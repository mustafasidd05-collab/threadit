from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.tribe import TribeCreate, TribeOut, TribeMemberOut
from app.schemas.thread import ThreadOut
from app.services.tribe_service import (
    create_tribe,
    get_tribes,
    get_tribe_by_name,
    join_tribe,
    leave_tribe,
    remove_member,
    check_tribe_membership,
    check_tribe_guardian,
)
from app.services.thread_service import get_top_level_threads, soft_delete_thread
from app.auth.dependencies import get_current_user, get_optional_user
from app.models.user import User

router = APIRouter(prefix="/tribes", tags=["tribes"])


@router.post("", response_model=TribeOut, status_code=201)
async def create_new_tribe(
    data: TribeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tribe = await create_tribe(db, current_user.id, data)
    return TribeOut(
        id=tribe.id,
        name=tribe.name,
        description=tribe.description or "",
        creator=current_user,
        created_at=tribe.created_at,
        member_count=tribe.member_count,
        is_member=True,
        user_role="guardian",
    )


@router.get("", response_model=list[TribeOut])
async def list_tribes(
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    user_id = current_user.id if current_user else None
    return await get_tribes(db, user_id)


@router.get("/{name}", response_model=TribeOut)
async def get_tribe(
    name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    user_id = current_user.id if current_user else None
    return await get_tribe_by_name(db, name, user_id)


@router.get("/{name}/threads", response_model=list[ThreadOut])
async def get_tribe_threads(
    name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    from app.models.tribe import Tribe
    from sqlalchemy import select
    result = await db.execute(select(Tribe).where(Tribe.name == name))
    tribe = result.scalar_one_or_none()
    if not tribe:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Tribe not found")

    user_id = current_user.id if current_user else None
    return await get_top_level_threads(db, skip, limit, user_id, tribe_id=tribe.id)


@router.post("/{tribe_id}/join", status_code=200)
async def join(
    tribe_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await join_tribe(db, tribe_id, current_user.id)
    return {"message": "Joined tribe"}


@router.post("/{tribe_id}/leave", status_code=200)
async def leave(
    tribe_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await leave_tribe(db, tribe_id, current_user.id)
    return {"message": "Left tribe"}


@router.delete("/{tribe_id}/members/{user_id}", status_code=200)
async def remove_tribe_member(
    tribe_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await remove_member(db, tribe_id, user_id, current_user.id)
    return {"message": "Member removed"}
