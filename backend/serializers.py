from rest_framework import serializers

from .models import Quizs, Questions, Answers, Categories, QuizResults, UserAnswers
from django.contrib.auth.models import User

class AnswersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answers
        fields = ['answer', 'good_answer']
    def to_representation(self, instance):
        # Ta metoda ustala, jakie dane mają być zwracane podczas operacji GET
        return {
            'answer': instance.answer,
        }

    def create(self, validated_data):
        # Ta metoda ustala, jakie dane mają być zapisywane podczas operacji POST
        return Answers.objects.create(**validated_data)

class QuestionsSerializer(serializers.ModelSerializer):
    answers = AnswersSerializer(many=True)

    class Meta:
        model = Questions
        fields = ['name', 'answers']

    def validate(self, date):
        if date['name'] is None:
            raise serializers.ValidationError("Pytanie nie może być puste.")
        if len(date['answers']) < 1:
            raise serializers.ValidationError("Musisz dodać odpowiedzi.")
        return date
class CategorysSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categories
        fields = ['name']

class QuizsSerializer(serializers.ModelSerializer):
    questions = QuestionsSerializer(many=True)
    user = serializers.CharField(source='user.username')
    quizCategory = serializers.CharField(source='quizCategory.name')

    class Meta:
        model = Quizs
        fields = ['user', 'name', 'questions', 'quizCategory', 'description', 'duration']

    def create(self, validated_data):
        username = validated_data.pop('user')['username']  # Extract the username from the input data
        user = User.objects.get(username=username)
        questions_data = validated_data.pop('questions')
        category_data = Categories.objects.get(name=validated_data.pop('quizCategory')['name'])

        quiz = Quizs.objects.create(user=user, quizCategory=category_data, **validated_data)


        for question_data in questions_data:
            answers_data = question_data.pop('answers', [])
            question = Questions.objects.create(quiz=quiz, **question_data)

            for answer_data in answers_data:
                Answers.objects.create(question=question, **answer_data)

        return quiz
    def validate(self, data):

        quiz_category_name = data.get('quizCategory', {}).get('name')
        if not quiz_category_name:
            raise serializers.ValidationError("Kategoria nie może być pusta.")
        if not Categories.objects.filter(name=quiz_category_name).exists():
            raise serializers.ValidationError("Kategoria '{}' nie istnieje.".format(quiz_category_name))
        if data['name'] is None:
            raise serializers.ValidationError("Nazwa nie może być puste.")
        if data['description'] is None:
            raise serializers.ValidationError("Opis nie może być pusty.")
        if data['user'] is None:
            raise serializers.ValidationError("Uzytkownik nie może być pusty.")
        if len(data['questions']) < 1:
            raise serializers.ValidationError("Musisz dodać pytania.")
        for question in data['questions']:
            answers = [answer['answer'] for answer in question['answers']]
            if len(set(answers)) != len(answers):
                raise serializers.ValidationError(
                    "Dla pytania '{}' istnieją takie same odpowiedzi.".format(question['name']))

        question_names = [question['name'] for question in data['questions']]
        if len(set(question_names)) != len(question_names):
            raise serializers.ValidationError("Pytania w quizie nie mogą sie powtarzać.")
        return data

class QuizsSerializerList(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username')
    quizCategory = serializers.CharField(source='quizCategory.name')
    class Meta:
        model = Quizs
        fields = ['id','user', 'name', 'quizCategory', 'description']
class AnswersSerializerQuizResults(serializers.ModelSerializer):
    class Meta:
        model = Answers
        fields = ['answer', 'good_answer']
class UserAnswersSerializer(serializers.ModelSerializer):
    answers = AnswersSerializerQuizResults(many=True)
    question = serializers.CharField(source='question.name')

    class Meta:
        model = UserAnswers
        fields = ['question', 'answers']
class QuizResultsSerializer(serializers.ModelSerializer):
    quiz = QuizsSerializerList()
    userAnswers = UserAnswersSerializer(many=True)

    class Meta:
        model = QuizResults
        fields = ['id','quiz', 'score', 'date','userAnswers']



class QuizResultsStartSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizResults
        fields = ['id']

class UserDetilSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']
class UserChangePasswordSerializer(serializers.Serializer):
    oldPassword = serializers.CharField(required=True)
    newPassword = serializers.CharField(required=True)

    def validate(self, data):
        if data['oldPassword'] is None:
            raise serializers.ValidationError("Stare hasło nie może być puste.")
        if data['newPassword'] is None:
            raise serializers.ValidationError("Nowe hasło nie może być puste.")
        if data['oldPassword'] == data['newPassword']:
            raise serializers.ValidationError("Nowe hasło nie może być takie samo jak stare.")
        if len(data['newPassword']) < 8:
            raise serializers.ValidationError("Hasło musi mieć minimum 8 znaków.")
        if not any(char in data['newPassword'] for char in "!@#$%^&*()_-+=<>?/[]{}|"):
            raise serializers.ValidationError("Hasło musi zawierać co najmniej jeden znak specjalny.")
        return data