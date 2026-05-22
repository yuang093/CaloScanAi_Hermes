from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from uuid import UUID


class FoodLogCreate(BaseModel):
    food_name: str = Field(..., min_length=1, max_length=200, description="食物名稱")
    calories: int = Field(ge=0, le=10000, default=0, description="熱量 (kcal)")
    protein_g: float = Field(ge=0, le=500, default=0.0, description="蛋白質 (g)")
    carbs_g: float = Field(ge=0, le=1000, default=0.0, description="碳水化合物 (g)")
    fat_g: float = Field(ge=0, le=500, default=0.0, description="脂肪 (g)")
    source: str = Field(default="manual", description="來源: ai_photo, nutrition_label, barcode, manual")
    log_date: date | None = Field(default=None, description="記錄日期")

    @field_validator("source")
    @classmethod
    def validate_source(cls, v):
        allowed = {"ai_photo", "nutrition_label", "barcode", "manual"}
        if v not in allowed:
            raise ValueError(f"source 必須是 {allowed} 之一")
        return v

    @field_validator("food_name")
    @classmethod
    def validate_food_name(cls, v):
        if not v or not v.strip():
            raise ValueError("食物名稱不可為空")
        return v.strip()


class FoodLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    image_url: str | None
    food_name: str
    calories: int
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    source: str
    log_date: date
    created_at: datetime

    class Config:
        from_attributes = True