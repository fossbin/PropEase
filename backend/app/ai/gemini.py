import os
import google.generativeai as genai
from typing import Optional

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def get_smart_price_from_gemini(prompt: str) -> str:

    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini API error: {e}")
        raise e

