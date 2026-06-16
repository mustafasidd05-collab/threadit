from pydantic import BaseModel
from datetime import datetime


class FileOut(BaseModel):
    id: str
    uploader_id: str
    filename: str
    file_type: str
    file_url: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}
