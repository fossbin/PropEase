from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID, uuid4
from typing import Optional
from datetime import date
from io import BytesIO
from reportlab.pdfgen import canvas

from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client as get_supabase

router = APIRouter(prefix="/applications", tags=["Applications"])

def generate_pdf_reportlab(data: dict, title: str) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 800, title)
    c.setFont("Helvetica", 12)

    y = 770
    for key, value in data.items():
        c.drawString(50, y, f"{key}: {value}")
        y -= 20

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()

def upload_pdf_to_supabase(supabase, bucket: str, path: str, pdf_bytes: bytes) -> str:
    supabase.storage.from_(bucket).upload(path, pdf_bytes, {
        "content-type": "application/pdf",
        "upsert": True
    })
    return f"{bucket}/{path}"

@router.patch("/{application_id}")
def update_application(application_id: UUID, payload: dict, supabase=Depends(get_supabase), user=Depends(get_current_user)):
    update_res = (
        supabase
        .table("applications")
        .update(payload)
        .eq("id", str(application_id))
        .execute()
    )
    if not update_res.data:
        raise HTTPException(status_code=404, detail="Application not found or update failed")

    updated_app = update_res.data[0]

    if payload.get("status") == "Approved":
        app = updated_app
        property_res = supabase.table("properties").select("*").eq("id", app["property_id"]).single().execute()
        property_data = property_res.data
        if not property_data:
            raise HTTPException(status_code=404, detail="Property not found")

        prop_type = property_data["type"]
        owner_id = property_data["owner_id"]
        price = app.get("bid_amount") or property_data.get("price")
        today = date.today()

        if prop_type == "Lease" and app.get("lease_start") and app.get("lease_end"):
            lease_id = str(uuid4())
            bucket = "lease-documents"
            path = f"agreements/lease_{lease_id}.pdf"
            pdf_data = {
                "Lease ID": lease_id,
                "Tenant ID": app["applicant_id"],
                "Property ID": app["property_id"],
                "Start Date": app["lease_start"],
                "End Date": app["lease_end"],
                "Rent": f"₹{price}",
                "Date Issued": str(today)
            }
            pdf = generate_pdf_reportlab(pdf_data, "Lease Agreement")
            file_path = upload_pdf_to_supabase(supabase, bucket, path, pdf)

            lease_payload = {
                "id": lease_id,
                "property_id": app["property_id"],
                "tenant_id": app["applicant_id"],
                "owner_id": owner_id,
                "start_date": app["lease_start"],
                "end_date": app["lease_end"],
                "rent": price,
                "agreement_file": file_path,
                "payment_status": "Pending",
                "payment_due_date": app["lease_start"],
                "last_paid_month": None,
                "late_fee": 0,
                "status": "Pending Payment"
            }
            supabase.table("leases").insert(lease_payload).execute()

        elif prop_type == "Sale":
            account_res = supabase.table("accounts").select("balance").eq("user_id", app["applicant_id"]).single().execute()
            if not account_res.data:
                raise HTTPException(status_code=400, detail="Applicant has no associated account")

            balance = float(account_res.data["balance"])
            if balance < float(price):
                raise HTTPException(status_code=400, detail="Insufficient balance to complete the sale")

            sale_id = str(uuid4())
            bucket = "sales-documents"
            path = f"deeds/sale_{sale_id}.pdf"
            pdf_data = {
                "Sale ID": sale_id,
                "Buyer ID": app["applicant_id"],
                "Seller ID": owner_id,
                "Property ID": app["property_id"],
                "Sale Price": f"₹{price}",
                "Date Issued": str(today)
            }
            pdf = generate_pdf_reportlab(pdf_data, "Sale Deed")
            file_path = upload_pdf_to_supabase(supabase, bucket, path, pdf)

            sale_payload = {
                "id": sale_id,
                "property_id": app["property_id"],
                "buyer_id": app["applicant_id"],
                "seller_id": owner_id,
                "sale_price": price,
                "deed_file": file_path,
                "status": "Pending Payment"
            }
            supabase.table("sales").insert(sale_payload).execute()

        elif prop_type == "PG" and app.get("subscription_start") and app.get("subscription_end"):
            sub_id = str(uuid4())
            bucket = "pg-documents"
            path = f"contracts/sub_{sub_id}.pdf"
            pdf_data = {
                "Subscription ID": sub_id,
                "User ID": app["applicant_id"],
                "Property ID": app["property_id"],
                "Start Date": app["subscription_start"],
                "End Date": app["subscription_end"],
                "Rent": f"₹{price}",
                "Date Issued": str(today)
            }
            pdf = generate_pdf_reportlab(pdf_data, "PG Subscription Agreement")
            file_path = upload_pdf_to_supabase(supabase, bucket, path, pdf)

            sub_payload = {
                "id": sub_id,
                "property_id": app["property_id"],
                "user_id": app["applicant_id"],
                "start_date": app["subscription_start"],
                "end_date": app["subscription_end"],
                "rent": price,
                "payment_status": "Pending",
                "payment_due_date": app["subscription_start"],
                "last_paid_period": None,
                "late_fee": 0,
                "is_active": True,
                "agreement_file": file_path,
                "status": "Pending Payment"
            }
            supabase.table("subscriptions").insert(sub_payload).execute()

    return updated_app
