from fastapi import APIRouter, Depends, HTTPException
from app.models.pricing import PricingRequest, PricingResponse
from app.ai.gemini import get_smart_price_from_gemini
import re

router = APIRouter(prefix="/pricing", tags=["Smart Pricing"])

@router.post("/suggest", response_model=PricingResponse)
async def suggest_price(data: PricingRequest):
  
    try:
        location_str = f"{data.city}, {data.state}, {data.country}" if data.city else data.location
        amenities_str = ", ".join(data.amenities) if data.amenities else "Standard amenities"
        
        prompt = f"""
        You are a real estate pricing expert in India. Analyze the following property details and provide a competitive price suggestion in INR.

        Property Details:
        - Type: {data.property_type}
        - Transaction: {data.transaction_type}
        - Location: {location_str}
        - Capacity: {data.capacity if data.capacity else 'Not specified'} people
        - Description: {data.description}
        - Amenities: {amenities_str}
        - Additional Info: {data.additional_info or 'None'}

        Please provide:
        1. A specific suggested price in INR (number only for the main suggestion)
        2. A price range (min-max in INR)
        3. Brief reasoning for the price
        4. Confidence level (High/Medium/Low)

        Consider current market rates, location desirability, property type, and amenities.
        
        Format your response as:
        SUGGESTED_PRICE: [amount in INR]
        PRICE_RANGE: [min amount] - [max amount] INR
        REASONING: [brief explanation]
        CONFIDENCE: [High/Medium/Low]
        """
        
       
        ai_response = get_smart_price_from_gemini(prompt)
        
        
        suggested_price = extract_field(ai_response, "SUGGESTED_PRICE")
        price_range = extract_field(ai_response, "PRICE_RANGE")
        reasoning = extract_field(ai_response, "REASONING")
        confidence = extract_field(ai_response, "CONFIDENCE")
        
        if not suggested_price:
            
            price_match = re.search(r'₹?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', ai_response)
            suggested_price = price_match.group(1) if price_match else "Price estimation unavailable"
        
        return PricingResponse(
            suggested_price=suggested_price or "Unable to determine",
            price_range=price_range or "Range unavailable",
            reasoning=reasoning or ai_response[:200] + "..." if len(ai_response) > 200 else ai_response,
            confidence_level=confidence or "Medium"
        )
        
    except Exception as e:
        print(f"Pricing suggestion error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate price suggestion: {str(e)}"
        )

def extract_field(text: str, field_name: str) -> str:
    pattern = f"{field_name}:\\s*(.+?)(?=\\n[A-Z_]+:|$)"
    match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else ""
