from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.message import MessageOut, ConversationOut
from app.services.message_service import (
    get_conversation,
    get_conversations_list,
    mark_as_read,
)
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_conversations_list(db, current_user.id)


@router.get("/messages/{other_user_id}", response_model=list[MessageOut])
async def get_messages(
    other_user_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await mark_as_read(db, other_user_id, current_user.id)
    return await get_conversation(db, current_user.id, other_user_id, limit)
