# app/api/routes/sales.py
from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client, Client
from uuid import UUID
from datetime import date
from pydantic import BaseModel, Field
import os

router = APIRouter(prefix="/sales", tags=["Sales"])

# Supabase client setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pydantic model for sales input
class SaleCreate(BaseModel):
    property_id: UUID
    buyer_id: UUID
    seller_id: UUID
    sale_price: float = Field(..., gt=0)
    sale_date: date = Field(default_factory=date.today)
    deed_file: str

class Sale(SaleCreate):
    id: UUID
    created_at: date

# Create a new sale record
@router.post("/", response_model=Sale)
def create_sale(sale: SaleCreate):
    result = supabase.table("sales").insert(sale.dict()).execute()

    if result.status_code != 201:
        raise HTTPException(status_code=400, detail="Failed to record property sale")

    return result.data[0]

# Get all sales records
@router.get("/", response_model=list[Sale])
def get_all_sales():
    result = supabase.table("sales").select("*").order("created_at", desc=True).execute()

    if result.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch sales records")

    return result.data

# Get sale by ID
@router.get("/{sale_id}", response_model=Sale)
def get_sale_by_id(sale_id: UUID):
    result = supabase.table("sales").select("*").eq("id", str(sale_id)).single().execute()

    if result.status_code != 200:
        raise HTTPException(status_code=404, detail="Sale not found")

    return result.data

# Get sales for a particular user (buyer or seller)
@router.get("/user/{user_id}", response_model=list[Sale])
def get_sales_by_user(user_id: UUID):
    result = supabase.table("sales").select("*").or_(f"buyer_id.eq.{user_id},seller_id.eq.{user_id}").order("created_at", desc=True).execute()

    if result.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user sales")

    return result.data

# Optional: delete a sale record (admin-only functionality in most systems)
@router.delete("/{sale_id}")
def delete_sale(sale_id: UUID):
    result = supabase.table("sales").delete().eq("id", str(sale_id)).execute()

    if result.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to delete sale")

    return {"message": "Sale deleted successfully"}
