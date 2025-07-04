from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from datetime import datetime
from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client

router = APIRouter(prefix="/seeker/purchases", tags=["Seeker Purchases"])

@router.get("/")
def get_user_purchases(user=Depends(get_current_user), supabase=Depends(get_supabase_client)):
    user_id = user["id"]
    purchases = []

    lease_resp = (
        supabase.table("leases")
        .select("*, properties(title, type)")
        .eq("tenant_id", user_id)
        .execute()
    )
    for lease in lease_resp.data or []:
        purchases.append({
            "id": lease["id"],
            "property_id": lease["property_id"],
            "title": lease["properties"]["title"],
            "type": lease["properties"]["type"],
            "rental_type": "Lease",
            "start_date": lease["start_date"],
            "end_date": lease["end_date"],
            "price": float(lease["rent"]),
            "is_active": lease["terminated_at"] is None
        })

    # Subscriptions
    sub_resp = (
        supabase.table("subscriptions")
        .select("*, properties(title, type)")
        .eq("user_id", user_id)
        .execute()
    )
    for sub in sub_resp.data or []:
        purchases.append({
            "id": sub["id"],
            "property_id": sub["property_id"],
            "title": sub["properties"]["title"],
            "type": sub["properties"]["type"],
            "rental_type": "Subscription",
            "start_date": sub["start_date"],
            "end_date": sub["end_date"],
            "price": float(sub["rent"]),
            "is_active": sub.get("is_active", True) and sub.get("terminated_at") is None
        })

    # Sales (purchased properties)
    sale_resp = (
        supabase.table("sales")
        .select("*, properties(title, type)")
        .eq("buyer_id", user_id)
        .execute()
    )
    for sale in sale_resp.data or []:
        purchases.append({
            "id": sale["id"],
            "property_id": sale["property_id"],
            "title": sale["properties"]["title"],
            "type": sale["properties"]["type"],
            "rental_type": "Sale",
            "price": float(sale["sale_price"]),
            "start_date": sale["sale_date"],
            "end_date": None,
        })

    return purchases

@router.delete("/{rental_id}")
def cancel_purchase(rental_id: UUID, user=Depends(get_current_user), supabase=Depends(get_supabase_client)):
    user_id = user["id"]

    for table, user_col in [("leases", "tenant_id"), ("subscriptions", "user_id")]:
        res = (
            supabase.table(table)
            .select("id")
            .eq("id", str(rental_id))
            .eq(user_col, user_id)
            .execute()
        )
        if res.data:
            update_data = {
                "terminated_at": datetime.utcnow().isoformat(),
                "terminated_by": "seeker"
            }
            if table == "subscriptions":
                update_data["is_active"] = False

            update = (
                supabase.table(table)
                .update(update_data)
                .eq("id", str(rental_id))
                .execute()
            )
            return {"message": f"{table[:-1].capitalize()} cancelled successfully"}

    raise HTTPException(status_code=404, detail="Rental not found or not cancelable")
