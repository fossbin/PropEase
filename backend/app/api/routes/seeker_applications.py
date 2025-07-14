from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from uuid import UUID, uuid4
from typing import Optional
from datetime import date, datetime
from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("/apply/{property_id}", status_code=201)
def submit_application(
    property_id: UUID,
    message: str = Form(...),
    bid_amount: Optional[float] = Form(None),
    lease_start: Optional[str] = Form(None),  # Changed from date to str
    lease_end: Optional[str] = Form(None),    # Changed from date to str
    subscription_start: Optional[str] = Form(None),  # Changed from date to str
    subscription_end: Optional[str] = Form(None),    # Changed from date to str
    user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    applicant_id = user["id"]

    # Helper function to parse date strings
    def parse_date(date_str: Optional[str]) -> Optional[str]:
        if not date_str:
            return None
        try:
            # Parse the date string and convert to ISO format
            parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            return parsed_date.isoformat()
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {date_str}")

    # Debug: Log received data
    print(f"Received data:")
    print(f"message: {message}")
    print(f"bid_amount: {bid_amount}")
    print(f"lease_start: {lease_start}")
    print(f"lease_end: {lease_end}")
    print(f"subscription_start: {subscription_start}")
    print(f"subscription_end: {subscription_end}")

    payload = {
        "property_id": str(property_id),
        "applicant_id": applicant_id,
        "message": message,
        "bid_amount": bid_amount,
        "lease_start": parse_date(lease_start),
        "lease_end": parse_date(lease_end),
        "subscription_start": parse_date(subscription_start),
        "subscription_end": parse_date(subscription_end),
        "status": "Pending"
    }

    # Debug: Log payload
    print(f"Payload to database: {payload}")

    try:
        response = supabase.table("applications").insert(payload).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to submit application")
        return response.data[0]
    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")


@router.get("/sent")
def fetch_user_applications(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    user_id = user["id"]
    response = supabase.table("applications").select("*").eq("applicant_id", str(user_id)).order("created_at", desc=True).execute()
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

@router.delete("/{application_id}", status_code=204)
def withdraw_application(
    application_id: UUID,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase)
):
    # Step 1: Fetch application to confirm ownership
    fetch_response = supabase.table("applications").select("id, applicant_id").eq("id", str(application_id)).single().execute()
    app_data = fetch_response.data

    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found")

    if app_data["applicant_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You can only withdraw your own applications")

    # Step 2: Delete the application
    delete_response = supabase.table("applications").delete().eq("id", str(application_id)).execute()

    if delete_response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to withdraw application")

    return JSONResponse(status_code=204, content=None)
