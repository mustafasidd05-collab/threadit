from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from app.models.thread import Thread
from app.models.user import User
from app.schemas.thread import ThreadOut, VoteInfo
from app.schemas.user import UserOut
from app.schemas.search import CommentResult


async def search(db: AsyncSession, query: str, user_id: str | None = None) -> dict:
    pattern = f"%{query}%"

    # Search threads (title match)
    thread_result = await db.execute(
        select(Thread).where(
            Thread.title.ilike(pattern),
            Thread.parent_thread_id.is_(None),
            Thread.deleted_at.is_(None),
        ).order_by(Thread.created_at.desc()).limit(10)
    )
    threads_raw = thread_result.scalars().unique().all()
    threads = []
    for t in threads_raw:
        if t.author:
            # Count replies without lazy loading
            reply_count_result = await db.execute(
                select(func.count()).where(Thread.parent_thread_id == t.id)
            )
            reply_count = reply_count_result.scalar() or 0

            # Calculate vote info without lazy loading
            vote_result = await db.execute(
                select(Thread.votes).where(Thread.id == t.id)
            )
            score = 0
            user_vote = None
            for v in (t.votes if hasattr(t, 'votes') and t.votes is not None else []):
                score += v.value
                if user_id and v.user_id == user_id:
                    user_vote = v.value

            threads.append(
                ThreadOut(
                    id=t.id,
                    title=t.title,
                    content=t.content[:200] if t.content else "",
                    author=UserOut.model_validate(t.author),
                    parent_thread_id=t.parent_thread_id,
                    tribe_id=t.tribe_id,
                    created_at=t.created_at,
                    updated_at=t.updated_at,
                    reply_count=reply_count,
                    vote_info=VoteInfo(score=score, user_vote=user_vote),
                )
            )

    # Search users
    user_result = await db.execute(
        select(User).where(User.username.ilike(pattern))
        .order_by(User.created_at.desc()).limit(10)
    )
    users = [UserOut.model_validate(u) for u in user_result.scalars().all()]

    # Search comments (content match)
    comment_result = await db.execute(
        select(Thread).where(
            Thread.content.ilike(pattern),
            Thread.parent_thread_id.isnot(None),
            Thread.deleted_at.is_(None),
        ).order_by(Thread.created_at.desc()).limit(10)
    )
    comments_raw = comment_result.scalars().unique().all()
    comments = []
    for c in comments_raw:
        if c.author:
            # Get parent title without lazy loading
            parent_result = await db.execute(
                select(Thread.title).where(Thread.id == c.parent_thread_id)
            )
            parent_title = parent_result.scalar() or ""

            comments.append(
                CommentResult(
                    id=c.id,
                    content=c.content[:200] if c.content else "",
                    author=UserOut.model_validate(c.author),
                    thread_id=c.parent_thread_id or c.id,
                    thread_title=parent_title,
                )
            )

    return {"threads": threads, "users": users, "comments": comments}