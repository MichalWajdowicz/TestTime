import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Button, Checkbox, List, Input, message, Card } from 'antd';

import { useParams } from 'react-router-dom';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { useAuthHeader, useAuthUser } from 'react-auth-kit';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { useNavigate } from 'react-router-dom';

const { Meta } = Card;

interface User {
  id: number;
  username: string;
}


interface Quiz {
  id: number;
  question_text: string;
  answers: { id: number; text: string }[];
  timer?: number;
}
interface QuizAnswer {
  username: string;
  question: string;
  selected_answers: string[];
}
interface QuizResult {
  username: string;
  score: number;
}



const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [owner, setOwner] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [resultsVisible, setResultsVisible] = useState<boolean>(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]); 
  const [quizAnswersVisible, setQuizAnswersVisible] = useState<boolean>(false);
  const [receivedLobbyError, setReceivedLobbyError] = useState<boolean>(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const authHeader = useAuthHeader();
  const socketRef = useRef<WebSocket | null>(null);
  const shouldLog = useRef(true);
  

  const [password, setPassword] = useState('');
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Authorization': authHeader() },
  });
  const fetchOwner = () => {
    axiosInstance
      .get(`/api/lobby/check_quiz_lobby_ownership/${id}/`)
      .then((response: AxiosResponse) => {
        setOwner(response.data.is_creator);
        if (response.data.is_creator) {
          setIsPasswordVerified(true);
        }
      })
      .catch((err: AxiosError) => {
        if (err.response && err.response.status === 404) {
          // If a 404 error is received, navigate to the dashboard
          navigate('/dashboard');
        } else {
          console.log(err);
        }
      });
  };
  const checkPassword = () => {
    axiosInstance
      .post(`/api/lobby/check_quiz_lobby_password/${id}/`, { password })
      .then((response: AxiosResponse) => {
        setIsPasswordVerified(response.data.is_correct);
        if (!response.data.is_correct) {
          message.error('Niepoprawne hasło');
        }
      })
      .catch((err: AxiosError) => {
        console.log(err);
      });
  }
  useEffect(() => {
    
    if (shouldLog.current) {
      shouldLog.current = false;
      fetchOwner();
      setReceivedLobbyError(false);
    }

    if (!socketRef.current) {
      socketRef.current = new WebSocket(`ws://127.0.0.1:8000/ws/lobby/${id}/`);
      socketRef.current.onopen = () => {
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setUsers(data.lobby_members || []);

        if (data.type === 'quiz.question') {
          setCurrentQuestion(data.question_data);
          setCountdown(data.question_data.timer || null);
          setAnswerSubmitted(false); // Reset answer submission status
          setQuizAnswersVisible(false);
        } else if (data.type === 'countdown.update') {
          setCountdown(data.seconds_left);
        } else if (data.type === 'answer.received') {
          setAnswerSubmitted(true); // Mark answer as submitted
          message.success('Odpowiedź została przesłana!');
        } else if (data.type === 'quiz.results') {
          // Handle quiz results if needed
          setQuizResults(data.results);
          setResultsVisible(true);
        }
        else if (data.type === 'quiz.answers') {
          // Handle quiz answers if needed
          setQuizAnswers(data.answers_data
            );
          setQuizAnswersVisible(true);
        }
        else if (data.type === 'lobby.error') {
          message.error(data.message);
          setReceivedLobbyError(true);
          navigate('/dashboard');
        }

      };
      

      socketRef.current.onclose = () => {
      };

      socketRef.current.onerror = (error) => {
        console.log('WebSocket error:', error);
      };
    }

    // Cleanup function
    const cleanup = () => {
      if (!receivedLobbyError && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        message.warning('Odswież stronę, aby odnowić połączenie z serwerem, jesli dostale informacje o błędzie lobby to zignoruj ten komunikat');
        socketRef.current.close();
      }
    };

    // Add event listener for beforeunload
    window.addEventListener('beforeunload', cleanup);

    // Cleanup event listener when the component unmounts
    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };
    
  }, []);

  const handleSendMessage = () => {
    const data = {
      type: 'start.quiz',
      message: 'Start game',
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  const handleAnswerQuestion = () => {
    if (!answerSubmitted) {
      const data = {
        type: 'user.answer',
        question: currentQuestion?.question_text,
        selected_answers: selectedAnswers,
      };

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(data));
      }
    } else {
      message.warning('Przesłałeś już odpowiedź');
    }
  };

  const handleCheckboxChange = (checkedValues: number[]) => {
    setSelectedAnswers(checkedValues);
  };
  const handleExitButton = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    navigate('/dashboard');
  }

  const verifyPassword = () => {
    checkPassword();
  };

  // Modify handleExitButton to reset password verification on exit

  if (!isPasswordVerified) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={24} sm={12} md={8}>
          <Card >
          <Meta
            title="Weryfikacja hasła"
            description="Jesli lobby nie posiada hasla zostaw puste"
          />
            <Input.Password
            style={{ marginTop: 10 }}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={verifyPassword}
            />
            <div style={{ marginTop: 10 }}>
            <Button onClick={verifyPassword} type="primary" style={{ marginRight: 10 }}>Wejdź</Button>
            <Button onClick={handleExitButton} type="default">Powrót do dashboard</Button>
            </div>
          </Card>
          
        </Col>
      </Row>
    );
  }
  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
    <Col xs={24} sm={20} md={16} lg={12} xl={10}>
      <Card>
      <h1>Lobby</h1>
  
      {!resultsVisible && !quizAnswersVisible && !currentQuestion &&(
        <>
          <h2>Users</h2>
          <List
            bordered
            dataSource={users}
            renderItem={(user) => (
              <List.Item key={user.id}>
                {user.username}
              </List.Item>
            )}
          />
          <div style={{marginTop:10}}>
          <Button onClick={handleExitButton} type="primary" style={{marginRight:10}}>Powrót do dashboard</Button>
          {owner && !currentQuestion && (
            <Button type="primary" onClick={handleSendMessage}>
              Start quiz
            </Button>
          )}
          </div>
        </>
      )}
  
      {currentQuestion && !resultsVisible && !quizAnswersVisible && (
        <div>
          <h2>Pytanie: {currentQuestion.question_text}</h2>     
           {countdown !== null && (
            <p>Pozostaly czas: {countdown} sekund</p>
          )}
          <Checkbox.Group
            options={currentQuestion.answers.map((answer) => ({
              label: answer.text,
              value: answer.id,
            }))}
            onChange={(checkedValues: CheckboxValueType[]) => handleCheckboxChange(checkedValues.map(value => Number(value)))}
          />
          {!answerSubmitted ? (
          <Button type="primary" onClick={handleAnswerQuestion}>
            Przyślij odpowiedź 
          </Button>
          ) : (
            <Button type="primary" onClick={handleAnswerQuestion} disabled>
              Przyślij odpowiedź
            </Button>
          )}

        </div>
      )}
  
      {resultsVisible && (
        <div>
          <h2>Wyniki</h2>
          <List
            bordered
            dataSource={quizResults}
            renderItem={(result) => (
              <List.Item>
                {result.username} wynik: {result.score}
              </List.Item>
            )}
          />
          <Button type="primary" onClick={handleExitButton}>
            Powrót do dashboard
          </Button>
        </div>
      )}
  
      {quizAnswersVisible &&  !resultsVisible &&(
        <div>
          <h2>Answers</h2>
          <List
            bordered
            dataSource={quizAnswers}
            renderItem={(answer) => (
              <List.Item>
                Odpowidzi {answer.username} na pytanie {answer.question} to {answer.selected_answers.join(', ')}
              </List.Item>
            )}
          />
        </div>
      )}
            </Card>
      </Col>
    </Row>
  );
}

export default App;