from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID, uuid4
from typing import Optional
from datetime import date
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.units import inch
from reportlab.platypus import Table, TableStyle
from app.dependencies import get_current_user
from app.db.supabase import get_supabase_client as get_supabase
from decimal import Decimal
import json

router = APIRouter(prefix="/applications", tags=["Applications"])

def safe_json_serialize(obj):
    """Convert problematic types to JSON-serializable formats"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, UUID):
        return str(obj)
    elif hasattr(obj, 'isoformat'):  # datetime objects
        return obj.isoformat()
    return obj

@router.get("/received")
def fetch_received_applications(user=Depends(get_current_user), supabase=Depends(get_supabase)):
    provider_id = user["id"]
    prop_res = supabase.table("properties").select("id, title, type, status, price").eq("owner_id", str(provider_id)).execute()
    properties = prop_res.data or []

    if not properties:
        return []

    property_map = {p["id"]: p for p in properties}
    property_ids = list(property_map.keys())

    apps_res = (
        supabase
        .table("applications")
        .select("*")
        .in_("property_id", property_ids)
        .order("created_at", desc=True)
        .execute()
    )
    applications = apps_res.data or []

    for app in applications:
        prop_info = property_map.get(app["property_id"], {})
        app["property_title"] = prop_info.get("title", "Unknown")
        app["property_type"] = prop_info.get("type", "Unknown")
        app["property_status"] = prop_info.get("status", "Unknown")
        app["property_price"] = prop_info.get("price", None)

    return applications


@router.get("/{application_id}")
def get_application_detail(application_id: UUID, supabase=Depends(get_supabase)):
    try:
        # Method 1: Try with explicit column selection to avoid problematic fields
        app_res = supabase.table("applications").select(
            "id, property_id, applicant_id, status, message, bid_amount, "
            "lease_start, lease_end, subscription_start, subscription_end, "
            "created_at"
        ).eq("id", str(application_id)).execute()
        
        # Check if we got results
        if not app_res.data or len(app_res.data) == 0:
            raise HTTPException(status_code=404, detail="Application not found")
        
        app_data = app_res.data[0]
        
        # Clean up the data - convert problematic types
        for key, value in app_data.items():
            app_data[key] = safe_json_serialize(value)
        
        applicant_id = app_data["applicant_id"]

        # Fetch user profile
        user_res = supabase.table("users").select("name, email, phone_number").eq("id", applicant_id).execute()
        user_data = user_res.data[0] if user_res.data else {}

        # Inject applicant name into application for frontend
        app_data["applicant_name"] = user_data.get("name", "Unknown")

        # Fetch user documents
        docs_res = supabase.table("user_documents").select("id, document_url, document_type, verified").eq("user_id", applicant_id).execute()
        user_documents = docs_res.data or []

        # Fetch property details
        prop_res = supabase.table("properties").select("title, type, status, price, is_negotiable, transaction_type").eq("id", app_data["property_id"]).execute()
        property_data = prop_res.data[0] if prop_res.data else {}

        return {
            "application": app_data,
            "user_profile": user_data,
            "user_documents": user_documents,
            "property_details": property_data
        }

    except Exception as e:
        print(f"Error fetching application details: {str(e)}")
        # If the above fails, try a more conservative approach
        try:
            # Alternative approach: Use limit(1) instead of single()
            app_res = supabase.table("applications").select("*").eq("id", str(application_id)).limit(1).execute()
            
            if not app_res.data:
                raise HTTPException(status_code=404, detail="Application not found")
            
            app_data = app_res.data[0]
            
            # Manually clean problematic fields
            if 'bid_amount' in app_data and app_data['bid_amount'] is not None:
                app_data['bid_amount'] = float(app_data['bid_amount'])
            
            if 'created_at' in app_data and app_data['created_at'] is not None:
                # Handle datetime string parsing if needed
                app_data['created_at'] = str(app_data['created_at'])
            
            applicant_id = app_data["applicant_id"]

            # Fetch user profile
            user_res = supabase.table("users").select("name, email, phone_number").eq("id", applicant_id).limit(1).execute()
            user_data = user_res.data[0] if user_res.data else {}

            # Inject applicant name into application for frontend
            app_data["applicant_name"] = user_data.get("name", "Unknown")

            # Fetch user documents
            docs_res = supabase.table("user_documents").select("id, document_url, document_type, verified").eq("user_id", applicant_id).execute()
            user_documents = docs_res.data or []

            # Fetch property details
            prop_res = supabase.table("properties").select("title, type, status, price, is_negotiable, transaction_type").eq("id", app_data["property_id"]).limit(1).execute()
            property_data = prop_res.data[0] if prop_res.data else {}

            return {
                "application": app_data,
                "user_profile": user_data,
                "user_documents": user_documents,
                "property_details": property_data
            }
            
        except Exception as e2:
            print(f"Alternative approach also failed: {str(e2)}")
            raise HTTPException(status_code=500, detail=f"Error fetching application: {str(e2)}")


def generate_pdf_reportlab(data: dict, title: str) -> bytes:
    from datetime import datetime
    
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Define colors
    primary_color = HexColor('#2563eb')  # Blue
    secondary_color = HexColor('#f8fafc')  # Light gray
    text_color = HexColor('#1f2937')  # Dark gray
    
    # Header with gradient-like effect
    c.setFillColor(primary_color)
    c.rect(0, height - 120, width, 120, fill=1, stroke=0)
    
    # Company logo placeholder (circular)
    c.setFillColor(white)
    c.circle(60, height - 60, 25, fill=1, stroke=0)
    c.setFillColor(primary_color)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredText(60, height - 65, "PE")
    
    # Company name and title
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(110, height - 50, "PropEase")
    c.setFont("Helvetica", 12)
    c.drawString(110, height - 70, "Property Management Solutions")
    
    # Document title
    c.setFont("Helvetica-Bold", 20)
    c.drawString(110, height - 100, title)
    
    # Add a decorative line
    c.setStrokeColor(white)
    c.setLineWidth(2)
    c.line(50, height - 130, width - 50, height - 130)
    
    # Document info section
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 160, "Document Information")
    
    # Add current date and document ID
    current_date = datetime.now().strftime("%B %d, %Y")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 180, f"Generated on: {current_date}")
    c.drawString(50, height - 195, f"Document ID: {data.get('Lease ID', data.get('Sale ID', data.get('Subscription ID', 'N/A')))}")
    
    # Main content area with background
    content_y_start = height - 230
    c.setFillColor(secondary_color)
    c.rect(30, content_y_start - 200, width - 60, 200, fill=1, stroke=0)
    
    # Content table data
    table_data = []
    for key, value in data.items():
        if key not in ['Date Issued']:  # Skip date issued as it's already shown above
            # Format the key to be more readable
            formatted_key = key.replace("_", " ").title()
            table_data.append([formatted_key, str(value)])
    
    # Create and style the table
    if table_data:
        table = Table(table_data, colWidths=[2.5*inch, 3.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), white),
            ('TEXTCOLOR', (0, 0), (-1, -1), text_color),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [white, HexColor('#f9fafb')]),
            ('GRID', (0, 0), (-1, -1), 1, HexColor('#e5e7eb')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        # Draw the table
        table.wrapOn(c, width - 100, height)
        table.drawOn(c, 50, content_y_start - 180)
    
    # Terms and conditions section
    terms_y = content_y_start - 250
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, terms_y, "Terms and Conditions")
    
    c.setFont("Helvetica", 9)
    terms_text = [
        "• This document is legally binding and constitutes an agreement between the parties.",
        "• All payments must be made on time as specified in the agreement.",
        "• Any modifications to this agreement must be made in writing and signed by all parties.",
        "• This document is generated electronically and is valid without physical signatures.",
        "• For any disputes, please contact PropEase support at support@propease.com"
    ]
    
    y_pos = terms_y - 20
    for term in terms_text:
        c.drawString(50, y_pos, term)
        y_pos -= 15
    
    # Footer
    footer_y = 80
    c.setFillColor(primary_color)
    c.rect(0, 0, width, footer_y, fill=1, stroke=0)
    
    c.setFillColor(white)
    c.setFont("Helvetica", 10)
    c.drawCentredText(width/2, footer_y/2 + 15, "PropEase - Your Trusted Property Management Partner")
    c.drawCentredText(width/2, footer_y/2, "Contact: support@propease.com | www.propease.com")
    c.drawCentredText(width/2, footer_y/2 - 15, "This is a computer-generated document and is valid without signature.")
    
    # Add page border
    c.setStrokeColor(HexColor('#e5e7eb'))
    c.setLineWidth(1)
    c.rect(20, 20, width - 40, height - 40, fill=0, stroke=1)
    
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()

def upload_pdf_to_supabase(supabase, bucket: str, path: str, pdf_bytes: bytes) -> str:
    response = supabase.storage.from_(bucket).upload(path, pdf_bytes, {
        "content-type": "application/pdf",
        "x-upsert": "true"
    })

    if not response or not getattr(response, "path", None):
        print("File upload failed:", response)
        raise HTTPException(status_code=500, detail="File upload failed")

    return f"{bucket}/{path}"




@router.patch("/{application_id}")
def update_application(application_id: UUID, payload: dict, supabase=Depends(get_supabase), user=Depends(get_current_user)):
    try:
        # Clean payload data
        for key, value in payload.items():
            payload[key] = safe_json_serialize(value)
        
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
            property_res = supabase.table("properties").select("*").eq("id", app["property_id"]).limit(1).execute()
            property_data = property_res.data[0] if property_res.data else None
            
            if not property_data:
                raise HTTPException(status_code=404, detail="Property not found")

            prop_type = property_data["transaction_type"]
            owner_id = property_data["owner_id"]
            
            # Safely handle price conversion
            price = app.get("bid_amount") or property_data.get("price")
            if price is not None:
                price = float(price)
            
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
                    "rent": str(price),  # Convert to string for DECIMAL
                    "agreement_file": file_path,
                    "payment_status": "Pending",
                    "payment_due_date": app["lease_start"],
                    "last_paid_month": None,
                    "late_fee": "0.00",  # String for DECIMAL
                    "status": "Pending Payment",
                    "application_id": str(application_id)  # Add missing field
                }
                
                lease_result = supabase.table("leases").insert(lease_payload).execute()

                if not lease_result.data:
                    print("Lease insert failed:", lease_result)
                    raise HTTPException(status_code=500, detail="Failed to create lease record")

                print(f"Lease created successfully: {lease_result.data[0]['id']}")


            elif prop_type == "Sale":
                account_res = supabase.table("accounts").select("balance").eq("user_id", app["applicant_id"]).limit(1).execute()
                if not account_res.data:
                    raise HTTPException(status_code=400, detail="Applicant has no associated account")

                balance = float(account_res.data[0]["balance"])
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
                    "sale_price": str(price),  # Convert to string for DECIMAL
                    "deed_file": file_path,
                    "status": "Pending Payment",
                    "application_id": str(application_id)  # Add missing field
                }
                
                sale_result = supabase.table("sales").insert(sale_payload).execute()
                if not sale_result.data:
                    print(f"Sale insert failed: {sale_result}")
                    raise HTTPException(status_code=500, detail="Failed to create sale record")
                print(f"Sale created successfully: {sale_result.data[0]['id']}")

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
                    "rent": str(price),  # Convert to string for DECIMAL
                    "payment_status": "Pending",
                    "payment_due_date": app["subscription_start"],
                    "last_paid_period": None,
                    "late_fee": "0.00",  # String for DECIMAL
                    "is_active": True,
                    "agreement_file": file_path,
                    "status": "Pending Payment",
                    "application_id": str(application_id)  # Add missing field
                }
                
                sub_result = supabase.table("subscriptions").insert(sub_payload).execute()
                if not sub_result.data:
                    print(f"Subscription insert failed: {sub_result}")
                    raise HTTPException(status_code=500, detail="Failed to create subscription record")
                print(f"Subscription created successfully: {sub_result.data[0]['id']}")

            
            if prop_type in ["Sale", "Lease"]:
                rejection_msg = "Another application was approved."
                reject_res = supabase.table("applications") \
                    .update({
                        "status": "Rejected",
                        "message": rejection_msg
                    }) \
                    .eq("property_id", app["property_id"]) \
                    .neq("id", str(application_id)) \
                    .neq("status", "Rejected") \
                    .execute()

            elif prop_type == "PG":
                # Get max occupancy of PG property
                max_resp = supabase.table("properties") \
                    .select("max_occupancy") \
                    .eq("id", app["property_id"]) \
                    .limit(1) \
                    .execute()

                max_occupancy = max_resp.data[0]["max_occupancy"] if max_resp.data else 0

                # Count current active subscriptions
                active_subs = supabase.table("subscriptions") \
                    .select("id") \
                    .eq("property_id", app["property_id"]) \
                    .eq("is_active", True) \
                    .execute()

                if len(active_subs.data or []) >= max_occupancy:
                    rejection_msg = "Occupancy full. No more applications accepted."
                    reject_pg = supabase.table("applications") \
                        .update({
                            "status": "Rejected",
                            "message": rejection_msg
                        }) \
                        .eq("property_id", app["property_id"]) \
                        .neq("id", str(application_id)) \
                        .neq("status", "Rejected") \
                        .execute()


        return updated_app
    
    except Exception as e:
        print(f"Error updating application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating application: {str(e)}")