"""
CaloScanAi — 普通用戶帳號管理 API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr

from ..core.database import get_db
from ..models.user import User
from ..services.auth import get_current_user, verify_password, get_password_hash

router = APIRouter(prefix="/api/account", tags=["Account"])


# ── Request Schemas ────────────────────────────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class UpdateProfileRequest(BaseModel):
    email: EmailStr | None = None
    daily_calorie_limit: int | None = None
    preferred_style: str | None = None


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """取得目前登入用戶的個人資料。"""
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "preferred_style": current_user.preferred_style,
        "daily_calorie_limit": current_user.daily_calorie_limit,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.put("/password")
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """變更密碼。"""
    # 驗證舊密碼
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="舊密碼輸入錯誤")

    # 新密碼起碼驗證
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="新密碼至少需要 8 個字元")

    if data.old_password == data.new_password:
        raise HTTPException(status_code=400, detail="新密碼不能與舊密碼相同")

    current_user.password_hash = get_password_hash(data.new_password)
    await db.commit()
    return {"message": "密碼變更成功"}


@router.put("/profile")
async def update_profile(
    data: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """更新個人資料（Email、每日熱量限制）。"""
    if data.email is not None:
        # 檢查 Email 是否已被其他帳號使用
        from sqlalchemy import select
        existing = await db.execute(
            select(User).where(User.email == data.email, User.id != current_user.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="此 Email 已被其他帳號使用")

        current_user.email = data.email

    if data.daily_calorie_limit is not None:
        if not isinstance(data.daily_calorie_limit, int) or \
           data.daily_calorie_limit < 500 or data.daily_calorie_limit > 10000:
            raise HTTPException(status_code=400, detail="熱量限制需在 500~10000 kcal")
        current_user.daily_calorie_limit = data.daily_calorie_limit

    if data.preferred_style is not None:
        VALID_STYLES = ("V1", "V3", "V5")
        if data.preferred_style not in VALID_STYLES and data.preferred_style != "":
            raise HTTPException(status_code=400, detail=f"preferred_style 必須是 {VALID_STYLES} 之一或留空")
        current_user.preferred_style = data.preferred_style if data.preferred_style != "" else None

    await db.commit()
    await db.refresh(current_user)

    return {
        "message": "個人資料更新成功",
        "email": current_user.email,
        "preferred_style": current_user.preferred_style,
        "daily_calorie_limit": current_user.daily_calorie_limit,
    }