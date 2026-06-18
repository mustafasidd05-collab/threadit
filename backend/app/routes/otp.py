from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.config import settings
from app.schemas.otp import SignupRequest, OTPVerify, OTPResponse
from app.schemas.user import UserCreate
from app.services.user_service import create_user
from app.services.otp_service import request_signup_otp, verify_signup_otp

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=201)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Dev mode: skip OTP, create account immediately
    if settings.is_dev:
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
            "dev_mode": True,
        }

    # Production: OTP flow
    otp = await request_signup_otp(db, data)
    return {
        "message": "OTP sent to your email.",
        "email": data.email,
        "otp": otp,  # Remove in real production
    }


@router.post("/verify-otp", response_model=OTPResponse)
async def verify_otp(data: OTPVerify, db: AsyncSession = Depends(get_db)):
    if settings.is_dev:
        return OTPResponse(
            message="Dev mode: verification skipped.",
            email=data.email,
        )
    await verify_signup_otp(db, data)
    return OTPResponse(
        message="Account verified. You can now log in.",
        email=data.email,
    )


@router.post("/resend-otp", status_code=200)
async def resend_otp(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    if settings.is_dev:
        return {"message": "Dev mode: OTP not needed.", "email": data.email}
    otp = await request_signup_otp(db, data)
    return {
        "message": "New OTP sent.",
        "email": data.email,
        "otp": otp,
    }
