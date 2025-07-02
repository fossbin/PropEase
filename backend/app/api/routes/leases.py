from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client, Client
from typing import List
from pydantic import BaseModel
from datetime import date
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Supabase client setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------- SCHEMAS ----------

class LeaseBase(BaseModel):
    property_id: str
    tenant_id: str
    owner_id: str
    start_date: date
    end_date: date
    agreement_file: str | None = None
    monthly_rent: float
    is_signed: bool = False

class LeaseCreate(LeaseBase):
    pass

class LeaseOut(LeaseBase):
    id: str
    created_at: str

# ---------- ROUTES ----------

@router.post("/leases/", response_model=LeaseOut)
def create_lease(lease: LeaseCreate):
    response = supabase.table("leases").insert(lease.dict()).execute()
    if response.status_code != 201:
        raise HTTPException(status_code=400, detail="Failed to create lease")
    return response.data[0]

@router.get("/leases/", response_model=List[LeaseOut])
def list_leases():
    response = supabase.table("leases").select("*").order("created_at", desc=True).execute()
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch leases")
    return response.data

@router.get("/leases/{lease_id}", response_model=LeaseOut)
def get_lease(lease_id: str):
    response = supabase.table("leases").select("*").eq("id", lease_id).single().execute()
    if response.status_code != 200:
        raise HTTPException(status_code=404, detail="Lease not found")
    return response.data

@router.delete("/leases/{lease_id}")
def delete_lease(lease_id: str):
    response = supabase.table("leases").delete().eq("id", lease_id).execute()
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to delete lease")
    return {"message": "Lease deleted successfully"}

@router.put("/leases/{lease_id}", response_model=LeaseOut)
def update_lease(lease_id: str, lease: LeaseCreate):
    response = supabase.table("leases").update(lease.dict()).eq("id", lease_id).execute()
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to update lease")
    return response.data[0]
