from fastapi import APIRouter, Depends, HTTPException, Request, Body
from uuid import uuid4
from typing import List
from app.models.reviews import ReviewCreate, ReviewResponse
from app.db.supabase import get_supabase_client as get_supabase
# from app.services.sentiment_local import classify_sentiment
from supabase import Client

router = APIRouter(prefix="/seeker", tags=["Seeker Reviews"])

@router.post("/review/{property_id}", response_model=ReviewResponse)
def create_or_update_review(
    request: Request,
    property_id: str,
    review_data: ReviewCreate = Body(...),
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Check if user has leased or subscribed to the property
    lease_check = supabase.table("leases") \
        .select("id") \
        .eq("property_id", property_id) \
        .eq("tenant_id", user_id) \
        .execute()
    
    sub_check = supabase.table("subscriptions") \
        .select("id") \
        .eq("property_id", property_id) \
        .eq("user_id", user_id) \
        .execute()
    
    if not lease_check.data and not sub_check.data:
        raise HTTPException(
            status_code=403, 
            detail="You can only review properties you have rented or subscribed to."
        )
    
    # Check for existing review
    existing_review = supabase.table("reviews") \
        .select("id") \
        .eq("property_id", property_id) \
        .eq("reviewer_id", user_id) \
        .execute()
    
    # Optional sentiment analysis
    # sentiment = classify_sentiment(review_data.comment)
    
    if existing_review.data and len(existing_review.data) > 0:
        # Update existing review
        review_id = existing_review.data[0]["id"]
        
        update_obj = {
            "rating": review_data.rating,
            "comment": review_data.comment,
            # "sentiment": sentiment
        }
        
        result = supabase.table("reviews") \
            .update(update_obj) \
            .eq("id", review_id) \
            .execute()
        
        return result.data[0]
    else:
        # Create new review
        review_obj = {
            "id": str(uuid4()),
            "reviewer_id": user_id,
            "property_id": property_id,
            "rating": review_data.rating,
            "comment": review_data.comment,
            # "sentiment": sentiment
        }
        
        result = supabase.table("reviews").insert(review_obj).execute()
        return result.data[0]

@router.get("/reviewables")
def get_reviewable_properties(
    request: Request,
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Get leases with property details
    leases = supabase.table("leases") \
        .select("property_id, start_date, end_date, properties(title, transaction_type, type, property_locations(address_line, city, state))") \
        .eq("tenant_id", user_id) \
        .execute()
    
    lease_props = leases.data or []
    
    # Get subscriptions with property details
    subs = supabase.table("subscriptions") \
        .select("property_id, start_date, end_date, properties(title, transaction_type, type, property_locations(address_line, city, state))") \
        .eq("user_id", user_id) \
        .execute()
    
    sub_props = subs.data or []
    
    # Get existing reviews for these properties
    all_property_ids = list(set([item["property_id"] for item in lease_props + sub_props]))
    existing_reviews = {}
    
    if all_property_ids:
        reviews = supabase.table("reviews") \
            .select("property_id, rating, comment") \
            .eq("reviewer_id", user_id) \
            .in_("property_id", all_property_ids) \
            .execute()
        
        for review in reviews.data or []:
            existing_reviews[review["property_id"]] = {
                "rating": review["rating"],
                "comment": review["comment"]
            }
    
    # Combine and deduplicate
    seen = set()
    results = []
    
    for item in lease_props + sub_props:
        pid = item["property_id"]
        if pid not in seen:
            seen.add(pid)
            property_info = item.get("properties", {})
            location_info = property_info.get("property_locations", [{}])[0] if property_info.get("property_locations") else {}
            
            # Build location string
            location_parts = [
                location_info.get("address_line", ""),
                location_info.get("city", ""),
                location_info.get("state", "")
            ]
            location = ", ".join([part for part in location_parts if part])
            
            # Determine transaction type based on source
            transaction_type = property_info.get("transaction_type", "Lease")
            if item in sub_props and transaction_type != "Lease":
                transaction_type = "PG"
            
            # Get existing review data if available
            existing_review = existing_reviews.get(pid, {})
            
            result_item = {
                "property_id": pid,
                "title": property_info.get("title", "Untitled"),
                "transaction_type": transaction_type,
                "property_type": property_info.get("type"),
                "start_date": item.get("start_date"),
                "end_date": item.get("end_date"),
                "location": location if location else None,
                "rating": existing_review.get("rating"),
                "comment": existing_review.get("comment")
            }
            
            results.append(result_item)
    
    return results

@router.get("/review/property/{property_id}", response_model=List[ReviewResponse])
def get_reviews_for_property(
    property_id: str,
    supabase: Client = Depends(get_supabase)
):
    result = supabase.table("reviews") \
        .select("*") \
        .eq("property_id", property_id) \
        .order("created_at", desc=True) \
        .execute()
    
    return result.data or []