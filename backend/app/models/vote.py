import uuid
from sqlalchemy import String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("user_id", "thread_id", name="uq_user_thread_vote"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    thread_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("threads.id"), nullable=False, index=True
    )
    value: Mapped[int] = mapped_column(Integer, nullable=False)  # +1 or -1

    user = relationship("User", back_populates="votes")
    thread = relationship("Thread", back_populates="votes")
