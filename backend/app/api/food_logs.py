"""
CaloScanAi — Food Log API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID
from datetime import datetime
import os
import uuid
import base64

from ..core.database import get_db
from ..models.food_log import FoodLog
from ..models.user import User
from ..schemas.food_log import FoodLogResponse, FoodLogCreate
from ..services.image_processor import compress_image
from ..services.vision import analyze_food_image
from .auth import get_current_user

router = APIRouter(prefix="/api/food-logs", tags=["Food Logs"])


@router.post("", response_model=FoodLogResponse)
async def create_food_log(
    image: UploadFile = File(...),
    food_name: str = Form(...),
    calories: int = Form(...),
    protein_g: float = Form(0),
    carbs_g: float = Form(0),
    fat_g: float = Form(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    上傳圖片 + 資料建立飲食記錄。
    圖片會先壓縮再存檔。
    """
    # 1. 檢查檔案格式
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="僅支援 JPEG/PNG/WEBP 格式")

    # 2. 壓縮圖片
    compressed_bytes = await compress_image(image)

    # 3. 建立記錄（實際存檔路徑可改為 local volume 或 S3）
    filename = f"{uuid.uuid4().hex}.jpg"
    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    path = f"{upload_dir}/{filename}"

    with open(path, "wb") as f:
        f.write(compressed_bytes)

    food_log = FoodLog(
        user_id=current_user.id,
        food_name=food_name,
        calories=calories,
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        image_path=filename,
    )
    db.add(food_log)
    await db.commit()
    await db.refresh(food_log)

    return food_log


@router.post("/analyze", response_model=dict)
async def analyze_image(
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    只分析圖片，不儲存。回傳食物辨識結果。
    """
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="僅支援 JPEG/PNG/WEBP 格式")

    compressed = await compress_image(image)
    b64 = base64.b64encode(compressed).decode("utf-8")

    result = await analyze_food_image(b64)
    return result


@router.get("", response_model=list[FoodLogResponse])
async def list_food_logs(
    date: str = None,  # YYYY-MM-DD
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    取得当前用户的所有饮食记录，可按日期篩選。
    """
    query = select(FoodLog).where(FoodLog.user_id == current_user.id)

    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.where(
                and_(
                    FoodLog.created_at >= target_date,
                    FoodLog.created_at < target_date.replace(day=target_date.day + 1) if target_date.month < 12
                    else target_date.replace(year=target_date.year + 1, month=1, day=1)
                )
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="日期格式錯誤，請使用 YYYY-MM-DD")

    query = query.order_by(FoodLog.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/today", response_model=list[FoodLogResponse])
async def get_today_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """取得今日所有飲食記錄。"""
    today = datetime.now().date()
    tomorrow = today.replace(month=today.month + 1) if today.month < 12 else today.replace(year=today.year + 1, month=1, day=1)

    query = (
        select(FoodLog)
        .where(
            and_(
                FoodLog.user_id == current_user.id,
                FoodLog.created_at >= today,
                FoodLog.created_at < tomorrow,
            )
        )
        .order_by(FoodLog.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/{log_id}")
async def delete_food_log(
    log_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """刪除指定飲食記錄（只能刪自己的）。"""
    result = await db.execute(
        select(FoodLog).where(
            and_(FoodLog.id == log_id, FoodLog.user_id == current_user.id)
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="找不到該筆記錄")

    await db.delete(log)
    await db.commit()
    return {"message": "刪除成功"}