from pydantic import BaseModel
from datetime import datetime


class MediaCreate(BaseModel):
    sanity_asset_id: str
    media_type: str
    url: str
    thumbnail_url: str | None = None
    caption: str | None = None
    duration: int | None = None
    width: int | None = None
    height: int | None = None
    order_index: int = 0


class MediaOut(BaseModel):
    id: str
    sanity_asset_id: str
    media_type: str
    url: str
    thumbnail_url: str | None = None
    caption: str | None = None
    duration: int | None = None
    width: int | None = None
    height: int | None = None
    order_index: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}