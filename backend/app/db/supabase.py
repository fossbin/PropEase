# app/db/supabase.py

from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY: str = os.getenv("SUPABASE_API_KEY")

if not SUPABASE_URL or not SUPABASE_API_KEY:
    raise ValueError("Supabase credentials are not properly set in environment variables.")

def get_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_API_KEY)
