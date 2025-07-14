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
    # user=Depends(get_current_user),  
    supabase: Client = Depends(get_supabase)
):
    # user_id = user["id"]

    query = (
        supabase.table("properties")
        .select(
            "id, title, type, rating, price, photos, verified, approval_status, status, "
            "transaction_type, occupancy, capacity, property_locations(city)"
        )
        .eq("verified", True)
        .eq("approval_status", "Approved")
        .eq("status", "Available")
        # .neq("owner_id", user_id)  
    )

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
