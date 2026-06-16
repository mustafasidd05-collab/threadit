from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func, desc
from app.models.message import Message
from app.models.user import User
from app.schemas.message import MessageCreate, MessageOut, ConversationOut


async def save_message(
    db: AsyncSession, sender_id: str, data: MessageCreate
) -> Message:
    msg = Message(
        sender_id=sender_id,
        receiver_id=data.receiver_id,
        content=data.content,
    )
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return msg


async def get_conversation(
    db: AsyncSession, user_id: str, other_user_id: str, limit: int = 50
) -> list[MessageOut]:
    result = await db.execute(
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == user_id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == user_id),
            )
        )
        .order_by(Message.sent_time.desc())
        .limit(limit)
    )
    messages = result.scalars().all()
    return [MessageOut.model_validate(m) for m in reversed(messages)]


async def get_conversations_list(
    db: AsyncSession, user_id: str
) -> list[ConversationOut]:
    partners_result = await db.execute(
        select(
            func.distinct(
                func.coalesce(
                    func.nullif(Message.sender_id, user_id),
                    Message.receiver_id,
                )
            )
        ).where(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        )
    )
    partner_ids = [row[0] for row in partners_result.all()]

    conversations = []
    for partner_id in partner_ids:
        last_msg_result = await db.execute(
            select(Message)
            .where(
                or_(
                    and_(
                        Message.sender_id == user_id,
                        Message.receiver_id == partner_id,
                    ),
                    and_(
                        Message.sender_id == partner_id,
                        Message.receiver_id == user_id,
                    ),
                )
            )
            .order_by(desc(Message.sent_time))
            .limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()
        if not last_msg:
            continue

        unread_result = await db.execute(
            select(func.count())
            .select_from(Message)
            .where(
                Message.sender_id == partner_id,
                Message.receiver_id == user_id,
                Message.read_status == False,
            )
        )
        unread = unread_result.scalar() or 0

        partner = await db.execute(select(User).where(User.id == partner_id))
        partner_user = partner.scalar_one_or_none()

        conversations.append(
            ConversationOut(
                other_user=partner_id,
                other_username=partner_user.username if partner_user else "deleted",
                last_message=last_msg.content,
                last_message_time=last_msg.sent_time,
                unread_count=unread,
            )
        )

    conversations.sort(key=lambda c: c.last_message_time, reverse=True)
    return conversations


async def mark_as_read(
    db: AsyncSession, sender_id: str, receiver_id: str
) -> None:
    result = await db.execute(
        select(Message).where(
            Message.sender_id == sender_id,
            Message.receiver_id == receiver_id,
            Message.read_status == False,
        )
    )
    for msg in result.scalars().all():
        msg.read_status = True
    await db.flush()
