from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.file import FileOut
from app.services.file_service import upload_file
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=FileOut, status_code=201)
async def upload(
    file: UploadFile = FastAPIFile(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await upload_file(db, current_user.id, file)
