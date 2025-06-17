from fastapi import APIRouter, Query
from app.services.property_service import search_properties

router = APIRouter()

@router.get("/search")
def search(city: str = Query(...)):
    return search_properties(city)
