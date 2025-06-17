from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client
from app.dependencies import get_current_user
from app.models.maintenance_tickets import (
    MaintenanceTicketCreate,
    MaintenanceTicketResponse,
    MaintenanceTicketUpdate
)
from app.core.config import settings
import uuid
from typing import List

router = APIRouter()

# Supabase client setup
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

@router.post("/", response_model=MaintenanceTicketResponse)
def create_maintenance_ticket(
    ticket_data: MaintenanceTicketCreate,
    user=Depends(get_current_user)
):
    ticket_id = str(uuid.uuid4())

    # Validate the user has an active lease or subscription on the property
    property_id = ticket_data.property_id
    tenant_id = user['id']

    lease_check = supabase.table("leases").select("id").eq("property_id", property_id).eq("tenant_id", tenant_id).execute()
    subscription_check = supabase.table("subscriptions").select("id").eq("property_id", property_id).eq("user_id", tenant_id).eq("is_active", True).execute()

    if not lease_check.data and not subscription_check.data:
        raise HTTPException(status_code=403, detail="You are not authorized to raise a ticket for this property.")

    # Get the owner_id to assign the ticket
    prop = supabase.table("properties").select("owner_id").eq("id", property_id).single().execute()
    if not prop.data:
        raise HTTPException(status_code=404, detail="Property not found.")

    new_ticket = {
        "id": ticket_id,
        "property_id": property_id,
        "raised_by": tenant_id,
        "assigned_to": prop.data["owner_id"],
        "issue_type": ticket_data.issue_type,
        "description": ticket_data.description,
        "status": "Open",
        "priority": ticket_data.priority
    }

    response = supabase.table("maintenance_tickets").insert(new_ticket).execute()
    return response.data[0]

@router.get("/", response_model=List[MaintenanceTicketResponse])
def list_user_tickets(user=Depends(get_current_user)):
    tickets = supabase.table("maintenance_tickets").select("*").or_(
        f"raised_by.eq.{user['id']},assigned_to.eq.{user['id']}"
    ).order("created_at", desc=True).execute()
    return tickets.data

@router.patch("/{ticket_id}", response_model=MaintenanceTicketResponse)
def update_ticket_status(ticket_id: str, update_data: MaintenanceTicketUpdate, user=Depends(get_current_user)):
    # First check if the user is the assigned owner
    ticket = supabase.table("maintenance_tickets").select("*").eq("id", ticket_id).single().execute()

    if not ticket.data:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.data["assigned_to"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only the assigned owner can update the ticket")

    update_payload = update_data.dict(exclude_unset=True)
    updated = supabase.table("maintenance_tickets").update(update_payload).eq("id", ticket_id).execute()
    return updated.data[0]
