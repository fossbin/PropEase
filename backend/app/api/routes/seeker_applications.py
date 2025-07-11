from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from uuid import UUID, uuid4
from typing import Optional
from datetime import date
from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("/apply/{property_id}", status_code=201)
def submit_application(
    property_id: UUID,
    message: str = Form(...),
    bid_amount: Optional[float] = Form(None),
    lease_start: Optional[date] = Form(None),
    lease_end: Optional[date] = Form(None),
    subscription_start: Optional[date] = Form(None),
    subscription_end: Optional[date] = Form(None),
    user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    applicant_id = user["id"]

    payload = {
        "property_id": str(property_id),
        "applicant_id": applicant_id,
        "message": message,
        "bid_amount": bid_amount,
        "lease_start": lease_start.isoformat() if lease_start else None,
        "lease_end": lease_end.isoformat() if lease_end else None,
        "subscription_start": subscription_start.isoformat() if subscription_start else None,
        "subscription_end": subscription_end.isoformat() if subscription_end else None,
        "status": "Pending"
    }

    response = supabase.table("applications").insert(payload).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to submit application")
    return response.data[0]


@router.get("/sent")
def fetch_user_applications(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    user_id = user["id"]
    response = supabase.table("applications").select("*" ).eq("applicant_id", str(user_id)).order("created_at", desc=True).execute()
    applications = response.data or []

    if not applications:
        return []

    property_ids = list(set(app["property_id"] for app in applications))
    prop_res = supabase.table("properties").select("id, title, type, status, price").in_("id", property_ids).execute()
    prop_map = {p["id"]: p for p in (prop_res.data or [])}

    for app in applications:
        prop = prop_map.get(app["property_id"], {})
        app["property_title"] = prop.get("title", "Unknown")
        app["property_type"] = prop.get("type", "Unknown")
        app["property_status"] = prop.get("status", "Unknown")
        app["property_price"] = prop.get("price", None)

    return applications


