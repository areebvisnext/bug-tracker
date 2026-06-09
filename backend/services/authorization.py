from fastapi import HTTPException, Depends
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer
from typing import cast
from sqlalchemy.orm import Session

from services.authService import get_current_user_profile

from models.bug import Bug
from models.project import ProjectMember

from schemas.auth import UserProfileResponse


bearer_scheme = HTTPBearer()


def can_access_project_by_id(db: Session, user_id: str, project_id: int) -> bool:
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

    return True


def can_access_project(db: Session, user: UserProfileResponse, project_id: int) -> bool:
    return can_access_project_by_id(db, user.id, project_id)


def can_manage_project(user: UserProfileResponse, project) -> bool:
    creator_id = project.created_by

    if require_manager():
        if str(creator_id) != user.id:
            raise HTTPException(status_code=403, detail="Forbidden")

        return True
    else:
        raise HTTPException(status_code=403, detail="Forbidden")


def can_access_bug(db: Session, bug_id: int, user_id: str) -> bool:
    bug = db.query(Bug).filter(Bug.id == bug_id).first()

    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")

    return can_access_project_by_id(db, user_id, cast(int, bug.project_id))


def require_manager(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    user = get_current_user_profile(credentials.credentials)
    if user.role != "Manager":
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    return user


def require_qa(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    user = get_current_user_profile(credentials.credentials)
    if user.role != "QA":
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this resource",
        )

    return user
