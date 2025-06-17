from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client
from starlette.status import HTTP_404_NOT_FOUND
from app.config import get_supabase_client

router = APIRouter()

@router.get("/{user_id}")
async def get_user(user_id: str, supabase: Client = Depends(get_supabase_client)):
    response = supabase.table("users").select("*").eq("id", user_id).single().execute()

    if response.data is None:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="User not found")

    return response.data


@router.get("/")
async def list_users(supabase: Client = Depends(get_supabase_client)):
    response = supabase.table("users").select("id", "email", "name", "phone_number", "created_at").execute()
    return response.data
