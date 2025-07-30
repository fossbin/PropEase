from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client
from uuid import UUID
from app.db.supabase import get_supabase_client
import numpy as np

router = APIRouter(prefix="/provider/analytics", tags=["Provider Analytics"])

@router.get("/")
def get_provider_property_analytics(request: Request, supabase: Client = Depends(get_supabase_client)):
    user_id = request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user ID")
    
    props_resp = supabase.table("properties").select("id, title").eq("owner_id", user_id).execute()
    properties = props_resp.data
    if not properties:
        return []
    
    property_ids = [p["id"] for p in properties]
    
    def sum_earnings(table, amount_field):
        resp = supabase.table(table).select(f"id, property_id, {amount_field}") \
            .in_("property_id", property_ids).execute()
        result = {}
        for item in resp.data:
            pid = item["property_id"]
            result[pid] = result.get(pid, 0) + (item[amount_field] or 0)
        return result
    
    sales = sum_earnings("sales", "sale_price") 
    leases = sum_earnings("leases", "rent")      
    subscriptions = sum_earnings("subscriptions", "rent")  
    
    applications_resp = supabase.table("applications").select("property_id") \
        .in_("property_id", property_ids).execute()
    

    application_counts = {}
    for app in applications_resp.data:
        pid = app["property_id"]
        application_counts[pid] = application_counts.get(pid, 0) + 1
    
    bookings_resp = supabase.table("applications").select("property_id") \
        .in_("property_id", property_ids).eq("status", "Approved").execute()
    
    booking_counts = {}
    for booking in bookings_resp.data:
        pid = booking["property_id"]
        booking_counts[pid] = booking_counts.get(pid, 0) + 1
    

    analytics = []
    for prop in properties:
        pid = prop["id"]
        earnings = sales.get(pid, 0) + leases.get(pid, 0) + subscriptions.get(pid, 0)
        applications = application_counts.get(pid, 0)  
        bookings = booking_counts.get(pid, 0)
        
        analytics.append({
            "title": prop["title"],
            "earnings": float(earnings), 
            "applications": applications,  
            "bookings": bookings,
            "z_score_earnings": 0.0, 
        })
    
    earnings_values = [a["earnings"] for a in analytics]
    if len(earnings_values) > 1:
        mean = float(np.mean(earnings_values)) 
        std = float(np.std(earnings_values)) or 1.0  
        for a in analytics:
            z = (a["earnings"] - mean) / std
            a["z_score_earnings"] = round(float(z), 2)  
            a["anomaly"] = bool(abs(z) > 1.5)  
    else:
        for a in analytics:
            a["z_score_earnings"] = 0.0
            a["anomaly"] = False
    
    return analytics