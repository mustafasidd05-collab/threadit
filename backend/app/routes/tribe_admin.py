from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.tribe import Tribe
from app.models.thread import Thread
from app.models.tribe_role import TribeRole
from app.services.role_service import (
    get_user_role,
    promote_to_admin,
    demote_to_member,
    remove_from_tribe,
    get_tribe_members_with_roles,
)
from app.schemas.user import UserOut

router = APIRouter(prefix="/tribes/admin", tags=["tribe-admin"])


@router.get("/{tribe_id}/members")
async def list_members(
    tribe_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await get_user_role(db, tribe_id, current_user.id)
    if role not in ("OWNER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Admin access required")

    members = await get_tribe_members_with_roles(db, tribe_id)
    result = []
    for tribe_role, user in members:
        result.append({
            "user": UserOut.model_validate(user),
            "role": tribe_role.role,
            "joined_at": tribe_role.created_at.isoformat(),
        })
    return result


@router.post("/{tribe_id}/members/{user_id}/promote")
async def promote_member(
    tribe_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await get_user_role(db, tribe_id, current_user.id)
    if role != "OWNER":
        raise HTTPException(status_code=403, detail="Only owner can promote members")

    target_role = await get_user_role(db, tribe_id, user_id)
    if not target_role:
        raise HTTPException(status_code=404, detail="User is not a member of this tribe")
    if target_role == "OWNER":
        raise HTTPException(status_code=400, detail="Cannot change owner role")

    updated = await promote_to_admin(db, tribe_id, user_id)
    return {"success": True, "role": updated.role}


@router.post("/{tribe_id}/members/{user_id}/demote")
async def demote_member(
    tribe_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await get_user_role(db, tribe_id, current_user.id)
    if role != "OWNER":
        raise HTTPException(status_code=403, detail="Only owner can demote admins")

    target_role = await get_user_role(db, tribe_id, user_id)
    if not target_role:
        raise HTTPException(status_code=404, detail="User is not a member of this tribe")
    if target_role == "OWNER":
        raise HTTPException(status_code=400, detail="Cannot change owner role")

    updated = await demote_to_member(db, tribe_id, user_id)
    return {"success": True, "role": updated.role}


@router.delete("/{tribe_id}/members/{user_id}")
async def remove_member(
    tribe_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    caller_role = await get_user_role(db, tribe_id, current_user.id)
    if caller_role not in ("OWNER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Admin access required")

    target_role = await get_user_role(db, tribe_id, user_id)
    if not target_role:
        raise HTTPException(status_code=404, detail="User is not a member of this tribe")
    if target_role == "OWNER":
        raise HTTPException(status_code=400, detail="Cannot remove the owner")
    if caller_role == "ADMIN" and target_role == "ADMIN":
        raise HTTPException(status_code=403, detail="Admins cannot remove other admins")

    await remove_from_tribe(db, tribe_id, user_id)
    return {"success": True, "message": "Member removed"}


@router.delete("/{tribe_id}")
async def delete_tribe(
    tribe_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role = await get_user_role(db, tribe_id, current_user.id)
    if role != "OWNER":
        raise HTTPException(status_code=403, detail="Only the owner can delete a tribe")

    result = await db.execute(select(Tribe).where(Tribe.id == tribe_id))
    tribe = result.scalar_one_or_none()
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")

    # Soft-delete all threads in tribe
    threads_result = await db.execute(
        select(Thread).where(Thread.tribe_id == tribe_id, Thread.deleted_at.is_(None))
    )
    for thread in threads_result.scalars().all():
        thread.deleted_at = datetime.now(timezone.utc)

    # Delete all roles
    roles_result = await db.execute(select(TribeRole).where(TribeRole.tribe_id == tribe_id))
    for role_row in roles_result.scalars().all():
        await db.delete(role_row)

    # Delete memberships
    from app.models.tribe import TribeMember
    members_result = await db.execute(
        select(TribeMember).where(TribeMember.tribe_id == tribe_id)
    )
    for member in members_result.scalars().all():
        await db.delete(member)

    await db.delete(tribe)
    await db.flush()

    return {"success": True, "message": "Tribe deleted"}
