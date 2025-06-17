from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client, Client
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import os

router = APIRouter(prefix="/account-transactions", tags=["Account Transactions"])

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)


class AccountTransactionCreate(BaseModel):
    account_id: UUID
    type: str = Field(..., regex=r"^(Deposit|Withdrawal|Payment|Refund|Payout|Transfer)$")
    amount: float = Field(..., gt=0)
    description: Optional[str] = None
    property_id: Optional[UUID] = None
    user_id: Optional[UUID] = None


class AccountTransaction(BaseModel):
    id: UUID
    account_id: UUID
    type: str
    amount: float
    description: Optional[str]
    property_id: Optional[UUID]
    user_id: Optional[UUID]
    created_at: datetime


@router.post("/", response_model=AccountTransaction)
def create_transaction(data: AccountTransactionCreate):
    # Insert transaction
    transaction_resp = supabase.table("account_transactions").insert(data.dict()).execute()
    if transaction_resp.status_code != 201:
        raise HTTPException(status_code=500, detail="Failed to create transaction")

    transaction = transaction_resp.data[0]

    # Fetch current balance
    account_resp = supabase.table("accounts").select("balance").eq("id", str(data.account_id)).single().execute()
    if account_resp.status_code != 200:
        raise HTTPException(status_code=404, detail="Account not found")

    current_balance = account_resp.data["balance"]

    # Adjust balance based on transaction type
    new_balance = current_balance
    if data.type == "Deposit" or data.type == "Refund" or data.type == "Payout":
        new_balance += data.amount
    elif data.type == "Withdrawal" or data.type == "Payment" or data.type == "Transfer":
        if current_balance < data.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        new_balance -= data.amount

    # Update account balance
    update_resp = supabase.table("accounts").update({"balance": new_balance}).eq("id", str(data.account_id)).execute()
    if update_resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to update account balance")

    return transaction


@router.get("/user/{user_id}", response_model=List[AccountTransaction])
def get_transactions_by_user(user_id: UUID):
    resp = supabase.table("account_transactions").select("*").eq("user_id", str(user_id)).order("created_at", desc=True).execute()
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")
    return resp.data


@router.get("/account/{account_id}", response_model=List[AccountTransaction])
def get_transactions_by_account(account_id: UUID):
    resp = supabase.table("account_transactions").select("*").eq("account_id", str(account_id)).order("created_at", desc=True).execute()
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")
    return resp.data
