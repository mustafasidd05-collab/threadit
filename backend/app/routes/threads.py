from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.thread import ThreadCreate, ThreadUpdate, ThreadOut, ThreadTree
from app.schemas.vote import VoteCreate
from app.schemas.thread import VoteInfo
from app.services.thread_service import (
    create_thread,
    get_top_level_threads,
    get_thread_with_replies,
    update_thread,
    delete_thread,
    cast_vote,
)
from app.auth.dependencies import get_current_user, get_optional_user
from app.models.user import User

router = APIRouter(prefix="/threads", tags=["threads"])


@router.post("", response_model=ThreadOut, status_code=201)
async def create_new_thread(
    data: ThreadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = await create_thread(db, current_user.id, data)
    return ThreadOut(
        id=thread.id,
        title=thread.title,
        content=thread.content,
        author=current_user,
        parent_thread_id=thread.parent_thread_id,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        reply_count=0,
        vote_info=VoteInfo(score=0, user_vote=None),
    )


@router.get("", response_model=list[ThreadOut])
async def list_threads(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    user_id = current_user.id if current_user else None
    return await get_top_level_threads(db, skip, limit, user_id)


@router.get("/{thread_id}", response_model=ThreadTree)
async def get_thread_detail(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    user_id = current_user.id if current_user else None
    return await get_thread_with_replies(db, thread_id, user_id)


@router.put("/{thread_id}", response_model=ThreadOut)
async def edit_thread(
    thread_id: str,
    data: ThreadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = await update_thread(db, thread_id, current_user.id, data)
    return ThreadOut(
        id=thread.id,
        title=thread.title,
        content=thread.content,
        author=current_user,
        parent_thread_id=thread.parent_thread_id,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
    )


@router.delete("/{thread_id}", status_code=204)
async def remove_thread(
    thread_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_thread(db, thread_id, current_user.id)


@router.post("/{thread_id}/vote", response_model=VoteInfo)
async def vote_on_thread(
    thread_id: str,
    data: VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await cast_vote(db, current_user.id, thread_id, data)