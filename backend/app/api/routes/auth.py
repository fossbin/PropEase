from fastapi import APIRouter, HTTPException
import httpx
import os
from dotenv import load_dotenv

load_dotenv()  # load from .env

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")

@router.post("/register/")
async def register_user(name: str, email: str, password: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/auth/v1/signup",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "email": email,
                "password": password,
                "data": {"name": name}
            },
        )
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=response.json())
    return response.json()
