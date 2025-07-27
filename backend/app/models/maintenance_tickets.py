from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class MaintenanceTicketCreate(BaseModel):
    property_id: str
    issue_type: str
    description: Optional[str]
    priority: Literal["Low", "Medium", "High"] 
    
class MaintenanceTicketUpdate(BaseModel):
    status: Optional[str]  
    description: Optional[str]
    priority: Optional[Literal["Low", "Medium", "High"]]

class MaintenanceTicketResponse(BaseModel):
    id: str
    property_id: str
    raised_by: str
    assigned_to: str
    issue_type: str
    description: Optional[str]
    status: str
    priority: str
    created_at: datetime
