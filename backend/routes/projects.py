from fastapi import APIRouter, Depends, File, Form, UploadFile, BackgroundTasks
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from schemas.projects import ProjectCreate, ProjectResponse, ProjectUpdate

from services.authService import get_current_user_profile
from services.mailService import added_to_project
from services.projectService import (
    add_members_service,
    create_project_service,
    get_project_service,
    get_members_service,
    list_projects,
    update_project_service,
    update_project_with_logo_service,
    remove_members_service,
)


router = APIRouter()
bearer_scheme = HTTPBearer()


class AddMemberRequest(BaseModel):
    user_id: str


@router.post("/", response_model=ProjectResponse, status_code=201)
def create_project(
    project: ProjectCreate,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)

    return create_project_service(
        project,
        user,
        credentials.credentials,
    )


@router.post("/upload", response_model=ProjectResponse, status_code=201)
async def create_project_with_logo(
    name: str = Form(...),
    description: str | None = Form(None),
    logo_file: UploadFile | None = File(None),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)
    project = ProjectCreate(name=name, description=description)

    return create_project_service(
        project,
        user,
        credentials.credentials,
        logo_file,
    )


@router.put("/{project_id}/upload", response_model=ProjectResponse)
async def update_project_with_logo(
    project_id: int,
    name: str = Form(...),
    description: str | None = Form(None),
    logo_file: UploadFile | None = File(None),
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)

    return update_project_with_logo_service(
        project_id,
        name,
        description,
        logo_file,
        user,
        credentials.credentials,
    )


@router.get("/")
def get_projects(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)
    return list_projects(user, credentials.credentials)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)
    return get_project_service(project_id, user, credentials.credentials)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project: ProjectUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)
    return update_project_service(project_id, project, user, credentials.credentials)


@router.post("/{project_id}/members")
async def add_members(
    project_id: int,
    request: AddMemberRequest,
    background_tasks: BackgroundTasks,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)
    result = add_members_service(
        project_id, request.user_id, user, credentials.credentials
    )

    background_tasks.add_task(
        added_to_project, user, request.user_id, project_id, credentials.credentials
    )

    return result


@router.delete("/{project_id}/members/{user_id}")
def remove_members(
    project_id: int,
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)

    return remove_members_service(project_id, user_id, user, credentials.credentials)


@router.get("/{project_id}/members")
def get_members(
    project_id: int, credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    user = get_current_user_profile(credentials.credentials)

    return get_members_service(project_id, user, credentials.credentials)
