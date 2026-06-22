from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.services.role_service import ensure_owner_role
from app.models.tribe import Tribe, TribeMember
from app.models.thread import Thread
from app.schemas.tribe import TribeCreate, TribeOut
from app.schemas.user import UserOut
from app.models.user import User


def _tribe_to_out(tribe: Tribe, user_id: str | None = None) -> TribeOut:
    is_member = False
    user_role = None
    if user_id:
        for m in (tribe.members or []):
            if m.user_id == user_id:
                is_member = True
                user_role = m.role
                break

    return TribeOut(
        id=tribe.id,
        name=tribe.name,
        description=tribe.description or "",
        creator=UserOut.model_validate(tribe.creator),
        created_at=tribe.created_at,
        member_count=tribe.member_count,
        is_member=is_member,
        user_role=user_role,
    )


async def create_tribe(db: AsyncSession, user_id: str, data: TribeCreate) -> Tribe:
    existing = await db.execute(select(Tribe).where(Tribe.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Tribe name already taken")

    tribe = Tribe(
        name=data.name,
        description=data.description,
        creator_id=user_id,
    )
    db.add(tribe)
    await db.flush()

    # Add creator as guardian
    member = TribeMember(tribe_id=tribe.id, user_id=user_id, role="guardian")
    db.add(member)
    await db.flush()
    await db.refresh(tribe)
    return tribe


async def get_tribes(db: AsyncSession, user_id: str | None = None) -> list[TribeOut]:
    result = await db.execute(
        select(Tribe).order_by(Tribe.member_count.desc())
    )
    tribes = result.scalars().unique().all()
    return [_tribe_to_out(t, user_id) for t in tribes]


async def get_tribe_by_name(db: AsyncSession, name: str, user_id: str | None = None) -> TribeOut:
    result = await db.execute(
        select(Tribe).where(Tribe.name == name)
    )
    tribe = result.scalar_one_or_none()
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
    return _tribe_to_out(tribe, user_id)


async def join_tribe(db: AsyncSession, tribe_id: str, user_id: str) -> None:
    result = await db.execute(select(Tribe).where(Tribe.id == tribe_id))
    tribe = result.scalar_one_or_none()
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")

    existing = await db.execute(
        select(TribeMember).where(
            TribeMember.tribe_id == tribe_id,
            TribeMember.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already a member")

    member = TribeMember(tribe_id=tribe_id, user_id=user_id, role="member")
    db.add(member)
    tribe.member_count += 1
    await db.flush()


async def leave_tribe(db: AsyncSession, tribe_id: str, user_id: str) -> None:
    result = await db.execute(
        select(TribeMember).where(
            TribeMember.tribe_id == tribe_id,
            TribeMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Not a member")
    if member.role == "guardian":
        raise HTTPException(status_code=403, detail="Guardian cannot leave. Transfer ownership first.")

    tribe_result = await db.execute(select(Tribe).where(Tribe.id == tribe_id))
    tribe = tribe_result.scalar_one_or_none()
    if tribe:
        tribe.member_count = max(0, tribe.member_count - 1)

    await db.delete(member)
    await db.flush()


async def check_tribe_membership(db: AsyncSession, tribe_id: str, user_id: str) -> TribeMember | None:
    result = await db.execute(
        select(TribeMember).where(
            TribeMember.tribe_id == tribe_id,
            TribeMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def check_tribe_guardian(db: AsyncSession, tribe_id: str, user_id: str) -> bool:
    member = await check_tribe_membership(db, tribe_id, user_id)
    return member is not None and member.role == "guardian"


async def remove_member(db: AsyncSession, tribe_id: str, target_user_id: str, requester_id: str) -> None:
    if not await check_tribe_guardian(db, tribe_id, requester_id):
        raise HTTPException(status_code=403, detail="Only guardians can remove members")

    result = await db.execute(
        select(TribeMember).where(
            TribeMember.tribe_id == tribe_id,
            TribeMember.user_id == target_user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.role == "guardian":
        raise HTTPException(status_code=403, detail="Cannot remove a guardian")

    tribe_result = await db.execute(select(Tribe).where(Tribe.id == tribe_id))
    tribe = tribe_result.scalar_one_or_none()
    if tribe:
        tribe.member_count = max(0, tribe.member_count - 1)

    await db.delete(member)
    await db.flush()
