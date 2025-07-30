from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from supabase import Client
from app.db.supabase import get_supabase_client as get_supabase
from app.dependencies import get_current_user

router = APIRouter(prefix="/seeker", tags=["Seeker Explore"])

@router.get("/explore")
def explore_properties(
    type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    minRating: Optional[float] = Query(None),
    transaction_type: Optional[str] = Query(None),
    user=Depends(get_current_user),  # Uncommented to get current user
    supabase: Client = Depends(get_supabase)
):
    user_id = user["id"]  # Uncommented to get user ID
    
    # Get properties the user has already applied to
    applied_properties_result = (
        supabase.table("applications")
        .select("property_id")
        .eq("applicant_id", user_id)
        .execute()
    )
    applied_property_ids = [app["property_id"] for app in applied_properties_result.data]
    
    # Get properties the user is currently leasing/subscribed to
    active_leases_result = (
        supabase.table("leases")
        .select("property_id")
        .eq("tenant_id", user_id)
        .is_("terminated_at", "null")
        .execute()
    )
    leased_property_ids = [lease["property_id"] for lease in active_leases_result.data]
    
    active_subscriptions_result = (
        supabase.table("subscriptions")
        .select("property_id")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .is_("terminated_at", "null")
        .execute()
    )
    subscribed_property_ids = [sub["property_id"] for sub in active_subscriptions_result.data]
    
    # Combine all property IDs to exclude
    excluded_property_ids = list(set(applied_property_ids + leased_property_ids + subscribed_property_ids))
    
    query = (
        supabase.table("properties")
        .select(
            "id, title, type, rating, price, photos, verified, approval_status, status, "
            "transaction_type, occupancy, capacity, owner_id, property_locations(city)"
        )
        .eq("verified", True)
        .eq("approval_status", "Approved")
        .neq("status", "Sold")  
        .neq("status", "Booked")  
        .neq("owner_id", user_id)  
    )
    
    # Exclude properties the user has applied to or is currently using
    if excluded_property_ids:
        query = query.not_.in_("id", excluded_property_ids)
    
    # Apply optional filters
    if type:
        query = query.eq("type", type)
    if minRating:
        query = query.gte("rating", minRating)
    if city:
        query = query.ilike("property_locations.city", f"%{city}%")
    if transaction_type:
        query = query.eq("transaction_type", transaction_type)
    
    result = query.order("created_at", desc=True).execute()
    
    if not result.data:
        return []
    
    properties = []
    for item in result.data:
        # For PG properties, check if occupancy is less than capacity
        if item.get("transaction_type") == "PG":
            occupancy = item.get("occupancy", 0)
            capacity = item.get("capacity", 0)
            
            # Skip if at full capacity or if capacity data is invalid
            if capacity <= 0 or occupancy >= capacity:
                continue
        
        locations = item.get("property_locations", [])
        city_val = locations[0].get("city") if isinstance(locations, list) and locations else ""
        
        properties.append({
            "id": item["id"],
            "title": item["title"],
            "type": item["type"],
            "transaction_type": item.get("transaction_type"),
            "rating": float(item["rating"]) if item["rating"] is not None else None,
            "price": float(item["price"]),
            "photos": item["photos"] or [],
            "city": city_val,
            "occupancy": item.get("occupancy", 0),
            "capacity": item.get("capacity", 0),
        })
    
    return properties