from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from app.database.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.services.user_service import create_user, authenticate_user
from app.auth.jwt_handler import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut, status_code=201)
async def signup(data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = await create_user(db, data)
    return user


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    user.last_seen = datetime.now(timezone.utc)
    token = create_access_token({"sub": user.id, "username": user.username})
    return Token(access_token=token)
