from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    profile_image: str | None
    created_at: datetime
    last_seen: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=30)
    profile_image: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
