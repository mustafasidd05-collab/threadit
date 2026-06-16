from pydantic import BaseModel, Field


class VoteCreate(BaseModel):
    value: int = Field(..., ge=-1, le=1)
