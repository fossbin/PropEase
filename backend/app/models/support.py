from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SupportTicketCreate(BaseModel):
    subject: str
    priority: str  # 'Low', 'Medium', 'High'
    description: str
    role: str      # 'Seeker', 'Provider', etc.

class SupportTicketUpdate(BaseModel):
    status: Optional[str]  # 'Open', 'Resolved', 'Closed'

class SupportTicketResponse(BaseModel):
    id: str
    user_id: str
    subject: str
    priority: str
    description: str
    status: str
    role: str
    created_at: datetime
