import json
from collections import defaultdict

from channels.generic.websocket import AsyncWebsocketConsumer
from .models import QuizLobby, Questions, Answers, QuizResults, UserAnswers
from .serializers import QuizLobbySerializerList, QuizsSerializer, QuizResultsSerializer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User
from channels.exceptions import StopConsumer
import asyncio

class LobbyConsumer(AsyncWebsocketConsumer):
    users_answers = []
    users_answers_round = []
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.question_data = None
        self.is_Completed = False
        self.user = None
        self.duration = 10
    async def connect(self):
        self.lobby_id = self.scope['url_route']['kwargs']['lobby_id']

        lobby_exists, is_end = await self.check_lobby_status(self.lobby_id)
        mebers_count = await self.check_count_of_members(self.lobby_id)
        if not lobby_exists or is_end:
            await self.accept()
            await self.send(text_data=json.dumps({
                'type': 'lobby.error',
                'message': 'Looby nie istnieje lub jest zakończone'
            }))
            await self.close(code=4001)
            return

        if mebers_count >= 4:
            await self.accept()
            await self.send(text_data=json.dumps({
                'type': 'lobby.error',
                'message': 'Lobby jest pełne'
            }))
            await self.close(code=4001)
            return
        await self.channel_layer.group_add(
            self.lobby_id,
            self.channel_name
        )
        if self.scope['cookies'].get('_auth') is None:
            await self.accept()
            await self.send(text_data=json.dumps({
                'type': 'lobby.error',
                'message': 'Problem z ciasteczkami'
            }))
            await self.close(code=4001)
            return

        await self.accept()
        token = self.scope['cookies']['_auth']

        user = await self.get_user_from_token(token)
        if user is not None:
            self.user = user
            await self.isOwnerJoin(user.id)
            await self.add_user_to_lobby(user.id)
            await self.channel_layer.group_send(
                self.lobby_id,
                {
                    'type': 'user.joined',
                    'user_id': user.id,
                    'message': 'User joined'
                }
            )
        else:
            await self.close()

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get('type') == 'start.quiz':
            LobbyConsumer.user_answers = []
            asyncio.ensure_future(self.start_quiz())
        elif data.get('type') == 'user.answer':
            asyncio.ensure_future(self.handle_user_answer(data))
    async def user_joined(self, event):

        lobby_members = await self.get_lobby_members()

        await self.send(text_data=json.dumps({
            'lobby_members': lobby_members
        }))

    async def disconnect(self, close_code):
        token = self.scope['cookies']['_auth']
        user = await self.get_user_from_token(token)

        if user is not None:
            removed = await self.remove_user_from_lobby(user.id)

            await self.isOwnerLeft(user.id)
            if removed:
                lobby_members = await self.get_lobby_members()

                await self.channel_layer.group_send(
                    self.lobby_id,
                    {
                        'type': 'user.left',
                        'lobby_members': lobby_members
                    }
                )

        await self.channel_layer.group_discard(
            self.lobby_id,
            self.channel_name
        )

    async def start_quiz(self):
        await self.send(text_data=json.dumps({
            'type': 'quiz.started',
            'message': 'Quiz rozpoczęty',
        }))

        question_data = await self.get_first_question_data()
        await self.set_quiz_started_flag()
        await self.channel_layer.group_send(
            self.lobby_id,
            {
                'type': 'quiz.question',
                'question_data': question_data,
            }
        )
        await self.start_countdown()

    async def start_countdown(self):
        for seconds_left in range(self.duration, 0, -1):
            await asyncio.sleep(1)
            await self.send_countdown_update(seconds_left)
        await self.display_answers()
        await asyncio.sleep(10)
        await self.next_question()

    async def send_countdown_update(self, seconds_left):
        await self.channel_layer.group_send(
            self.lobby_id,
            {
                'type': 'countdown.update',
                'seconds_left': seconds_left,
            }
        )
    async def countdown_update(self, event):
        seconds_left = event['seconds_left']
        await self.send(text_data=json.dumps({
            'type': 'countdown.update',
            'seconds_left': seconds_left,
        }))

    async def handle_user_answer(self, data):

        answer_data = {
            'username': self.user.username,
            'question': data['question'],
            'selected_answers': data['selected_answers'],
        }
        LobbyConsumer.users_answers.append(answer_data)
        LobbyConsumer.users_answers_round.append(await self.convert_answers_data(answer_data))
        await self.send(text_data=json.dumps({
            'type': 'answer.received',
            'message': 'Odpowiedź odebrana',
        }))

    async def display_answers(self):
        await self.channel_layer.group_send(
            self.lobby_id,
            {
                'type': 'quiz.answers',
                'answers_data': LobbyConsumer.users_answers_round ,
            }
        )
        LobbyConsumer.users_answers_round = []

    async def quiz_answers(self, event):
        answers_data = event['answers_data']

        await self.send(text_data=json.dumps({
            'type': 'quiz.answers',
            'answers_data': answers_data,
        }))
    async def quiz_question(self, event):
        question_data = event['question_data']

        await self.send(text_data=json.dumps({
            'type': 'quiz.question',
            'question_data': question_data,
        }))

    @database_sync_to_async
    def get_first_question_data(self):
        try:
            quiz_lobby_instance = QuizLobby.objects.get(id=self.lobby_id)
            self.duration = quiz_lobby_instance.questionTime
            quiz = quiz_lobby_instance.quiz
            first_question = quiz.questions.first()
            answers = list(first_question.answers.all())

            question_data = {
                'question_text': first_question.name,
                'answers': [{'id': answer.id, 'text': answer.answer} for answer in answers],
            }

            return question_data
        except (QuizLobby.DoesNotExist, Questions.DoesNotExist, Answers.DoesNotExist):
            return {
                'type': 'quiz_lobby',
                'error': 'Quiz lobby, pytanie lub odpowiedź nie znaleziono',
            }

    @database_sync_to_async
    def set_quiz_started_flag(self):
        try:
            quiz_lobby_instance = QuizLobby.objects.get(id=self.lobby_id)
            quiz_lobby_instance.quiz_started = True
            quiz_lobby_instance.save()
        except QuizLobby.DoesNotExist:
            pass

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            userID = access_token.payload.get('user_id')
            user = User.objects.get(id=userID)
            return user
        except Exception as e:
            print(e)
            return None
    @database_sync_to_async
    def add_user_to_lobby(self, user_id):
        if user_id is not None:
            lobby = QuizLobby.objects.get(id=self.lobby_id)
            lobby.members.add(user_id)

    @database_sync_to_async
    def get_lobby_members(self):
        lobby = QuizLobby.objects.get(id=self.lobby_id)

        lobby_members = [{'id': member.id, 'username': member.username} for member in lobby.members.all()]

        return lobby_members

    @database_sync_to_async
    def remove_user_from_lobby(self, user_id):
        try:
            if user_id is not None:
                lobby = QuizLobby.objects.get(id=self.lobby_id)
                lobby.members.remove(user_id)

                return True
        except QuizLobby.DoesNotExist:
            return False
    async def user_left(self, event):
        lobby_members = event.get('lobby_members', [])

        await self.send(text_data=json.dumps({
            'lobby_members': lobby_members
        }))

    async def next_question(self):
        self.question_data = await self.get_next_question_data()
        if not self.is_Completed:
            await self.channel_layer.group_send(
                self.lobby_id,
                {
                    'type': 'quiz.question',
                    'question_data': self.question_data,
                }
            )
            await self.start_countdown()
        else:
            await self.send_results()


    @database_sync_to_async
    def get_next_question_data(self):
        try:
            quiz_lobby_instance = QuizLobby.objects.get(id=self.lobby_id)
            quiz = quiz_lobby_instance.quiz
            current_question_index = quiz_lobby_instance.current_question_index
            questions = list(quiz.questions.all())

            if current_question_index + 1 < len(questions):
                next_question_index = current_question_index + 1
            else:
                self.is_Completed = True
                quiz_lobby_instance.is_completed = True
                quiz_lobby_instance.save()
                return {'type': 'quiz_ended', 'message': 'Koniec quizu'}

            quiz_lobby_instance.current_question_index = next_question_index
            quiz_lobby_instance.save()
            next_question = questions[next_question_index]

            answers = list(next_question.answers.all())

            question_data = {
                'question_text': next_question.name,
                'answers': [{'id': answer.id, 'text': answer.answer} for answer in answers],
            }

            return question_data
        except (QuizLobby.DoesNotExist, Questions.DoesNotExist, Answers.DoesNotExist) as e:
            print(e)
            return {
                'type': 'quiz_lobby',
                'error': 'Quiz lobby, pytanie lub odpowiedź nie znaleziono',
            }

    @database_sync_to_async
    def convert_answers_data(self,answer_data):
        return {
            'username': answer_data['username'],
            'question': answer_data['question'],
            'selected_answers': [
                Answers.objects.get(id=answer_id).answer
                for answer_id in answer_data['selected_answers']
            ],
        }

    async def send_results(self):

        results = await self.calculate_results()

        await self.channel_layer.group_send(
            self.lobby_id,
            {
                'type': 'quiz.results',
                'results': results,
            }
        )

    async def quiz_results(self, event):
        results = event['results']

        await self.send(text_data=json.dumps({
            'type': 'quiz.results',
            'results': results,
        }))

    @database_sync_to_async
    def calculate_results(self):
        user_answers_grouped = defaultdict(list)
        for answer in LobbyConsumer.users_answers:
            user_answers_grouped[answer['username']].append(answer)

        quiz_scores = []
        quiz_lobby_instance = QuizLobby.objects.get(id=self.lobby_id)
        quiz = quiz_lobby_instance.quiz

        for username, answers in user_answers_grouped.items():
            user = User.objects.get(username=username)
            total_score = 0

            for answer in answers:
                question = Questions.objects.get(name=answer['question'], quiz=quiz)
                correct_answers = list(question.answers.filter(good_answer=True).values_list('id', flat=True))
                score = self.calculate_user_score(answer['selected_answers'], correct_answers)
                total_score += score
            quiz_scores.append({'username': user.username, 'score': total_score})
            if quiz.user != user and not QuizResults.objects.filter(quiz=quiz, user=user).exists():
                quiz_result = QuizResults.objects.create(quiz=quiz, user=user, score=total_score, isStarted=True,
                                                         isCompleted=True)

                for answer in answers:
                    question = Questions.objects.get(name=answer['question'], quiz=quiz)
                    user_answer_instance = UserAnswers.objects.create(quizResult=quiz_result, question=question)
                    answer_objects = Answers.objects.filter(id__in=answer['selected_answers'])
                    user_answer_instance.answers.set(answer_objects)

        return quiz_scores


    def calculate_user_score(self, selected_answers, correct_answers):
        score = 0
        is_correct = all(answer in correct_answers for answer in selected_answers)
        score += 1 if is_correct else 0

        return score
    @database_sync_to_async
    def check_lobby_status(self, lobby_id):
        try:
            lobby = QuizLobby.objects.get(id=lobby_id)
            return True, lobby.is_completed
        except QuizLobby.DoesNotExist:
            return False, False

    @database_sync_to_async
    def check_count_of_members(self, lobby_id):
        try:
            lobby = QuizLobby.objects.get(id=lobby_id)
            return lobby.members.count()
        except QuizLobby.DoesNotExist:
            return False
    @database_sync_to_async
    def isOwnerLeft(self, user_id):
        try:
            lobby = QuizLobby.objects.get(id=self.lobby_id)
            if lobby.creator.id == user_id:
                QuizLobby.objects.filter(id=self.lobby_id).update(is_active=False)
            return True
        except QuizLobby.DoesNotExist:
            return False
    @database_sync_to_async
    def isOwnerJoin(self, user_id):
        try:
            lobby = QuizLobby.objects.get(id=self.lobby_id)
            if lobby.creator.id == user_id:
                QuizLobby.objects.filter(id=self.lobby_id).update(is_active=True)
            return True
        except QuizLobby.DoesNotExist:
            return False
