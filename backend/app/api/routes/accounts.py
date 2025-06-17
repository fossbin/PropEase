from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client
from uuid import UUID
from typing import List
from pydantic import BaseModel, Field
from datetime import datetime
import os

from ...dependencies.supabase import get_supabase

router = APIRouter(prefix="/accounts", tags=["Accounts"])

class Account(BaseModel):
    id: UUID
    user_id: UUID
    balance: float
    updated_at: datetime

class AccountCreateResponse(BaseModel):
    id: UUID
    user_id: UUID
    balance: float
    updated_at: datetime

@router.get("/{user_id}", response_model=Account)
def get_account(user_id: UUID, supabase: Client = Depends(get_supabase)):
    response = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute()
    if response.error:
        raise HTTPException(status_code=404, detail="Account not found")
    return response.data

@router.post("/create/{user_id}", response_model=AccountCreateResponse)
def create_account(user_id: UUID, supabase: Client = Depends(get_supabase)):
    existing = supabase.table("accounts").select("*").eq("user_id", user_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Account already exists")

    response = supabase.table("accounts").insert({
        "user_id": str(user_id),
        "balance": 0.0
    }).execute()

    if response.error:
        raise HTTPException(status_code=500, detail=response.error.message)

    return response.data[0]

class UpdateBalanceRequest(BaseModel):
    amount: float
    operation: str = Field(..., regex="^(deposit|withdraw)$")

@router.patch("/update/{user_id}", response_model=Account)
def update_balance(user_id: UUID, req: UpdateBalanceRequest, supabase: Client = Depends(get_supabase)):
    account_response = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute()
    if account_response.error:
        raise HTTPException(status_code=404, detail="Account not found")

    current_balance = account_response.data['balance']
    if req.operation == "withdraw" and current_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    new_balance = current_balance + req.amount if req.operation == "deposit" else current_balance - req.amount

    update_response = supabase.table("accounts").update({
        "balance": new_balance,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("user_id", user_id).execute()

    if update_response.error:
        raise HTTPException(status_code=500, detail=update_response.error.message)

    return update_response.data[0]
