import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Tribe(Base):
    __tablename__ = "tribes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    creator_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    member_count: Mapped[int] = mapped_column(default=1)

    creator = relationship("User", lazy="selectin")
    members = relationship("TribeMember", back_populates="tribe", lazy="selectin")


class TribeMember(Base):
    __tablename__ = "tribe_members"
    __table_args__ = (
        UniqueConstraint("tribe_id", "user_id", name="uq_tribe_user"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    tribe_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tribes.id"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), default="member")  # member | guardian
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    tribe = relationship("Tribe", back_populates="members")
    user = relationship("User", lazy="selectin")
