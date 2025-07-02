from pydantic import BaseModel

class UserProfileUpdate(BaseModel):
    name: str
    phone_number: str
    picture: dict | None = None  