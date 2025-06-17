from fastapi import FastAPI
from app.api.routes import properties

app = FastAPI()
app.include_router(properties.router, prefix="/api/properties")

@app.get("/")
def root():
    return {"status": "Backend running", "docs": "/docs"}