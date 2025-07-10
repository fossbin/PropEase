from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from supabase import Client
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/seeker", tags=["Seeker Explore"])

@router.get("/property/{property_id}")
def get_property_details(
    property_id: UUID,
    supabase: Client = Depends(get_supabase)
):
    result = (
        supabase.table("properties")
        .select(
            """
            id,
            title,
            type,
            description,
            price,
            capacity,
            occupancy,
            photos,
            rating,
            status,
            owner_id,
            transaction_type,
            is_negotiable,
            approval_status,
            verified,
            property_locations (
                address_line,
                city,
                state,
                country,
                zipcode,
                latitude,
                longitude
            )
            """
        )
        .eq("id", str(property_id))
        .eq("verified", True)
        .eq("approval_status", "Approved")
        .execute()
    )

    if not result or not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Property not found")

    property_data = result.data[0]  
    location_list = property_data.get("property_locations", [])
    location = location_list[0] if isinstance(location_list, list) and location_list else {}

    reviews_res = (
        supabase.table("reviews")
        .select("reviewer_id, rating, comment, created_at")
        .eq("property_id", str(property_id))
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "id": property_data["id"],
        "title": property_data["title"],
        "type": property_data["type"],
        "description": property_data["description"],
        "price": float(property_data["price"]),
        "capacity": property_data["capacity"],
        "occupancy": property_data["occupancy"],
        "photos": property_data["photos"],
        "rating": float(property_data["rating"]) if property_data["rating"] is not None else None,
        "status": property_data["status"],
        "owner_id": property_data["owner_id"],
        "transaction_type": property_data["transaction_type"],
        "is_negotiable": property_data["is_negotiable"],
        "approval_status": property_data["approval_status"],
        "verified": property_data["verified"],
        "address_line": location.get("address_line", ""),
        "city": location.get("city", ""),
        "state": location.get("state", ""),
        "country": location.get("country", ""),
        "zipcode": location.get("zipcode", ""),
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "reviews": reviews_res.data or []
    }
