from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base
from models.profile import Profile
from models.project import Project


class Bug(Base):
    __tablename__ = "bugs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    title: Mapped[str] = mapped_column(String, nullable=False)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    type: Mapped[str] = mapped_column(String, nullable=False)

    status: Mapped[str] = mapped_column(String, nullable=False)

    priority: Mapped[str] = mapped_column(String, nullable=False, default="medium")

    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    screenshot: Mapped[str | None] = mapped_column(String, nullable=True)

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )

    assigned_to: Mapped[UUID | None] = mapped_column(
        ForeignKey("profiles.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_by: Mapped[UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    project: Mapped["Project"] = relationship(foreign_keys=[project_id])

    assignee: Mapped["Profile | None"] = relationship(foreign_keys=[assigned_to])

    creator: Mapped["Profile"] = relationship(foreign_keys=[created_by])
