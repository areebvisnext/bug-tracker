from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image
from sqlalchemy.orm import Session

from config import SUPABASE_STORAGE_BUCKET
from database.orm import SessionLocal
from database.supabase import get_supabase_db
from models import Profile, Project, ProjectMember
from schemas.auth import UserProfileResponse
from schemas.projects import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from services.authorization import (
    can_access_project,
    can_manage_project,
)


def _profile_for_user(user_id: str) -> UserProfileResponse | None:
    with SessionLocal() as db:
        profile = db.query(Profile).filter(Profile.id == user_id).first()

        if not profile:
            return None

        return UserProfileResponse(
            id=str(profile.id),
            email="",
            full_name=str(profile.full_name),
            role=str(profile.role),
            phone=None,
            avatar_url=None,
        )


def _project_model_to_response(
    project: Project,
    creator: UserProfileResponse | None = None,
) -> ProjectResponse:
    creator_id = str(project.created_by)

    resolved_creator = creator if creator is not None else _profile_for_user(creator_id)

    if not resolved_creator:
        raise HTTPException(
            status_code=500,
            detail=f"Profile not found for project creator {creator_id}",
        )

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        logo=project.logo,
        created_by=resolved_creator,
        created_at=project.created_at,
    )


def _get_project_or_404(
    db: Session,
    project_id: int,
) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found",
        )

    return project


def _add_project_member(
    db: Session,
    project_id: int,
    user_id: str,
) -> None:
    db.add(
        ProjectMember(
            project_id=project_id,
            user_id=user_id,
        )
    )
    db.commit()


def _project_ids_for_user(
    db: Session,
    user_id: str,
) -> list[int]:
    members = db.query(ProjectMember).filter(ProjectMember.user_id == user_id).all()

    return [member.project_id for member in members]


def _build_project_logo_path(
    project_id: int,
    filename: str,
) -> str:
    extension = Path(filename).suffix or ""

    return f"projects/{project_id}/" f"{uuid4().hex}{extension}"


def _upload_project_logo(
    supabase,
    logo_file: UploadFile,
    project_id: int,
) -> str:
    upload_path = _build_project_logo_path(
        project_id,
        str(logo_file.filename),
    )

    bucket = supabase.storage.from_(SUPABASE_STORAGE_BUCKET)

    logo_file.file.seek(0)
    data = logo_file.file.read()

    content_type = (logo_file.content_type or "").lower()

    try:
        img = Image.open(BytesIO(data))
        detected = img.format.lower() if img.format else None
    except Exception:
        detected = None

    if not detected:
        ext = Path(str(logo_file.filename)).suffix.lower()

        if ext in (".jpg", ".jpeg"):
            detected = "jpeg"
        elif ext == ".png":
            detected = "png"

    if detected in ("jpeg", "png"):
        content_type = "image/jpeg" if detected == "jpeg" else "image/png"
    elif content_type not in (
        "image/jpeg",
        "image/png",
    ):
        raise HTTPException(
            status_code=400,
            detail=("Unsupported image type; " "only JPEG and PNG are allowed"),
        )

    result = bucket.upload(
        upload_path,
        data,
        file_options={
            "content-type": content_type,
        },
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
    with SessionLocal() as db:
        existing = db.query(Project).filter(Project.name == body.name).first()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Project name should be unique",
            )

        project = Project(
            name=body.name,
            description=body.description,
            created_by=user.id,
        )

        db.add(project)
        db.commit()
        db.refresh(project)

        try:
            if logo_file:
                storagedb = get_supabase_db(access_token)

                project.logo = _upload_project_logo(
                    storagedb,
                    logo_file,
                    project.id,
                )

                db.commit()

            _add_project_member(
                db,
                project.id,
                user.id,
            )

        except Exception:
            db.delete(project)
            db.commit()
            raise

        return _project_model_to_response(
            project,
            creator=user,
        )


def list_projects_service(
    user: UserProfileResponse,
) -> list[ProjectResponse]:
    with SessionLocal() as db:
        project_ids = _project_ids_for_user(
            db,
            user.id,
        )

        if not project_ids:
            return []

        projects = (
            db.query(Project)
            .filter(Project.id.in_(project_ids))
            .order_by(Project.created_at.desc())
            .all()
        )

        return [_project_model_to_response(project) for project in projects]


def get_project_service(
    project_id: int,
    user: UserProfileResponse,
):
    with SessionLocal() as db:
        can_access_project(
            db,
            user,
            project_id,
        )

        project = _get_project_or_404(
            db,
            project_id,
        )

        return _project_model_to_response(project)


def update_project_service(
    project_id: int,
    body: ProjectUpdate,
    user: UserProfileResponse,
):
    with SessionLocal() as db:
        if body.name:
            existing = (
                db.query(Project)
                .filter(
                    Project.name == body.name,
                    Project.id != project_id,
                )
                .first()
            )

            if existing:
                raise HTTPException(
                    status_code=409,
                    detail="Project name should be unique",
                )

        project = _get_project_or_404(
            db,
            project_id,
        )

        can_manage_project(
            user,
            project,
        )

        update_data = body.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(project, key, value)

        db.commit()
        db.refresh(project)

        return _project_model_to_response(project)


def update_project_with_logo_service(
    project_id: int,
    name: str,
    description: str | None,
    logo_file: UploadFile | None,
    user: UserProfileResponse,
    access_token: str,
):
    storagedb = get_supabase_db(access_token)

    with SessionLocal() as db:
        project = _get_project_or_404(
            db,
            project_id,
        )

        can_manage_project(
            user,
            project,
        )

        if logo_file:
            project.logo = _upload_project_logo(
                storagedb,
                logo_file,
                project_id,
            )

        project.name = name

        if description is not None:
            project.description = description

        db.commit()
        db.refresh(project)

        return _project_model_to_response(project)


def add_members_service(
    project_id: int,
    user_id: str,
    user: UserProfileResponse,
):
    with SessionLocal() as db:
        project = _get_project_or_404(db, project_id)

        can_manage_project(user, project)

        profile = db.query(Profile).filter(Profile.id == user_id).first()

        if not profile:
            raise HTTPException(
                status_code=404,
                detail="User not found",
            )

        existing_member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
            .first()
        )

        if existing_member:
            raise HTTPException(
                status_code=409,
                detail="User already exists in project",
            )

        db.add(
            ProjectMember(
                project_id=project_id,
                user_id=user_id,
            )
        )

        db.commit()

        return {"message": "Member added successfully"}


def remove_members_service(
    project_id: int,
    user_id: str,
    user: UserProfileResponse,
):
    with SessionLocal() as db:
        project = _get_project_or_404(
            db,
            project_id,
        )

        can_manage_project(
            user,
            project,
        )

        member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
            .first()
        )

        if not member:
            raise HTTPException(
                status_code=404,
                detail="User not in project",
            )

        db.delete(member)
        db.commit()

        return {"message": "Member removed successfully"}


def get_members_service(
    project_id: int,
    user: UserProfileResponse,
):
    with SessionLocal() as db:
        can_access_project(
            db,
            user,
            project_id,
        )

        members = (
            db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()
        )

        return [{"user_id": str(member.user_id)} for member in members]
