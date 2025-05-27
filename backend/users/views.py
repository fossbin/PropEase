from django.shortcuts import render

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Users
from .serializers import UserSerializer

@api_view(['POST'])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'User synced to public.users'})
    return Response(serializer.errors, status=400)
