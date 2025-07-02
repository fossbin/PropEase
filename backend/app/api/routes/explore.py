from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from supabase import Client
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/seeker", tags=["Seeker Explore"])

@router.get("/explore")
def explore_properties(
    type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    minRating: Optional[float] = Query(None),
    supabase: Client = Depends(get_supabase)
):
    query = (
        supabase.table("properties")
        .select("id, title, type, rating, price, photos, verified, approval_status, status, "
                "property_locations(city)")
        .eq("verified", True)
        .eq("approval_status", "Approved")
        .eq("status", "Available")
    )

    if type:
        query = query.eq("type", type)
    if minRating:
        query = query.gte("rating", minRating)
    if city:
        query = query.ilike("property_locations.city", f"%{city}%")

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
            "rating": float(item["rating"]) if item["rating"] is not None else None,
            "price": float(item["price"]),
            "photos": item["photos"] or [],
            "city": city_val,
        })

    return properties
