from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.user import UserOut


class TribeCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    description: str = Field("", max_length=2000)


class TribeOut(BaseModel):
    id: str
    name: str
    description: str
    creator: UserOut
    created_at: datetime
    member_count: int
    is_member: bool = False
    user_role: str | None = None

    model_config = {"from_attributes": True}


class TribeMemberOut(BaseModel):
    id: str
    user: UserOut
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}
