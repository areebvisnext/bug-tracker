from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from schemas.auth import LoginSchema, SignupSchema, UserProfileResponse
from services.auth_errors import raise_auth_http_exception
from services.authService import (
    get_current_user_profile,
    login_user,
    logout_user,
    signup_user,
    get_qa_service,
    get_devs_service,
)
from supabase_auth.errors import AuthApiError

router = APIRouter()
bearer_scheme = HTTPBearer()


@router.post("/signup")
def signup(data: SignupSchema):

    try:
        return signup_user(data)
    except AuthApiError as e:
        raise_auth_http_exception(e)
    except Exception as e:
        raise_auth_http_exception(e)


@router.post("/login")
def login(data: LoginSchema):

    try:
        response = login_user(data)
    except AuthApiError as e:
        raise_auth_http_exception(e)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not response.session:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "user": response.user.model_dump() if response.user else None,
    }


@router.get("/me", response_model=UserProfileResponse)
def get_me(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    print("TOKEN:", credentials.credentials[:20])
    try:
        return get_current_user_profile(credentials.credentials)
    except AuthApiError as e:
        raise_auth_http_exception(e)
    except Exception as e:
        raise_auth_http_exception(e)


@router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    scope: Literal["global", "local", "others"] = Query(default="global"),
):
    try:
        logout_user(credentials.credentials, scope=scope)
    except AuthApiError as e:
        raise_auth_http_exception(e)
    except Exception as e:
        raise_auth_http_exception(e)

    return {"message": "Logged out successfully"}


@router.get("/qa")
def get_qa(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    user = get_current_user_profile(credentials.credentials)
    return get_qa_service(user, credentials.credentials)


@router.get("/devs")
def get_devs(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    user = get_current_user_profile(credentials.credentials)
    return get_devs_service(user, credentials.credentials)
