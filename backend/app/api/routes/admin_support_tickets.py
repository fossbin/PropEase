from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.supabase import get_supabase_client as get_supabase
from supabase import Client
from app.dependencies import get_current_user
from app.models.support import SupportTicketUpdate
from app.core.config import settings

router = APIRouter(prefix="/support-tickets", tags=["Admin Support Tickets"])

@router.get("/", response_model=List[dict])
def admin_get_tickets(
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Only admins can access this route.")

    result = supabase.table("support_tickets").select("*, users!inner(name)").order("created_at", desc=True).execute()

    if not result.data:
        return []

    tickets_with_user_name = []
    for item in result.data:
        ticket = {**item}
        ticket["user_name"] = item.get("users", {}).get("name", "Unknown")
        ticket.pop("users", None)
        tickets_with_user_name.append(ticket)

    return tickets_with_user_name

@router.patch("/{ticket_id}")
def admin_update_ticket_status(
    ticket_id: str,
    update_data: SupportTicketUpdate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    if user["email"] not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Only admins can update ticket status.")

    update_payload = update_data.dict(exclude_unset=True)

    result = supabase.table("support_tickets").update(update_payload).eq("id", ticket_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Support ticket not found.")

    return {"message": "Ticket status updated successfully"}
