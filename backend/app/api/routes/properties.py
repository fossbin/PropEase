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

    if payload.property.is_negotiable and payload.property.transaction_type not in ["lease", "sale"]:
        raise HTTPException(
            status_code=400,
            detail="Only lease and sale properties can be marked as negotiable."
        )

    property_data = {
        "owner_id": user_id,
        "title": payload.property.title,
        "description": payload.property.description,
        "type": payload.property.type,
        "status": payload.property.status,
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
    # Fetch the property data
    prop_res = supabase.table("properties") \
        .select("*") \
        .eq("id", str(property_id)) \
        .single() \
        .execute()

    if not prop_res.data:
        raise HTTPException(status_code=404, detail="Property not found")

    # Fetch the corresponding location
    loc_res = supabase.table("property_locations") \
        .select("address_line, city, state, country, zipcode, latitude, longitude") \
        .eq("property_id", str(property_id)) \
        .single() \
        .execute()

    location_data = loc_res.data if loc_res.data else None

    return {
        **prop_res.data,
        "location": location_data
    }


@router.delete("/{property_id}")
def delete_property(
    property_id: UUID,
    request: Request,
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    prop_res = supabase.table("properties").select("*") \
        .eq("id", str(property_id)).eq("owner_id", user_id) \
        .single().execute()

    if not prop_res.data:
        raise HTTPException(status_code=404, detail="Property not found or not owned by user")

    property_data = prop_res.data

    if property_data["approval_status"] == "Approved":
        if property_data["transaction_type"] == "sale" and property_data["status"] == "Sold":
            raise HTTPException(status_code=400, detail="Cannot delete a sold property")

        # Check leases
        lease_res = supabase.table("leases").select("id").eq("property_id", str(property_id)).execute()
        if lease_res.data:
            raise HTTPException(status_code=400, detail="Cannot delete property with active lease")

        # Check subscriptions
        sub_res = supabase.table("subscriptions").select("id").eq("property_id", str(property_id)).eq("is_active", True).execute()
        if sub_res.data:
            raise HTTPException(status_code=400, detail="Cannot delete property with active subscription")

        # Check sales (shouldn’t happen if status != Sold, but just in case)
        sale_res = supabase.table("sales").select("id").eq("property_id", str(property_id)).execute()
        if sale_res.data:
            raise HTTPException(status_code=400, detail="Cannot delete property with finalized sale")

    # Safe to delete
    delete_res = supabase.table("properties").delete().eq("id", str(property_id)).execute()

    if delete_res.status_code >= 400:
        raise HTTPException(status_code=500, detail="Failed to delete property")

    return {"message": "Property deleted successfully"}
