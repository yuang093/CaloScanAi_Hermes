import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Enum, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum as PyEnum
from ..core.database import Base


class FeedbackType(str, PyEnum):
    feature = "feature"
    bug = "bug"
    general = "general"


class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    feedback_type: Mapped[str] = mapped_column(String(20), nullable=False, default=FeedbackType.general.value)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates=None)

    def __repr__(self):
        return f"<Feedback {self.id} user={self.user_id} rating={self.rating}>"