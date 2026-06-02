from pathlib import Path
from sys import exception
from unittest import result
from uuid import uuid4
import imghdr

from fastapi import HTTPException, UploadFile
from postgrest.exceptions import APIError

from config import SUPABASE_STORAGE_BUCKET
from database.supabase import get_supabase_db, supabase
from schemas.auth import UserProfileResponse
from schemas.projects import ProjectCreate, ProjectResponse, ProjectUpdate
from services.authorization import can_access_project, can_manage_project


def _profile_for_user(user_id: str) -> UserProfileResponse | None:
    result = (
        supabase.table("profiles")
        .select("id, full_name, role")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None

    row = result.data[0]
    return UserProfileResponse(
        id=row["id"],
        email="",
        full_name=row["full_name"],
        role=row["role"],
        phone=None,
        avatar_url=None,
    )


def _row_to_project_response(
    row: dict, creator: UserProfileResponse | None = None
) -> ProjectResponse:
    creator_id = row["created_by"]
    resolved_creator = creator or _profile_for_user(creator_id)
    if not resolved_creator:
        raise HTTPException(
            status_code=500,
            detail=f"Profile not found for project creator {creator_id}",
        )

    return ProjectResponse(
        id=row["id"],
        name=row["name"],
        description=row.get("description"),
        logo=row.get("logo"),
        created_by=resolved_creator,
        created_at=row["created_at"],
    )


def _add_project_member(db, project_id: str, user_id: str) -> None:
    try:
        db.table("project_members").insert(
            {"project_id": project_id, "user_id": user_id}
        ).execute()
    except APIError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to add project member: {e.message}",
        ) from e


def _build_project_logo_path(project_id: int, filename: str) -> str:
    extension = Path(filename).suffix or ""
    return f"projects/{project_id}/{uuid4().hex}{extension}"


def _upload_project_logo(db, logo_file: UploadFile, project_id: int) -> str:
    upload_path = _build_project_logo_path(project_id, logo_file.filename)
    bucket = db.storage.from_(SUPABASE_STORAGE_BUCKET)

    logo_file.file.seek(0)
    data = logo_file.file.read()

    content_type = (logo_file.content_type or "").lower()
    detected = imghdr.what(None, data)

    if not detected:
        ext = Path(logo_file.filename).suffix.lower()
        if ext in (".jpg", ".jpeg"):
            detected = "jpeg"
        elif ext == ".png":
            detected = "png"

    if detected in ("jpeg", "png"):
        if detected == "jpeg":
            content_type = "image/jpeg"
        else:
            content_type = "image/png"
    else:
        if content_type.startswith("image/") and content_type in (
            "image/jpeg",
            "image/png",
        ):
            pass
        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported image type; only JPEG and PNG are allowed",
            )

    result = bucket.upload(
        upload_path,
        data,
        file_options={"content-type": content_type},
    )
    if getattr(result, "error", None):
        raise HTTPException(
            status_code=400,
            detail=(getattr(result, "error", None) or "Failed to upload logo"),
        )

    public_url = bucket.get_public_url(upload_path)
    if not public_url:
        raise HTTPException(
            status_code=500,
            detail="Failed to resolve logo public URL",
        )

    return public_url


def create_project_service(
    body: ProjectCreate,
    user: UserProfileResponse,
    access_token: str,
    logo_file: UploadFile | None = None,
) -> ProjectResponse:
    if user.role != "Manager":
        raise HTTPException(status_code=403, detail="Only managers can create projects")

    db = get_supabase_db(access_token)
    payload = {
        "name": body.name,
        "description": body.description,
        "created_by": user.id,
    }

    try:
        result = db.table("projects").insert(payload).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=e.message) from e

    if not result.data:
        raise HTTPException(status_code=500, detail="Project creation failed")

    project_row = result.data[0]
    project_id = project_row["id"]

    if logo_file:
        try:
            logo_url = _upload_project_logo(db, logo_file, project_id)
            update_result = (
                db.table("projects")
                .update({"logo": logo_url})
                .eq("id", project_id)
                .select("*")
                .execute()
            )
            if not update_result.data:
                raise HTTPException(
                    status_code=500,
                    detail="Project logo update failed",
                )
            project_row = update_result.data[0]
        except HTTPException:
            db.table("projects").delete().eq("id", project_id).execute()
            raise

    try:
        _add_project_member(db, project_id, user.id)
    except HTTPException:
        db.table("projects").delete().eq("id", project_id).execute()
        raise

    return _row_to_project_response(project_row, creator=user)


