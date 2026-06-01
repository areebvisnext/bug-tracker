from schemas.auth import UserProfileResponse
from fastapi import HTTPException


def can_access_project(db, user: UserProfileResponse, project_id) -> bool:

    result = (
        db.table("project_members")
        .select("*")
        .eq("project_id", project_id)
        .eq("user_id", user.id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=403, detail="Forbidden")
    return True


def can_manage_project(user: UserProfileResponse, project):
    if user.role == "Manager":
        if project["created_by"] != user.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        return True
    else:
        raise HTTPException(status_code=403, detail="Forbidden")
