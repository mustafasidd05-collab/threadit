from pydantic import BaseModel, Field
from datetime import datetime


class MessageCreate(BaseModel):
    receiver_id: str
    content: str = Field(..., min_length=1, max_length=10000)


class MessageOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    sent_time: datetime
    read_status: bool

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    other_user: str
    other_username: str
    last_message: str
    last_message_time: datetime
    unread_count: int
