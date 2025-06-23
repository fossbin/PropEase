from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
# from app.api.routes import admin_auth
from app.api.routes import (
    users,
    properties,
    leases,
    sales,
    subscriptions,
    applications,
    common_account_transactions,
    maintenance_tickets,
    admin_support_tickets,
    reviews,
    support_tickets,
)

app = FastAPI()

# CORS setup
origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# Include routers
app.include_router(users.router, prefix="/api")
app.include_router(properties.router, prefix="/api")
app.include_router(leases.router, prefix="/api/leases")
app.include_router(sales.router, prefix="/api/sales")
app.include_router(subscriptions.router, prefix="/api/subscriptions")
app.include_router(applications.router, prefix="/api")
app.include_router(common_account_transactions.router, prefix="/api")
app.include_router(maintenance_tickets.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(support_tickets.router, prefix="/api")
app.include_router(admin_support_tickets.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Welcome to the PropEase FastAPI backend."}
