import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.conf import settings


SUPABASE_AUTH_URL = f"{settings.SUPABASE_URL}/auth/v1"

HEADERS = {
    "apikey": settings.SUPABASE_API_KEY,
    "Content-Type": "application/json"
}


@csrf_exempt
def register_user(request):
    if request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")

        # Supabase sign up endpoint
        res = requests.post(
            f"{SUPABASE_AUTH_URL}/signup",
            headers=HEADERS,
            json={"email": email, "password": password}
        )

        if res.status_code == 200:
            user_data = res.json()
            # Optionally sync to Django DB or your public.users table here
            return JsonResponse(user_data, status=200)
        else:
            return JsonResponse(res.json(), status=res.status_code)

    return JsonResponse({"error": "Only POST allowed"}, status=405)


@csrf_exempt
def login_user(request):
    if request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")

        # Supabase sign in endpoint
        res = requests.post(
            f"{SUPABASE_AUTH_URL}/token?grant_type=password",
            headers=HEADERS,
            json={"email": email, "password": password}
        )

        if res.status_code == 200:
            return JsonResponse(res.json(), status=200)
        else:
            return JsonResponse(res.json(), status=res.status_code)

    return JsonResponse({"error": "Only POST allowed"}, status=405)
