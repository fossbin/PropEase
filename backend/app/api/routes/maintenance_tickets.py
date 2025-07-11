from fastapi import APIRouter, HTTPException, Depends, Request
from supabase import Client
from typing import List
from uuid import uuid4
from app.db.supabase import get_supabase_client as get_supabase
from app.models.maintenance_tickets import (
    MaintenanceTicketCreate,
    MaintenanceTicketResponse,
    MaintenanceTicketUpdate,
)

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

@router.post("/", response_model=MaintenanceTicketResponse)
def create_maintenance_ticket(
    request: Request,
    ticket_data: MaintenanceTicketCreate,
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    lease_check = supabase.table("leases") \
        .select("id") \
        .eq("property_id", ticket_data.property_id) \
        .eq("tenant_id", user_id) \
        .execute()

    subscription_check = supabase.table("subscriptions") \
        .select("id") \
        .eq("property_id", ticket_data.property_id) \
        .eq("user_id", user_id) \
        .eq("is_active", True) \
        .execute()

    if not lease_check.data and not subscription_check.data:
        raise HTTPException(status_code=403, detail="You are not authorized to raise a ticket for this property.")

    # Get property owner
    prop = supabase.table("properties") \
        .select("owner_id") \
        .eq("id", ticket_data.property_id) \
        .single() \
        .execute()

    if not prop.data:
        raise HTTPException(status_code=404, detail="Property not found")

    ticket_id = str(uuid4())

    new_ticket = {
        "id": ticket_id,
        "property_id": ticket_data.property_id,
        "raised_by": user_id,
        "assigned_to": prop.data["owner_id"],
        "issue_type": ticket_data.issue_type,
        "description": ticket_data.description,
        "status": "Open",
        "priority": ticket_data.priority,
    }

    response = supabase.table("maintenance_tickets").insert(new_ticket).execute()
    return response.data[0]

@router.get("/assigned", response_model=List[MaintenanceTicketResponse])
def get_assigned_tickets(
    request: Request,
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user ID")

    response = supabase.table("maintenance_tickets").select(
        """
        id, property_id, issue_type, description, status, priority, raised_by, assigned_to, created_at,
        properties(title),
        users!maintenance_tickets_raised_by_fkey(name)
        """
    ).eq("assigned_to", user_id).order("created_at", desc=True).execute()

    if not response.data:
        return []

    tickets = []
    for item in response.data:
        tickets.append({
            **item,
            "property_title": item.get("properties", {}).get("title", ""),
            "raised_by_name": item.get("users", {}).get("name", "")
        })

    return tickets



@router.get("/raised", response_model=List[MaintenanceTicketResponse])
def get_raised_tickets(
    request: Request,
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    result = supabase.table("maintenance_tickets") \
        .select("*") \
        .eq("raised_by", user_id) \
        .order("created_at", desc=True) \
        .execute()

    return result.data or []


@router.patch("/{ticket_id}", response_model=MaintenanceTicketResponse)
def update_ticket_status(
    ticket_id: str,
    update_data: MaintenanceTicketUpdate,
    request: Request,
    supabase: Client = Depends(get_supabase)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    ticket = supabase.table("maintenance_tickets") \
        .select("*") \
        .eq("id", ticket_id) \
        .single() \
        .execute()

    if not ticket.data:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.data["assigned_to"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this ticket")

    updated = supabase.table("maintenance_tickets") \
        .update(update_data.dict(exclude_unset=True)) \
        .eq("id", ticket_id) \
        .execute()

    return updated.data[0]
