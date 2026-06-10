from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class BugCreate(BaseModel):

    title: str
    description: str | None = None
    type: Literal["bug", "feature"]
    status: Literal["new", "started", "completed", "resolved"]
    priority: Literal["low", "medium", "high"]
    deadline: datetime | None = None
    screenshot: str | None = None
    project_id: int
    assigned_to: str


class BugResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None = None
    type: Literal["bug", "feature"]
    status: Literal["new", "started", "completed", "resolved"]
    priority: Literal["low", "medium", "high"]
    deadline: datetime | None = None
    screenshot: str | None = None
    project_id: int
    assigned_to: str | None = None
    created_by: str
    created_at: datetime


class BugUpdate(BaseModel):

    title: str | None = None
    description: str | None = None
    type: Literal["bug", "feature"] | None = None
    status: Literal["new", "started", "completed", "resolved"] | None = None
    priority: Literal["low", "medium", "high"] | None = None
    deadline: datetime | None = None
    screenshot: str | None = None
    project_id: int | None = None
    assigned_to: str | None = None
    created_at: datetime | None = None
