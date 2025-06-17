from fastapi import APIRouter
from . import users

register_routes = APIRouter()

register_routes.include_router(users.router, prefix="/users", tags=["Users"])