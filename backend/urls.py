from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view(), name='listCategory'),
    path('quiz/', views.QuizView.as_view(), name='addQuiz'),
    path('users/', views.UserDetailView.as_view(), name='user'),
    path('users/user-quizs/', views.UserQuizsCreateView.as_view(), name='userQuizs'),
    path('quiz/<int:pk>/', views.QuizRetrieveView.as_view(), name='quiz-retrieve'),
    path('check-answer/', views.CheckQuizResultsView.as_view(), name='checkAnswer'),
    path('quiz-results/', views.QuizResultsView.as_view(), name='quizResults'),
    path('quiz-results/<int:quiz_result_id>/time-remaining/', views.get_time_remaining, name='get_time_remaining'),
    path('users/user-stats/', views.CombinedUserStatsView.as_view(), name='CombinedUserStatsView'),
    path('users/user-change-password/', views.UserChangePasswordView.as_view(), name='UserChangePasswordView'),
    path('lobby/', views.QuizLobbyView.as_view(), name='LobbyView'),
    path('lobby/check_quiz_lobby_ownership/<int:lobby_id>/', views.check_quiz_lobby_ownership, name='check_ownership'),
    path('lobby/check_quiz_lobby_password/<int:lobby_id>/', views.check_quiz_lobby_password, name='check_password'),
]