from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from uuid import UUID
import re


class UserCreate(BaseModel):
    username: str = Field(
        ..., 
        min_length=3, 
        max_length=30, 
        description="使用者名稱（3-30字）"
    )
    email: EmailStr = Field(..., description="電子郵件")
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=128,
        description="密碼（最少8字）"
    )
    daily_calorie_limit: int = Field(
        ge=500, 
        le=10000, 
        default=2000, 
        description="每日熱量限制"
    )

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_\u4e00-\u9fff]+$", v):
            raise ValueError("使用者名稱只能包含英文、數字、底線和中文")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("密碼至少需要 8 個字元")
        return v


class UserLogin(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    role: str
    daily_calorie_limit: int
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse