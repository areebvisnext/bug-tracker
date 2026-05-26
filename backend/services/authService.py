from database.supabase import supabase


def signup_user(data):

    auth_response = supabase.auth.sign_up(
        {
            "email": data.email,
            "password": data.password,
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
