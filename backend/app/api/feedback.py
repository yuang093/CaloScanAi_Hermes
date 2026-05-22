from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from ..core.database import get_db
from ..models.user import User, UserRole
from ..models.feedback import Feedback
from ..schemas.feedback import FeedbackCreate, FeedbackResponse, FeedbackStats
from .auth import get_current_user

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("", response_model=dict)
async def submit_feedback(
    data: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit feedback. Requires authentication.
    """
    feedback = Feedback(
        user_id=current_user.id,
        rating=data.rating,
        feedback_type=data.feedback_type.value,
        message=data.message,
    )
    db.add(feedback)
    await db.commit()
    return {"message": "感謝回饋"}


@router.get("", response_model=List[FeedbackResponse])
async def get_all_feedback(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all feedback. Admin only.
    """
    if current_user.role != UserRole.admin.value:
        raise HTTPException(status_code=403, detail="需要管理員權限")

    result = await db.execute(
        select(Feedback).order_by(Feedback.created_at.desc())
    )
    feedbacks = result.scalars().all()
    return [FeedbackResponse.model_validate(f) for f in feedbacks]


@router.get("/stats", response_model=FeedbackStats)
async def get_feedback_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get feedback statistics. Admin only.
    """
    if current_user.role != UserRole.admin.value:
        raise HTTPException(status_code=403, detail="需要管理員權限")

    # Total count
    count_result = await db.execute(select(func.count(Feedback.id)))
    total_count = count_result.scalar() or 0

    # Average rating
    avg_result = await db.execute(select(func.coalesce(func.avg(Feedback.rating), 0)))
    avg_rating = round(float(avg_result.scalar() or 0), 2)

    # Count by type
    type_result = await db.execute(
        select(Feedback.feedback_type, func.count(Feedback.id))
        .group_by(Feedback.feedback_type)
    )
    by_type = {row[0]: row[1] for row in type_result.fetchall()}

    return FeedbackStats(
        avg_rating=avg_rating,
        total_count=total_count,
        by_type=by_type
    )