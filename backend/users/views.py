from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from .models import Users  

@csrf_exempt
def register_user(request):
    if request.method == "POST":
        data = json.loads(request.body)
        try:
            Users.objects.create(
                id=data["id"],
                email=data["email"],
                name=data["name"],
                phone_number=data["phone_number"]
            )
            return JsonResponse({"message": "User created successfully."}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return JsonResponse({"error": "Invalid request method."}, status=405)
