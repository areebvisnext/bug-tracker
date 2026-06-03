from datetime import datetime
from typing import cast, Any, Literal
import uuid
from fastapi import HTTPException

from schemas.bug import BugCreate, BugResponse, BugUpdate
from schemas.auth import UserProfileResponse

from database.supabase import get_supabase_db
from services.authorization import (
    can_access_project,
    can_access_project_by_id,
    can_access_bug,
)


def row_to_Bug(row: dict):
    type_value = cast(Literal["bug", "feature"], row.get("type"))
    status_value = cast(
        Literal["new", "started", "completed", "resolved"], row.get("status")
    )
    return BugResponse(
        id=cast(int, row.get("id")),
        title=str(row.get("title")),
        description=row.get("description"),
        type=type_value,
        status=status_value,
        deadline=row.get("deadline"),
        screenshot=row.get("screenshot"),
        project_id=cast(int, row.get("project_id")),
        assigned_to=cast(str, row.get("assigned_to")),
        created_by=str(row.get("created_by")),
        created_at=cast(datetime, row.get("created_at")),
    )


def create_bug_service(bug: BugCreate, user: UserProfileResponse, access_token: str):
    db = get_supabase_db(access_token)
    if user.role != "QA":
        raise HTTPException(status_code=403, detail="Only a QA can create bug")
    if not can_access_project(db, user, bug.project_id):
        raise HTTPException(status_code=403, detail="Not allowed")
    if not can_access_project_by_id(db, bug.assigned_to, bug.project_id):
        raise HTTPException(status_code=403, detail="Not allowed")
    payload = bug.model_dump(mode="json")
    payload["created_by"] = user.id
    result = db.table("bugs").insert(payload).execute()
    return row_to_Bug(cast(dict, result.data[0]))


def get_bugList_service(user: UserProfileResponse, access_token: str):
    db = get_supabase_db(access_token)
    response = (
        db.table("project_members")
        .select("project_id")
        .eq("user_id", user.id)
        .execute()
    )
    result = cast(list[dict[str, Any]], response.data)
    project_ids = []
    for i in result:
        project_ids.append(i["project_id"])
    response = db.table("bugs").select("*").in_("project_id", project_ids).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Not Found")
    result = response.data
    return result


def get_bug_service(bug_id: int, user: UserProfileResponse, access_token: str):
    db = get_supabase_db(access_token)
    if not can_access_bug(db, bug_id, user.id):
        raise HTTPException(status_code=403, detail="Not allowed")
    result = db.table("bugs").select("*").eq("id", bug_id).execute()
    return row_to_Bug(cast(dict, result.data[0]))


def delete_bug_service(bug_id: int, user: UserProfileResponse, access_token: str):
    db = get_supabase_db(access_token)
    response = db.table("bugs").select("created_by").eq("id", bug_id).execute()
    result = response.data[0]
    if not response.data:
        raise HTTPException(status_code=404, detail="Bug does not exist")
    if result != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    response = db.table("bugs").delete().eq("id", bug_id).execute()
    if not response.data:
        raise HTTPException(status_code=403, detail="Error")
    return "Deleted succesfully"


async def upload_screenshot_service(
    bug_id: int, file, user: UserProfileResponse, access_token: str
):
    if user.role != "QA":
        raise HTTPException(status_code=403, detail="Access denied")
    db = get_supabase_db(access_token)
    if not can_access_bug(db, bug_id, user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    allowed_types = {
        "image/png",
        "image/gif",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, detail="Only png and gif files are allowed"
        )

    contents = await file.read()

    filename = f"{uuid.uuid4()}-{file.filename}"
    path = f"bugs/{bug_id}/{filename}"

    db.storage.from_("bug-screenshots").upload(
        path=path, file=contents, file_options={"content-type": file.content_type}
    )

    url = db.storage.from_("bug-screenshots").get_public_url(path)
    db.table("bugs").update({"screenshot": url}).eq("id", bug_id).execute()
    return "screenshot uploaded succesfully"


def update_bug_service(
    bug_id: int, bug: BugUpdate, user: UserProfileResponse, access_token: str
):
    db = get_supabase_db(access_token)
    response = db.table("bugs").select("*").eq("id", bug_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Not found")
    result = cast(dict, response.data[0])
    if user.role == "Manager":
        raise HTTPException(status_code=403, detail="Access denied")
    if user.role == "QA":
        if result["created_by"] == user.id:
            payload = bug.model_dump(exclude_unset=True)
            result = db.table("bugs").update(payload).eq("id", bug_id).execute()
            if not result.data:
                raise HTTPException(status_code=403, detail="Error occured")
            return "Updated Successfully"
    if user.role == "Developer":
        if result["assigned_to"] == user.id:
            payload = bug.model_dump(exclude_unset=True)
            updated_payload = {}
            updated_payload["status"] = payload["status"]
            result = db.table("bugs").update(updated_payload).eq("id", bug_id).execute()
            if not result.data:
                raise HTTPException(status_code=403, detail="Error occured")
            return "Updated Successfully"
