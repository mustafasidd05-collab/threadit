import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.database.base import Base


class ThreadMedia(Base):
    __tablename__ = "thread_media"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    thread_id = Column(String(36), ForeignKey("threads.id"), nullable=False, index=True)
    sanity_asset_id = Column(String(255), nullable=False)
    media_type = Column(String(10), nullable=False)  # "image" or "video"
    url = Column(String(1000), nullable=False)
    thumbnail_url = Column(String(1000), nullable=True)
    caption = Column(String(500), nullable=True)
    duration = Column(Integer, nullable=True)  # seconds, for video
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    thread = relationship("Thread", back_populates="media")