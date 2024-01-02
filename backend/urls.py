from django.urls import path
from . import views

urlpatterns = [
    # path('admin/', admin.site.urls),
    path('addQuiz/', views.QuizCreateView.as_view(), name='addQuiz'),
]