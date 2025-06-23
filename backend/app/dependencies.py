from fastapi import Header, HTTPException, Depends
from app.db.supabase import get_supabase_client as get_supabase
from supabase import Client

async def get_current_user(x_user_id: str = Header(None), supabase: Client = Depends(get_supabase)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")

    user_response = supabase.table("users").select("*").eq("id", x_user_id).single().execute()
    if not user_response.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_response.data