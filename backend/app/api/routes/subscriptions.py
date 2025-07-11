from fastapi import APIRouter, HTTPException, Depends
from supabase import create_client, Client
from uuid import UUID
from datetime import date
from pydantic import BaseModel, Field
import os

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class SubscriptionBase(BaseModel):
    user_id: UUID
    property_id: UUID
    start_date: date
    end_date: date
    price: float
    is_active: bool = True

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionOut(SubscriptionBase):
    id: UUID
    created_at: date

@router.post("/subscriptions/", response_model=SubscriptionOut)
def create_subscription(subscription: SubscriptionCreate):
    response = supabase.table("subscriptions").insert(subscription.dict()).execute()
    if response.status_code != 201:
        raise HTTPException(status_code=response.status_code, detail=response.data)
    return response.data[0]


@router.get("/subscriptions/{subscription_id}", response_model=SubscriptionOut)
def get_subscription(subscription_id: UUID):
    response = supabase.table("subscriptions").select("*").eq("id", str(subscription_id)).single().execute()
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Subscription not found")
    return response.data


@router.get("/subscriptions/user/{user_id}", response_model=list[SubscriptionOut])
def get_subscriptions_by_user(user_id: UUID):
    response = supabase.table("subscriptions").select("*").eq("user_id", str(user_id)).execute()
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Error retrieving subscriptions")
    return response.data


@router.put("/subscriptions/{subscription_id}", response_model=SubscriptionOut)
def update_subscription(subscription_id: UUID, subscription: SubscriptionCreate):
    response = supabase.table("subscriptions").update(subscription.dict()).eq("id", str(subscription_id)).execute()
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Update failed")
    return response.data[0]


@router.delete("/subscriptions/{subscription_id}")
def delete_subscription(subscription_id: UUID):
    response = supabase.table("subscriptions").delete().eq("id", str(subscription_id)).execute()
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Deletion failed")
    return {"message": "Subscription deleted successfully"}
