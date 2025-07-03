from fastapi import APIRouter, HTTPException, Depends, Request
from supabase import Client
from typing import Optional
from uuid import UUID
from app.db.supabase import get_supabase_client as get_supabase
from app.models.property import PropertyWithLocation

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.post("/")
def create_property(
    request: Request,
    payload: PropertyWithLocation,
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized: Missing user ID")

    property_data = {
        "owner_id": user_id,
        "title": payload.property.title,
        "description": payload.property.description,
        "type": payload.property.type,
        "status": payload.property.status,  # Must be one of: 'Available', 'Booked', 'Sold'
        "price": payload.property.price,
        "transaction_type": payload.property.transaction_type,
        "is_negotiable": payload.property.is_negotiable,
        "capacity": payload.property.capacity,
        "photos": payload.property.photos or [],
        "documents": getattr(payload.property, "documents", []),
    }

    prop_res = supabase.table("properties").insert(property_data).execute()
    if not prop_res.data:
        raise HTTPException(status_code=500, detail="Property creation failed")

    property_id = prop_res.data[0]["id"]

    location_data = {
        "property_id": property_id,
        **payload.location.dict()
    }

    loc_res = supabase.table("property_locations").insert(location_data).execute()
    if not loc_res.data:
        raise HTTPException(status_code=500, detail="Location creation failed")

    return {
        "message": "Property and location created successfully",
        "property_id": property_id
    }


@router.get("/owned")
def get_owned_properties(
    request: Request,
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    result = supabase.table("properties") \
        .select("id, title, type, status, price, transaction_type, is_negotiable, capacity, approval_status, created_at") \
        .eq("owner_id", user_id) \
        .execute()

    if result.data is None:
        raise HTTPException(status_code=404, detail="No properties found")

    return result.data


@router.get("/{property_id}")
def get_property_by_id(
    property_id: UUID,
    supabase: Client = Depends(get_supabase)
):
    result = supabase.table("properties") \
        .select("*") \
        .eq("id", str(property_id)) \
        .single() \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Property not found")

    return result.data
