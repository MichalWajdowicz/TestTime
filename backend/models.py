from django.db import models
# Create your models here.
from django.utils import timezone
class Categories(models.Model):
    name = models.CharField(max_length=255)
class Quizs(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='author')
    quizCategories = models.ManyToManyField(Categories)
    # Możesz dodać więcej pól w zależności od potrzeb

class Questions(models.Model):
    quiz = models.ForeignKey(Quizs, on_delete=models.CASCADE, related_name='questions')
    name = models.TextField()
    # Możesz dodać więcej pól w zależności od potrzeb

class Answers(models.Model):
    question = models.ForeignKey(Questions, on_delete=models.CASCADE, related_name='answers')
    answer = models.TextField()
    good_answer = models.BooleanField(default=False)

class QuizResults(models.Model):
    quiz = models.ForeignKey(Quizs, on_delete=models.CASCADE, related_name='quizResults')
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='userResults')
    score = models.IntegerField()
    date = models.DateTimeField(default=timezone.now)

    # Możesz dodać więcej pól w zależności od potrzeb

class UserAnswers(models.Model):
    quizResult = models.ForeignKey(QuizResults, on_delete=models.CASCADE, related_name='userAnswers')
    question = models.ForeignKey(Questions, on_delete=models.CASCADE, related_name='userAnswers')
    answers = models.ManyToManyField(Answers)
    # Możesz dodać więcej pól w zależności od potrzeb