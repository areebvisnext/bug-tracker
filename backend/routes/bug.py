from fastapi import APIRouter, Depends, File, UploadFile, BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from schemas.bug import BugCreate, BugUpdate

from services.authorization import require_qa
from services.authService import get_current_user_profile
from services.bugService import (
    create_bug_service,
    delete_bug_service,
    get_bug_service,
    get_bug_list_service,
    update_bug_service,
    upload_screenshot_service,
)
from services.mailService import assigned_bug


router = APIRouter()
bearer_scheme = HTTPBearer()


@router.post("/")
async def create_bug(
    bug: BugCreate,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    user=Depends(require_qa),
):
    result = create_bug_service(bug, user)

    background_tasks.add_task(
        assigned_bug, bug.assigned_to, bug.project_id, bug.title, user.full_name
    )
    return result


@router.get("/")
def get_bugList(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    user = get_current_user_profile(credentials.credentials)

    return get_bug_list_service(user)


@router.get("/{bug_id}")
def get_bug(
    bug_id: int, credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    user = get_current_user_profile(credentials.credentials)

    return get_bug_service(bug_id, user)


@router.delete("/{bug_id}")
def delete_bug(
    bug_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    user=Depends(require_qa),
):
    return delete_bug_service(bug_id, user)


@router.post("/{bug_id}/screenshot")
async def upload_screenshot(
    bug_id: int,
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    user=Depends(require_qa),
):
    result = await upload_screenshot_service(
        bug_id, file, user, credentials.credentials
    )

    return result


@router.put("/{bug_id}")
async def update_bug(
    bug_id: int,
    bug: BugUpdate,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)
    result = update_bug_service(bug_id, bug, user, background_tasks)

    return result
