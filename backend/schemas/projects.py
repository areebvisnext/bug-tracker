from datetime import datetime

from pydantic import BaseModel, Field

from schemas.auth import UserProfileResponse


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    logo: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    logo: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    logo: str | None = None
    created_by: UserProfileResponse
    created_at: datetime
