from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ApplicationBase(BaseModel):
    property_id: UUID
    applicant_id: UUID
    message: Optional[str] = None
    documents: Optional[dict] = None


class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: str = Field(..., pattern="^(Pending|Approved|Rejected)$")
    message: Optional[str] = None

class ApplicationInDB(ApplicationBase):
    id: UUID
    status: str
    created_at: datetime

    class Config:
        orm_mode = True
