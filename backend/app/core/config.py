import os

class Settings:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")
    ADMIN_EMAILS = ["admin@gmail.com"]  
settings = Settings()