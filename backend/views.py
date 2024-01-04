
# Create your views here.
# views.py
from rest_framework import generics

from .models import Quizs, Categories
from .serializers import QuizsSerializer, QuizsSerializerList, CategorysSerializer
from django.db.models import Q, Count  # Import Q to handle complex queries
from rest_framework.pagination import PageNumberPagination



class QuizCreateView(generics.CreateAPIView):
    queryset = Quizs.objects.all()
    serializer_class = QuizsSerializer
class CategoryListView(generics.ListAPIView):
    queryset = Categories.objects.all()
    serializer_class = CategorysSerializer
class QuizListView(generics.ListAPIView):
    serializer_class = QuizsSerializerList

    def get_queryset(self):
        queryset = Quizs.objects.all()
        search_query = self.request.query_params.get('searchQuery', '')
        categories = self.request.query_params.get('categories', '').split(',')

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(user__username__icontains=search_query)
            )

        if categories and categories[0] != '':
            categories = [category.strip("'") for category in categories]
            queryset = queryset.filter(quizCategories__name__in=categories).annotate(
                categories_count=Count('quizCategories')).filter(categories_count=len(categories))
        return queryset