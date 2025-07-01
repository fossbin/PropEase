from fastapi import APIRouter, Depends, HTTPException, Body
from uuid import UUID
from typing import List
from supabase import Client
from app.db.supabase import get_supabase_client as get_supabase
from app.dependencies import get_current_user
from app.core.config import settings

router = APIRouter(tags=["Admin Property Approval"])

@router.get("/pending-properties", response_model=List[dict])
def get_pending_properties(
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Only admins can access this route.")

    result = supabase.table("properties").select(
        "id, title, type, pricing_type, status, created_at, verified, owner_id, users!owner_id(name)"
    ).eq("approval_status", "Pending").execute()

    if not result.data:
        return []

    pending_props = []
    for item in result.data:
        prop = {**item}
        prop["owner_name"] = item.get("users", {}).get("name", "Unknown")
        prop.pop("users", None)
        pending_props.append(prop)

    return pending_props


@router.get("/properties/{property_id}")
def get_property_details(
    property_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only.")

    result = supabase.table("properties").select("*").eq("id", str(property_id)).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    return result.data


@router.post("/properties/{property_id}/approve")
def approve_property(
    property_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Only admins can approve properties.")

    result = supabase.table("properties").update({
        "approval_status": "Approved",
        "status": "Available"
    }).eq("id", str(property_id)).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    return {"message": "Property approved and marked as Available."}


@router.post("/properties/{property_id}/reject")
def reject_property(
    property_id: UUID,
    reason: dict = Body(..., example={"reason": "Missing photos or location"}),
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only.")

    result = supabase.table("properties").update({
        "approval_status": "Rejected",
        "rejection_reason": reason.get("reason", "")
    }).eq("id", str(property_id)).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    return {"message": "Property rejected with reason."}


@router.post("/properties/{property_id}/verify")
def verify_property(
    property_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only.")

    result = supabase.table("properties").update({
        "verified": True
    }).eq("id", str(property_id)).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    return {"message": "Property verified."}


@router.post("/properties/{property_id}/unverify")
def unverify_property(
    property_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only.")

    result = supabase.table("properties").update({
        "verified": False
    }).eq("id", str(property_id)).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    return {"message": "Verification revoked."}


@router.post("/properties/{property_id}/disable")
def disable_property(
    property_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only.")

    result = supabase.table("properties").update({
        "status": "Booked"
    }).eq("id", str(property_id)).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    return {"message": "Property status set to Booked (disabled)."}    


@router.post("/properties/{property_id}/enable")
def enable_property(
    property_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only.")

    result = supabase.table("properties").update({
        "status": "Available"
    }).eq("id", str(property_id)).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    return {"message": "Property status set to Available (enabled)."}
