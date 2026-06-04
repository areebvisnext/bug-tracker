from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from schemas.bug import BugCreate, BugUpdate

from services.authService import get_current_user_profile
from services.bugService import (
    create_bug_service,
    delete_bug_service,
    get_bug_service,
    get_bugList_service,
    update_bug_service,
    upload_screenshot_service,
)
from services.mailService import assigned_bug


router = APIRouter()
bearer_scheme = HTTPBearer()


@router.post("/")
async def create_bug(
    bug: BugCreate, credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):

    user = get_current_user_profile(credentials.credentials)

    result = create_bug_service(bug, user, credentials.credentials)
    res = await assigned_bug(
        bug.assigned_to,
        bug.project_id,
        bug.title,
        user.full_name,
        credentials.credentials,
    )

    return result


@router.get("/")
def get_bugList(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):

    user = get_current_user_profile(credentials.credentials)
    return get_bugList_service(user, credentials.credentials)


@router.get("/{bug_id}")
def get_bug(
    bug_id: int, credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):

    user = get_current_user_profile(credentials.credentials)
    return get_bug_service(bug_id, user, credentials.credentials)


@router.delete("/{bug_id}")
def delete_bug(
    bug_id: int, credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):

    user = get_current_user_profile(credentials.credentials)
    return delete_bug_service(bug_id, user, credentials.credentials)


@router.post("/{bug_id}/screenshot")
async def upload_screenshot(
    bug_id: int,
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):

    user = get_current_user_profile(credentials.credentials)
    result = await upload_screenshot_service(
        bug_id, file, user, credentials.credentials
    )
    return result


@router.put("/{bug_id}")
async def update_bug(
    bug_id: int,
    bug: BugUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):

    user = get_current_user_profile(credentials.credentials)
    result = await update_bug_service(bug_id, bug, user, credentials.credentials)

    return result
