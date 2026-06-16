import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.file import File
from app.config import settings

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif",
    ".pdf", ".doc", ".docx",
    ".txt", ".csv", ".zip",
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


async def upload_file(
    db: AsyncSession, uploader_id: str, file: UploadFile
) -> File:
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 20 MB)")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    file_record = File(
        uploader_id=uploader_id,
        filename=file.filename or unique_name,
        file_type=ext,
        file_url=f"/uploads/{unique_name}",
    )
    db.add(file_record)
    await db.flush()
    await db.refresh(file_record)
    return file_record
