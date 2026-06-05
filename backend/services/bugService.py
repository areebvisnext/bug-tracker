from datetime import datetime
from fastapi import HTTPException, BackgroundTasks
from typing import Any, cast, Literal
import uuid

from database.supabase import get_supabase_db

from schemas.bug import BugCreate, BugResponse, BugUpdate
from schemas.auth import UserProfileResponse

from services.authorization import (
    can_access_bug,
    can_access_project,
    can_access_project_by_id,
)
from services.mailService import assigned_bug


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

    existing_bug = (
        db.table("bugs")
        .select("id")
        .eq("project_id", bug.project_id)
        .eq("title", bug.title)
        .limit(1)
        .execute()
    )
    if existing_bug.data:
        raise HTTPException(
            status_code=409,
            detail="A bug with this title already exists in this project",
        )

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

    return response.data


def get_bug_service(bug_id: int, user: UserProfileResponse, access_token: str):

    db = get_supabase_db(access_token)

    if not can_access_bug(db, bug_id, user.id):
        raise HTTPException(status_code=403, detail="Not allowed")

    response = db.table("bugs").select("*").eq("id", bug_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Not Found")

    return row_to_Bug(cast(dict, response.data[0]))


def delete_bug_service(bug_id: int, user: UserProfileResponse, access_token: str):

    db = get_supabase_db(access_token)

    response = db.table("bugs").select("created_by").eq("id", bug_id).execute()
    result = cast(dict, response.data[0])

    if not response.data:
        raise HTTPException(status_code=404, detail="Bug does not exist")
    if result["created_by"] != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    response = db.table("bugs").delete().eq("id", bug_id).execute()
    if not response.data:
        raise HTTPException(status_code=403, detail="Error")

    return {"response": "Deleted succesfully"}


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
    bug_id: int,
    bug: BugUpdate,
    user: UserProfileResponse,
    access_token: str,
    background_tasks: BackgroundTasks,
):

    db = get_supabase_db(access_token)
    response = db.table("bugs").select("*").eq("id", bug_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Not found")
    result = cast(dict, response.data[0])

    if user.role == "Manager":
        raise HTTPException(status_code=403, detail="Access denied")

    if bug.title:
        existing_bug = (
            db.table("bugs")
            .select("id")
            .eq("project_id", result["project_id"])
            .eq("title", bug.title)
            .neq("id", bug_id)
            .limit(1)
            .execute()
        )
        if existing_bug.data:
            raise HTTPException(
                status_code=409,
                detail="A bug with this title already exists in this project",
            )

    bug_type = bug.type if bug.type is not None else result["type"]

    valid_status = {
        "feature": {"new", "started", "completed"},
        "bug": {"new", "started", "resolved"},
    }

    if bug.status and bug.status not in valid_status[bug_type]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{bug.status}' for type '{bug_type}'",
        )

    if bug.type and bug.type != result["type"]:
        if not bug.status:
            bug.status = "new"
        elif bug.status not in valid_status[bug.type]:
            raise HTTPException(
                status_code=400,
                detail=f"Status '{bug.status}' is invalid for new type '{bug.type}'",
            )

    payload = bug.model_dump(exclude_unset=True, mode="json")

    if user.role == "QA" and result["created_by"] == user.id:
        response = db.table("bugs").update(payload).eq("id", bug_id).execute()

        if (
            payload.get("assigned_to")
            and result["assigned_to"] != payload["assigned_to"]
        ):
            background_tasks.add_task(
                assigned_bug,
                result["assigned_to"],
                result["project_id"],
                result["title"],
                user.full_name,
                access_token,
            )

        if not response.data:
            raise HTTPException(status_code=403, detail="Error occurred")

        return {"message": "Updated Successfully"}

    if user.role == "Developer" and result["assigned_to"] == user.id:
        if "status" not in payload:
            raise HTTPException(status_code=400, detail="No status to update")

        result = (
            db.table("bugs")
            .update({"status": payload["status"]})
            .eq("id", bug_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=403, detail="Error occurred")
        return {"message": "Updated Successfully"}

    raise HTTPException(status_code=403, detail="Access denied")
