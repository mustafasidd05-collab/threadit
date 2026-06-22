from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.user import UserOut
from app.schemas.media import MediaCreate, MediaOut


class ThreadCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    content: str = ""
    parent_thread_id: str | None = None
    tribe_id: str | None = None
    media: list[MediaCreate] = []


class ThreadUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    content: str | None = None


class VoteInfo(BaseModel):
    score: int = 0
    user_vote: int | None = None


class ThreadOut(BaseModel):
    id: str
    title: str
    content: str
    author: UserOut
    parent_thread_id: str | None
    tribe_id: str | None = None
    created_at: datetime
    updated_at: datetime
    reply_count: int = 0
    vote_info: VoteInfo = VoteInfo()
    is_deleted: bool = False
    media: list[MediaOut] = []

    model_config = {"from_attributes": True}


class ThreadTree(ThreadOut):
    children: list["ThreadTree"] = []


ThreadTree.model_rebuild()