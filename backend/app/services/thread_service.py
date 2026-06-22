import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app.models.thread import Thread
from app.models.vote import Vote
from app.models.thread_media import ThreadMedia
from app.models.user import User
from app.schemas.thread import ThreadCreate, ThreadUpdate, ThreadOut, ThreadTree, VoteInfo
from app.schemas.media import MediaOut
from app.schemas.user import UserOut


async def create_thread(db: AsyncSession, user_id: str, data: ThreadCreate) -> Thread:
    thread = Thread(
        id=str(uuid.uuid4()),
        title=data.title,
        content=data.content,
        author_id=user_id,
        parent_thread_id=data.parent_thread_id,
        tribe_id=data.tribe_id,
    )
    db.add(thread)
    await db.flush()

    for m in data.media:
        media = ThreadMedia(
            thread_id=thread.id,
            sanity_asset_id=m.sanity_asset_id,
            media_type=m.media_type,
            url=m.url,
            thumbnail_url=m.thumbnail_url,
            caption=m.caption,
            duration=m.duration,
            width=m.width,
            height=m.height,
            order_index=m.order_index,
        )
        db.add(media)

    await db.flush()

    result = await db.execute(
        select(Thread)
        .where(Thread.id == thread.id)
        .options(
            selectinload(Thread.media),
            selectinload(Thread.votes),
            selectinload(Thread.author),
        )
    )
    return result.scalar_one()


def _build_thread_out(thread: Thread, user_id: str | None) -> ThreadOut:
    votes = thread.votes or []
    score = sum(v.value for v in votes)
    user_vote = None
    if user_id:
        for v in votes:
            if v.user_id == user_id:
                user_vote = v.value
                break

    return ThreadOut(
        id=thread.id,
        title=thread.title,
        content=thread.content or "",
        author=UserOut.model_validate(thread.author),
        parent_thread_id=thread.parent_thread_id,
        tribe_id=thread.tribe_id,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        reply_count=0,
        vote_info=VoteInfo(score=score, user_vote=user_vote),
        is_deleted=thread.deleted_at is not None,
        media=[MediaOut.model_validate(m) for m in (thread.media or [])],
    )


async def get_top_level_threads(
    db: AsyncSession, skip: int = 0, limit: int = 20, user_id: str | None = None, tribe_id: str | None = None
) -> list[ThreadOut]:
    query = (
        select(Thread)
        .where(
            Thread.parent_thread_id.is_(None),
            Thread.deleted_at.is_(None),
        )
        .options(
            selectinload(Thread.media),
            selectinload(Thread.votes),
            selectinload(Thread.author),
        )
    )
    if tribe_id:
        query = query.where(Thread.tribe_id == tribe_id)
    query = query.order_by(desc(Thread.created_at)).offset(skip).limit(limit)

    result = await db.execute(query)
    threads = result.scalars().unique().all()

    thread_ids = [t.id for t in threads]
    reply_counts: dict[str, int] = {}
    if thread_ids:
        count_result = await db.execute(
            select(Thread.parent_thread_id, func.count(Thread.id))
            .where(
                Thread.parent_thread_id.in_(thread_ids),
                Thread.deleted_at.is_(None),
            )
            .group_by(Thread.parent_thread_id)
        )
        for parent_id, count in count_result.all():
            reply_counts[parent_id] = count

    out = []
    for t in threads:
        thread_out = _build_thread_out(t, user_id)
        thread_out.reply_count = reply_counts.get(t.id, 0)
        out.append(thread_out)

    return out


