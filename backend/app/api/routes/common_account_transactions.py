from fastapi import APIRouter, Depends, HTTPException, Header, Body
from supabase import Client
from uuid import uuid4
from datetime import datetime
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/common/account", tags=["Common Account"])

@router.get("/balance")
def get_account_balance(
    x_user_id: str = Header(..., alias="X-User-Id"),
    supabase: Client = Depends(get_supabase)
):
    resp = supabase.table("accounts").select("balance").eq("user_id", x_user_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"balance": float(resp.data["balance"])}

@router.get("/transactions")
def get_user_account_transactions(
    x_user_id: str = Header(..., alias="X-User-Id"),
    supabase: Client = Depends(get_supabase)
):
    acc_resp = supabase.table("accounts").select("id").eq("user_id", x_user_id).single().execute()
    if not acc_resp.data:
        raise HTTPException(status_code=404, detail="Account not found")

    account_id = acc_resp.data["id"]

    tx_resp = supabase.table("account_transactions") \
        .select("*") \
        .eq("account_id", account_id) \
        .order("created_at", desc=True) \
        .execute()

    if not tx_resp.data:
        return []

    return tx_resp.data


@router.post("/deposit")
def deposit_to_account(
    amount: float = Body(..., embed=True),
    x_user_id: str = Header(..., alias="X-User-Id"),
    supabase: Client = Depends(get_supabase)
):
    return handle_transaction("Deposit", amount, x_user_id, supabase)


@router.post("/withdraw")
def withdraw_from_account(
    amount: float = Body(..., embed=True),
    x_user_id: str = Header(..., alias="X-User-Id"),
    supabase: Client = Depends(get_supabase)
):
    return handle_transaction("Withdrawal", amount, x_user_id, supabase)


def handle_transaction(tx_type: str, amount: float, user_id: str, supabase: Client):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    acc_resp = supabase.table("accounts").select("id", "balance").eq("user_id", user_id).single().execute()
    if not acc_resp.data:
        raise HTTPException(status_code=404, detail="Account not found")

    account_id = acc_resp.data["id"]
    current_balance = float(acc_resp.data["balance"])

    if tx_type == "Withdrawal" and current_balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    transaction = {
        "id": str(uuid4()),
        "account_id": account_id,
        "user_id": user_id,
        "type": tx_type,
        "amount": amount,
        "description": f"{tx_type} of ₹{amount}",
        "created_at": datetime.utcnow().isoformat()
    }

    insert_resp = supabase.table("account_transactions").insert(transaction).execute()
    if not insert_resp.data:
        raise HTTPException(status_code=500, detail="Transaction failed")

    new_balance = current_balance + (amount if tx_type == "Deposit" else -amount)
    update_resp = supabase.table("accounts").update({"balance": new_balance}).eq("id", account_id).execute()

    if not update_resp.data:
        raise HTTPException(status_code=500, detail="Failed to update balance")

    return {"message": f"{tx_type} successful", "new_balance": new_balance}
