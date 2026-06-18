"""
Seed script to create a demo user for testing.
Run: python scripts/create_demo_user.py
"""
import asyncio
import sys
import os

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import async_session, engine
from app.database.base import Base
from app.models import User, Thread, Vote, Message, File, OTPVerification, Tribe, TribeMember
from app.auth.hashing import hash_password
from sqlalchemy import select
from datetime import datetime, timezone


async def create_demo():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Check if demo user exists
        result = await db.execute(
            select(User).where(User.email == "demo@threadit.com")
        )
        if result.scalar_one_or_none():
            print("Demo user already exists. Skipping.")
            return

        # Create demo user
        user = User(
            username="demo",
            email="demo@threadit.com",
            hashed_password=hash_password("demo1234"),
            email_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print(f"Demo user created:")
        print(f"  Email:    demo@threadit.com")
        print(f"  Password: demo1234")
        print(f"  User ID:  {user.id}")


if __name__ == "__main__":
    asyncio.run(create_demo())
