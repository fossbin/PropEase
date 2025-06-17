from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MaintenanceTicketCreate(BaseModel):
    property_id: str
    issue_type: str
    description: Optional[str]
    priority: str  # Low, Medium, High

class MaintenanceTicketUpdate(BaseModel):
    status: Optional[str]  # Open, In Progress, Closed
    description: Optional[str]
    priority: Optional[str]

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
