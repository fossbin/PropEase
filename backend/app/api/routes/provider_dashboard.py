from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client
from app.db.supabase import get_supabase_client
from app.dependencies import get_current_user

router = APIRouter(prefix="/provider/dashboard", tags=["Provider Dashboard"])

@router.get("/stats")
def get_provider_dashboard_stats(
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    user=Depends(get_current_user)  # You must have a user auth system in place
):
    user_id = user['id']

    # Properties owned by provider
    properties_resp = supabase.table("properties").select("id, approval_status, status").eq("owner_id", user_id).execute()
    properties = properties_resp.data or []

    active_properties = len([p for p in properties if p["status"] == "Available" and p["approval_status"] == "Approved"])
    pending_properties = len([p for p in properties if p["approval_status"] == "Pending"])

    property_ids = [p["id"] for p in properties]

    # Applications to provider's properties
    applications_resp = supabase.table("applications").select("id").in_("property_id", property_ids).execute()
    total_applications = len(applications_resp.data or [])

    # Sales by provider
    sales_resp = supabase.table("sales").select("id").eq("seller_id", user_id).execute()
    total_sales = len(sales_resp.data or [])

    # Leases owned by provider
    leases_resp = supabase.table("leases").select("id").eq("owner_id", user_id).execute()
    total_leases = len(leases_resp.data or [])

    # Subscriptions for provider's properties
    subscriptions_resp = supabase.table("subscriptions").select("id").in_("property_id", property_ids).execute()
    total_subscriptions = len(subscriptions_resp.data or [])

    # Pending maintenance tickets
    maintenance_resp = supabase.table("maintenance_tickets").select("id").in_("property_id", property_ids).eq("status", "Open").execute()
    pending_maintenance_tickets = len(maintenance_resp.data or [])

    return {
        "active_properties": active_properties,
        "pending_properties": pending_properties,
        "total_applications": total_applications,
        "total_sales": total_sales,
        "total_leases": total_leases,
        "total_subscriptions": total_subscriptions,
        "pending_maintenance_tickets": pending_maintenance_tickets,
    }
