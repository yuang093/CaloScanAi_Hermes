from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    daily_calorie_limit: int = 2000


class UserLogin(BaseModel):
    username: str
    password: str


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