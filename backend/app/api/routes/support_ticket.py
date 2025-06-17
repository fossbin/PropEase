from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import uuid4
from supabase import create_client, Client
from app.core.config import settings
from app.models.support import SupportTicketCreate, SupportTicketResponse, SupportTicketUpdate
from app.dependencies import get_current_user

router = APIRouter()
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

@router.post("/", response_model=SupportTicketResponse)
def create_support_ticket(
    ticket_data: SupportTicketCreate,
    user=Depends(get_current_user)
):
    ticket_id = str(uuid4())

    ticket_payload = {
        "id": ticket_id,
        "user_id": user["id"],
        "subject": ticket_data.subject,
        "priority": ticket_data.priority,
        "description": ticket_data.description,
        "status": "Open",
        "role": ticket_data.role,
    }

    response = supabase.table("support_tickets").insert(ticket_payload).execute()
    return response.data[0]


@router.get("/", response_model=List[SupportTicketResponse])
def get_all_tickets(user=Depends(get_current_user)):
    # For now, any user sees only their own tickets unless admin
    query = supabase.table("support_tickets").select("*")

    if user["email"] not in settings.ADMIN_EMAILS:
        query = query.eq("user_id", user["id"])

    result = query.order("created_at", desc=True).execute()
    return result.data


@router.patch("/{ticket_id}", response_model=SupportTicketResponse)
def update_ticket_status(ticket_id: str, update_data: SupportTicketUpdate, user=Depends(get_current_user)):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only can update ticket status.")

    result = supabase.table("support_tickets").update(update_data.dict(exclude_unset=True)).eq("id", ticket_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    return result.data[0]
