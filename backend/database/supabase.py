from supabase import Client, create_client

from config import SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL


supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

supabase_admin: Client | None = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    if SUPABASE_SERVICE_ROLE_KEY
    else None
)


def get_supabase_as_user(access_token: str) -> Client:
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    client.postgrest.auth(access_token)

    return client


def get_supabase_db(access_token: str) -> Client:
    if supabase_admin is not None:
        return supabase_admin

    return get_supabase_as_user(access_token)
