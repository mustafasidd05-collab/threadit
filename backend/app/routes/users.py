from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.user import UserOut, UserUpdate
from app.schemas.thread import ThreadOut
from app.services.user_service import (
    get_user_by_username,
    update_user,
)
from app.services.thread_service import get_threads_by_user
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserOut)
async def update_profile(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await update_user(db, current_user, data)


@router.get("/{username}", response_model=UserOut)
async def get_user_profile(
    username: str, db: AsyncSession = Depends(get_db)
):
    return await get_user_by_username(db, username)


@router.get("/{username}/threads", response_model=list[ThreadOut])
async def get_user_threads(
    username: str, db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_username(db, username)
    return await get_threads_by_user(db, user.id)
