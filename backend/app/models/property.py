from pydantic import BaseModel
from typing import Optional

# Location model
class PropertyLocation(BaseModel):
    address_line: str
    city: str
    state: str
    country: str
    zipcode: str
    latitude: float
    longitude: float

# Property model
class PropertyBase(BaseModel):
    title: str
    description: str
    type: str
    status: Optional[str] = "Available"
    price: float
    pricing_type: str
    capacity: int
    photos: Optional[list[str]] = []  
    approval_status: Optional[str] = "Pending"  
    rejection_reason: Optional[str] = None   


# Combined request model
class PropertyWithLocation(BaseModel):
    property: PropertyBase
    location: PropertyLocation
