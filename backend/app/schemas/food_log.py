from pydantic import BaseModel
from datetime import datetime, date
from uuid import UUID


class FoodLogCreate(BaseModel):
    food_name: str
    calories: int = 0
    source: str = "manual"  # ai_photo, nutrition_label, barcode, manual
    log_date: date | None = None


class FoodLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    image_url: str | None
    food_name: str
    calories: int
    source: str
    log_date: date
    created_at: datetime

    class Config:
        from_attributes = True