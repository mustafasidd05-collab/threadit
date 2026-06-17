from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.otp import SignupRequest, OTPVerify, OTPResponse
from app.services.otp_service import request_signup_otp, verify_signup_otp

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=OTPResponse, status_code=200)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    otp = await request_signup_otp(db, data)
    return OTPResponse(
        message="OTP sent to your email. Check console for dev OTP.",
        email=data.email,
    )


@router.post("/verify-otp", response_model=OTPResponse)
async def verify_otp(data: OTPVerify, db: AsyncSession = Depends(get_db)):
    await verify_signup_otp(db, data)
    return OTPResponse(message="Account verified successfully. You can now log in.", email=data.email)


@router.post("/resend-otp", response_model=OTPResponse)
async def resend_otp(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    otp = await request_signup_otp(db, data)
    return OTPResponse(message="New OTP sent.", email=data.email)
