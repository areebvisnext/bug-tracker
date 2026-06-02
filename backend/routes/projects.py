from operator import ge
from fastapi import APIRouter, Depends, File, Form, UploadFile, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from services.authService import get_current_user_profile
from services.projectService import (
    create_project_service,
    list_projects,
    get_project_service,
    update_project_service,
    update_project_with_logo_service,
    add_members_service,
    remove_members_service,
    get_members_service,
)

from schemas.projects import ProjectCreate, ProjectResponse, ProjectUpdate

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
    print("TOKEN:", credentials.credentials[:20])
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
def add_members(
    project_id: int,
    request: AddMemberRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)
    return add_members_service(project_id, request.user_id, user, credentials.credentials)


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
