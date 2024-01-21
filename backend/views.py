
# Create your views here.
# views.py
from rest_framework import generics, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Quizs, Categories, Answers, Questions, QuizResults, UserAnswers
from .serializers import QuizsSerializer, QuizsSerializerList, CategorysSerializer, QuizResultsSerializer,QuizResultsStartSerializer
from django.db.models import Q, Count  # Import Q to handle complex queries



class CategoryListView(generics.ListAPIView):
    queryset = Categories.objects.all()
    serializer_class = CategorysSerializer

# class QuizCreateView(generics.CreateAPIView):
#     queryset = Quizs.objects.all()
#     serializer_class = QuizsSerializer
class QuizView(generics.ListCreateAPIView):
    serializer_class = QuizsSerializerList
    def get_queryset(self):

        queryset = Quizs.objects.all()
        search_query = self.request.query_params.get('searchQuery', '')
        categories = self.request.query_params.get('categories', '').split(',')

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(user__username__icontains=search_query)
            )

        if categories and categories[0] != '':
            categories = [category.strip("'") for category in categories]
            queryset = queryset.filter(quizCategories__name__in=categories).annotate(
                categories_count=Count('quizCategories')).filter(categories_count=len(categories))
        return queryset

    def create(self, request, *args, **kwargs):
        serializer_class = QuizsSerializer
        serializer = serializer_class(data={**self.request.data, 'user': self.request.user.username})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class QuizRetrieveView(generics.RetrieveAPIView):
    queryset = Quizs.objects.all()
    serializer_class = QuizsSerializer

class QuizResultsView(generics.ListCreateAPIView):
    queryset = QuizResults.objects.all()
    serializer_class = QuizResultsSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = QuizResults.objects.filter(user=user)

        # Filtrowanie po kategorii quizu
        date_param = self.request.query_params.get('date', '')
        categories = self.request.query_params.get('categories', '')
        search_query = self.request.query_params.get('searchQuery', '')
        categories = categories.split(',')
        if categories and categories[0] != '':
            categories = [category.strip("'") for category in categories]
            queryset = queryset.filter(quiz__quizCategories__name__in=categories).annotate(
                categories_count=Count('quiz__quizCategories')).filter(categories_count=len(categories))

        # Filtrowanie po dacie - przykład: ?start_date=2023-01-01&end_date=2023-12-31

        if date_param:
            queryset = queryset.filter(date__date=date_param)

        # Wyszukiwanie po nazwie quizu

        if search_query:
            queryset = queryset.filter(quiz__name__icontains=search_query)

        return queryset
    def create(self, request, *args, **kwargs):

        quiz_id = request.data.get('quizId')
        print(quiz_id)
        # Używam filter zamiast get
        quizzes = Quizs.objects.filter(pk=quiz_id)

        # Sprawdzam, czy co najmniej jeden quiz został znaleziony
        if not quizzes.exists():
            return Response({'detail': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

        quiz = quizzes.first()

        # Tworzenie wyniku quizu z domyślną punktacją równą 0
        quiz_result = QuizResults.objects.create(quiz=quiz, user=request.user, score=0)

        serializer =QuizResultsStartSerializer(quiz_result)
        headers = self.get_success_headers(serializer.data)

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class CheckQuizResultsView(APIView):
    def post(self, request, *args, **kwargs):
        quiz_id = request.data.get('quizId')

        try:
            quizResults = QuizResults.objects.get(pk=quiz_id, user=request.user)
        except QuizResults.DoesNotExist:
            return Response({'error': 'QuizResults not found'}, status=status.HTTP_404_NOT_FOUND)

        overall_score = 0

        # Loop through each result in quizResults
        for result in request.data.get('quizResults', []):
            question_text = result.get('question')
            selected_answers = result.get('selectedAnswer', [])

            question = get_object_or_404(Questions, quiz=quizResults.quiz, name=question_text)
            correct_answers = Answers.objects.filter(question=question, good_answer=True).values_list('answer', flat=True)

            # Check if selected answers are correct
            is_correct = all(answer in correct_answers for answer in selected_answers)

            # Save or update UserAnswers for each question
            user_answers, created = UserAnswers.objects.get_or_create(quizResult=quizResults, question=question)
            user_answers.answers.set(Answers.objects.filter(question=question, answer__in=selected_answers))

            # Update overall score
            if is_correct:
                overall_score += 1

        # Update the overall score for the QuizResults
        quizResults.score = overall_score
        quizResults.save()

        # Return the overall score in the response
        return Response({'overall_score': overall_score}, status=status.HTTP_200_OK)