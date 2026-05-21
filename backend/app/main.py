from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date
from jose import jwt, JWTError

from .core.config import get_settings
from .core.database import get_db, engine, Base
from .models.user import User
from .models.food_log import FoodLog
from .models.barcode import BarcodeDictionary, DailyQuote
from .schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from .schemas.food_log import FoodLogCreate, FoodLogResponse
from .services.auth import get_password_hash, verify_password, create_access_token, decode_token

settings = get_settings()
security = HTTPBearer()


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if not exist (SQLAlchemy will not override existing)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="CaloScanAi API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_db)) -> User:
    try:
        payload = decode_token(credentials.credentials)
        user_id = payload.get("sub")
        result = await db.execute(select(User).where(User.id == UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except (JWTError, Exception):
        raise HTTPException(status_code=401, detail="Invalid token")


# ── Auth Routes ───────────────────────────────────────────────────────────────
@app.post("/api/auth/register", response_model=TokenResponse)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check duplicate
    existing = await db.execute(
        select(User).where((User.username == data.username) | (User.email == data.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="帳號或 Email 已經存在")

    user = User(
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
        daily_calorie_limit=data.daily_calorie_limit,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="帳號或密碼錯誤")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


# ── User Routes ───────────────────────────────────────────────────────────────
@app.get("/api/users/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@app.put("/api/users/me", response_model=UserResponse)
async def update_me(data: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if "daily_calorie_limit" in data:
        current_user.daily_calorie_limit = data["daily_calorie_limit"]
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


# ── Food Log Routes ───────────────────────────────────────────────────────────
@app.get("/api/food-logs", response_model=list[FoodLogResponse])
async def get_food_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    log_date: date | None = None,
):
    query = select(FoodLog).where(FoodLog.user_id == current_user.id)
    if log_date:
        query = query.where(FoodLog.log_date == log_date)
    query = query.order_by(FoodLog.created_at.desc())
    result = await db.execute(query)
    logs = result.scalars().all()
    return [FoodLogResponse.model_validate(log) for log in logs]


@app.post("/api/food-logs", response_model=FoodLogResponse)
async def create_food_log(
    data: FoodLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = FoodLog(
        user_id=current_user.id,
        food_name=data.food_name,
        calories=data.calories,
        source=data.source,
        log_date=data.log_date or date.today(),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return FoodLogResponse.model_validate(log)


@app.get("/api/food-logs/summary")
async def get_daily_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    result = await db.execute(
        select(func.coalesce(func.sum(FoodLog.calories), 0))
        .where(FoodLog.user_id == current_user.id, FoodLog.log_date == today)
    )
    total_calories = result.scalar() or 0
    remaining = current_user.daily_calorie_limit - total_calories
    return {
        "date": today.isoformat(),
        "total_calories": total_calories,
        "limit": current_user.daily_calorie_limit,
        "remaining": remaining,
        "percentage": round((total_calories / current_user.daily_calorie_limit) * 100, 1) if current_user.daily_calorie_limit > 0 else 0,
    }


# ── Barcode Routes ────────────────────────────────────────────────────────────
@app.get("/api/barcode/{barcode}")
async def lookup_barcode(barcode: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BarcodeDictionary).where(BarcodeDictionary.barcode == barcode))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="找不到這個條碼")
    return {"barcode": item.barcode, "food_name": item.food_name, "calories": item.calories, "category": item.category}


# ── Daily Quote Route ─────────────────────────────────────────────────────────
@app.get("/api/daily-quote")
async def get_daily_quote(db: AsyncSession = Depends(get_db)):
    today = date.today()
    result = await db.execute(
        select(DailyQuote).where(DailyQuote.used_date == None).order_by(func.random()).limit(1)
    )
    quote = result.scalar_one_or_none()
    if not quote:
        result = await db.execute(select(DailyQuote).order_by(func.random()).limit(1))
        quote = result.scalar_one_or_none()
    if quote:
        quote.used_date = today
        await db.commit()
    return {"quote": quote.quote_text if quote else "今天也要好好愛自己。", "author": quote.author if quote else "佚名"}


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}