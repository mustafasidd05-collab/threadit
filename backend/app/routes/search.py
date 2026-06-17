from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.search import SearchResults
from app.services.search_service import search
from app.auth.dependencies import get_optional_user
from app.models.user import User

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResults)
async def search_all(
    q: str = Query(..., min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    user_id = current_user.id if current_user else None
    results = await search(db, q, user_id)
    return results
