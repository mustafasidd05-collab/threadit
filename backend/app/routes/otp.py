from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.otp import SignupRequest, OTPVerify, OTPResponse
from app.schemas.user import UserCreate, UserLogin, Token
from app.services.user_service import create_user, authenticate_user
from app.auth.jwt_handler import create_access_token
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=201)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Direct signup — no OTP (needs persistent DB for OTP)
    user_data = UserCreate(
        username=data.username,
        email=data.email,
        password=data.password,
    )
    user = await create_user(db, user_data)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "profile_image": user.profile_image,
        "created_at": str(user.created_at),
        "last_seen": str(user.last_seen),
    }


@router.post("/verify-otp", response_model=OTPResponse)
async def verify_otp(data: OTPVerify, db: AsyncSession = Depends(get_db)):
    # Stub — just return success
    return OTPResponse(
        message="Verification skipped (OTP not available with SQLite)",
        email=data.email,
    )


@router.post("/resend-otp", status_code=200)
async def resend_otp(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    return {
        "message": "OTP not available with SQLite. Use direct signup.",
        "email": data.email,
    }