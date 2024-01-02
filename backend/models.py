from django.db import models

# Create your models here.

class Categories(models.Model):
    name = models.CharField(max_length=255)
class Quizs(models.Model):
    name = models.CharField(max_length=255)
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
