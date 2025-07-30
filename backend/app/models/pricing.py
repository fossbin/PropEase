from pydantic import BaseModel
from typing import List, Optional

class PricingRequest(BaseModel):
    property_type: str
    location: str
    transaction_type: str  
    description: str
    capacity: Optional[int] = None
    amenities: Optional[List[str]] = []
    additional_info: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None

class PricingResponse(BaseModel):
    suggested_price: str
    price_range: str
    reasoning: str
    confidence_level: str
