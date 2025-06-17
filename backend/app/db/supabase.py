import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Supabase credentials are not properly set in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_API_KEY)
