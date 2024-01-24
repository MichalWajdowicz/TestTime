
# Create your views here.
# views.py
from rest_framework import generics, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Quizs, Categories, Answers, Questions, QuizResults, UserAnswers
from .serializers import QuizsSerializer, QuizsSerializerList, CategorysSerializer, QuizResultsSerializer, \
    QuizResultsStartSerializer, UserDetilSerializer, UserChangePasswordSerializer
from django.db.models import Q, Count, Avg  # Import Q to handle complex queries



class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserDetilSerializer
    def get_object(self):
        # Zwraca obiekt użytkownika, który dokonuje zapytania
        return self.request.user

class UserQuizsCreateView(generics.ListAPIView):
    serializer_class = QuizsSerializerList
    def get_queryset(self):
        queryset = Quizs.objects.filter(user=self.request.user)

        queryset = queryset.annotate(
            num_attempts=Count('quizResults__id', distinct=True),  # Ilość rozwiązanych quizów
            avg_score=Avg('quizResults__score')  # Średnia ilość punktów
        )
        return queryset
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # Dodaj dodatkowe pola do danych odpowiedzi
        data = serializer.data
        for i, quiz_data in enumerate(data):
            quiz_data['num_attempts'] = queryset[i].num_attempts
            quiz_data['avg_score'] = queryset[i].avg_score

        for quiz_data in data:
            quiz_data.pop('id', None)
            quiz_data.pop('user', None)
            quiz_data.pop('quizCategories', None)
            quiz_data.pop('description', None)

        return Response(data)
class CategoryListView(generics.ListAPIView):
    queryset = Categories.objects.all()
    serializer_class = CategorysSerializer

class QuizView(generics.ListCreateAPIView):
    serializer_class = QuizsSerializerList
    def get_queryset(self):
        user = self.request.user
        queryset = Quizs.objects.exclude(user=user)  # Exclude quizzes created by the authenticated user

        # Exclude quizzes that the user has already completed
        completed_quizzes = QuizResults.objects.filter(user=user, isCompleted=True).values_list('quiz', flat=True)
        queryset = queryset.exclude(pk__in=completed_quizzes)

        search_query = self.request.query_params.get('searchQuery', '')
        categories = self.request.query_params.get('categories', '').split(',')

        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(user__username__icontains=search_query)
            )

        if categories and categories[0] != '':
            categories = [category.strip("'") for category in categories]
            queryset = queryset.filter(quizCategory__name__in=categories).distinct()

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


        date_param = self.request.query_params.get('date', '')
        categories = self.request.query_params.get('categories', '')
        search_query = self.request.query_params.get('searchQuery', '')
        categories = categories.split(',')
        if categories and categories[0] != '':
            categories = [category.strip("'") for category in categories]
            queryset = queryset.filter(quiz__quizCategory__name__in=categories).distinct()
        # Filtrowanie po dacie - przykład: ?start_date=2023-01-01&end_date=2023-12-31

        if date_param:
            queryset = queryset.filter(date__date=date_param)

        # Wyszukiwanie po nazwie quizu

        if search_query:
            queryset = queryset.filter(quiz__name__icontains=search_query)

        return queryset
    def create(self, request, *args, **kwargs):

        user = self.request.user


        quiz_id = request.data.get('quizId')
        user = self.request.user
        # Używam filter zamiast get
        quizzes = Quizs.objects.filter(pk=quiz_id)

        # Sprawdzam, czy co najmniej jeden quiz został znaleziony
        if not quizzes.exists():
            return Response({'detail': 'Nie znaleziono quizu.'}, status=status.HTTP_404_NOT_FOUND)

        quiz = quizzes.first()
        if quiz.user == user:
            return Response({'detail': 'Nie możesz rozwiązać własnego quizu.'}, status=status.HTTP_400_BAD_REQUEST)
        if QuizResults.objects.filter(user=user, quiz=quiz, isCompleted=True).exists():
            return Response({'detail': 'Rozwiązałeś już ten quiz.'}, status=status.HTTP_400_BAD_REQUEST)
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
        if quizResults.user != request.user:
            return Response({'error': 'Unauthorized access to quiz results'}, status=status.HTTP_403_FORBIDDEN)
        # Loop through each result in quizResults
        for result in request.data.get('quizResults', []):
            question_text = result.get('question')
            selected_answers = result.get('selectedAnswer', [])

            if not question_text or not selected_answers:
                return Response({'error': 'Invalid quiz results format'}, status=status.HTTP_400_BAD_REQUEST)

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
        quizResults.isCompleted = True
        quizResults.save()

        # Return the overall score in the response
        return Response({'overall_score': overall_score}, status=status.HTTP_200_OK)
