from django.http import JsonResponse
from .models import TestModel
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def test_connection(request):
    if request.method == "GET":
        data = list(TestModel.objects.values())
        return JsonResponse({"success": True, "data": data})
    elif request.method == "POST":
        test_obj = TestModel.objects.create(name="Hello Supabase!")
        return JsonResponse({"success": True, "message": f"Created: {test_obj.name}"})
