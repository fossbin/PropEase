from pydantic import BaseModel
from typing import Optional

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
    status: Optional[str] = "Available"
    price: float
    pricing_type: str
    capacity: int
    photos: Optional[list[str]] = []  
    documents: Optional[list[dict]] = []
    approval_status: Optional[str] = "Pending"  
    rejection_reason: Optional[str] = None   

class PropertyWithLocation(BaseModel):
    property: PropertyBase
    location: PropertyLocation
