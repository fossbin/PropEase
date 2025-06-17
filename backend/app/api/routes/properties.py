from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client, Client
from typing import List
from uuid import UUID
from pydantic import BaseModel
import os

from ..dependencies import get_supabase

router = APIRouter(prefix="/properties", tags=["Properties"])

class PropertyLocation(BaseModel):
    address_line: str
    city: str
    state: str
    country: str
    zipcode: str
    latitude: float
    longitude: float

class PropertyBase(BaseModel):
    title: str
    description: str
    type: str
    status: str
    price: float
    pricing_type: str
    capacity: int
    photos: List[str]
    location: PropertyLocation

class PropertyCreate(PropertyBase):
    owner_id: UUID

class Property(PropertyBase):
    id: UUID
    owner_id: UUID
    created_at: str

@router.post("/", response_model=Property)
def create_property(property: PropertyCreate, supabase: Client = Depends(get_supabase)):
    # Step 1: Insert into properties table
    property_data = {
        "owner_id": str(property.owner_id),
        "title": property.title,
        "description": property.description,
        "type": property.type,
        "status": property.status,
        "price": property.price,
        "pricing_type": property.pricing_type,
        "capacity": property.capacity,
        "photos": property.photos,
    }

    res = supabase.table("properties").insert(property_data).execute()
    if res.status_code != 201:
        raise HTTPException(status_code=400, detail="Failed to create property")

    property_id = res.data[0]["id"]

    # Step 2: Insert corresponding location in property_locations
    location_data = {
        "property_id": property_id,
        "address_line": property.location.address_line,
        "city": property.location.city,
        "state": property.location.state,
        "country": property.location.country,
        "zipcode": property.location.zipcode,
        "latitude": property.location.latitude,
        "longitude": property.location.longitude,
    }

    loc_res = supabase.table("property_locations").insert(location_data).execute()
    if loc_res.status_code != 201:
        raise HTTPException(status_code=400, detail="Failed to create property location")

    return {**res.data[0], "location": property.location}

@router.get("/", response_model=List[Property])
def list_properties(supabase: Client = Depends(get_supabase)):
    res = supabase.rpc("get_properties_with_location").execute()
    if res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch properties")
    return res.data
