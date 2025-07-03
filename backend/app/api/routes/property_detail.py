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
            pricing_type,
            capacity,
            occupancy,
            photos,
            rating,
            status,
            owner_id,
            transaction_type,
            property_locations (
                address_line,
                city,
                state,
                country,
                zipcode
            )
            """
        )
        .eq("id", str(property_id))
        .eq("verified", True)
        .eq("approval_status", "Approved")
        .single()
        .execute()
    )

    if not result or not result.data:
        raise HTTPException(status_code=404, detail="Property not found")

    data = result.data
    location_list = data.get("property_locations", [])
    location = location_list[0] if isinstance(location_list, list) and location_list else {}

    return {
        "id": data["id"],
        "title": data["title"],
        "type": data["type"],
        "description": data["description"],
        "price": float(data["price"]),
        "pricing_type": data.get("pricing_type", ""),
        "capacity": data.get("capacity", 0),
        "occupancy": data.get("occupancy", 0),
        "photos": data.get("photos", []),
        "rating": float(data["rating"]) if data["rating"] is not None else None,
        "status": data.get("status", ""),
        "owner_id": data["owner_id"],
        "transaction_type": data.get("transaction_type", ""),
        "address_line": location.get("address_line", ""),
        "city": location.get("city", ""),
        "state": location.get("state", ""),
        "country": location.get("country", ""),
        "zipcode": location.get("zipcode", "")
    }
