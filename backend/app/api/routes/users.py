from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from app.db.supabase import get_supabase_client
from supabase import Client
from app.models.user import UserProfileUpdate

router = APIRouter(prefix="/user", tags=["User"])

@router.patch("/profile")
async def update_user_profile(
    request: Request,
    profile: UserProfileUpdate,
    supabase: Client = Depends(get_supabase_client)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    update_data = {
        "name": profile.name,
        "phone_number": profile.phone_number,
        "picture": profile.picture 
    }

    result = supabase.table("users").update(update_data).eq("id", user_id).execute()

    if result.data is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Profile updated successfully"}

@router.get("/profile")
async def get_user_profile(
    request: Request,
    supabase: Client = Depends(get_supabase_client)
):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    res = supabase.table("users").select("*").eq("id", user_id).single().execute()
    if res.data is None:
        raise HTTPException(status_code=404, detail="User not found")

    return res.data

@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    filename: str = Form(...),
    user_id: str = Form(...),
    supabase: Client = Depends(get_supabase_client)
):
    from datetime import datetime
    import os

    SUPABASE_URL = os.getenv("SUPABASE_URL")

    # 1. Delete existing document from Supabase Storage (if any)
    existing = supabase.table("user_documents").select("*").eq("user_id", user_id).execute()
    if existing.data:
        for doc in existing.data:
            # extract path from URL
            url_path = doc["document_url"].split("/user-documents/")[-1]
            supabase.storage.from_("user-documents").remove([url_path])

        # delete from table
        supabase.table("user_documents").delete().eq("user_id", user_id).execute()

    # 2. Upload new file
    timestamp = datetime.utcnow().isoformat().replace(":", "-")
    storage_path = f"{user_id}/{timestamp}_{filename}"

    file_content = await file.read()
    res = supabase.storage.from_("user-documents").upload(
        storage_path,
        file_content,
        {"content-type": file.content_type}
    )

    if not res:
        raise HTTPException(status_code=500, detail="Failed to upload document")

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/user-documents/{storage_path}"

    supabase.table("user_documents").insert({
        "user_id": user_id,
        "document_type": file.content_type,
        "document_url": public_url,
    }).execute()

    return {"message": "Document uploaded"}

@router.get("/{user_id}/documents")
async def get_user_documents(user_id: str, supabase: Client = Depends(get_supabase_client)):
    result = supabase.table("user_documents").select("*").eq("user_id", user_id).order("uploaded_at", desc=True).execute()
    
    if not result.data:
        return []

    return [
        {
            "id": doc["id"],
            "document_type": doc["document_type"],
            "document_url": doc["document_url"],
            "verified": doc.get("verified", False)
        }
        for doc in result.data
    ]
