from rest_framework import serializers
from .models import Quizs, Questions, Answers, Categories
from django.contrib.auth.models import User

class AnswersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answers
        fields = ['answer', 'good_answer']

class QuestionsSerializer(serializers.ModelSerializer):
    answers = AnswersSerializer(many=True)

    class Meta:
        model = Questions
        fields = ['name', 'answers']

class CategorysSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categories
        fields = ['name']

class QuizsSerializer(serializers.ModelSerializer):
    questions = QuestionsSerializer(many=True)
    quizCategories = CategorysSerializer(many=True)
    user = serializers.CharField(source='user.username')

    class Meta:
        model = Quizs
        fields = ['user', 'name', 'questions', 'quizCategories']

    def create(self, validated_data):
        username = validated_data.pop('user')['username']  # Extract the username from the input data
        user = User.objects.get(username=username)
        questions_data = validated_data.pop('questions')
        categories_data = validated_data.pop('quizCategories')


        quiz = Quizs.objects.create(user=user, **validated_data)


        for question_data in questions_data:
            answers_data = question_data.pop('answers', [])
            question = Questions.objects.create(quiz=quiz, **question_data)

            for answer_data in answers_data:
                Answers.objects.create(question=question, **answer_data)

        for category_data in categories_data:
            category, created = Categories.objects.get_or_create(**category_data)
            quiz.quizCategories.add(category)

        return quiz