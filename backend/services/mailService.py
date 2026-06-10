from fastapi_mail import (
    FastMail,
    MessageSchema,
    MessageType,
)
import os

from supabase import create_client
from pydantic import NameEmail

from config import mail_conf
from database.orm import SessionLocal
from models.project import Project
from schemas.auth import UserProfileResponse


def _get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def _get_project_name(project_id: int) -> str:
    with SessionLocal() as db:
        project = db.query(Project).filter(Project.id == project_id).first()

        return project.name if project else ""


async def send_notification(
    recipient: str,
    subject: str,
    body: str,
) -> None:
    message = MessageSchema(
        subject=subject,
        recipients=[NameEmail(name="", email=recipient)],
        body=body,
        subtype=MessageType.plain,
    )

    await FastMail(mail_conf).send_message(message)


async def added_to_project_mail(
    recipient: str,
    project_name: str,
    adder: str,
) -> None:
    await send_notification(
        recipient=recipient,
        subject=f"Added to {project_name}",
        body=(
            "This is an automated email to inform you "
            f"that you have been added to Project: "
            f"{project_name} by: {adder}"
        ),
    )


async def assigned_bug_mail(
    recipient: str,
    project_name: str,
    bug_name: str,
    adder: str,
) -> None:
    await send_notification(
        recipient=recipient,
        subject=f"Assigned a bug: {bug_name}",
        body=(
            "This is an automated email to inform you "
            f"that you have been assigned to bug: "
            f"{bug_name} by: {adder} "
            f"in the project: {project_name}"
        ),
    )


async def added_to_project(
    user: UserProfileResponse,
    user_id: str,
    project_id: int,
) -> dict:
    supabase = _get_supabase()

    response = supabase.auth.admin.get_user_by_id(user_id)

    email = response.user.email

    if not email:
        return {"message": "User has no email"}

    await added_to_project_mail(
        recipient=email,
        project_name=_get_project_name(project_id),
        adder=user.full_name,
    )

    return {"message": "Mail sent"}


async def assigned_bug(
    user_id: str,
    project_id: int,
    bug_name: str,
    adder: str,
) -> dict:
    supabase = _get_supabase()

    response = supabase.auth.admin.get_user_by_id(user_id)

    email = response.user.email

    if not email:
        return {"message": "User has no email"}

    await assigned_bug_mail(
        recipient=email,
        project_name=_get_project_name(project_id),
        bug_name=bug_name,
        adder=adder,
    )

    return {"message": "Mail sent"}
