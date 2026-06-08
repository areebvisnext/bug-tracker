from datetime import datetime
from fastapi import HTTPException, BackgroundTasks
from typing import Any, cast, Literal
import uuid

from database.supabase import supabase, get_supabase_db
from database.orm import SessionLocal
from models import Bug, ProjectMember
from schemas.bug import BugCreate, BugResponse, BugUpdate
from schemas.auth import UserProfileResponse
from services.authorization import (
    can_access_bug,
    can_access_project,
    can_access_project_by_id,
)
from services.mailService import assigned_bug


def _bug_model_to_response(bug: Bug) -> BugResponse:
    return BugResponse(
        id=cast(int, bug.id),
        title=cast(str, bug.title),
        description=cast(str, bug.description),
        type=cast(Literal["bug", "feature"], bug.type),
        status=cast(Literal["new", "started", "completed", "resolved"], bug.status),
        deadline=cast(datetime, bug.deadline),
        screenshot=cast(str, bug.screenshot),
        project_id=cast(int, bug.project_id),
        assigned_to=str(bug.assigned_to),
        created_by=str(bug.created_by),
        created_at=cast(datetime, bug.created_at),
    )


def create_bug_service(bug: BugCreate, user: UserProfileResponse, access_token: str):
    if user.role != "QA":
        raise HTTPException(status_code=403, detail="Only a QA can create bug")

    with SessionLocal() as db:
        if not can_access_project(db, user, bug.project_id):
            raise HTTPException(status_code=403, detail="Not allowed")

        existing_bug = (
            db.query(Bug)
            .filter(Bug.project_id == bug.project_id, Bug.title == bug.title)
            .first()
        )
        if existing_bug:
            raise HTTPException(
                status_code=409,
                detail="A bug with this title already exists in this project",
            )

        if not can_access_project_by_id(db, bug.assigned_to, bug.project_id):
            raise HTTPException(status_code=403, detail="Not allowed")

        new_bug = Bug(
            title=bug.title,
            description=bug.description,
            type=bug.type,
            status=bug.status,
            deadline=bug.deadline,
            screenshot=bug.screenshot,
            project_id=bug.project_id,
            assigned_to=bug.assigned_to if bug.assigned_to else None,
            created_by=user.id,
        )
        db.add(new_bug)
        db.commit()
        db.refresh(new_bug)
        return _bug_model_to_response(new_bug)


def get_bugList_service(user: UserProfileResponse, access_token: str):
    with SessionLocal() as db:
        project_ids = [
            pm.project_id
            for pm in db.query(ProjectMember)
            .filter(ProjectMember.user_id == user.id)
            .all()
        ]
        if not project_ids:
            raise HTTPException(status_code=404, detail="Not Found")

        bugs = db.query(Bug).filter(Bug.project_id.in_(project_ids)).all()
        if not bugs:
            raise HTTPException(status_code=404, detail="Not Found")

        return [_bug_model_to_response(b).model_dump() for b in bugs]


def get_bug_service(bug_id: int, user: UserProfileResponse, access_token: str):
    with SessionLocal() as db:
        if not can_access_bug(db, bug_id, user.id):
            raise HTTPException(status_code=403, detail="Not allowed")

        bug = db.query(Bug).filter(Bug.id == bug_id).first()
        if not bug:
            raise HTTPException(status_code=404, detail="Not Found")

        return _bug_model_to_response(bug)


def delete_bug_service(bug_id: int, user: UserProfileResponse, access_token: str):
    with SessionLocal() as db:
        bug = db.query(Bug).filter(Bug.id == bug_id).first()
        if not bug:
            raise HTTPException(status_code=404, detail="Bug does not exist")

        if str(bug.created_by) != user.id:
            raise HTTPException(status_code=403, detail="Not allowed")

        db.delete(bug)
        db.commit()

        return {"response": "Deleted succesfully"}


async def upload_screenshot_service(
    bug_id: int, file, user: UserProfileResponse, access_token: str
) -> dict:
    if user.role != "QA":
        raise HTTPException(status_code=403, detail="Access denied")

    with SessionLocal() as db:
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

        storagedb = get_supabase_db(access_token)

        storagedb.storage.from_("bug-screenshots").upload(
            path=path, file=contents, file_options={"content-type": file.content_type}
        )

        url = storagedb.storage.from_("bug-screenshots").get_public_url(path)

        bug = db.query(Bug).filter(Bug.id == bug_id).first()
        if bug:
            bug.screenshot = cast(str, url)
            db.commit()

        return {"message": "screenshot uploaded succesfully"}


def update_bug_service(
    bug_id: int,
    bug: BugUpdate,
    user: UserProfileResponse,
    access_token: str,
    background_tasks: BackgroundTasks,
):
    with SessionLocal() as db:
        bug_db = db.query(Bug).filter(Bug.id == bug_id).first()
        if not bug_db:
            raise HTTPException(status_code=404, detail="Not found")

        if user.role == "Manager":
            raise HTTPException(status_code=403, detail="Access denied")

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
            "feature": {"new", "started", "completed"},
            "bug": {"new", "started", "resolved"},
        }

        if bug.status and bug.status not in valid_status[bug_type]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{bug.status}' for type '{bug_type}'",
            )

        if bug.type and bug.type != bug_db.type:
            if not bug.status:
                bug.status = "new"
            elif bug.status not in valid_status[bug.type]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Status '{bug.status}' is invalid for new type '{bug.type}'",
                )

        payload = bug.model_dump(exclude_unset=True)

        if user.role == "QA" and str(bug_db.created_by) == user.id:
            old_assigned_to = str(bug_db.assigned_to) if bug_db.assigned_to else None

            for key, value in payload.items():
                if key != "created_at":
                    setattr(bug_db, key, value)

            db.commit()

            if payload.get("assigned_to") and old_assigned_to != payload["assigned_to"]:
                background_tasks.add_task(
                    assigned_bug,
                    payload["assigned_to"],
                    bug_db.project_id,
                    bug_db.title,
                    user.full_name,
                    access_token,
                )

            return {"message": "Updated Successfully"}

        if user.role == "Developer" and str(bug_db.assigned_to) == user.id:
            if "status" not in payload:
                raise HTTPException(status_code=400, detail="No status to update")

            bug_db.status = payload["status"]
            db.commit()
            return {"message": "Updated Successfully"}

        raise HTTPException(status_code=403, detail="Access denied")
