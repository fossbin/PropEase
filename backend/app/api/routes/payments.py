from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID, uuid4
from typing import List, Dict, Optional
from datetime import datetime, date, timedelta
from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/payments", tags=["Payments"])

def update_property_status_after_payment(supabase, property_id: str, transaction_type: str):
    """Helper function to update property status after successful payment"""
    try:
        if transaction_type == "Sale":
            # Sale is complete, property is fully booked/sold
            new_status = "Sold"
        elif transaction_type == "Lease":
            # Lease is active, property is fully booked
            new_status = "Booked"
        elif transaction_type == "PG":
            # Check current occupancy for PG
            property_res = supabase.table("properties") \
                .select("max_occupancy") \
                .eq("id", property_id) \
                .single().execute()
            
            if not property_res.data:
                return False
            
            max_occupancy = property_res.data["max_occupancy"]
            
            # Count current active subscriptions
            active_subs = supabase.table("subscriptions") \
                .select("id", count="exact") \
                .eq("property_id", property_id) \
                .eq("is_active", True) \
                .execute()
            
            current_occupancy = active_subs.count if active_subs.count is not None else 0
            
            if current_occupancy >= max_occupancy:
                new_status = "Booked"
            else:
                new_status = "Partially Booked"
        else:
            return False
        
        # Update property status
        prop_update_res = supabase.table("properties") \
            .update({"status": new_status}) \
            .eq("id", property_id) \
            .execute()
        
        if prop_update_res.data:
            print(f"Property {property_id} status updated to: {new_status}")
            return True
        else:
            print(f"Failed to update property {property_id} status")
            return False
            
    except Exception as e:
        print(f"Error updating property status after payment: {str(e)}")
        return False

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
        "id, sale_price, created_at, properties(id, title, transaction_type, status)"
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
        "id, rent, created_at, properties(id, title, transaction_type, status)"
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
        "id, rent, created_at, properties(id, title, transaction_type, status, max_occupancy)"
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

    # Sort payments by creation date (most recent first)
    payments.sort(key=lambda x: x["created_at"], reverse=True)
    
    return payments


