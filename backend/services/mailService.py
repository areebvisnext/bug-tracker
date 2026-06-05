from fastapi_mail import FastMail, MessageSchema, MessageType
import os
from typing import cast
from supabase import create_client

from config import mail_conf

from database.supabase import get_supabase_db
from schemas.auth import UserProfileResponse


async def send_notification(recipient, subject: str, body: str):

    recipients = []
    recipients.append(recipient)

    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype=MessageType.plain,
    )
    fm = FastMail(mail_conf)

    await fm.send_message(message)


async def added_to_project_mail(recipient, project_name: str | None, adder: str | None):

    subject: str = f"Added to {project_name}"
    body: str = (
        f"This is an automated email to inform you that you have been added to Project: {project_name} by: {adder}"
    )

    result = await send_notification(recipient, subject, body)
    return result


async def assigned_bug_mail(recipient, project_name, bug_name, adder):

    subject: str = f"Assigned a bug: {bug_name}"
    body: str = (
        f"This is an automated email to inform you that you have been assigned to bug: {bug_name} by: {adder} in the project : {project_name}"
    )

    result = await send_notification(recipient, subject, body)
    return result


async def added_to_project(
    user: UserProfileResponse, user_id: str, project_id: int, access_token: str
):

    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

    response = supabase.auth.admin.get_user_by_id(user_id)
    email = response.user.email

    db = get_supabase_db(access_token)
    response = db.table("projects").select("name").eq("id", project_id).execute()
    result = cast(dict, response.data[0])

    result = await added_to_project_mail(email, result["name"], user.full_name)
    return {"message": "mail sent"}


async def assigned_bug(user_id, project_id, bug_name, adder, access_token):

    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

    response = supabase.auth.admin.get_user_by_id(user_id)
    email = response.user.email

    db = get_supabase_db(access_token)
    response = db.table("projects").select("name").eq("id", project_id).execute()
    result = cast(dict, response.data[0])

    result = await assigned_bug_mail(email, result["name"], bug_name, adder)
    return {"message": "mail sent"}
