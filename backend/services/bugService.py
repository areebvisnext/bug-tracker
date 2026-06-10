import uuid

from fastapi import BackgroundTasks, HTTPException, UploadFile

from database.orm import SessionLocal
from database.supabase import get_supabase_db
from models import Bug, ProjectMember
from schemas.auth import UserProfileResponse
from schemas.bug import (
    BugCreate,
    BugResponse,
    BugUpdate,
)
from services.authorization import (
    can_access_bug,
    can_access_project,
    can_access_project_by_id,
)
from services.mailService import assigned_bug


def _bug_model_to_response(bug: Bug) -> BugResponse:
    return BugResponse.model_validate(bug)


def _get_bug_or_404(db, bug_id: int) -> Bug:
    bug = db.query(Bug).filter(Bug.id == bug_id).first()

    if not bug:
        raise HTTPException(
            status_code=404,
            detail="Bug not found",
        )

    return bug


def create_bug_service(
    bug: BugCreate,
    user: UserProfileResponse,
):
    with SessionLocal() as db:
        can_access_project(
            db,
            user,
            bug.project_id,
        )

        existing_bug = (
            db.query(Bug)
            .filter(
                Bug.project_id == bug.project_id,
                Bug.title == bug.title,
            )
            .first()
        )

        if existing_bug:
            raise HTTPException(
                status_code=409,
                detail="A bug with this title already exists in this project",
            )

        can_access_project_by_id(
            db,
            bug.assigned_to,
            bug.project_id,
        )

        new_bug = Bug(
            title=bug.title,
            description=bug.description,
            type=bug.type,
            status=bug.status,
            priority=bug.priority,
            deadline=bug.deadline,
            screenshot=bug.screenshot,
            project_id=bug.project_id,
            assigned_to=bug.assigned_to or None,
            created_by=user.id,
        )

        db.add(new_bug)
        db.commit()
        db.refresh(new_bug)

        return _bug_model_to_response(new_bug)


def get_bug_list_service(user: UserProfileResponse):
    with SessionLocal() as db:
        project_ids = [
            pm.project_id
            for pm in db.query(ProjectMember)
            .filter(ProjectMember.user_id == user.id)
            .all()
        ]

        if not project_ids:
            raise HTTPException(
                status_code=404,
                detail="Not found",
            )

        bugs = db.query(Bug).filter(Bug.project_id.in_(project_ids)).all()

        if not bugs:
            raise HTTPException(
                status_code=404,
                detail="Not found",
            )

        return [_bug_model_to_response(bug).model_dump() for bug in bugs]


def get_bug_service(
    bug_id: int,
    user: UserProfileResponse,
):
    with SessionLocal() as db:
        can_access_bug(
            db,
            bug_id,
            user.id,
        )

        bug = _get_bug_or_404(
            db,
            bug_id,
        )

        return _bug_model_to_response(bug)


def delete_bug_service(
    bug_id: int,
    user: UserProfileResponse,
):
    with SessionLocal() as db:
        bug = _get_bug_or_404(
            db,
            bug_id,
        )

        if str(bug.created_by) != user.id:
            raise HTTPException(
                status_code=403,
                detail="Not allowed",
            )

        db.delete(bug)
        db.commit()

        return {
            "message": "Deleted successfully",
        }


async def upload_screenshot_service(
    bug_id: int,
    file: UploadFile,
    user: UserProfileResponse,
    access_token: str,
) -> dict:
    if user.role != "QA":
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    with SessionLocal() as db:
        can_access_bug(
            db,
            bug_id,
            user.id,
        )

        allowed_types = {
            "image/png",
            "image/gif",
        }

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Only png and gif files are allowed",
            )

        contents = await file.read()

        filename = f"{uuid.uuid4()}-{file.filename}"
        path = f"bugs/{bug_id}/{filename}"

        storagedb = get_supabase_db(access_token)

        storagedb.storage.from_("bug-screenshots").upload(
            path=path,
            file=contents,
            file_options={
                "content-type": file.content_type,
            },
        )

        url = storagedb.storage.from_("bug-screenshots").get_public_url(path)

        bug = _get_bug_or_404(
            db,
            bug_id,
        )

        bug.screenshot = url
        db.commit()

        return {
            "message": "Screenshot uploaded successfully",
        }


def update_bug_service(
    bug_id: int,
    bug: BugUpdate,
    user: UserProfileResponse,
    background_tasks: BackgroundTasks,
):
    with SessionLocal() as db:
        bug_db = _get_bug_or_404(
            db,
            bug_id,
        )

        if bug.title:
            existing_bug = (
                db.query(Bug)
                .filter(
                    Bug.project_id == bug_db.project_id,
                    Bug.title == bug.title,
                    Bug.id != bug_id,
                )
                .first()
            )

            if existing_bug:
                raise HTTPException(
                    status_code=409,
                    detail="A bug with this title already exists in this project",
                )

        bug_type = bug.type if bug.type is not None else bug_db.type

        valid_status = {
            "feature": {
                "new",
                "started",
                "completed",
            },
            "bug": {
                "new",
                "started",
                "resolved",
            },
        }

        if bug.status and bug.status not in valid_status[bug_type]:
            raise HTTPException(
                status_code=400,
                detail=(f"Invalid status '{bug.status}' " f"for type '{bug_type}'"),
            )

        if bug.type and bug.type != bug_db.type:
            if not bug.status:
                bug.status = "new"

            elif bug.status not in valid_status[bug.type]:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Status '{bug.status}' "
                        f"is invalid for new type '{bug.type}'"
                    ),
                )

        payload = bug.model_dump(exclude_unset=True)

        if user.role == "QA" and str(bug_db.created_by) == user.id:
            old_assigned_to = str(bug_db.assigned_to) if bug_db.assigned_to else None

            for key, value in payload.items():
                if key != "created_at":
                    setattr(
                        bug_db,
                        key,
                        value,
                    )

            db.commit()

            new_assigned_to = payload.get("assigned_to")

            if new_assigned_to and old_assigned_to != new_assigned_to:
                background_tasks.add_task(
                    assigned_bug,
                    new_assigned_to,
                    bug_db.project_id,
                    bug_db.title,
                    user.full_name,
                )

            return {
                "message": "Updated successfully",
            }

        if user.role == "Manager":
            if "priority" in payload:
                bug_db.priority = payload["priority"]

                db.commit()

                return {
                    "message": "Updated successfully",
                }

        if user.role == "Developer" and str(bug_db.assigned_to) == user.id:
            if "status" not in payload:
                raise HTTPException(
                    status_code=400,
                    detail="No status to update",
                )

            bug_db.status = payload["status"]

            db.commit()

            return {
                "message": "Updated successfully",
            }

        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )
