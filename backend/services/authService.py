from fastapi import HTTPException
from typing import Any, cast, Literal

from database.supabase import get_supabase_db, supabase, supabase_admin
from schemas.auth import UserProfileResponse


def signup_user(data):

    phone = data.phone.strip().replace(" ", "")

    auth_response = supabase.auth.sign_up(
        {
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "full_name": data.full_name,
                    "role": data.role,
                    "phone": phone,
                }
            },
        }
    )

    user = auth_response.user

    if not user:
        raise Exception("User signup failed")

    if phone and supabase_admin and not user.phone:
        supabase_admin.auth.admin.update_user_by_id(user.id, {"phone": phone})

    supabase.table("profiles").insert(
        {"id": user.id, "full_name": data.full_name, "role": data.role}
    ).execute()

    return {"message": "User created successfully"}


def login_user(data):

    response = supabase.auth.sign_in_with_password(
        {"email": data.email, "password": data.password}
    )

    return response


def logout_user(
    access_token: str, scope: Literal["global", "local", "others"] = "global"
):
    supabase.auth.admin.sign_out(access_token, scope)

    return {"message": "User logged out successfully"}


def get_current_user_profile(access_token: str) -> UserProfileResponse:

    auth_response = supabase.auth.get_user(jwt=access_token)

    if not auth_response:
        raise HTTPException(status_code=404, detail="Current user not found")
    user = auth_response.user

    profile_row: dict[str, Any] | None = None
    profile_result = (
        supabase.table("profiles").select("full_name, role").eq("id", user.id).execute()
    )

    if profile_result.data:
        profile_row = cast(dict[str, Any], profile_result.data[0])

    metadata = user.user_metadata or {}
    full_name = (
        profile_row.get("full_name") if profile_row else metadata.get("full_name") or ""
    )
    role = profile_row.get("role") if profile_row else metadata.get("role") or ""
    email = user.email or ""
    phone = user.phone or metadata.get("phone")

    return UserProfileResponse(
        id=user.id,
        email=email,
        phone=phone,
        full_name=str(full_name),
        role=str(role),
        avatar_url=metadata.get("avatar_url"),
    )


def get_qa_service(user: UserProfileResponse, access_token: str):

    if user:
        db = get_supabase_db(access_token)

        res = db.table("profiles").select("*").eq("role", "QA").execute()
        return res.data


def get_devs_service(user: UserProfileResponse, access_token: str):

    if user:
        db = get_supabase_db(access_token)

        res = db.table("profiles").select("*").eq("role", "Developer").execute()
        return res.data


def get_users_service(user: UserProfileResponse, access_token: str):

    if user:
        db = get_supabase_db(access_token)

        users = ["Developer", "QA"]
        res = db.table("profiles").select("*").in_("role", users).execute()
        return res.data
