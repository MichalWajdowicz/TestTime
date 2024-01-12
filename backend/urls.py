from django.urls import path
from . import views

urlpatterns = [
    # path('admin/', admin.site.urls),
    path('addQuiz/', views.QuizCreateView.as_view(), name='addQuiz'),
    path('listQuiz/', views.QuizListView.as_view(), name='listQuiz'),
    path('listCategory/', views.CategoryListView.as_view(), name='listCategory'),
    path('<int:pk>/', views.QuizRetrieveView.as_view(), name='quiz-retrieve'),
]