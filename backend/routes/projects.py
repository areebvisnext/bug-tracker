from operator import ge
from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.authService import get_current_user_profile
from services.projectService import (
    create_project_service,
    list_projects,
    get_project_service,
    update_project_service,
    add_members_service,
    remove_members_service,
    get_members_service,
)

from schemas.projects import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter()
bearer_scheme = HTTPBearer()


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
def add_members(
    project_id: int,
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    user = get_current_user_profile(credentials.credentials)
    return add_members_service(project_id, user_id, user, credentials.credentials)


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
