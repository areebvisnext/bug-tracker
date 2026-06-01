from supabase import Client, create_client

from config import SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

supabase_admin: Client | None = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    if SUPABASE_SERVICE_ROLE_KEY
    else None
)


def get_supabase_as_user(access_token: str) -> Client:
    """PostgREST client scoped to the logged-in user (RLS uses auth.uid())."""
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    client.postgrest.auth(access_token)
    return client


def get_supabase_db(access_token: str) -> Client:
    """
    DB access for trusted server routes.
    Prefer service role (bypasses RLS). Otherwise use the user's JWT.
    """
    if supabase_admin is not None:
        return supabase_admin
    return get_supabase_as_user(access_token)
