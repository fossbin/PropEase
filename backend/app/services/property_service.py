from app.db.supabase import supabase

def search_properties(city: str):
    response = supabase \
        .from_("property_locations") \
        .select("*, properties(*)") \
        .ilike("city", f"%{city}%") \
        .execute()
    
    if response.error:
        raise Exception(response.error.message)

    return response.data
