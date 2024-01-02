from django.shortcuts import render

# Create your views here.
# views.py
from rest_framework import status, permissions, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Quizs
from .serializers import QuizsSerializer


# class CreateQuizAPIView(APIView):
#     serializer_class = QuizsSerializer
#     permission_classes = [ permissions.AllowAny ]
#     def post(self, request, *args, **kwargs):
#         serializer = QuizsSerializer(data=request.data)
#
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class QuizCreateView(generics.CreateAPIView):
    queryset = Quizs.objects.all()
    serializer_class = QuizsSerializer
