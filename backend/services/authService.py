from database.supabase import supabase, supabase_admin
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


def logout_user(access_token: str, scope: str = "global") -> None:
    supabase.auth.admin.sign_out(access_token, scope)


def _username_from_profile(full_name: str, email: str) -> str:
    if full_name.strip():
        parts = full_name.lower().strip().split()
        if len(parts) >= 2:
            return f"{parts[0]}.{parts[1]}"
        return parts[0]
    return email.split("@")[0].lower()


def get_current_user_profile(access_token: str) -> UserProfileResponse:
    auth_response = supabase.auth.get_user(jwt=access_token)
    user = auth_response.user

    if not user:
        raise Exception("User not found")

    profile_row = None
    profile_result = (
        supabase.table("profiles").select("full_name, role").eq("id", user.id).execute()
    )
    if profile_result.data:
        profile_row = profile_result.data[0]

    metadata = user.user_metadata or {}
    full_name = (
        profile_row.get("full_name")
        if profile_row
        else metadata.get("full_name") or ""
    )
    role = (
        profile_row.get("role") if profile_row else metadata.get("role") or ""
    )
    email = user.email or ""
    username = metadata.get("username") or _username_from_profile(full_name, email)

    phone = user.phone or metadata.get("phone")

    return UserProfileResponse(
        id=user.id,
        email=email,
        phone=phone,
        full_name=full_name,
        role=role,
        username=username,
        avatar_url=metadata.get("avatar_url"),
    )
