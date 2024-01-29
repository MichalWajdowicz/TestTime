
# Create your views here.
# views.py
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Quizs, Categories, Answers, Questions, QuizResults, UserAnswers
from .serializers import QuizsSerializer, QuizsSerializerList, CategorysSerializer, QuizResultsSerializer, \
    QuizResultsStartSerializer, UserDetilSerializer, UserChangePasswordSerializer
from django.db.models import Q, Count, Avg  # Import Q to handle complex queries
from django.utils import timezone
import datetime

def truncate_microseconds(dt):
    return dt - datetime.timedelta(microseconds=dt.microsecond)
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

class QuizResultsDetailView(generics.RetrieveAPIView):
    queryset = QuizResults.objects.all()
    serializer_class = QuizResultsSerializer

    def get_object(self):
        quiz_result = super(QuizResultsDetailView, self).get_object()
        if quiz_result.user != self.request.user:
            raise PermissionError('Nie masz uprawnień do wyświetlenia tego wyniku.')
        return quiz_result

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
        if not QuizResults.objects.filter(user=user, quiz=quiz, isStarted=True).exists():
            quiz_result = QuizResults.objects.create(quiz=quiz, user=user, score=0, start_time=timezone.now(),isStarted=True)
        else:
            quiz_result = QuizResults.objects.get(user=user, quiz=quiz, isStarted=True)

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
        response_data = {'overall_score': overall_score, 'questions': []}

        if quizResults.user != request.user:
            return Response({'error': 'Unauthorized access to quiz results'}, status=status.HTTP_403_FORBIDDEN)

        for result in request.data.get('quizResults', []):
            question_text = result.get('question')
            selected_answers = result.get('selectedAnswer', [])

            if not question_text or selected_answers is None or not selected_answers:
                response_data['questions'].append({
                    'question_text': question_text,
                    'selected_answers': selected_answers,
                    'correct_answers': [],  # Empty list as no correct answer for this question
                    'is_correct': False
                })
                continue

            question = get_object_or_404(Questions, quiz=quizResults.quiz, name=question_text)
            correct_answers = Answers.objects.filter(question=question, good_answer=True).values_list('answer', flat=True)
            is_correct = all(answer in correct_answers for answer in selected_answers)

            user_answers, created = UserAnswers.objects.get_or_create(quizResult=quizResults, question=question)
            user_answers.answers.set(Answers.objects.filter(question=question, answer__in=selected_answers))
            is_all_correct = all(answer in correct_answers for answer in selected_answers)

            overall_score += 1 if is_correct and is_all_correct else 0

            response_data['questions'].append({
                'question_text': question_text,
                'selected_answers': selected_answers,
                'correct_answers': list(correct_answers),
                'is_correct': is_correct and is_all_correct
            })

        quizResults.score = overall_score
        quizResults.isCompleted = True
        quizResults.save()

        response_data['overall_score'] = overall_score

        return Response(response_data, status=status.HTTP_200_OK)


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
@api_view(['GET'])
def get_time_remaining(request, quiz_result_id):
    print(quiz_result_id)
    quiz_result = get_object_or_404(QuizResults, id=quiz_result_id)

    if not quiz_result.isStarted:
        # Quiz nie zaczął się jeszcze
        return Response({'timeRemaining': quiz_result.quiz.duration * 60}, status=status.HTTP_200_OK)
    if quiz_result.isCompleted:
        # Quiz został już rozwiązany
        return Response({'timeRemaining': 0}, status=status.HTTP_200_OK)
    # Sprawdź, czy quiz nie wygasł
    if quiz_result.start_time + timezone.timedelta(minutes=quiz_result.quiz.duration) < timezone.now():
        quiz_result.isCompleted = True
        quiz_result.save()
        return Response({'timeRemaining': 0}, status=status.HTTP_200_OK)

    current_time = timezone.now()
    current_time = truncate_microseconds(current_time)
    print(current_time)
    elapsed_time = current_time - quiz_result.start_time
    print(elapsed_time)
    # Oblicz pozostały czas
    time_remaining = quiz_result.quiz.duration * 60 - elapsed_time.total_seconds()
    print(time_remaining / 60)

    return Response({'timeRemaining': time_remaining}, status=status.HTTP_200_OK)