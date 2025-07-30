from fastapi import APIRouter, HTTPException, Depends, Request
from supabase import Client
from typing import Optional
from uuid import UUID
from app.db.supabase import get_supabase_client as get_supabase
from app.models.property import PropertyWithLocation, PropertyDocument

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

    if payload.property.is_negotiable and payload.property.transaction_type not in ["Lease", "Sale"]:
        raise HTTPException(
            status_code=400,
            detail="Only lease and sale properties can be marked as negotiable."
        )

    # Insert into properties
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

    # Insert documents if any
    if payload.property.documents:
        doc_payloads = [
            {
                "property_id": property_id,
                "document_type": doc.document_type or "Other",
                "document_url": doc.document_url,
                "file_name": doc.file_name
            } for doc in payload.property.documents
        ]
        supabase.table("property_documents").insert(doc_payloads).execute()

    return {
        "message": "Property, location, and documents created successfully",
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
    # Fetch property
    prop_res = supabase.table("properties").select("*").eq("id", str(property_id)).single().execute()
    if not prop_res.data:
        raise HTTPException(status_code=404, detail="Property not found")

    # Fetch location
    loc_res = supabase.table("property_locations").select(
        "address_line, city, state, country, zipcode, latitude, longitude"
    ).eq("property_id", str(property_id)).single().execute()

    # Fetch documents
    doc_res = supabase.table("property_documents") \
        .select("id, document_type, document_url, file_name, verified") \
        .eq("property_id", str(property_id)) \
        .execute()

    return {
        **prop_res.data,
        "location": loc_res.data if loc_res.data else None,
        "documents": doc_res.data if doc_res.data else [],
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

    # Ensure property is owned by user
    prop_res = supabase.table("properties").select("*") \
        .eq("id", str(property_id)).eq("owner_id", user_id) \
        .single().execute()

    if not prop_res.data:
        raise HTTPException(status_code=404, detail="Property not found or not owned by user")

    property_data = prop_res.data

    # Prevent deleting finalized transactions
    if property_data["approval_status"] == "Approved":
        if property_data["transaction_type"] == "Sale" and property_data["status"] == "Sold":
            raise HTTPException(status_code=400, detail="Cannot delete a sold property")

        lease_res = supabase.table("leases").select("id").eq("property_id", str(property_id)).execute()
        if lease_res.data:
            raise HTTPException(status_code=400, detail="Cannot delete property with active lease")

        sub_res = supabase.table("subscriptions").select("id").eq("property_id", str(property_id)).eq("is_active", True).execute()
        if sub_res.data:
            raise HTTPException(status_code=400, detail="Cannot delete property with active subscription")

        sale_res = supabase.table("sales").select("id").eq("property_id", str(property_id)).execute()
        if sale_res.data:
            raise HTTPException(status_code=400, detail="Cannot delete property with finalized sale")

    # Delete documents from storage + DB
    doc_res = supabase.table("property_documents").select("document_url").eq("property_id", str(property_id)).execute()
    if doc_res.data:
        for doc in doc_res.data:
            supabase.storage.from_("property-files").remove([doc["document_url"]])
        supabase.table("property_documents").delete().eq("property_id", str(property_id)).execute()

    # Delete location
    supabase.table("property_locations").delete().eq("property_id", str(property_id)).execute()

    # Delete property
    delete_res = supabase.table("properties").delete().eq("id", str(property_id)).execute()
    if delete_res.status_code >= 400:
        raise HTTPException(status_code=500, detail="Failed to delete property")

    return {"message": "Property and related data deleted successfully"}

@router.get("/{property_id}/reviews")
def get_property_reviews(
    property_id: UUID,
    supabase: Client = Depends(get_supabase)
):
    result = supabase.table("reviews") \
        .select("id, reviewer_id, rating, comment, sentiment, created_at, users!reviewer_id(name)") \
        .eq("property_id", str(property_id)) \
        .order("created_at", desc=True) \
        .execute()
    
    # Transform the data to include reviewer name
    reviews = []
    for review in result.data:
        reviews.append({
            **review,
            "reviewer_name": review.get("users", {}).get("name") if review.get("users") else None
        })
    
    return reviews