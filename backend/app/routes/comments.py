from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.thread import Thread

router = APIRouter(prefix="/comments", tags=["comments"])


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Thread).where(Thread.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.deleted_at:
        raise HTTPException(status_code=404, detail="Comment already deleted")

    is_author = comment.author_id == current_user.id

    if not is_author:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    comment.deleted_at = datetime.now(timezone.utc)
    await db.flush()

    return {"success": True, "message": "Comment deleted"}