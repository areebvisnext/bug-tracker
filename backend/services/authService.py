from database.supabase import supabase


def signup_user(data):
    phone = data.phone.strip().replace(" ", "")

    auth_response = supabase.auth.sign_up(
        {
            "email": data.email,
            "password": data.password,
            "phone": phone,
            "options": {
                "data": {
                    "full_name": data.full_name,
                    "role": data.role,
                }
            },
        }
    )

    user = auth_response.user

    if not user:
        raise Exception("User signup failed")

    if phone and not user.phone:
        supabase.auth.admin.update_user_by_id(user.id, {"phone": phone})

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
