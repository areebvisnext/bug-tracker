from fastapi import HTTPException
from supabase_auth.errors import AuthApiError

_RATE_LIMIT_CODES = frozenset(
    {"over_email_send_rate_limit", "over_request_rate_limit", "over_sms_send_rate_limit"}
)

_STATUS_BY_CODE = {
    "email_exists": 409,
    "user_already_exists": 409,
    "invalid_credentials": 401,
    "email_not_confirmed": 403,
    "weak_password": 400,
    "signup_disabled": 403,
    "not_admin": 500,
}


def raise_auth_http_exception(error: Exception) -> None:
    if isinstance(error, AuthApiError):
        status = error.status or 400
        if error.code in _RATE_LIMIT_CODES:
            status = 429
        elif error.code in _STATUS_BY_CODE:
            status = _STATUS_BY_CODE[error.code]

        detail = error.message
        if error.code == "not_admin":
            detail = (
                "Server misconfiguration: admin auth operations require "
                "SUPABASE_SERVICE_ROLE_KEY in the backend .env"
            )

        raise HTTPException(status_code=status, detail=detail) from error

    raise HTTPException(status_code=400, detail=str(error)) from error
