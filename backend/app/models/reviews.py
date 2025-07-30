from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    reviewer_id: str
    property_id: str
    rating: int
    comment: Optional[str]
    sentiment: Optional[str]
    created_at: datetime
    reviewer_name: Optional[str]
    reviewer_picture: Optional[dict]  # since picture is JSONB
