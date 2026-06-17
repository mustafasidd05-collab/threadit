from pydantic import BaseModel
from app.schemas.thread import ThreadOut
from app.schemas.user import UserOut


class CommentResult(BaseModel):
    id: str
    content: str
    author: UserOut
    thread_id: str
    thread_title: str


class SearchResults(BaseModel):
    threads: list[ThreadOut]
    users: list[UserOut]
    comments: list[CommentResult]
