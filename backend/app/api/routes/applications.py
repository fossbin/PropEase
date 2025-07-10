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


@router.get("/received")
def fetch_received_applications(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    provider_id = user["id"]
    prop_res = supabase.table("properties").select("id, title, type, status, price").eq("owner_id", str(provider_id)).execute()
    properties = prop_res.data or []

    if not properties:
        return []

    property_map = {p["id"]: p for p in properties}
    property_ids = list(property_map.keys())

    apps_res = (
        supabase
        .table("applications")
        .select("*")
        .in_("property_id", property_ids)
        .order("created_at", desc=True)
        .execute()
    )
    applications = apps_res.data or []

    for app in applications:
        prop_info = property_map.get(app["property_id"], {})
        app["property_title"] = prop_info.get("title", "Unknown")
        app["property_type"] = prop_info.get("type", "Unknown")
        app["property_status"] = prop_info.get("status", "Unknown")
        app["property_price"] = prop_info.get("price", None)

    return applications


@router.get("/{application_id}")
def get_application_detail(application_id: UUID, supabase=Depends(get_supabase)):
    # Fetch application
    app_res = supabase.table("applications").select("*").eq("id", str(application_id)).single().execute()
    if not app_res or not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")

    app_data = app_res.data
    applicant_id = app_data["applicant_id"]

    # Fetch user profile
    user_res = supabase.table("users").select("name, email, phone_number").eq("id", applicant_id).single().execute()
    user_data = user_res.data or {}

    # Fetch user documents
    docs_res = supabase.table("user_documents").select("id, document_url, document_type, verified").eq("user_id", applicant_id).execute()
    user_documents = docs_res.data or []

    # Fetch property details
    prop_res = supabase.table("properties").select("title, type, status, price, is_negotiable, transaction_type").eq("id", app_data["property_id"]).single().execute()
    property_data = prop_res.data or {}

    return {
        "application": app_data,
        "user_profile": user_data,
        "user_documents": user_documents,
        "property_details": property_data
    }



@router.patch("/{application_id}")
def update_application(application_id: UUID, payload: dict, supabase=Depends(get_supabase), user=Depends(get_current_user)):
    update_res = (
        supabase
        .table("applications")
        .update(payload)
        .eq("id", str(application_id))
        .execute()
    )
    if not update_res.data:
        raise HTTPException(status_code=404, detail="Application not found or update failed")

    updated_app = update_res.data[0]

    if payload.get("status") == "Approved":
        app = updated_app
        property_res = supabase.table("properties").select("*").eq("id", app["property_id"]).single().execute()
        property_data = property_res.data
        if not property_data:
            raise HTTPException(status_code=404, detail="Property not found")

        prop_type = property_data["type"]
        owner_id = property_data["owner_id"]
        price = app.get("bid_amount") or property_data.get("price")

        if prop_type == "lease" and app.get("lease_start") and app.get("lease_end"):
            lease_payload = {
                "id": str(uuid4()),
                "property_id": app["property_id"],
                "tenant_id": app["applicant_id"],
                "owner_id": owner_id,
                "start_date": app["lease_start"],
                "end_date": app["lease_end"],
                "rent": price,
                "agreement_file": None,
                "payment_status": "Pending",
                "payment_due_date": app["lease_start"],
                "last_paid_month": None,
                "late_fee": 0
            }
            supabase.table("leases").insert(lease_payload).execute()

        elif prop_type == "sale":
            account_res = supabase.table("accounts").select("balance").eq("user_id", app["applicant_id"]).single().execute()
            if not account_res.data:
                raise HTTPException(status_code=400, detail="Applicant has no associated account")

            balance = float(account_res.data["balance"])
            if balance < float(price):
                raise HTTPException(status_code=400, detail="Insufficient balance to complete the sale")

            sale_payload = {
                "id": str(uuid4()),
                "property_id": app["property_id"],
                "buyer_id": app["applicant_id"],
                "seller_id": owner_id,
                "sale_price": price,
                "deed_file": None
            }
            supabase.table("sales").insert(sale_payload).execute()

        elif prop_type == "pg" and app.get("subscription_start") and app.get("subscription_end"):
            sub_payload = {
                "id": str(uuid4()),
                "property_id": app["property_id"],
                "user_id": app["applicant_id"],
                "start_date": app["subscription_start"],
                "end_date": app["subscription_end"],
                "rent": price,
                "payment_status": "Pending",
                "payment_due_date": app["subscription_start"],
                "last_paid_period": None,
                "late_fee": 0,
                "is_active": True
            }
            supabase.table("subscriptions").insert(sub_payload).execute()

    return updated_app