def _project_ids_for_user(db, user_id: str) -> list[str]:
    result = (
        db.table("project_members")
        .select("project_id")
        .eq("user_id", user_id)
        .execute()
    )
    return [row["project_id"] for row in result.data or []]


def list_projects(
    user: UserProfileResponse, access_token: str
) -> list[ProjectResponse]:
    db = get_supabase_db(access_token)

    try:
        query = db.table("projects").select("*")

        if user.role == "Manager":
            query = query.eq("created_by", user.id)
        else:
            project_ids = _project_ids_for_user(db, user.id)

            if not project_ids:
                return []

            query = query.in_("id", project_ids)

        result = query.order("created_at", desc=True).execute()

    except APIError as e:
        raise HTTPException(status_code=400, detail=e.message) from e

    rows = result.data or []
    return [_row_to_project_response(row) for row in rows]


def get_project_service(
    project_id: int, user: UserProfileResponse, access_token: str
) -> ProjectResponse:
    db = get_supabase_db(access_token)
    result = db.table("projects").select("*").eq("id", project_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    project = result.data[0]
    if can_access_project(db, user, project_id):
        return _row_to_project_response(project)


def update_project_service(
    project_id: int,
    body: ProjectUpdate,
    user: UserProfileResponse,
    access_token: str,
):
    if user.role != "Manager":
        raise HTTPException(status_code=403, detail="Forbidden")
    db = get_supabase_db(access_token)
    update_body = body.model_dump(exclude_unset=True)
    result = db.table("projects").select("*").eq("id", project_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    project = result.data[0]
    if not can_manage_project(user, project):
        raise HTTPException(status_code=403, detail="Forbidden")
    result = db.table("projects").update(update_body).eq("id", project_id).execute()
    return _row_to_project_response(result.data[0])


def update_project_with_logo_service(
    project_id: int,
    name: str,
    description: str | None,
    logo_file,
    user: UserProfileResponse,
    access_token: str,
):
    if user.role != "Manager":
        raise HTTPException(status_code=403, detail="Forbidden")

    db = get_supabase_db(access_token)

    result = db.table("projects").select("*").eq("id", project_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    project = result.data[0]
    if not can_manage_project(user, project):
        raise HTTPException(status_code=403, detail="Forbidden")

    logo_url = None
    if logo_file:
        logo_url = _upload_project_logo(db, logo_file, project_id)

    update_data = {"name": name}
    if description is not None:
        update_data["description"] = description
    if logo_url:
        update_data["logo"] = logo_url

    result = db.table("projects").update(update_data).eq("id", project_id).execute()

    return _row_to_project_response(result.data[0])


def add_members_service(
    project_id: int, user_id: str, user: UserProfileResponse, access_token: str
):
    if user.role != "Manager":
        raise HTTPException(status_code=403, detail="Forbidden")
    db = get_supabase_db(access_token)
    result = db.table("projects").select("*").eq("id", project_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    project = result.data[0]
    if not can_manage_project(user, project):
        raise HTTPException(status_code=403, detail="Forbidden")
    profile = db.table("profiles").select("id").eq("id", user_id).limit(1).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        result = (
            db.table("project_members")
            .insert(
                {
                    "project_id": project_id,
                    "user_id": user_id,
                }
            )
            .execute()
        )
    except:
        raise HTTPException(status_code=403, detail="Erro occured in db operations")

    return {"message": "Member added successfully"}


def remove_members_service(
    project_id: int, user_id: str, user: UserProfileResponse, access_token: str
):
    if user.role != "Manager":
        raise HTTPException(status_code=403, detail="Forbidden")
    db = get_supabase_db(access_token)
    result = db.table("projects").select("*").eq("id", project_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    project = result.data[0]
    if not can_manage_project(user, project):
        raise HTTPException(status_code=403, detail="Forbidden")
    profile = db.table("profiles").select("id").eq("id", user_id).limit(1).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")
    result = (
        db.table("project_members")
        .delete()
        .eq("user_id", user_id)
        .eq("project_id", project_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=404, detail="User not in members or already deleted"
        )

    return {"message": "Member removed successfully"}


def get_members_service(project_id: int, user: UserProfileResponse, access_token: str):
    db = get_supabase_db(access_token)
    if not can_access_project(db, user, project_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    result = (
        db.table("project_members")
        .select("user_id")
        .eq("project_id", project_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Members not found")
    return result.data
