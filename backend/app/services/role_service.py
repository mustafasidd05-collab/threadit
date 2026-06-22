from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tribe_role import TribeRole
from app.models.tribe import Tribe


async def get_user_role(db: AsyncSession, tribe_id: str, user_id: str) -> str | None:
    """Get user's role in a tribe. Returns None if not a member."""
    result = await db.execute(
        select(TribeRole).where(
            TribeRole.tribe_id == tribe_id,
            TribeRole.user_id == user_id,
        )
    )
    role = result.scalar_one_or_none()
    return role.role if role else None


async def ensure_owner_role(db: AsyncSession, tribe_id: str, user_id: str) -> None:
    """Create OWNER role for tribe creator if not exists."""
    existing = await get_user_role(db, tribe_id, user_id)
    if existing:
        return
    role = TribeRole(tribe_id=tribe_id, user_id=user_id, role="OWNER")
    db.add(role)
    await db.flush()


async def promote_to_admin(db: AsyncSession, tribe_id: str, user_id: str) -> TribeRole:
    """Promote a MEMBER to ADMIN."""
    result = await db.execute(
        select(TribeRole).where(
            TribeRole.tribe_id == tribe_id,
            TribeRole.user_id == user_id,
        )
    )
    role = result.scalar_one_or_none()
    if not role:
        role = TribeRole(tribe_id=tribe_id, user_id=user_id, role="ADMIN")
        db.add(role)
    else:
        role.role = "ADMIN"
    await db.flush()
    await db.refresh(role)
    return role


async def demote_to_member(db: AsyncSession, tribe_id: str, user_id: str) -> TribeRole:
    """Demote an ADMIN to MEMBER."""
    result = await db.execute(
        select(TribeRole).where(
            TribeRole.tribe_id == tribe_id,
            TribeRole.user_id == user_id,
        )
    )
    role = result.scalar_one_or_none()
    if not role:
        role = TribeRole(tribe_id=tribe_id, user_id=user_id, role="MEMBER")
        db.add(role)
    else:
        role.role = "MEMBER"
    await db.flush()
    await db.refresh(role)
    return role


async def remove_from_tribe(db: AsyncSession, tribe_id: str, user_id: str) -> None:
    """Remove user from tribe (delete role and membership)."""
    result = await db.execute(
        select(TribeRole).where(
            TribeRole.tribe_id == tribe_id,
            TribeRole.user_id == user_id,
        )
    )
    role = result.scalar_one_or_none()
    if role:
        await db.delete(role)
    await db.flush()


async def get_tribe_members_with_roles(db: AsyncSession, tribe_id: str) -> list:
    """Get all members of a tribe with their roles."""
    from app.models.user import User
    result = await db.execute(
        select(TribeRole, User)
        .join(User, TribeRole.user_id == User.id)
        .where(TribeRole.tribe_id == tribe_id)
        .order_by(
            TribeRole.role.asc(),  # OWNER first, then ADMIN, then MEMBER
            TribeRole.created_at.asc(),
        )
    )
    return result.all()
