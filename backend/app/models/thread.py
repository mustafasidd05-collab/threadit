import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Thread(Base):
    __tablename__ = "threads"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    parent_thread_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("threads.id"), nullable=True, index=True
    )
    tribe_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("tribes.id"), nullable=True, index=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    author = relationship("User", back_populates="threads", lazy="selectin")
    parent = relationship(
        "Thread", remote_side="Thread.id", back_populates="children", lazy="selectin"
    )
    children = relationship("Thread", back_populates="parent", lazy="selectin")
    votes = relationship("Vote", back_populates="thread", lazy="selectin")
    tribe = relationship("Tribe", lazy="selectin")
    
    media = relationship("ThreadMedia", back_populates="thread", cascade="all, delete-orphan", order_by="ThreadMedia.order_index")

