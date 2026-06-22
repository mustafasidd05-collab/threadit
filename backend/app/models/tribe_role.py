import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base


class TribeRole(Base):
    __tablename__ = "tribe_roles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tribe_id = Column(String(36), ForeignKey("tribes.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False, default="MEMBER")  # OWNER, ADMIN, MEMBER
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    tribe = relationship("Tribe", back_populates="roles")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("tribe_id", "user_id", name="uq_tribe_user_role"),
    )
