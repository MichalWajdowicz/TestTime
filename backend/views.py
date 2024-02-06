
# Create your views here.
# views.py
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import Quizs, Categories, Answers, Questions, QuizResults, UserAnswers, QuizLobby
from .serializers import QuizsSerializer, QuizsSerializerList, CategorysSerializer, QuizResultsSerializer, \
    QuizResultsStartSerializer, UserDetilSerializer, UserChangePasswordSerializer, QuizLobbySerializer, QuizLobbySerializerList
from django.db.models import Q, Count, Avg, F  # Import Q to handle complex queries
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
import datetime

def truncate_microseconds(dt):
    return dt - datetime.timedelta(microseconds=dt.microsecond)
class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserDetilSerializer
    def get_object(self):
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
        queryset = Quizs.objects.exclude(user=user)

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

        if date_param:
            queryset = queryset.filter(date__date=date_param)


        if search_query:
            queryset = queryset.filter(quiz__name__icontains=search_query)

        return queryset
    def create(self, request, *args, **kwargs):

        user = self.request.user
        quiz_id = request.data.get('quizId')
        quizzes = Quizs.objects.filter(pk=quiz_id)
        if not quizzes.exists():
            return Response({'detail': 'Nie znaleziono quizu.'}, status=status.HTTP_404_NOT_FOUND)
        quiz = quizzes.first()
        if quiz.user == user:
            return Response({'detail': 'Nie możesz rozwiązać własnego quizu.'}, status=status.HTTP_400_BAD_REQUEST)
        if QuizResults.objects.filter(user=user, quiz=quiz, isCompleted=True).exists():
            return Response({'detail': 'Rozwiązałeś już ten quiz.'}, status=status.HTTP_400_BAD_REQUEST)
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

        if quizResults.user != request.user:
            return Response({'error': 'Unauthorized access to quiz results'}, status=status.HTTP_403_FORBIDDEN)

        overall_score = 0
        response_data = {'overall_score': overall_score, 'questions': []}

        for result in request.data.get('quizResults', []):
            question_text = result.get('question')
            selected_answers = result.get('selectedAnswer', [])

            if not question_text or selected_answers is None or not selected_answers:
                response_data['questions'].append({
                    'question_text': question_text,
                    'selected_answers': selected_answers,
                    'correct_answers': [],
                    'is_correct': False
                })
                continue

            question = get_object_or_404(Questions, quiz=quizResults.quiz, name=question_text)
            correct_answers = list(Answers.objects.filter(question=question, good_answer=True).values_list('answer', flat=True))
            is_correct = set(selected_answers) == set(correct_answers)

            user_answers, created = UserAnswers.objects.get_or_create(quizResult=quizResults, question=question)
            user_answers.answers.set(Answers.objects.filter(question=question, answer__in=selected_answers))

            if is_correct:
                overall_score += 1

            response_data['questions'].append({
                'question_text': question_text,
                'selected_answers': selected_answers,
                'correct_answers': correct_answers,
                'is_correct': is_correct
            })

        quizResults.score = overall_score
        quizResults.isCompleted = True
        quizResults.save()

        response_data['overall_score'] = overall_score

        return Response(response_data, status=status.HTTP_200_OK)

class CombinedUserStatsView(APIView):
    def get(self, request, format=None):
        user = request.user

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
        user_category_quiz_counts = (
            QuizResults.objects
            .filter(user=user)
            .values('quiz__quizCategory__name')
            .annotate(num_quizzes=Count('quiz__id', distinct=True))
        )

        user_skills_data = [
            {
                'category': avg_score['quiz__quizCategory__name'],
                'avg_score': avg_score['avg_score'],
                'num_quizzes': quiz_count['num_quizzes'],
            }
            for avg_score, quiz_count in zip(user_category_avg_scores, user_category_quiz_counts)
        ]

        category_quiz_counts = (
            QuizResults.objects
            .filter(user=user)
            .values('quiz__quizCategory__name')
            .annotate(num_quizzes=Count('quiz__id', distinct=True))
        )

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

            if not user.check_password(old_password):
                return Response({'error': 'Stare hasło jest nieprawidłowe.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()

            return Response({'detail': 'Hasło zostało zmienione pomyślnie.'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['GET'])
def get_time_remaining(request, quiz_result_id):
    print(quiz_result_id)
    quiz_result = get_object_or_404(QuizResults, id=quiz_result_id)

    if not quiz_result.isStarted:
        return Response({'timeRemaining': quiz_result.quiz.duration * 60}, status=status.HTTP_200_OK)
    if quiz_result.isCompleted:
        return Response({'timeRemaining': 0}, status=status.HTTP_200_OK)
    if quiz_result.start_time + timezone.timedelta(minutes=quiz_result.quiz.duration) < timezone.now():
        quiz_result.isCompleted = True
        quiz_result.save()
        return Response({'timeRemaining': 0}, status=status.HTTP_200_OK)

    current_time = timezone.now()
    current_time = truncate_microseconds(current_time)
    print(current_time)
    elapsed_time = current_time - quiz_result.start_time
    print(elapsed_time)
    time_remaining = quiz_result.quiz.duration * 60 - elapsed_time.total_seconds()
    print(time_remaining / 60)

    return Response({'timeRemaining': time_remaining}, status=status.HTTP_200_OK)

class QuizLobbyView(generics.ListCreateAPIView):
    queryset = QuizLobby.objects.all()
    serializer_class = QuizLobbySerializerList

    def get_queryset(self):
        user = self.request.user

        queryset = QuizLobby.objects.filter(
            Q(is_active=True) |
            Q(creator=user),
            ~Q(members=user),
            is_completed=False,
            quiz_started=False
        )

        search_query = self.request.query_params.get('searchQuery', '')
        categories = self.request.query_params.get('categories', '').split(',')

        if search_query:
            queryset = queryset.filter(name__icontains=search_query)

        if categories and categories[0] != '':
            categories = [category.strip("'") for category in categories]
            queryset = queryset.filter(quiz__quizCategory__name__in=categories)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        data = []
        for item in serializer.data:
            creator_data = item['creator']
            creator_serializer = User.objects.get(id=creator_data).username
            item['creator'] = creator_serializer
            data.append(item)

        return Response(data)
    def create(self, request, *args, **kwargs):
        serializer_class = QuizLobbySerializer
        if request.data.get('password') is not None:
            hashed_password = make_password(request.data.get('password'))
            serializer = serializer_class(data={**self.request.data, 'creator': self.request.user.id, 'password': hashed_password})
        else:
            serializer = serializer_class(data={**self.request.data, 'creator': self.request.user.id})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        headers = self.get_success_headers(serializer.data)
        print(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

@api_view(['GET'])
def check_quiz_lobby_ownership(request, lobby_id):

    user = request.user
    quiz_lobby = get_object_or_404(QuizLobby, id=lobby_id)
    is_creator = quiz_lobby.creator == user

    return Response({'is_creator': is_creator}, status=status.HTTP_200_OK)


@api_view(['POST'])
def check_quiz_lobby_password(request, lobby_id):
    quiz_lobby = get_object_or_404(QuizLobby, id=lobby_id)
    if quiz_lobby.password is None:
        return Response({'is_correct': True}, status=status.HTTP_200_OK)
    else:
        provided_password = request.data.get('password')
        is_password_correct = check_password(provided_password, quiz_lobby.password)
        return Response({'is_correct': is_password_correct}, status=status.HTTP_200_OK)