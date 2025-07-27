import json
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

    # Check for active subscriptions - note: subscriptions table doesn't have provider_id
    # We need to get the property owner as the provider
    subscription_check = supabase.table("subscriptions") \
        .select("id, property_id") \
        .eq("property_id", ticket_data.property_id) \
        .eq("user_id", user_id) \
        .eq("is_active", True) \
        .execute()

    if not subscription_check.data:
        raise HTTPException(
            status_code=403, 
            detail="You can only raise maintenance tickets for properties with active subscriptions."
        )

    # Get the property and its owner (who acts as the provider for subscriptions)
    prop = supabase.table("properties") \
        .select("id, title, owner_id") \
        .eq("id", ticket_data.property_id) \
        .single() \
        .execute()

    if not prop.data:
        raise HTTPException(status_code=404, detail="Property not found")

    if not prop.data.get("owner_id"):
        raise HTTPException(status_code=400, detail="Property has no assigned owner/provider")

    ticket_id = str(uuid4())

    new_ticket = {
        "id": ticket_id,
        "property_id": ticket_data.property_id,
        "raised_by": user_id,
        "assigned_to": prop.data["owner_id"],  # Assign to property owner (provider)
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
    """Get tickets assigned to the current user (provider)"""
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
    """Get tickets raised by the current user (seeker)"""
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    result = supabase.table("maintenance_tickets") \
        .select("""
            id, property_id, issue_type, description, status, priority, raised_by, assigned_to, created_at,
            properties(title),
            users!maintenance_tickets_assigned_to_fkey(name)
        """) \
        .eq("raised_by", user_id) \
        .order("created_at", desc=True) \
        .execute()

    if not result.data:
        return []

    tickets = []
    for item in result.data:
        tickets.append({
            **item,
            "property_title": item.get("properties", {}).get("title", ""),
            "assigned_to_name": item.get("users", {}).get("name", "")
        })

    return tickets

@router.patch("/{ticket_id}", response_model=MaintenanceTicketResponse)
async def update_ticket_status(
    ticket_id: str,
    request: Request,
    supabase: Client = Depends(get_supabase)
):  
    """Update ticket status - only assigned provider can update"""
    
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Parse and validate request data
    try:
        update_data = await request.json()
        if not update_data:
            raise HTTPException(status_code=422, detail="Empty request body")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON: {str(e)}")

    # Validate and normalize fields
    allowed_fields = ['status', 'description', 'priority']
    update_dict = {}
    
    for key, value in update_data.items():
        if key not in allowed_fields:
            continue
            
        if key == 'status':
            if value not in ["Open", "In Progress", "Closed"]:
                status_map = {
                    'open': 'Open',
                    'in progress': 'In Progress',
                    'inprogress': 'In Progress', 
                    'closed': 'Closed'
                }
                normalized_status = status_map.get(value.lower() if isinstance(value, str) else str(value).lower())
                if not normalized_status:
                    raise HTTPException(
                        status_code=422, 
                        detail=f"Invalid status '{value}'. Must be: Open, In Progress, or Closed"
                    )
                update_dict[key] = normalized_status
            else:
                update_dict[key] = value
                
        elif key == 'priority':
            if value not in ["Low", "Medium", "High"]:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid priority '{value}'. Must be: Low, Medium, or High"
                )
            update_dict[key] = value
            
        else:  # description
            update_dict[key] = value

    if not update_dict:
        raise HTTPException(status_code=422, detail="No valid fields to update")

    # Verify ticket exists and user has permission
    ticket = supabase.table("maintenance_tickets") \
        .select("*") \
        .eq("id", ticket_id) \
        .single() \
        .execute()

    if not ticket.data:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.data["assigned_to"] != user_id:
        raise HTTPException(
            status_code=403, 
            detail="Only the assigned provider can update this ticket"
        )

    # Update ticket
    try:
        updated = supabase.table("maintenance_tickets") \
            .update(update_dict) \
            .eq("id", ticket_id) \
            .execute()
        
        if not updated.data:
            raise Exception("No data returned from update")
            
        return updated.data[0]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@router.get("/subscription-properties", response_model=List[dict])
def get_subscription_properties(
    request: Request,
    supabase: Client = Depends(get_supabase)
):
    """Get properties where user has active subscriptions"""
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    response = supabase.table("subscriptions") \
        .select("""
            property_id,
            properties!inner(id, title, property_locations(address_line, city, state))
        """) \
        .eq("user_id", user_id) \
        .eq("is_active", True) \
        .execute()

    if not response.data:
        return []

    properties = []
    for item in response.data:
        if item.get("properties"):
            property_data = item["properties"]
            # Get address from property_locations if available
            address = ""
            if property_data.get("property_locations") and len(property_data["property_locations"]) > 0:
                location = property_data["property_locations"][0]
                address_parts = [
                    location.get("address_line", ""),
                    location.get("city", ""),
                    location.get("state", "")
                ]
                address = ", ".join(filter(None, address_parts))
            
            properties.append({
                "id": property_data["id"],
                "title": property_data["title"],
                "address": address
            })

    return properties