from fastapi import APIRouter, HTTPException, Depends, Request
from supabase import Client
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/properties", tags=["Properties"])

# Location model
class PropertyLocation(BaseModel):
    address_line: str
    city: str
    state: str
    country: str
    zipcode: str
    latitude: float
    longitude: float

# Property model
class PropertyBase(BaseModel):
    title: str
    description: str
    type: str
    status: Optional[str] = "Available"
    price: float
    pricing_type: str
    capacity: int

# Combined request model
class PropertyWithLocation(BaseModel):
    property: PropertyBase
    location: PropertyLocation

@router.post("/")
def create_property(
    request: Request,
    payload: PropertyWithLocation,
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized: Missing user ID")

    # Insert property
    property_data = {
        "owner_id": user_id,
        "title": payload.property.title,
        "description": payload.property.description,
        "type": payload.property.type,
        "status": payload.property.status,
        "price": payload.property.price,
        "pricing_type": payload.property.pricing_type,
        "capacity": payload.property.capacity,
        "photos": [],
    }

    prop_res = supabase.table("properties").insert(property_data).execute()
    if not prop_res.data:
        raise HTTPException(status_code=500, detail="Property creation failed")

    property_id = prop_res.data[0]["id"]

    # Insert location
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
