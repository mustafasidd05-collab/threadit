from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    UPLOAD_DIR: str = "./uploads"
    CORS_ORIGINS: str = '["http://localhost:3000"]'
    DEV_SKIP_EMAIL_VERIFICATION: str = "false"

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    @property
    def is_dev(self) -> bool:
        return self.DEV_SKIP_EMAIL_VERIFICATION.lower() == "true"

    class Config:
        env_file = ".env"


settings = Settings()
