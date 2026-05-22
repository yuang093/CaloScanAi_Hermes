"""
CaloScanAi — 管理員 API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from uuid import UUID
from datetime import date, timedelta

from ..core.database import get_db
from ..models.user import User
from ..models.food_log import FoodLog
from ..services.auth import get_current_user, verify_password, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="需要管理員權限")
    return current_user


# ── 儀表板統計 ────────────────────────────────────────────────────────────────


@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """管理員儀表板：總用戶數、總記錄數、今日活躍用戶、7日趨勢。"""

    # 總用戶數
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0

    # 總記錄數
    total_logs_result = await db.execute(select(func.count(FoodLog.id)))
    total_logs = total_logs_result.scalar() or 0

    # 今日新增用戶
    today = date.today()
    new_users_today_result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= today)
    )
    new_users_today = new_users_today_result.scalar() or 0

    # 今日飲食記錄數
    logs_today_result = await db.execute(
        select(func.count(FoodLog.id)).where(FoodLog.created_at >= today)
    )
    logs_today = logs_today_result.scalar() or 0

    # 過去 7 天每日新建飲食記錄數（趨勢）
    week_range = today - timedelta(days=6)
    weekly_result = await db.execute(
        select(
            func.date(FoodLog.created_at).label("date"),
            func.count(FoodLog.id).label("count"),
        )
        .where(FoodLog.created_at >= week_range)
        .group_by(func.date(FoodLog.created_at))
        .order_by(func.date(FoodLog.created_at))
    )
    weekly_trend = [
        {"date": str(row.date), "count": row.count}
        for row in weekly_result.all()
    ]

    # 過去 7 天每日新增用戶
    weekly_users_result = await db.execute(
        select(
            func.date(User.created_at).label("date"),
            func.count(User.id).label("count"),
        )
        .where(User.created_at >= week_range)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )
    weekly_users_trend = [
        {"date": str(row.date), "count": row.count}
        for row in weekly_users_result.all()
    ]

    # 熱門食物（最多被記錄的食物名稱 TOP 10）
    top_foods_result = await db.execute(
        select(FoodLog.food_name, func.count(FoodLog.id).label("count"))
        .group_by(FoodLog.food_name)
        .order_by(func.count(FoodLog.id).desc())
        .limit(10)
    )
    top_foods = [
        {"food_name": row.food_name, "count": row.count}
        for row in top_foods_result.all()
    ]

    return {
        "total_users": total_users,
        "total_logs": total_logs,
        "new_users_today": new_users_today,
        "logs_today": logs_today,
        "weekly_food_logs_trend": weekly_trend,
        "weekly_new_users_trend": weekly_users_trend,
        "top_foods": top_foods,
    }


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """列出所有用戶（一般用戶和管理員）。"""

    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    return [
        {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "daily_calorie_limit": user.daily_calorie_limit,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        for user in users
    ]


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """變更用戶角色（user ↔ admin）。"""

    if "role" not in data or data["role"] not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="role 必須是 user 或 admin")

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="找不到該用戶")

    # 防止移除自己管理員身份（可註解掉這段以允許）
    if target.id == admin.id and data["role"] != "admin":
        raise HTTPException(status_code=400, detail="不能移除自己的管理員身份")

    target.role = data["role"]
    await db.commit()
    return {"message": f"已將 {target.username} 角色改為 {data['role']}"}


@router.put("/users/{user_id}/calorie-limit")
async def update_user_calorie_limit(
    user_id: UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """管理員修改用戶的每日熱量限制。"""

    if "daily_calorie_limit" not in data:
        raise HTTPException(status_code=400, detail="缺少 daily_calorie_limit")

    limit = data["daily_calorie_limit"]
    if not isinstance(limit, int) or limit < 500 or limit > 10000:
        raise HTTPException(status_code=400, detail="熱量限制需在 500~10000 kcal 之間")

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="找不到該用戶")

    target.daily_calorie_limit = limit
    await db.commit()
    return {"message": f"已將 {target.username} 的每日熱量限制改為 {limit} kcal"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """刪除指定用戶（會連帶刪除該用戶所有飲食記錄）。"""

    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="不能刪除自己的帳號")

    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="找不到該用戶")

    username = target.username
    await db.delete(target)
    await db.commit()
    return {"message": f"已刪除用戶 {username}"}