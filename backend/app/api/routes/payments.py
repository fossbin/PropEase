from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID, uuid4
from typing import List, Dict, Optional
from datetime import datetime, date, timedelta
from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("/", response_model=List[Dict])
def get_payments(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    account = supabase.table("accounts").select("id").eq("user_id", user_id).single().execute().data
    if not account:
        raise HTTPException(status_code=400, detail="Account not found")

    account_id = account["id"]
    payments = []

    # Paid transactions
    txs = supabase.table("account_transactions").select(
        "*, properties(id, title, transaction_type), leases(id), subscriptions(id)"
    ).eq("account_id", account_id).eq("type", "Payment").order("created_at", desc=True).execute().data or []

    for tx in txs:
        prop = tx.get("properties")
        payments.append({
            "type": prop.get("transaction_type") if prop else "Unknown",
            "amount": tx["amount"],
            "description": tx["description"],
            "created_at": tx["created_at"],
            "property": prop,
            "status": "Paid",
            "recurring": bool(tx.get("lease_id") or tx.get("subscription_id")),
            "lease_id": tx.get("lease_id"),
            "subscription_id": tx.get("subscription_id")
        })

    # Pending payments: sales
    sales = supabase.table("sales").select(
        "id, sale_price, created_at, properties(id, title, transaction_type)"
    ).eq("buyer_id", user_id).eq("status", "Pending Payment").execute().data or []

    for sale in sales:
        prop = sale["properties"]
        payments.append({
            "type": "Sale",
            "amount": sale["sale_price"],
            "description": f"Sale payment pending for '{prop['title']}'" if prop else "Sale payment pending",
            "created_at": sale["created_at"],
            "property": prop,
            "status": "Pending Payment",
            "sale_id": sale["id"],
            "recurring": False
        })

    # Pending leases
    leases = supabase.table("leases").select(
        "id, rent, created_at, properties(id, title, transaction_type)"
    ).eq("tenant_id", user_id).eq("status", "Pending Payment").execute().data or []

    for lease in leases:
        prop = lease["properties"]
        payments.append({
            "type": "Lease",
            "amount": lease["rent"],
            "description": f"Lease payment pending for '{prop['title']}'" if prop else "Lease payment pending",
            "created_at": lease["created_at"],
            "property": prop,
            "status": "Pending Payment",
            "lease_id": lease["id"],
            "recurring": True
        })

    # Pending subscriptions
    subs = supabase.table("subscriptions").select(
        "id, rent, created_at, properties(id, title, transaction_type)"
    ).eq("user_id", user_id).eq("status", "Pending Payment").execute().data or []

    for sub in subs:
        prop = sub["properties"]
        payments.append({
            "type": "PG",
            "amount": sub["rent"],
            "description": f"PG payment pending for '{prop['title']}'" if prop else "PG payment pending",
            "created_at": sub["created_at"],
            "property": prop,
            "status": "Pending Payment",
            "subscription_id": sub["id"],
            "recurring": True
        })

    return payments


@router.get("/{payment_id}", response_model=Dict)
def get_payment_detail(payment_id: UUID, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    result = supabase.table("account_transactions").select(
        "*, properties(title, transaction_type), leases(start_date, end_date), subscriptions(start_date, end_date)"
    ).eq("id", str(payment_id)).single().execute()

    if result.error or not result.data:
        raise HTTPException(status_code=404, detail="Payment not found")

    payment = result.data
    if payment["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "id": payment["id"],
        "type": payment["type"],
        "amount": payment["amount"],
        "description": payment["description"],
        "property": payment.get("properties"),
        "lease_period": payment.get("leases") or payment.get("subscriptions"),
        "created_at": payment["created_at"]
    }


@router.post("/pay/sale/{sale_id}")
def pay_for_sale(sale_id: UUID, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    sale = supabase.table("sales").select("*", "properties(*)").eq("id", str(sale_id)).single().execute().data
    if not sale or sale["status"] != "Pending Payment":
        raise HTTPException(status_code=400, detail="Sale not found or already paid")

    amount = sale["sale_price"]
    prop = sale["properties"]

    buyer_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
    if float(buyer_acc["balance"]) < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    seller_acc = supabase.table("accounts").select("*").eq("user_id", prop["owner_id"]).single().execute().data

    # Transfer funds
    supabase.table("accounts").update({"balance": float(buyer_acc["balance"]) - amount}).eq("id", buyer_acc["id"]).execute()
    supabase.table("accounts").update({"balance": float(seller_acc["balance"]) + amount}).eq("id", seller_acc["id"]).execute()

    # Update sale and property
    supabase.table("sales").update({"status": "Sold"}).eq("id", str(sale_id)).execute()
    supabase.table("properties").update({"status": "Sold"}).eq("id", prop["id"]).execute()

    supabase.table("account_transactions").insert({
        "account_id": buyer_acc["id"], "type": "Payment", "amount": amount,
        "description": f"Sale payment for {prop['title']}", "property_id": prop["id"], "user_id": user_id
    }).execute()

    return {"detail": "Sale payment successful"}


@router.post("/pay/lease/{lease_id}")
def pay_for_lease(lease_id: UUID, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    lease = supabase.table("leases").select("*", "properties(*)").eq("id", str(lease_id)).single().execute().data
    if not lease or lease["status"] != "Pending Payment":
        raise HTTPException(status_code=400, detail="Lease not found or already paid")

    amount = lease["rent"]
    prop = lease["properties"]

    tenant_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
    owner_acc = supabase.table("accounts").select("*").eq("user_id", prop["owner_id"]).single().execute().data

    if float(tenant_acc["balance"]) < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Transfer funds
    supabase.table("accounts").update({"balance": float(tenant_acc["balance"]) - amount}).eq("id", tenant_acc["id"]).execute()
    supabase.table("accounts").update({"balance": float(owner_acc["balance"]) + amount}).eq("id", owner_acc["id"]).execute()

    now = datetime.now()
    supabase.table("leases").update({
        "status": "Booked", "payment_status": "Paid",
        "last_paid_month": now.date(), "payment_due_date": (now + timedelta(days=30)).date()
    }).eq("id", str(lease_id)).execute()

    supabase.table("properties").update({"status": "Booked"}).eq("id", prop["id"]).execute()

    supabase.table("account_transactions").insert({
        "account_id": tenant_acc["id"], "type": "Payment", "amount": amount,
        "description": f"Lease payment for {prop['title']}", "property_id": prop["id"], "user_id": user_id, "lease_id": lease_id
    }).execute()

    return {"detail": "Lease payment successful"}


@router.post("/pay/subscription/{subscription_id}")
def pay_for_subscription(subscription_id: UUID, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    sub = supabase.table("subscriptions").select("*", "properties(*)").eq("id", str(subscription_id)).single().execute().data
    if not sub or sub["status"] != "Pending Payment":
        raise HTTPException(status_code=400, detail="Subscription not found or already paid")

    amount = sub["rent"]
    prop = sub["properties"]

    seeker_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
    provider_acc = supabase.table("accounts").select("*").eq("user_id", prop["owner_id"]).single().execute().data

    if float(seeker_acc["balance"]) < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Transfer funds
    supabase.table("accounts").update({"balance": float(seeker_acc["balance"]) - amount}).eq("id", seeker_acc["id"]).execute()
    supabase.table("accounts").update({"balance": float(provider_acc["balance"]) + amount}).eq("id", provider_acc["id"]).execute()

    now = datetime.now()
    supabase.table("subscriptions").update({
        "status": "Booked", "payment_status": "Paid",
        "last_paid_period": now.date(), "payment_due_date": (now + timedelta(days=30)).date()
    }).eq("id", str(subscription_id)).execute()

    supabase.table("properties").update({"status": "Booked"}).eq("id", prop["id"]).execute()

    supabase.table("account_transactions").insert({
        "account_id": seeker_acc["id"], "type": "Payment", "amount": amount,
        "description": f"Subscription payment for {prop['title']}", "property_id": prop["id"], "user_id": user_id, "subscription_id": subscription_id
    }).execute()

    return {"detail": "Subscription payment successful"}


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
            raise HTTPException(status_code=403, detail="Unauthorized")

        tenant_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
        owner_acc = supabase.table("accounts").select("*").eq("user_id", lease["owner_id"]).single().execute().data

        if float(tenant_acc["balance"]) < lease["rent"]:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        supabase.table("accounts").update({"balance": float(tenant_acc["balance"]) - lease["rent"]}).eq("id", tenant_acc["id"]).execute()
        supabase.table("accounts").update({"balance": float(owner_acc["balance"]) + lease["rent"]}).eq("id", owner_acc["id"]).execute()

        supabase.table("leases").update({
            "last_paid_month": now,
            "payment_due_date": (now + timedelta(days=30)),
            "payment_status": "Paid",
            "late_fee": 0.00
        }).eq("id", str(lease_id)).execute()

        supabase.table("account_transactions").insert({
            "account_id": tenant_acc["id"], "type": "Payment", "amount": lease["rent"],
            "description": "Monthly lease payment", "property_id": lease["property_id"],
            "user_id": user_id, "lease_id": lease_id
        }).execute()

        return {"detail": "Lease payment successful"}

    elif subscription_id:
        sub = supabase.table("subscriptions").select("*").eq("id", str(subscription_id)).single().execute().data
        if sub["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        seeker_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
        owner_id = supabase.table("properties").select("owner_id").eq("id", sub["property_id"]).single().execute().data["owner_id"]
        provider_acc = supabase.table("accounts").select("*").eq("user_id", owner_id).single().execute().data

        if float(seeker_acc["balance"]) < sub["rent"]:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        supabase.table("accounts").update({"balance": float(seeker_acc["balance"]) - sub["rent"]}).eq("id", seeker_acc["id"]).execute()
        supabase.table("accounts").update({"balance": float(provider_acc["balance"]) + sub["rent"]}).eq("id", provider_acc["id"]).execute()

        supabase.table("subscriptions").update({
            "last_paid_period": now,
            "payment_due_date": (now + timedelta(days=30)),
            "payment_status": "Paid",
            "late_fee": 0.00
        }).eq("id", str(subscription_id)).execute()

        supabase.table("account_transactions").insert({
            "account_id": seeker_acc["id"], "type": "Payment", "amount": sub["rent"],
            "description": "Monthly PG payment", "property_id": sub["property_id"],
            "user_id": user_id, "subscription_id": subscription_id
        }).execute()

        return {"detail": "PG subscription payment successful"}

    raise HTTPException(status_code=400, detail="lease_id or subscription_id required")
