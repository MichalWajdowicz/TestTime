from django.urls import path
from . import views

urlpatterns = [
    # path('admin/', admin.site.urls),
    path('listCategory/', views.CategoryListView.as_view(), name='listCategory'),
    path('quiz/', views.QuizView.as_view(), name='addQuiz'),
    # path('addQuiz/', views.QuizCreateView.as_view(), name='addQuiz'),
    # path('listQuiz/', views.QuizListView.as_view(), name='listQuiz'),

    path('quiz/<int:pk>/', views.QuizRetrieveView.as_view(), name='quiz-retrieve'),
    path('checkAnswer/', views.CheckQuizResultsView.as_view(), name='checkAnswer'),
    path('quizResults/', views.QuizResultsView.as_view(), name='quizResults'),
]