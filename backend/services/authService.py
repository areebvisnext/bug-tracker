from fastapi import HTTPException
from typing import cast, Literal

from database.supabase import supabase, supabase_admin
from database.orm import SessionLocal
from models.profile import Profile
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

    with SessionLocal() as db:
        new_profile = Profile(id=user.id, full_name=data.full_name, role=data.role)
        db.add(new_profile)
        db.commit()

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

    full_name = ""
    role = ""

    with SessionLocal() as db:
        profile = db.query(Profile).filter(Profile.id == user.id).first()
        if profile:
            full_name = profile.full_name
            role = profile.role

    metadata = user.user_metadata or {}

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
        with SessionLocal() as db:
            qas = db.query(Profile).filter(Profile.role == "QA").all()

            return [
                {"id": str(q.id), "full_name": q.full_name, "role": q.role} for q in qas
            ]


def get_devs_service(user: UserProfileResponse, access_token: str):
    if user:
        with SessionLocal() as db:
            devs = db.query(Profile).filter(Profile.role == "Developer").all()

            return [
                {"id": str(d.id), "full_name": d.full_name, "role": d.role}
                for d in devs
            ]


def get_users_service(user: UserProfileResponse, access_token: str):
    if user:
        with SessionLocal() as db:
            users = ["Developer", "QA"]
            profiles = db.query(Profile).filter(Profile.role.in_(users)).all()

            return [
                {"id": str(p.id), "full_name": p.full_name, "role": p.role}
                for p in profiles
            ]
