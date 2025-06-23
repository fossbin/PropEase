from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import uuid4
from app.db.supabase import get_supabase_client as get_supabase
from supabase import Client
from app.dependencies import get_current_user
from app.models.support import (
    SupportTicketCreate,
    SupportTicketResponse,
    SupportTicketUpdate
)

router = APIRouter(prefix="/support-tickets", tags=["Support Tickets"])

@router.post("/", response_model=SupportTicketResponse)
def create_support_ticket(
    ticket_data: SupportTicketCreate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    ticket_id = str(uuid4())

    ticket_payload = {
        "id": ticket_id,
        "user_id": user["id"],
        "subject": ticket_data.subject,
        "priority": ticket_data.priority,
        "description": ticket_data.description,
        "status": "Open",
        "role": ticket_data.role
    }

    result = supabase.table("support_tickets").insert(ticket_payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create support ticket")
    
    return result.data[0]

@router.get("/", response_model=List[SupportTicketResponse])
def get_user_tickets(
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    result = supabase.table("support_tickets") \
        .select("*") \
        .eq("user_id", user["id"]) \
        .order("created_at", desc=True) \
        .execute()
    
    return result.data or []

@router.patch("/{ticket_id}", response_model=SupportTicketResponse)
def user_update_own_ticket(
    ticket_id: str,
    update_data: SupportTicketUpdate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Fetch to verify ownership
    ticket = supabase.table("support_tickets") \
        .select("*") \
        .eq("id", ticket_id) \
        .eq("user_id", user["id"]) \
        .single() \
        .execute()

    if not ticket.data:
        raise HTTPException(status_code=404, detail="Ticket not found or unauthorized")

    updated = supabase.table("support_tickets") \
        .update(update_data.dict(exclude_unset=True)) \
        .eq("id", ticket_id) \
        .execute()
    
    return updated.data[0]
