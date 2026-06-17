import random
import string
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from fastapi import HTTPException, status
from app.models.otp import OTPVerification
from app.models.user import User
from app.schemas.otp import SignupRequest, OTPVerify
from app.auth.hashing import hash_password, verify_password, hash_password as hash_otp
from app.services.user_service import create_user


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


async def request_signup_otp(db: AsyncSession, data: SignupRequest) -> str:
    # Check existing user
    existing = await db.execute(
        select(User).where(
            (User.username == data.username) | (User.email == data.email)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already taken",
        )

    # Rate limit: max 3 OTPs per email per 15 minutes
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
    count_result = await db.execute(
        select(func.count())
        .select_from(OTPVerification)
        .where(
            and_(
                OTPVerification.email == data.email,
                OTPVerification.created_at > cutoff,
                OTPVerification.verified == False,
            )
        )
    )
    if (count_result.scalar() or 0) >= 3:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Try again in 15 minutes.",
        )

    # Invalidate previous OTPs for this email
    prev = await db.execute(
        select(OTPVerification).where(
            OTPVerification.email == data.email,
            OTPVerification.verified == False,
        )
    )
    for old in prev.scalars().all():
        await db.delete(old)

    # Generate OTP
    otp = generate_otp()
    otp_record = OTPVerification(
        email=data.email,
        username=data.username,
        password_hash=hash_password(data.password),
        otp_hash=hash_otp(otp),
    )
    db.add(otp_record)
    await db.flush()

    # TODO: Replace with real email service (SendGrid, SES, etc.)
    print(f"\n{'='*50}")
    print(f"  OTP for {data.email}: {otp}")
    print(f"{'='*50}\n")

    return otp  # Returned in response for dev; remove in production


async def verify_signup_otp(db: AsyncSession, data: OTPVerify) -> None:
    result = await db.execute(
        select(OTPVerification).where(
            OTPVerification.email == data.email,
            OTPVerification.verified == False,
        )
    )
    otp_record = result.scalar_one_or_none()

    if not otp_record:
        raise HTTPException(status_code=400, detail="No pending OTP for this email")

    # Check expiry
    if datetime.now(timezone.utc) > otp_record.expires_at:
        await db.delete(otp_record)
        raise HTTPException(status_code=400, detail="OTP has expired. Please sign up again.")

    # Check attempts
    if otp_record.attempts >= 5:
        await db.delete(otp_record)
        raise HTTPException(status_code=400, detail="Too many failed attempts. Please sign up again.")

    # Increment attempts
    otp_record.attempts += 1

    # Verify OTP
    if not verify_password(data.otp, otp_record.otp_hash):
        await db.flush()
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Create actual user
    from app.schemas.user import UserCreate
    user_data = UserCreate(
        username=otp_record.username,
        email=otp_record.email,
        password="dummy",  # We already have the hash
    )
    user = User(
        username=otp_record.username,
        email=otp_record.email,
        hashed_password=otp_record.password_hash,
    )
    db.add(user)

    # Clean up OTP record
    otp_record.verified = True
    await db.flush()
