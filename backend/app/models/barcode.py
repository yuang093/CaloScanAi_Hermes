from datetime import datetime, date, timezone
from sqlalchemy import String, Integer, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base


class BarcodeDictionary(Base):
    __tablename__ = "barcode_dictionary"

    barcode: Mapped[str] = mapped_column(String(50), primary_key=True)
    food_name: Mapped[str] = mapped_column(String(255), nullable=False)
    calories: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<BarcodeDictionary {self.barcode}: {self.food_name}>"


class DailyQuote(Base):
    __tablename__ = "daily_quotes"

    id: Mapped[int] = mapped_column(primary_key=True)
    quote_text: Mapped[str] = mapped_column(String, nullable=False)
    author: Mapped[str | None] = mapped_column(String(100), nullable=True)
    used_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    def __repr__(self):
        return f"<DailyQuote {self.id}: {self.quote_text[:30]}>"