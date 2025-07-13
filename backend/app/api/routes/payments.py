from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID, uuid4
from typing import List, Dict, Optional
from datetime import datetime, date, timedelta
from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/payments", tags=["Payments"])

# 1. GET /payments - Fetch paid and pending payments
@router.get("/", response_model=List[Dict])
def get_payments(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    account_response = supabase.table("accounts").select("id").eq("user_id", user_id).single().execute()
    if account_response.error or not account_response.data:
        raise HTTPException(status_code=400, detail="Account not found")
    account_id = account_response.data["id"]

    tx_response = (
        supabase.table("account_transactions")
        .select("*, properties(title, transaction_type), leases(start_date, end_date), subscriptions(start_date, end_date)")
        .eq("account_id", account_id)
        .eq("type", "Payment")
        .order("created_at", desc=True)
        .execute()
    )
    if tx_response.error:
        raise HTTPException(status_code=500, detail=tx_response.error.message)

    pending_response = supabase.table("applications") \
        .select("id, property_id, status, created_at, properties!applications_property_id_fkey(id, title, transaction_type, price, owner_id)") \
        .eq("applicant_id", user_id) \
        .eq("status", "Approved") \
        .execute()
    if pending_response.error:
        raise HTTPException(status_code=500, detail=pending_response.error.message)

    payments = []
    for tx in tx_response.data:
        payments.append({
            "type": tx.get("type"),
            "amount": tx.get("amount"),
            "description": tx.get("description"),
            "created_at": tx.get("created_at"),
            "property": tx.get("properties"),
            "status": "Paid",
            "recurring": bool(tx.get("lease_id") or tx.get("subscription_id")),
        })

    for app in pending_response.data:
        prop = app.get("properties")
        payments.append({
            "type": "Pending Payment",
            "amount": prop["price"],
            "description": f"{prop['transaction_type']} payment pending for '{prop['title']}'",
            "created_at": app["created_at"],
            "property": prop,
            "status": "Pending",
            "recurring": prop["transaction_type"] in ["Lease", "PG"]
        })

    return payments

# 2. GET /payments/{id}
@router.get("/{payment_id}", response_model=Dict)
def get_payment_detail(payment_id: UUID, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    response = (
        supabase.table("account_transactions")
        .select("*, properties(title, transaction_type), leases(start_date, end_date), subscriptions(start_date, end_date)")
        .eq("id", str(payment_id))
        .single()
        .execute()
    )
    if response.error:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment = response.data
    if payment["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this payment")

    return {
        "id": payment["id"],
        "type": payment["type"],
        "amount": payment["amount"],
        "description": payment["description"],
        "property": payment.get("properties"),
        "lease_period": payment.get("leases") or payment.get("subscriptions"),
        "created_at": payment["created_at"]
    }

# 3. POST /payments/pay/{application_id}
@router.post("/pay/{application_id}")
def pay_for_property(application_id: UUID, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    app_res = supabase.table("applications").select("*").eq("id", str(application_id)).single().execute()
    if app_res.error or not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    app = app_res.data

    if app["status"] != "Approved":
        raise HTTPException(status_code=400, detail="Only approved applications can be paid for")

    prop_res = supabase.table("properties").select("*").eq("id", app["property_id"]).single().execute()
    if prop_res.error or not prop_res.data:
        raise HTTPException(status_code=404, detail="Property not found")
    prop = prop_res.data
    amount = float(app["bid_amount"] or prop["price"])

    buyer_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute()
    if buyer_acc.error:
        raise HTTPException(status_code=400, detail="Seeker account not found")
    if float(buyer_acc.data["balance"]) < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    seller_acc = supabase.table("accounts").select("*").eq("user_id", prop["owner_id"]).single().execute()
    if seller_acc.error:
        raise HTTPException(status_code=400, detail="Provider account not found")

    # Transfer funds
    supabase.table("accounts").update({
        "balance": float(buyer_acc.data["balance"]) - amount
    }).eq("id", buyer_acc.data["id"]).execute()
    supabase.table("accounts").update({
        "balance": float(seller_acc.data["balance"]) + amount
    }).eq("id", seller_acc.data["id"]).execute()

    transaction_type = prop["transaction_type"]
    now = datetime.now()
    if transaction_type == "Sale":
        supabase.table("sales").insert({
            "id": str(uuid4()),
            "property_id": prop["id"],
            "buyer_id": user_id,
            "seller_id": prop["owner_id"],
            "sale_price": amount,
            "application_id": str(application_id),
            "status": "Sold"
        }).execute()
        supabase.table("properties").update({"status": "Sold"}).eq("id", prop["id"]).execute()

    elif transaction_type == "Lease":
        supabase.table("leases").insert({
            "id": str(uuid4()),
            "property_id": prop["id"],
            "tenant_id": user_id,
            "owner_id": prop["owner_id"],
            "start_date": app["lease_start"],
            "end_date": app["lease_end"],
            "rent": amount,
            "last_paid_month": now.date(),
            "payment_due_date": (now + timedelta(days=30)).date(),
            "payment_status": "Paid",
            "application_id": str(application_id),
            "status": "Booked"
        }).execute()
        supabase.table("properties").update({"status": "Booked"}).eq("id", prop["id"]).execute()

    elif transaction_type == "PG":
        supabase.table("subscriptions").insert({
            "id": str(uuid4()),
            "property_id": prop["id"],
            "user_id": user_id,
            "start_date": app["subscription_start"],
            "end_date": app["subscription_end"],
            "rent": amount,
            "last_paid_period": now.date(),
            "payment_due_date": (now + timedelta(days=30)).date(),
            "payment_status": "Paid",
            "application_id": str(application_id),
            "status": "Booked"
        }).execute()
        supabase.table("properties").update({"status": "Booked"}).eq("id", prop["id"]).execute()

    supabase.table("account_transactions").insert({
        "account_id": buyer_acc.data["id"],
        "type": "Payment",
        "amount": amount,
        "description": f"{transaction_type} payment for {prop['title']}",
        "property_id": prop["id"],
        "user_id": user_id
    }).execute()

    supabase.table("applications").update({"status": "Completed"}).eq("id", application_id).execute()
    return {"detail": f"{transaction_type} payment successful"}

# 4. POST /payments/recurring
@router.post("/recurring")
def pay_recurring(
    lease_id: Optional[UUID] = None,
    subscription_id: Optional[UUID] = None,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    user_id = current_user["id"]
    now = date.today()

    if lease_id:
        lease = supabase.table("leases").select("*").eq("id", str(lease_id)).single().execute().data
        if lease["tenant_id"] != user_id:
            raise HTTPException(status_code=403, detail="Lease not owned by user")

        tenant_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
        owner_acc = supabase.table("accounts").select("*").eq("user_id", lease["owner_id"]).single().execute().data

        if float(tenant_acc["balance"]) < lease["rent"]:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        # Transfer funds
        supabase.table("accounts").update({"balance": float(tenant_acc["balance"]) - lease["rent"]}).eq("id", tenant_acc["id"]).execute()
        supabase.table("accounts").update({"balance": float(owner_acc["balance"]) + lease["rent"]}).eq("id", owner_acc["id"]).execute()

        # Update lease
        supabase.table("leases").update({
            "last_paid_month": now,
            "payment_due_date": (now + timedelta(days=30)),
            "payment_status": "Paid",
            "late_fee": 0.00
        }).eq("id", str(lease_id)).execute()

        # Transaction
        supabase.table("account_transactions").insert({
            "account_id": tenant_acc["id"],
            "type": "Payment",
            "amount": lease["rent"],
            "description": "Monthly lease payment",
            "property_id": lease["property_id"],
            "user_id": user_id,
            "lease_id": lease_id
        }).execute()

        return {"detail": "Lease payment successful"}

    elif subscription_id:
        sub = supabase.table("subscriptions").select("*").eq("id", str(subscription_id)).single().execute().data
        if sub["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Subscription not owned by user")

        seeker_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
        provider_acc = supabase.table("accounts").select("*").eq("user_id", sub["property_id"]).single().execute().data

        if float(seeker_acc["balance"]) < sub["rent"]:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        # Transfer funds
        supabase.table("accounts").update({"balance": float(seeker_acc["balance"]) - sub["rent"]}).eq("id", seeker_acc["id"]).execute()
        supabase.table("accounts").update({"balance": float(provider_acc["balance"]) + sub["rent"]}).eq("id", provider_acc["id"]).execute()

        supabase.table("subscriptions").update({
            "last_paid_period": now,
            "payment_due_date": (now + timedelta(days=30)),
            "payment_status": "Paid",
            "late_fee": 0.00
        }).eq("id", str(subscription_id)).execute()

        supabase.table("account_transactions").insert({
            "account_id": seeker_acc["id"],
            "type": "Payment",
            "amount": sub["rent"],
            "description": "Monthly PG payment",
            "property_id": sub["property_id"],
            "user_id": user_id,
            "subscription_id": subscription_id
        }).execute()

        return {"detail": "PG subscription payment successful"}

    raise HTTPException(status_code=400, detail="lease_id or subscription_id required")
