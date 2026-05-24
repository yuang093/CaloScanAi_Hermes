from contextlib import asynccontextmanager
import logging
import sys
import json
from datetime import date
from uuid import UUID

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from jose import jwt, JWTError

from .core.config import get_settings
from .core.database import get_db, engine, Base
from .core.exceptions import CaloScanException
from .models.user import User
from .models.food_log import FoodLog
from .models.barcode import BarcodeDictionary, DailyQuote
from .schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from .schemas.food_log import FoodLogCreate, FoodLogResponse
import base64 as _base64

from .services.vision import analyze_food_image
from .services.auth import get_password_hash, verify_password, create_access_token, decode_token
from .api.backup import router as backup_router
from .api.feedback import router as feedback_router
from .api.account import router as account_router
from .api.admin import router as admin_router
from .api.food_logs import router as food_logs_router


# ── JSON Logging Setup ─────────────────────────────────────────────────────────
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log_data["exc_info"] = self.formatException(record.exc_info)
        return json.dumps(log_data)


def setup_logging():
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root_logger.addHandler(handler)
    
    # Set httpx logging to WARNING to reduce noise
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


setup_logging()
logger = logging.getLogger(__name__)


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


app = FastAPI(title="CaloScanAi API", version="1.1.0", lifespan=lifespan)

# Mount uploads directory for serving food images
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

app.include_router(backup_router)
app.include_router(feedback_router)
app.include_router(account_router)
app.include_router(admin_router)
app.include_router(food_logs_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Exception Handlers ─────────────────────────────────────────────────────────
@app.exception_handler(CaloScanException)
async def caloscan_exception_handler(request: Request, exc: CaloScanException):
    logger.error(f"CaloScanException: {exc.detail}", exc_info=True)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": exc.error_code},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"HTTPException {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "error_code": "HTTP_ERROR"},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"RequestValidationError: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": "請求格式驗證失敗",
            "error_code": "VALIDATION_ERROR",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "伺服器內部錯誤", "error_code": "INTERNAL_ERROR"},
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
    # Check duplicate username
    existing = await db.execute(
        select(User).where(User.username == data.username)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="帳號已經存在")

    # 設定預設 email（username@localhost）
    default_email = f"{data.username}@localhost"

    user = User(
        username=data.username,
        email=default_email,
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
    #支援 username 或 email 登入
    result = await db.execute(
        select(User).where(
            (User.username == data.identifier) | (User.email == data.identifier)
        )
    )
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
        protein_g=data.protein_g,
        carbs_g=data.carbs_g,
        fat_g=data.fat_g,
        source=data.source,
        log_date=data.log_date or date.today(),
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    logger.info(f"FoodLog created: user={current_user.id}, food={data.food_name}, calories={data.calories}")
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
    """
    條碼查詢：
    1. 先查本地 BarcodeDictionary
    2. 找不到則自動查 OpenFoodFacts API
    3. 將查到的結果寫入本地 DB（可選快取）
    """
    logger.info(f"Barcode lookup: {barcode}")
    
    # 使用 barcode service 的整合查詢
    from .services.barcode import lookup_or_estimate_barcode
    
    result = await lookup_or_estimate_barcode(barcode, db)
    
    if not result["found"]:
        logger.warning(f"Barcode not found: {barcode}")
        return JSONResponse(
            status_code=404,
            content={
                "detail": "未找到商品，請手動輸入",
                "error_code": "BARCODE_NOT_FOUND",
                "barcode": barcode,
            },
        )
    
    logger.info(f"Barcode found via {result.get('source')}: {result['food_name']}")
    return result


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
    return {"status": "ok", "version": "1.1.0"}