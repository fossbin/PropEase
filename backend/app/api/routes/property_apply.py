from fastapi import APIRouter, UploadFile, Form, File, HTTPException, Depends
from uuid import UUID, uuid4
from datetime import datetime
from supabase import Client
from app.db.supabase import get_supabase_client as get_supabase
from app.dependencies import get_current_user

router = APIRouter(prefix="/seeker", tags=["Seeker Apply"])

@router.post("/apply/{property_id}")
async def submit_application(
    property_id: UUID,
    message: str = Form(...),
    documents: UploadFile = File(None),
    supabase: Client = Depends(get_supabase)
):
    user_id = Depends(get_current_user)

    document_url = None
    if documents:
        contents = await documents.read()
        file_ext = documents.filename.split(".")[-1]
        file_path = f"applications/{uuid4()}.{file_ext}"

        upload_resp = supabase.storage.from_("documents").upload(file_path, contents)
        if upload_resp.get("error"):
            raise HTTPException(status_code=500, detail="Failed to upload document")

        document_url = supabase.storage.from_("documents").get_public_url(file_path)

    application_payload = {
        "id": str(uuid4()),
        "seeker_id": user_id,
        "property_id": str(property_id),
        "message": message,
        "documents": document_url,
        "status": "Pending",
        "created_at": datetime.utcnow().isoformat()
    }

    result = supabase.table("applications").insert(application_payload).execute()

    if result.error:
        raise HTTPException(status_code=400, detail="Failed to submit application")

    return {"message": "Application submitted successfully"}
