from fastapi import APIRouter, Depends
from app.db.supabase import get_supabase_client
from supabase import Client
from typing import Dict, Any
from sklearn.ensemble import IsolationForest
import numpy as np

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/analytics")
def get_platform_analytics(supabase: Client = Depends(get_supabase_client)) -> Dict[str, Any]:
    # Fetch base analytics
    properties = supabase.table("properties").select("*").execute().data
    users = supabase.table("users").select("id").execute().data
    sales = supabase.table("sales").select("*").execute().data
    leases = supabase.table("leases").select("*").execute().data
    subscriptions = supabase.table("subscriptions").select("*").execute().data
    reviews = supabase.table("reviews").select("rating").execute().data

    # Revenue data from transactions
    transactions = supabase.table("account_transactions").select("type, amount").execute().data
    revenue_by_type = {}
    for tx in transactions:
        revenue_by_type[tx["type"]] = revenue_by_type.get(tx["type"], 0) + tx["amount"]

    # ML: Anomaly Detection on Revenue
    anomalies = []
    if revenue_by_type:
        types = list(revenue_by_type.keys())
        values = np.array(list(revenue_by_type.values())).reshape(-1, 1)

        model = IsolationForest(n_estimators=50, contamination=0.2, random_state=42)
        model.fit(values)
        preds = model.predict(values)

        mean, std = np.mean(values), np.std(values)
        z_scores = ((values - mean) / std).flatten()

        for i, pred in enumerate(preds):
            if pred == -1:
                anomalies.append({
                    "type": types[i],
                    "revenue": int(values[i][0]),
                    "z_score": round(float(z_scores[i]), 2)
                })

    return {
        "total_properties": len(properties),
        "total_users": len(users),
        "total_sales": len(sales),
        "total_leases": len(leases),
        "total_subscriptions": len(subscriptions),
        "avg_rating": round(np.mean([r["rating"] for r in reviews]) if reviews else 0, 2),
        "revenue_by_type": [{"type": k, "revenue": v} for k, v in revenue_by_type.items()],
        "anomalies": anomalies
    }
