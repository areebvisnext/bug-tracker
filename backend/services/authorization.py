from fastapi import Depends, HTTPException
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from models.bug import Bug
from models.project import ProjectMember
from schemas.auth import UserProfileResponse
from services.authService import get_current_user_profile


bearer_scheme = HTTPBearer()


def can_access_project_by_id(
    db: Session,
    user_id: str,
    project_id: int,
) -> None:
    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(status_code=403, detail="Forbidden")


def can_access_project(
    db: Session,
    user: UserProfileResponse,
    project_id: int,
) -> None:
    can_access_project_by_id(db, user.id, project_id)


def can_manage_project(
    user: UserProfileResponse,
    project,
) -> None:
    if user.role != "Manager":
        raise HTTPException(status_code=403, detail="Forbidden")

    if str(project.created_by) != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")


def can_access_bug(
    db: Session,
    bug_id: int,
    user_id: str,
) -> None:
    bug = db.query(Bug).filter(Bug.id == bug_id).first()

    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")

    can_access_project_by_id(
        db,
        user_id,
        bug.project_id,
    )


def require_manager(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)

    if user.role != "Manager":
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    return user


def require_qa(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)

    if user.role != "QA":
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    return user
