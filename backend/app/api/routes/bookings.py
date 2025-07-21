from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/provider/transactions", tags=["Provider Transactions"])

def latest_date(txns):
    date_fields = ["last_paid_month", "payment_due_date", "sale_date", "created_at"]
    dates = []
    for t in txns:
        for f in date_fields:
            raw = t.get(f)
            if raw:
                try:
                    dt = None
                    if isinstance(raw, str):
                        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
                    elif isinstance(raw, datetime):
                        dt = raw
                    if dt:
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=timezone.utc)
                        dates.append(dt)
                except Exception as e:
                    logger.debug(f"Date parsing failed: {e}")
                    continue
    return max(dates, default=datetime.min.replace(tzinfo=timezone.utc))


@router.get("/")
async def get_all_transactions(request: Request, current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    user_id = current_user["id"]
    supabase = get_supabase_client()
    logger.info(f"Fetching transactions for user_id: {user_id[:8]}...")

    try:
        # Confirm DB connection
        try:
            _ = supabase.table("properties").select("id").limit(1).execute()
        except Exception as e:
            logger.error(f"Test query failed: {e}")
            raise HTTPException(status_code=500, detail="Database connection failed")

        # Fetch owned properties
        properties = []
        page_size, offset = 100, 0
        while True:
            props_resp = (
                supabase.table("properties")
                .select("id,title,type,transaction_type")
                .eq("owner_id", user_id)
                .range(offset, offset + page_size - 1)
                .execute()
            )
            batch = props_resp.data
            if not batch:
                break
            properties.extend(batch)
            if len(batch) < page_size:
                break
            offset += page_size

        if not properties:
            return []

        property_map = {p["id"]: p for p in properties}
        property_ids = list(property_map.keys())
        grouped: Dict[str, Dict[str, Any]] = {}

        def fetch_transactions_with_user(table: str, user_field: str) -> List[Dict[str, Any]]:
            results = []
            for i in range(0, len(property_ids), 20):  # Increased batch size
                batch = property_ids[i:i + 20]
                try:
                    res = (supabase.table(table)
                        .select(f"*, {user_field} (id, name, email, phone_number)")
                        .in_("property_id", batch)
                        .execute())
                    results.extend(res.data or [])
                except Exception as e:
                    logger.warning(f"Error fetching {table} batch: {e}")
            return results

        leases = fetch_transactions_with_user("leases", "tenant_id")
        subscriptions = fetch_transactions_with_user("subscriptions", "user_id")
        sales = fetch_transactions_with_user("sales", "buyer_id")

        def insert_txn(txn: dict, txn_type: str):
            pid = txn["property_id"]
            grouped.setdefault(pid, {
                "property": property_map.get(pid),
                "transactions": []
            })

            user_info = {
                "Lease": txn.get("tenant_id"),
                "PG": txn.get("user_id"),
                "Sale": txn.get("buyer_id")
            }.get(txn_type)

            txn_cleaned = {
                **txn,
                "transaction_type": txn_type,
                "user": user_info
            }
            for k in ["tenant_id", "user_id", "buyer_id"]:
                txn_cleaned.pop(k, None)

            grouped[pid]["transactions"].append(txn_cleaned)

        for l in leases: insert_txn(l, "Lease")
        for s in subscriptions: insert_txn(s, "PG")
        for s in sales: insert_txn(s, "Sale")

        sorted_grouped = sorted(
            grouped.values(),
            key=lambda g: (
                g["property"]["transaction_type"] if g["property"] else "",
                latest_date(g["transactions"])
            ),
            reverse=True
        )

        logger.info(f"Returning {len(sorted_grouped)} grouped transactions")
        return sorted_grouped

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{transaction_id}")
async def get_transaction_detail(transaction_id: UUID):
    supabase = get_supabase_client()

    lookup_tables = [
        ("leases", "tenant_id"),
        ("subscriptions", "user_id"),
        ("sales", "buyer_id")
    ]
    table_map = {
        "leases": "Lease",
        "subscriptions": "PG",
        "sales": "Sale"
    }

    for table, user_field in lookup_tables:
        try:
            res = (supabase.table(table)
                   .select(f"*, {user_field} (id, name, email, phone_number)")
                   .eq("id", str(transaction_id))
                   .execute())
            if res.data:
                txn = res.data[0]
                user = txn.get(user_field)
                txn.pop(user_field, None)
                return {
                    **txn,
                    "transaction_type": table_map[table],
                    "user": user
                }
        except Exception as e:
            logger.warning(f"Error checking {table} for transaction {transaction_id}: {e}")

    raise HTTPException(status_code=404, detail="Transaction not found")


@router.patch("/{transaction_id}/terminate")
async def terminate_transaction(transaction_id: UUID, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_client()
    user_id = current_user["id"]

    for table in ["leases", "subscriptions"]:
        try:
            res = supabase.table(table).select("*").eq("id", str(transaction_id)).execute()
            if res.data:
                txn = res.data[0]
                property_id = txn["property_id"]

                # Verify provider owns this property
                owner_check = supabase.table("properties").select("id").eq("id", property_id).eq("owner_id", user_id).execute()
                if not owner_check.data:
                    raise HTTPException(status_code=403, detail="Not authorized to terminate this transaction")

                update_data = {
                    "terminated_at": datetime.utcnow().isoformat(),
                    "terminated_by": "provider"
                }
                if table == "subscriptions":
                    update_data["is_active"] = False

                update_res = supabase.table(table).update(update_data).eq("id", str(transaction_id)).execute()

                logger.info(f"Terminated {table[:-1]} {transaction_id} by provider {user_id}")
                return {
                    "message": f"{table[:-1].capitalize()} terminated successfully",
                    "updated": update_res.data[0] if update_res.data else None
                }

        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Error terminating {table} transaction {transaction_id}: {e}")

    raise HTTPException(status_code=400, detail="Only leases and subscriptions can be terminated")