class UserSkillsRadarView(APIView):
    def get(self, request, format=None):
        user = request.user

        # Pobieramy średnie wyniki użytkownika w poszczególnych kategoriach
        user_category_avg_scores = (
            QuizResults.objects
            .filter(user=user)
            .values('quiz__quizCategory__name')
            .annotate(avg_score=Avg('score'))
        )

        # Pobieramy ilość quizów w poszczególnych kategoriach, w których użytkownik brał udział
        user_category_quiz_counts = (
            QuizResults.objects
            .filter(user=user)
            .values('quiz__quizCategory__name')
            .annotate(num_quizzes=Count('quiz__id', distinct=True))
        )

        # Łączymy obie listy, aby uzyskać pełne informacje o umiejętnościach użytkownika
        user_skills_data = [
            {
                'category': avg_score['quiz__quizCategory__name'],
                'avg_score': avg_score['avg_score'],
                'num_quizzes': quiz_count['num_quizzes'],
            }
            for avg_score, quiz_count in zip(user_category_avg_scores, user_category_quiz_counts)
        ]

        return Response(user_skills_data)
class CategoryPieChartView(APIView):
    def get(self, request, format=None):
        user = request.user

        # Pobieramy ilość rozwiązanych quizów w poszczególnych kategoriach przez użytkownika
        category_quiz_counts = (
            QuizResults.objects
            .filter(user=user)
            .values('quiz__quizCategory__name')
            .annotate(num_quizzes=Count('quiz__id', distinct=True))
        )

        # Przygotowujemy dane w formie odpowiedniej dla wykresu kołowego
        category_pie_data = [
            {'category': quiz_count['quiz__quizCategory__name'], 'num_quizzes': quiz_count['num_quizzes']}
            for quiz_count in category_quiz_counts
        ]

        return Response(category_pie_data)
class ScoreDistributionHistogramView(APIView):
    def get(self, request, format=None):
        user = request.user

        # Pobieramy wyniki punktowe użytkownika w quizach
        user_scores = QuizResults.objects.filter(user=user).values_list('score', flat=True)

        return Response(user_scores)
class CombinedUserStatsView(APIView):
    def get(self, request, format=None):
        user = request.user

        # Pobieramy średnie wyniki użytkownika w poszczególnych kategoriach
        user_category_avg_scores = (
            QuizResults.objects
            .filter(user=user)
            .values('quiz__quizCategory__name')
            .annotate(avg_score=Avg('score'))
        )
        category_avg_scores = (
            QuizResults.objects
            .values('quiz__quizCategory__name')
            .annotate(avg_category_score=Avg('score'))
        )
        # Pobieramy ilość quizów w poszczególnych kategoriach, w których użytkownik brał udział
        user_category_quiz_counts = (
            QuizResults.objects
            .filter(user=user)
            .values('quiz__quizCategory__name')
            .annotate(num_quizzes=Count('quiz__id', distinct=True))
        )

        # Łączymy obie listy, aby uzyskać pełne informacje o umiejętnościach użytkownika
        user_skills_data = [
            {
                'category': avg_score['quiz__quizCategory__name'],
                'avg_score': avg_score['avg_score'],
                'num_quizzes': quiz_count['num_quizzes'],
            }
            for avg_score, quiz_count in zip(user_category_avg_scores, user_category_quiz_counts)
        ]

        # Pobieramy ilość rozwiązanych quizów w poszczególnych kategoriach przez użytkownika
        category_quiz_counts = (
            QuizResults.objects
            .filter(user=user)
            .values('quiz__quizCategory__name')
            .annotate(num_quizzes=Count('quiz__id', distinct=True))
        )

        # Przygotowujemy dane w formie odpowiedniej dla wykresu kołowego
        category_pie_data = [
            {'category': quiz_count['quiz__quizCategory__name'], 'num_quizzes': quiz_count['num_quizzes']}
            for quiz_count in category_quiz_counts
        ]

        user_comparison_data = [
            {
                'category': user_avg['quiz__quizCategory__name'],
                'avg_score': user_avg['avg_score'],
                'avg_category_score': category_avg['avg_category_score'],
            }
            for user_avg, category_avg in zip(user_category_avg_scores, category_avg_scores)
        ]

        return Response({
            'user_skills_data': user_skills_data,
            'category_pie_data': category_pie_data,
            'user_comparison_data': user_comparison_data,
        })
class UserChangePasswordView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserChangePasswordSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            old_password = serializer.validated_data.get('oldPassword')
            new_password = serializer.validated_data.get('newPassword')

            # Authenticate user with old password
            if not user.check_password(old_password):
                return Response({'error': 'Stare hasło jest nieprawidłowe.'}, status=status.HTTP_400_BAD_REQUEST)

            # Change password and save user
            user.set_password(new_password)
            user.save()

            return Response({'detail': 'Hasło zostało zmienione pomyślnie.'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)