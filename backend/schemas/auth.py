from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class SignupSchema(BaseModel):
    full_name: str
    email: EmailStr
    phone: str = Field(..., min_length=8, max_length=20)
    password: str
    role: Literal["Manager", "QA", "Developer"]


class LoginSchema(BaseModel):
    email: EmailStr
    password: str
