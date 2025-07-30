from fastapi import APIRouter, Depends, Request
from supabase import Client
from app.db.supabase import get_supabase_client
from app.dependencies import get_current_user

router = APIRouter(prefix="/seeker/dashboard", tags=["Seeker Dashboard"])

@router.get("/stats")
def get_seeker_dashboard_stats(
    request: Request,
    supabase: Client = Depends(get_supabase_client),
    user=Depends(get_current_user)
):
    user_id = user['id']

    # Applications by seeker
    apps_resp = supabase.table("applications").select("id").eq("applicant_id", user_id).execute()
    total_applications = len(apps_resp.data or [])

    # Purchases
    purchases_resp = supabase.table("sales").select("id").eq("buyer_id", user_id).execute()
    total_purchases = len(purchases_resp.data or [])

    # Leases
    leases_resp = supabase.table("leases").select("id").eq("tenant_id", user_id).execute()
    total_leases = len(leases_resp.data or [])

    # Subscriptions (PG)
    subs_resp = supabase.table("subscriptions").select("id").eq("user_id", user_id).execute()
    total_subscriptions = len(subs_resp.data or [])

    # Maintenance tickets raised
    mt_resp = supabase.table("maintenance_tickets").select("id").eq("raised_by", user_id).execute()
    maintenance_tickets = len(mt_resp.data or [])

    # Reviews written
    reviews_resp = supabase.table("reviews").select("id").eq("reviewer_id", user_id).execute()
    reviews_written = len(reviews_resp.data or [])

    return {
        "total_applications": total_applications,
        "total_purchases": total_purchases,
        "total_leases": total_leases,
        "total_subscriptions": total_subscriptions,
        "maintenance_tickets": maintenance_tickets,
        "reviews_written": reviews_written
    }
