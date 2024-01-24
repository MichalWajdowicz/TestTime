from django.urls import path
from . import views

urlpatterns = [
    path('listCategory/', views.CategoryListView.as_view(), name='listCategory'),
    path('quiz/', views.QuizView.as_view(), name='addQuiz'),
    path('users/', views.UserDetailView.as_view(), name='user'),
    path('users/userQuizs/', views.UserQuizsCreateView.as_view(), name='userQuizs'),
    path('quiz/<int:pk>/', views.QuizRetrieveView.as_view(), name='quiz-retrieve'),
    path('checkAnswer/', views.CheckQuizResultsView.as_view(), name='checkAnswer'),
    path('quizResults/', views.QuizResultsView.as_view(), name='quizResults'),
    path('users/user-stats/', views.CombinedUserStatsView.as_view(), name='CombinedUserStatsView'),
    path('users/userChangePassword/', views.UserChangePasswordView.as_view(), name='UserChangePasswordView'),
]