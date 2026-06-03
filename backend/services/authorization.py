from schemas.auth import UserProfileResponse
from fastapi import HTTPException


def can_access_project_by_id(db, user_id: str, project_id) -> bool:

    result = (
        db.table("project_members")
        .select("*")
        .eq("project_id", project_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=403, detail="Forbidden")
    return True


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


def can_access_bug(db, bug_id: int, user_id: str):
    response = db.table("bugs").select("project_id").eq("id", bug_id).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Bug not found")
    project_id = response.data[0]["project_id"]
    return can_access_project_by_id(db, user_id, project_id)
