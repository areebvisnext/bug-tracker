from fastapi_mail import ConnectionConfig

import os
from dotenv import load_dotenv
from pydantic import SecretStr

load_dotenv()

SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_KEY: str = os.environ["SUPABASE_KEY"]
SUPABASE_SERVICE_ROLE_KEY: str = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "project-logos")

mail_USERNAME: str = os.environ["MAIL_USERNAME"]
mail_PASSWORD: SecretStr = SecretStr(os.environ["MAIL_PASSWORD"])
mail_FROM: str = os.environ["MAIL_FROM"]
mail_PORT: int = int(os.environ["MAIL_PORT"])
mail_SERVER: str = os.environ["MAIL_SERVER"]

mail_conf = ConnectionConfig(
    MAIL_USERNAME=mail_USERNAME,
    MAIL_PASSWORD=mail_PASSWORD,
    MAIL_FROM=mail_FROM,
    MAIL_PORT=mail_PORT,
    MAIL_SERVER=mail_SERVER,
    MAIL_FROM_NAME="Bug Tracker",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
)