async def get_thread_with_replies(db: AsyncSession, thread_id: str, user_id: str | None = None) -> ThreadTree:
    result = await db.execute(
        select(Thread)
        .where(Thread.id == thread_id)
        .options(
            selectinload(Thread.media),
            selectinload(Thread.votes),
            selectinload(Thread.author),
        )
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    async def build_tree(t: Thread, depth: int = 0) -> ThreadTree:
        votes = t.votes or []
        score = sum(v.value for v in votes)
        user_vote = None
        if user_id:
            for v in votes:
                if v.user_id == user_id:
                    user_vote = v.value
                    break

        child_result = await db.execute(
            select(Thread)
            .where(
                Thread.parent_thread_id == t.id,
                Thread.deleted_at.is_(None),
            )
            .options(
                selectinload(Thread.media),
                selectinload(Thread.votes),
                selectinload(Thread.author),
            )
            .order_by(Thread.created_at.asc())
        )
        child_threads = child_result.scalars().unique().all()
        children = [await build_tree(c, depth + 1) for c in child_threads] if depth < 10 else []

        return ThreadTree(
            id=t.id,
            title=t.title,
            content=t.content or "",
            author=UserOut.model_validate(t.author),
            parent_thread_id=t.parent_thread_id,
            tribe_id=t.tribe_id,
            created_at=t.created_at,
            updated_at=t.updated_at,
            reply_count=len(child_threads),
            vote_info=VoteInfo(score=score, user_vote=user_vote),
            is_deleted=t.deleted_at is not None,
            children=children,
            media=[MediaOut.model_validate(m) for m in (t.media or [])],
        )

    return await build_tree(thread)


async def update_thread(db: AsyncSession, thread_id: str, user_id: str, data: ThreadUpdate) -> Thread:
    result = await db.execute(
        select(Thread)
        .where(Thread.id == thread_id, Thread.author_id == user_id)
        .options(selectinload(Thread.media))
    )
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found or not authorized")
    if data.title is not None:
        thread.title = data.title
    if data.content is not None:
        thread.content = data.content
    await db.flush()
    await db.refresh(thread)
    return thread


async def soft_delete_thread(db: AsyncSession, thread_id: str, user_id: str) -> None:
    result = await db.execute(select(Thread).where(Thread.id == thread_id, Thread.author_id == user_id))
    thread = result.scalar_one_or_none()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found or not authorized")
    thread.deleted_at = datetime.now(timezone.utc)
    await db.flush()


async def cast_vote(db: AsyncSession, user_id: str, thread_id: str, data) -> VoteInfo:
    result = await db.execute(select(Thread).where(Thread.id == thread_id))
    thread = result.scalar_one_or_none()
    if not thread:
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
    votes = all_votes.scalars().all()
    score = sum(v.value for v in votes)
    user_vote = None
    for v in votes:
        if v.user_id == user_id:
            user_vote = v.value
            break

    return VoteInfo(score=score, user_vote=user_vote)


async def get_threads_by_user(
    db: AsyncSession, user_id: str, skip: int = 0, limit: int = 20, current_user_id: str | None = None
) -> list[ThreadOut]:
    result = await db.execute(
        select(Thread)
        .where(
            Thread.author_id == user_id,
            Thread.parent_thread_id.is_(None),
            Thread.deleted_at.is_(None),
        )
        .options(
            selectinload(Thread.media),
            selectinload(Thread.votes),
            selectinload(Thread.author),
        )
        .order_by(desc(Thread.created_at))
        .offset(skip)
        .limit(limit)
    )
    threads = result.scalars().unique().all()

    thread_ids = [t.id for t in threads]
    reply_counts: dict[str, int] = {}
    if thread_ids:
        count_result = await db.execute(
            select(Thread.parent_thread_id, func.count(Thread.id))
            .where(
                Thread.parent_thread_id.in_(thread_ids),
                Thread.deleted_at.is_(None),
            )
            .group_by(Thread.parent_thread_id)
        )
        for parent_id, count in count_result.all():
            reply_counts[parent_id] = count

    out = []
    for t in threads:
        thread_out = _build_thread_out(t, current_user_id)
        thread_out.reply_count = reply_counts.get(t.id, 0)
        out.append(thread_out)

    return out