from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from typing import List
from uuid import UUID
from app.db.supabase import get_supabase_client
from postgrest.exceptions import APIError

router = APIRouter(prefix="/admin/reviews", tags=["Admin Reviews"])

@router.get("", response_model=List[dict])
def list_all_reviews(supabase: Client = Depends(get_supabase_client)):
    try:
        response = (
            supabase
            .from_("reviews")
            .select("""
                id,
                rating,
                comment,
                sentiment,
                created_at,
                reviewer_id,
                property_id,
                users!reviews_reviewer_id_fkey(name),
                properties!reviews_property_id_fkey(title)
            """)
            .order("created_at", desc=True)
            .execute()
        )
        
        reviews = response.data or []
        return [
            {
                "id": r["id"],
                "rating": r["rating"],
                "comment": r["comment"],
                "sentiment": r["sentiment"],
                "created_at": r["created_at"],
                "reviewer_name": r.get("users", {}).get("name", "Unknown") if r.get("users") else "Unknown",
                "property_title": r.get("properties", {}).get("title", "Unknown") if r.get("properties") else "Unknown"
            }
            for r in reviews
        ]
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.delete("/{review_id}")
def delete_review(review_id: UUID, supabase: Client = Depends(get_supabase_client)):
    try:
        response = (
            supabase
            .from_("reviews")
            .delete()
            .eq("id", str(review_id))
            .execute()
        )
        
        # Check if any rows were affected
        if not response.data:
            raise HTTPException(status_code=404, detail="Review not found")
            
        return {"message": "Review deleted successfully"}
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete review: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")