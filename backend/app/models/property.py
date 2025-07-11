from pydantic import BaseModel
from typing import Optional, List

class PropertyDocument(BaseModel):
    document_type: Optional[str]  
    document_url: str             
    file_name: str                
    verified: Optional[bool] = False  

class PropertyBase(BaseModel):
    title: str
    description: Optional[str]
    type: str
    status: str
    price: float
    transaction_type: str  # "Sale", "Lease", or "PG"
    is_negotiable: Optional[bool]
    capacity: Optional[int]
    photos: Optional[List[str]] = []
    documents: Optional[List[PropertyDocument]] = []

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
