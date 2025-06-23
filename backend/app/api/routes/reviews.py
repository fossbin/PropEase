from fastapi import APIRouter, Depends, HTTPException, Request
from uuid import uuid4
from typing import List
from app.models.reviews import ReviewCreate, ReviewResponse
from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client as get_supabase
from supabase import Client

router = APIRouter(prefix="/seeker", tags=["Seeker Reviews"])


@router.post("/review/{property_id}", response_model=ReviewResponse)
def create_review(
    property_id: str,
    review_data: ReviewCreate,
    request: Request,
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 1. Check if property is eligible for review (via lease or subscription)
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
        raise HTTPException(status_code=403, detail="You can only review properties you have rented or subscribed to.")

    # 2. Prevent duplicate reviews
    existing_review = supabase.table("reviews") \
        .select("id") \
        .eq("property_id", property_id) \
        .eq("reviewer_id", user_id) \
        .maybe_single() \
        .execute()

    if existing_review.data:
        raise HTTPException(status_code=400, detail="You have already reviewed this property.")

    # 3. Create review
    review_obj = {
        "id": str(uuid4()),
        "reviewer_id": user_id,
        "property_id": property_id,
        "rating": review_data.rating,
        "comment": review_data.comment,
    }

    result = supabase.table("reviews").insert(review_obj).execute()
    return result.data[0]


@router.get("/reviewables")
def get_reviewable_properties(
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    user_id = user["id"]

    # 1. Get properties from leases (join to get title)
    leases = supabase.table("leases") \
        .select("property_id, properties(title)") \
        .eq("tenant_id", user_id) \
        .execute()
    lease_props = leases.data or []

    # 2. Get properties from subscriptions (join to get title)
    subs = supabase.table("subscriptions") \
        .select("property_id, properties(title)") \
        .eq("user_id", user_id) \
        .execute()
    sub_props = subs.data or []

    seen = set()
    results = []

    for item in lease_props + sub_props:
        pid = item["property_id"]
        if pid not in seen:
            seen.add(pid)
            title = item.get("properties", {}).get("title", "Untitled")
            results.append({
                "property_id": pid,
                "title": title
            })

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
