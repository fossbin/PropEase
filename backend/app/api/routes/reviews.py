from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client
from app.dependencies import get_current_user
from app.models.reviews import ReviewCreate, ReviewResponse
from app.core.config import settings
import uuid
from typing import List

router = APIRouter()

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

@router.post("/", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    user=Depends(get_current_user)
):
    review_id = str(uuid.uuid4())
    property_id = review_data.property_id
    user_id = user["id"]

    # Step 1: Check if this property has been sold (disallow reviews for sold properties)
    property_check = supabase.table("properties").select("status").eq("id", property_id).single().execute()
    if not property_check.data:
        raise HTTPException(status_code=404, detail="Property not found.")
    if property_check.data["status"] == "Sold":
        raise HTTPException(status_code=403, detail="Cannot review sold properties.")

    # Step 2: Check if user has a valid lease/subscription/payment transaction for this property
    lease_check = supabase.table("leases").select("id").eq("property_id", property_id).eq("tenant_id", user_id).execute()
    sub_check = supabase.table("subscriptions").select("id").eq("property_id", property_id).eq("user_id", user_id).execute()
    payment_check = supabase.table("account_transactions").select("id").eq("property_id", property_id).eq("user_id", user_id).eq("type", "Payment").execute()

    if not lease_check.data and not sub_check.data and not payment_check.data:
        raise HTTPException(status_code=403, detail="Only verified tenants or subscribers can review this property.")

    # Step 3: Create the review
    review_obj = {
        "id": review_id,
        "reviewer_id": user_id,
        "property_id": property_id,
        "rating": review_data.rating,
        "comment": review_data.comment
    }

    response = supabase.table("reviews").insert(review_obj).execute()
    return response.data[0]

@router.get("/property/{property_id}", response_model=List[ReviewResponse])
def get_reviews_for_property(property_id: str):
    result = supabase.table("reviews").select("*").eq("property_id", property_id).order("created_at", desc=True).execute()
    return result.data