@router.get("/{payment_id}", response_model=Dict)
def get_payment_detail(payment_id: UUID, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    result = supabase.table("account_transactions").select(
        "*, properties(title, transaction_type, status), leases(start_date, end_date), subscriptions(start_date, end_date)"
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
    
    if sale["buyer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this sale")

    amount = float(sale["sale_price"])
    prop = sale["properties"]

    buyer_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
    if not buyer_acc:
        raise HTTPException(status_code=400, detail="Buyer account not found")
    
    if float(buyer_acc["balance"]) < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    seller_acc = supabase.table("accounts").select("*").eq("user_id", prop["owner_id"]).single().execute().data
    if not seller_acc:
        raise HTTPException(status_code=400, detail="Seller account not found")

    try:
        # Transfer funds
        new_buyer_balance = float(buyer_acc["balance"]) - amount
        new_seller_balance = float(seller_acc["balance"]) + amount
        
        supabase.table("accounts").update({"balance": new_buyer_balance}).eq("id", buyer_acc["id"]).execute()
        supabase.table("accounts").update({"balance": new_seller_balance}).eq("id", seller_acc["id"]).execute()

        # Update sale status
        supabase.table("sales").update({"status": "Completed"}).eq("id", str(sale_id)).execute()
        
        # Update property status to "Sold"
        update_property_status_after_payment(supabase, prop["id"], "Sale")

        # Record transaction
        supabase.table("account_transactions").insert({
            "account_id": buyer_acc["id"], 
            "type": "Payment", 
            "amount": amount,
            "description": f"Sale payment for {prop['title']}", 
            "property_id": prop["id"], 
            "user_id": user_id
        }).execute()

        return {
            "detail": "Sale payment successful",
            "transaction_id": str(uuid4()),
            "amount": amount,
            "new_balance": new_buyer_balance
        }
        
    except Exception as e:
        print(f"Error processing sale payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment processing failed")


@router.post("/pay/lease/{lease_id}")
def pay_for_lease(lease_id: UUID, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    lease = supabase.table("leases").select("*", "properties(*)").eq("id", str(lease_id)).single().execute().data
    if not lease or lease["status"] != "Pending Payment":
        raise HTTPException(status_code=400, detail="Lease not found or already paid")
    
    if lease["tenant_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this lease")

    amount = float(lease["rent"])
    prop = lease["properties"]

    tenant_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
    if not tenant_acc:
        raise HTTPException(status_code=400, detail="Tenant account not found")
        
    owner_acc = supabase.table("accounts").select("*").eq("user_id", prop["owner_id"]).single().execute().data
    if not owner_acc:
        raise HTTPException(status_code=400, detail="Owner account not found")

    if float(tenant_acc["balance"]) < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    try:
        # Transfer funds
        new_tenant_balance = float(tenant_acc["balance"]) - amount
        new_owner_balance = float(owner_acc["balance"]) + amount
        
        supabase.table("accounts").update({"balance": new_tenant_balance}).eq("id", tenant_acc["id"]).execute()
        supabase.table("accounts").update({"balance": new_owner_balance}).eq("id", owner_acc["id"]).execute()

        # Update lease status
        now = datetime.now().date()
        supabase.table("leases").update({
            "status": "Active",
            "payment_status": "Paid",
            "last_paid_month": now.isoformat(),
            "payment_due_date": (now + timedelta(days=30)).isoformat()
        }).eq("id", str(lease_id)).execute()

        # Update property status to "Fully Booked"
        update_property_status_after_payment(supabase, prop["id"], "Lease")

        # Record transaction
        supabase.table("account_transactions").insert({
            "account_id": tenant_acc["id"],
            "type": "Payment",
            "amount": amount,
            "description": f"Lease payment for {prop['title']}",
            "property_id": str(prop["id"]),
            "user_id": str(user_id),
            "lease_id": str(lease_id)
        }).execute()

        return {
            "detail": "Lease payment successful",
            "transaction_id": str(uuid4()),
            "amount": amount,
            "new_balance": new_tenant_balance
        }
        
    except Exception as e:
        print(f"Error processing lease payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment processing failed")


@router.post("/pay/subscription/{subscription_id}")
def pay_for_subscription(subscription_id: UUID, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    user_id = current_user["id"]

    sub = supabase.table("subscriptions").select("*", "properties(*)").eq("id", str(subscription_id)).single().execute().data
    if not sub or sub["status"] != "Pending Payment":
        raise HTTPException(status_code=400, detail="Subscription not found or already paid")
    
    if sub["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this subscription")

    amount = float(sub["rent"])
    prop = sub["properties"]

    seeker_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
    if not seeker_acc:
        raise HTTPException(status_code=400, detail="User account not found")
        
    provider_acc = supabase.table("accounts").select("*").eq("user_id", prop["owner_id"]).single().execute().data
    if not provider_acc:
        raise HTTPException(status_code=400, detail="Property owner account not found")

    if float(seeker_acc["balance"]) < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    try:
        # Transfer funds
        new_seeker_balance = float(seeker_acc["balance"]) - amount
        new_provider_balance = float(provider_acc["balance"]) + amount
        
        supabase.table("accounts").update({"balance": new_seeker_balance}).eq("id", seeker_acc["id"]).execute()
        supabase.table("accounts").update({"balance": new_provider_balance}).eq("id", provider_acc["id"]).execute()

        # Update subscription status
        now = datetime.now().date()
        supabase.table("subscriptions").update({
            "status": "Active",
            "payment_status": "Paid",
            "last_paid_period": now.isoformat(),
            "payment_due_date": (now + timedelta(days=30)).isoformat(),
            "is_active": True
        }).eq("id", str(subscription_id)).execute()

        # Update property status based on occupancy
        update_property_status_after_payment(supabase, prop["id"], "PG")

        # Record transaction
        supabase.table("account_transactions").insert({
            "account_id": seeker_acc["id"],
            "type": "Payment",
            "amount": amount,
            "description": f"PG subscription payment for {prop['title']}", 
            "property_id": prop["id"], 
            "user_id": str(user_id), 
            "subscription_id": str(subscription_id)
        }).execute()

        return {
            "detail": "Subscription payment successful",
            "transaction_id": str(uuid4()),
            "amount": amount,
            "new_balance": new_seeker_balance
        }
        
    except Exception as e:
        print(f"Error processing subscription payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment processing failed")


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
        lease = supabase.table("leases").select("*, properties(*)").eq("id", str(lease_id)).single().execute().data
        if not lease:
            raise HTTPException(status_code=404, detail="Lease not found")
            
        if lease["tenant_id"] != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        amount = float(lease["rent"])
        prop = lease["properties"]

        tenant_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
        owner_acc = supabase.table("accounts").select("*").eq("user_id", lease["owner_id"]).single().execute().data

        if float(tenant_acc["balance"]) < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        try:
            # Transfer funds
            new_tenant_balance = float(tenant_acc["balance"]) - amount
            new_owner_balance = float(owner_acc["balance"]) + amount
            
            supabase.table("accounts").update({"balance": new_tenant_balance}).eq("id", tenant_acc["id"]).execute()
            supabase.table("accounts").update({"balance": new_owner_balance}).eq("id", owner_acc["id"]).execute()

            # Update lease payment info
            supabase.table("leases").update({
                "last_paid_month": now.isoformat(),
                "payment_due_date": (now + timedelta(days=30)).isoformat(),
                "payment_status": "Paid",
                "late_fee": "0.00"
            }).eq("id", str(lease_id)).execute()

            # Record transaction
            supabase.table("account_transactions").insert({
                "account_id": tenant_acc["id"],
                "type": "Payment",
                "amount": amount,
                "description": f"Monthly lease payment for {prop['title']}",
                "property_id": str(prop["id"]),
                "user_id": str(user_id),
                "lease_id": str(lease_id)
            }).execute()

            return {
                "detail": "Lease payment successful",
                "amount": amount,
                "new_balance": new_tenant_balance,
                "next_due_date": (now + timedelta(days=30)).isoformat()
            }
            
        except Exception as e:
            print(f"Error processing recurring lease payment: {str(e)}")
            raise HTTPException(status_code=500, detail="Payment processing failed")

    elif subscription_id:
        sub = supabase.table("subscriptions").select("*, properties(*)").eq("id", str(subscription_id)).single().execute().data
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription not found")
            
        if sub["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")

        amount = float(sub["rent"])
        prop = sub["properties"]

        seeker_acc = supabase.table("accounts").select("*").eq("user_id", user_id).single().execute().data
        provider_acc = supabase.table("accounts").select("*").eq("user_id", prop["owner_id"]).single().execute().data

        if float(seeker_acc["balance"]) < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")

        try:
            # Transfer funds
            new_seeker_balance = float(seeker_acc["balance"]) - amount
            new_provider_balance = float(provider_acc["balance"]) + amount
            
            supabase.table("accounts").update({"balance": new_seeker_balance}).eq("id", seeker_acc["id"]).execute()
            supabase.table("accounts").update({"balance": new_provider_balance}).eq("id", provider_acc["id"]).execute()

            # Update subscription payment info
            supabase.table("subscriptions").update({
                "last_paid_period": now.isoformat(),
                "payment_due_date": (now + timedelta(days=30)).isoformat(),
                "payment_status": "Paid",
                "late_fee": "0.00"
            }).eq("id", str(subscription_id)).execute()

            # Record transaction
            supabase.table("account_transactions").insert({
                "account_id": seeker_acc["id"], 
                "type": "Payment", 
                "amount": amount,
                "description": f"Monthly PG payment for {prop['title']}", 
                "property_id": sub["property_id"],
                "user_id": str(user_id), 
                "subscription_id": str(subscription_id)
            }).execute()

            return {
                "detail": "PG subscription payment successful",
                "amount": amount,
                "new_balance": new_seeker_balance,
                "next_due_date": (now + timedelta(days=30)).isoformat()
            }
            
        except Exception as e:
            print(f"Error processing recurring subscription payment: {str(e)}")
            raise HTTPException(status_code=500, detail="Payment processing failed")

    raise HTTPException(status_code=400, detail="lease_id or subscription_id required")


@router.get("/due")
def get_due_payments(current_user: dict = Depends(get_current_user)):
    """Get all due payments for the current user"""
    supabase = get_supabase()
    user_id = current_user["id"]
    today = date.today()

    due_payments = []

    # Check for overdue leases
    overdue_leases = supabase.table("leases") \
        .select("*, properties(title, transaction_type)") \
        .eq("tenant_id", user_id) \
        .eq("status", "Active") \
        .lte("payment_due_date", today.isoformat()) \
        .execute().data or []

    for lease in overdue_leases:
        prop = lease["properties"]
        due_payments.append({
            "type": "Lease",
            "id": lease["id"],
            "amount": lease["rent"],
            "due_date": lease["payment_due_date"],
            "property_title": prop["title"] if prop else "Unknown",
            "late_fee": lease.get("late_fee", "0.00"),
            "is_overdue": True
        })

    # Check for overdue subscriptions
    overdue_subs = supabase.table("subscriptions") \
        .select("*, properties(title, transaction_type)") \
        .eq("user_id", user_id) \
        .eq("is_active", True) \
        .lte("payment_due_date", today.isoformat()) \
        .execute().data or []

    for sub in overdue_subs:
        prop = sub["properties"]
        due_payments.append({
            "type": "PG",
            "id": sub["id"],
            "amount": sub["rent"],
            "due_date": sub["payment_due_date"],
            "property_title": prop["title"] if prop else "Unknown",
            "late_fee": sub.get("late_fee", "0.00"),
            "is_overdue": True
        })

    return {
        "total_due": len(due_payments),
        "due_payments": due_payments
    }