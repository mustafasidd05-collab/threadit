import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    username: Mapped[str] = mapped_column(
        String(30), unique=True, index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    threads = relationship("Thread", back_populates="author", lazy="selectin")
    votes = relationship("Vote", back_populates="user", lazy="selectin")
    sent_messages = relationship(
        "Message", foreign_keys="Message.sender_id",
        back_populates="sender", lazy="selectin"
    )
    received_messages = relationship(
        "Message", foreign_keys="Message.receiver_id",
        back_populates="receiver", lazy="selectin"
    )
    files = relationship("File", back_populates="uploader", lazy="selectin")
