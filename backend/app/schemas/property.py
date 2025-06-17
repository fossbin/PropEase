from pydantic import BaseModel
from typing import Optional

class Property(BaseModel):
    id: str
    title: str
    description: Optional[str]
    price: float
    status: Optional[str]
    pricing_type: Optional[str]
