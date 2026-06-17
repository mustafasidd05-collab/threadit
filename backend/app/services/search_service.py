from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.thread import Thread
from app.models.user import User
from app.schemas.thread import ThreadOut, VoteInfo
from app.schemas.user import UserOut
from app.schemas.search import CommentResult


async def search(db: AsyncSession, query: str, user_id: str | None = None) -> dict:
    pattern = f"%{query}%"

    # Search threads (title match = highest priority)
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
            threads.append(
                ThreadOut(
                    id=t.id,
                    title=t.title,
                    content=t.content[:200],
                    author=UserOut.model_validate(t.author),
                    parent_thread_id=t.parent_thread_id,
                    tribe_id=t.tribe_id,
                    created_at=t.created_at,
                    updated_at=t.updated_at,
                    reply_count=len(t.children) if t.children else 0,
                    vote_info=_vote_info(t, user_id),
                )
            )

    # Search users
    user_result = await db.execute(
        select(User).where(User.username.ilike(pattern))
        .order_by(User.created_at.desc()).limit(10)
    )
    users = [UserOut.model_validate(u) for u in user_result.scalars().all()]

    # Search comments (content match = lowest priority)
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
        if c.author and c.parent:
            comments.append(
                CommentResult(
                    id=c.id,
                    content=c.content[:200],
                    author=UserOut.model_validate(c.author),
                    thread_id=c.parent_thread_id or c.id,
                    thread_title=c.parent.title if c.parent else "",
                )
            )

    return {"threads": threads, "users": users, "comments": comments}


def _vote_info(thread: Thread, user_id: str | None) -> VoteInfo:
    votes = thread.votes or []
    score = sum(v.value for v in votes)
    user_vote = None
    if user_id:
        for v in votes:
            if v.user_id == user_id:
                user_vote = v.value
                break
    return VoteInfo(score=score, user_vote=user_vote)
