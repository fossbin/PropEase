from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from typing import List
from supabase import Client
from app.db.supabase import get_supabase_client as get_supabase
from app.dependencies import get_current_user
from app.core.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["Admin Users"])

class UserUpdateRequest(BaseModel):
    name: str | None = None
    phone_number: str | None = None


@router.get("/", response_model=List[dict])
def list_users(
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Only admins can view users.")

    result = supabase.table("users").select("id, name, email, phone_number").execute()
    return result.data or []


@router.patch("/{user_id}")
def update_user(
    user_id: UUID,
    update: UserUpdateRequest,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Only admins can update users.")

    payload = update.dict(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=400, detail="No data provided for update.")

    result = supabase.table("users").update(payload).eq("id", str(user_id)).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")

    return {"message": "User updated successfully."}


@router.delete("/{user_id}")
def delete_user(
    user_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Only admins can delete users.")

    result = supabase.table("users").delete().eq("id", str(user_id)).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")

    return {"message": "User deleted successfully."}
