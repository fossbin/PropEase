from fastapi import APIRouter, Depends, HTTPException, Request
from app.db.supabase import get_supabase_client
from supabase import Client
from app.models.user import UserProfileUpdate

router = APIRouter(prefix="/user", tags=["User"])

@router.patch("/profile")
async def update_user_profile(
    request: Request,
    profile: UserProfileUpdate,
    supabase: Client = Depends(get_supabase_client)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    update_data = {
        "name": profile.name,
        "phone_number": profile.phone_number,
        "picture": profile.picture 
    }

    result = supabase.table("users").update(update_data).eq("id", user_id).execute()

    if result.data is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Profile updated successfully"}

@router.get("/profile")
async def get_user_profile(
    request: Request,
    supabase: Client = Depends(get_supabase_client)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    res = supabase.table("users").select("*").eq("id", user_id).single().execute()
    if res.data is None:
        raise HTTPException(status_code=404, detail="User not found")

    return res.data