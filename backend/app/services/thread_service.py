from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from datetime import datetime, timezone
from app.models.thread import Thread
from app.models.vote import Vote
from app.schemas.thread import ThreadCreate, ThreadUpdate, ThreadOut, ThreadTree, VoteInfo
from app.schemas.user import UserOut
from app.schemas.vote import VoteCreate


def _compute_vote_info(votes: list, user_id: str | None) -> VoteInfo:
    score = sum(v.value for v in votes) if votes else 0
    user_vote = None
    if user_id and votes:
        for v in votes:
            if v.user_id == user_id:
                user_vote = v.value
                break
    return VoteInfo(score=score, user_vote=user_vote)


def _thread_to_out(thread: Thread, user_id: str | None = None) -> ThreadOut:
    votes = thread.votes if thread.votes else []
    children = thread.children if thread.children else []
    vote_info = _compute_vote_info(votes, user_id)
    reply_count = len(children)
    return ThreadOut(
        id=thread.id,
        title=thread.title,
        content=thread.content,
        author=UserOut.model_validate(thread.author),
        parent_thread_id=thread.parent_thread_id,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        reply_count=reply_count,
        vote_info=vote_info,
    )


def _build_tree(thread: Thread, user_id: str | None) -> ThreadTree:
    children_list = thread.children if thread.children else []
    children = [_build_tree(child, user_id) for child in children_list]
    vote_info = _compute_vote_info(thread.votes if thread.votes else [], user_id)
    return ThreadTree(
        id=thread.id,
        title=thread.title,
        content=thread.content,
        author=UserOut.model_validate(thread.author),
        parent_thread_id=thread.parent_thread_id,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        reply_count=len(children_list),
        vote_info=vote_info,
        children=children,
    )


def _base_query():
    """Shared query with all relationships eagerly loaded."""
    return (
        select(Thread)
        .options(
            selectinload(Thread.author),
            selectinload(Thread.votes),
            selectinload(Thread.children),
        )
    )


async def create_thread(db: AsyncSession, author_id: str, data: ThreadCreate) -> Thread:
    if data.parent_thread_id:
        parent = await db.execute(
            select(Thread).where(Thread.id == data.parent_thread_id)
        )
        if not parent.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Parent thread not found")

    thread = Thread(
        title=data.title,
        content=data.content,
        author_id=author_id,
        parent_thread_id=data.parent_thread_id,
    )
    db.add(thread)
    await db.flush()

    # Re-load with relationships so we can build a proper response
    result = await db.execute(
        _base_query().where(Thread.id == thread.id)
    )
    return result.scalars().unique().one()


async def get_top_level_threads(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 20,
    user_id: str | None = None,
) -> list[ThreadOut]:
    result = await db.execute(
        _base_query()
        .where(Thread.parent_thread_id.is_(None))
        .order_by(Thread.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    threads = result.scalars().unique().all()
    return [_thread_to_out(t, user_id) for t in threads]


async def _collect_descendant_ids(db: AsyncSession, thread_id: str) -> list[str]:
    ids = [thread_id]
    queue = [thread_id]
    while queue:
        batch = queue.pop(0)
        result = await db.execute(
            select(Thread.id).where(Thread.parent_thread_id == batch)
        )
        child_ids = [row[0] for row in result.all()]
        ids.extend(child_ids)
        queue.extend(child_ids)
    return ids


async def get_thread_with_replies(
    db: AsyncSession, thread_id: str, user_id: str | None = None
) -> ThreadTree:
    all_ids = await _collect_descendant_ids(db, thread_id)
    result = await db.execute(
        _base_query().where(Thread.id.in_(all_ids))
    )
    threads_map = {t.id: t for t in result.scalars().unique().all()}

    if thread_id not in threads_map:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Reset children lists and rebuild tree
    for t in threads_map.values():
        t.children = []
    for t in threads_map.values():
        if t.parent_thread_id and t.parent_thread_id in threads_map:
            threads_map[t.parent_thread_id].children.append(t)

    return _build_tree(threads_map[thread_id], user_id)


async def get_threads_by_user(
    db: AsyncSession, user_id: str
) -> list[ThreadOut]:
    result = await db.execute(
        _base_query()
        .where(Thread.author_id == user_id, Thread.parent_thread_id.is_(None))
        .order_by(Thread.created_at.desc())
    )
    threads = result.scalars().unique().all()
    return [_thread_to_out(t, user_id) for t in threads]


async def update_thread(
    db: AsyncSession, thread_id: str, user_id: str, data: ThreadUpdate
) -> Thread:
    result = await db.execute(select(Thread).where(Thread.id == thread_id))
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    if thread.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if data.title is not None:
        thread.title = data.title
    if data.content is not None:
        thread.content = data.content
    thread.updated_at = datetime.now(timezone.utc)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        _base_query().where(Thread.id == thread_id)
    )
    return result.scalars().unique().one()


async def delete_thread(db: AsyncSession, thread_id: str, user_id: str) -> None:
    result = await db.execute(select(Thread).where(Thread.id == thread_id))
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    if thread.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.delete(thread)
    await db.flush()


async def cast_vote(
    db: AsyncSession, user_id: str, thread_id: str, data: VoteCreate
) -> VoteInfo:
    thread_check = await db.execute(select(Thread).where(Thread.id == thread_id))
    if not thread_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Thread not found")

    existing = await db.execute(
        select(Vote).where(Vote.user_id == user_id, Vote.thread_id == thread_id)
    )
    vote = existing.scalar_one_or_none()

    if data.value == 0:
        if vote:
            await db.delete(vote)
            await db.flush()
    elif vote:
        vote.value = data.value
        await db.flush()
    else:
        vote = Vote(user_id=user_id, thread_id=thread_id, value=data.value)
        db.add(vote)
        await db.flush()

    all_votes = await db.execute(select(Vote).where(Vote.thread_id == thread_id))
    return _compute_vote_info(list(all_votes.scalars().all()), user_id)