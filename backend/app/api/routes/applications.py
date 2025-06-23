from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from app.models.applications import ApplicationCreate, ApplicationUpdate
from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.post("/", status_code=201)
def submit_application(payload: ApplicationCreate):
    response = supabase.table("applications").insert(payload.dict()).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create application")
    return response.data[0]


@router.get("/sent")
def fetch_user_applications(user=Depends(get_current_user)):
    user_id = user["id"]
    response = supabase.table("applications").select("*").eq("applicant_id", str(user_id)).execute()
    return response.data or []


@router.get("/received")
def fetch_received_applications(user=Depends(get_current_user)):
    provider_id = user["id"]

    # Step 1: Get properties owned by this provider
    prop_res = supabase.table("properties").select("id,title").eq("owner_id", str(provider_id)).execute()
    properties = prop_res.data or []

    if not properties:
        return []

    property_map = {p["id"]: p["title"] for p in properties}
    property_ids = list(property_map.keys())

    # Step 2: Get all applications to those properties
    apps_res = supabase.table("applications").select("*").in_("property_id", property_ids).order("created_at", desc=True).execute()
    applications = apps_res.data or []

    # Step 3: Attach property titles
    for app in applications:
        app["property_title"] = property_map.get(app["property_id"], "Unknown Property")

    return applications


@router.patch("/{application_id}")
def update_application(application_id: UUID, payload: ApplicationUpdate):
    response = supabase.table("applications").update(payload.dict(exclude_unset=True)).eq("id", str(application_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Application not found or update failed")
    return response.data[0]
