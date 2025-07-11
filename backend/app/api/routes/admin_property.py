from fastapi import APIRouter, Depends, HTTPException, Body
from uuid import UUID
from typing import List
from supabase import Client
from app.db.supabase import get_supabase_client as get_supabase
from app.dependencies import get_current_user
from app.core.config import settings

router = APIRouter(tags=["Admin Property Management"])

@router.get("/pending-properties", response_model=List[dict])
def get_all_properties(
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)):
    
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Only admins can access this route.")

    result = supabase.table("properties").select(
        """
        id,
        title,
        type,
        transaction_type,
        status,
        approval_status,
        created_at,
        verified,
        is_negotiable,
        owner_id,
        users!owner_id(name)
        """
    ).execute()
    if not result.data:
        return []

    properties = []
    for item in result.data:
        prop = {**item}
        prop["owner_name"] = item.get("users", {}).get("name", "Unknown")
        prop.pop("users", None)
        properties.append(prop)

    return properties

@router.get("/properties/{property_id}")
def get_property_details(
    property_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)):
    
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only.")
    
    property_result = supabase.table("properties").select(
        """
        *,
        users!owner_id(id, name, email, phone_number, picture, created_at)
        """
    ).eq("id", str(property_id)).single().execute()
    
    if not property_result.data:
        raise HTTPException(status_code=404, detail="Property not found.")
    
    location_result = supabase.table("property_locations") \
        .select("*") \
        .eq("property_id", str(property_id)) \
        .single().execute()
    
    document_result = supabase.table("property_documents") \
        .select("id, file_name, document_url, document_type, verified") \
        .eq("property_id", str(property_id)).execute()

    property_data = property_result.data
    owner_data = property_data.pop("users", {})

    full_data = {
        **property_data,
        "location": location_result.data if location_result.data else {},
        "owner": owner_data,
        "documents": document_result.data if document_result.data else []
    }

    return full_data

@router.post("/properties/{property_id}/approve")
def approve_property(
    property_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)):
    
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
    reason: dict = Body(..., example={"reason": "Incomplete documentation"}),
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)):
    
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
    supabase: Client = Depends(get_supabase)):

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
    supabase: Client = Depends(get_supabase)):

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
    supabase: Client = Depends(get_supabase)):

    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only.")
    
    result = supabase.table("properties").update({
        "approval_status": "Disabled"
    }).eq("id", str(property_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")
    
    return {"message": "Property disabled. User cannot edit this property."}

@router.post("/properties/{property_id}/enable")
def enable_property(
    property_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)):

    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only.")

    result = supabase.table("properties").update({
        "approval_status": "Approved",
        "status": "Available"
    }).eq("id", str(property_id)).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    return {"message": "Property enabled. User can now edit this property."}
