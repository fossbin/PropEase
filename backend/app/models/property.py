from pydantic import BaseModel
from typing import Optional, List, Dict

class PropertyBase(BaseModel):
    title: str
    description: Optional[str]
    type: str
    status: str 
    price: float
    transaction_type: str  
    is_negotiable: bool
    capacity: Optional[int]
    photos: Optional[List[str]] = []
    documents: Optional[List[Dict[str, str]]] = []

class PropertyLocation(BaseModel):
    address_line: str
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    zipcode: Optional[str]
    latitude: float
    longitude: float

class PropertyWithLocation(BaseModel):
    property: PropertyBase
    location: PropertyLocation
