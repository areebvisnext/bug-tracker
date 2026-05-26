from pydantic import BaseModel, EmailStr
from typing import Literal


class SignupSchema(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Literal["Manager", "QA", "Developer"]


class LoginSchema(BaseModel):
    email: EmailStr
    password: str
