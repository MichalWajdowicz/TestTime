from django.db import models
from django.utils import timezone
import datetime
def truncate_microseconds(dt):
    return dt - datetime.timedelta(microseconds=dt.microsecond)
class Categories(models.Model):
    name = models.CharField(max_length=255)
class Quizs(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='author')
    quizCategory = models.ForeignKey(Categories, on_delete=models.CASCADE, related_name='quizCategory')
    duration = models.PositiveIntegerField(default=10)

class Questions(models.Model):
    quiz = models.ForeignKey(Quizs, on_delete=models.CASCADE, related_name='questions')
    name = models.TextField()

class Answers(models.Model):
    question = models.ForeignKey(Questions, on_delete=models.CASCADE, related_name='answers')
    answer = models.TextField()
    good_answer = models.BooleanField(default=False)

class QuizResults(models.Model):
    quiz = models.ForeignKey(Quizs, on_delete=models.CASCADE, related_name='quizResults')
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='userResults')
    score = models.IntegerField()
    date = models.DateTimeField(default=timezone.now)
    start_time = models.DateTimeField(default=timezone.now)
    isStarted = models.BooleanField(default=False)
    isCompleted = models.BooleanField(default=False)
    def save(self, *args, **kwargs):
        if self.isStarted:
            self.start_time = truncate_microseconds(timezone.now())
        super(QuizResults, self).save(*args, **kwargs)
class UserAnswers(models.Model):
    quizResult = models.ForeignKey(QuizResults, on_delete=models.CASCADE, related_name='userAnswers')
    question = models.ForeignKey(Questions, on_delete=models.CASCADE, related_name='userAnswers')
    answers = models.ManyToManyField(Answers)
