from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import timedelta
from app.core.auth import create_access_token

router = APIRouter()

# Admin credentials (hardcoded for demo)
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "admin@123"

class AdminLoginInput(BaseModel):
    email: str
    password: str

@router.post("/login")
def admin_login(data: AdminLoginInput):
    if data.email != ADMIN_EMAIL or data.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )

    access_token = create_access_token(
        data={"sub": data.email, "role": "admin"},
        expires_delta=timedelta(hours=2)
    )

    return {"access_token": access_token, "token_type": "bearer", "role": "admin"}
