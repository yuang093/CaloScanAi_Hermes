from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from enum import Enum


class FeedbackTypeEnum(str, Enum):
    feature = "feature"
    bug = "bug"
    general = "general"


class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating from 1-5 stars")
    feedback_type: FeedbackTypeEnum = Field(
        default=FeedbackTypeEnum.general,
        description="Type of feedback: feature, bug, or general"
    )
    message: str = Field(..., min_length=1, max_length=500, description="Feedback message (max 500 chars)")

    class Config:
        json_schema_extra = {
            "example": {
                "rating": 5,
                "feedback_type": "feature",
                "message": "很棒的功能！希望能有更多圖表分析。"
            }
        }


class FeedbackResponse(BaseModel):
    id: UUID
    user_id: UUID
    rating: int
    feedback_type: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackStats(BaseModel):
    avg_rating: float
    total_count: int
    by_type: dict[str, int]