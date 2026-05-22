import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Integer, DateTime, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum as PyEnum
from ..core.database import Base


class FoodSource(str, PyEnum):
    ai_photo = "ai_photo"
    nutrition_label = "nutrition_label"
    barcode = "barcode"
    manual = "manual"


class FoodLog(Base):
    __tablename__ = "food_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    food_name: Mapped[str] = mapped_column(String(255), nullable=False)
    calories: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    protein_g: Mapped[float] = mapped_column(default=0.0)
    carbs_g: Mapped[float] = mapped_column(default=0.0)
    fat_g: Mapped[float] = mapped_column(default=0.0)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default=FoodSource.manual.value)
    log_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="food_logs")

    def __repr__(self):
        return f"<FoodLog {self.food_name} - {self.calories}kcal>"