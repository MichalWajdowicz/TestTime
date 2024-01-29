import React, { useState, useRef, useEffect } from 'react';
import { Steps, Button, Checkbox, Card, message, Modal,Row,Col } from 'antd';
import { useParams } from 'react-router-dom';
import { useAuthHeader } from 'react-auth-kit';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const { Step } = Steps;

type Answer = {
  answer: string;
  good_answer: boolean;
};

type Question = {
  name: string;
  answers: Answer[];
};

type Categories = {
  name: string;
};

type Quiz = {
  name: string;
  user: string;
  description: string;
  quizCategories: Categories[];
  questions: Question[];
  duration: number;
};

type QuestioResults = {
  question: string;
  selectedAnswer: string[];
};
type QuizResults = {
  quizId: number;
  quizResults: QuestioResults[];
};
type Results = {
  overall_score: number;
  questions: {
    question_text: string;
    selected_answers: string[];
    correct_answers: string[];
    is_correct: boolean;
  }[];
};
const QuizComponent: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Array<Array<string>>>([]);
  const [quizResults, setQuizResults] = useState<QuizResults>({} as QuizResults);
  const [quizData, setQuizData] = useState<Quiz>({} as Quiz);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState<Results>({} as Results);
  const [results, setResults] = useState(false);
  const { id } = useParams();
  const authHeader = useAuthHeader();
  const shouldLog = useRef(true);
  const [quizResultsId, setQuizResultsId] = useState(Number);
  const navigate = useNavigate();
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timeExpired, setTimeExpired] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (shouldLog.current) {
      shouldLog.current = false;
      axios
        .get(`http://localhost:8000/api/quiz/${id}/`, {
          headers: { Authorization: authHeader() },
        })
        .then((response: AxiosResponse) => {
          setQuizData(response.data);
          // Initialize answers array with empty arrays for each question
          setAnswers(new Array(response.data.questions.length).fill([]));
        })
        .catch((err: AxiosError) => {
          console.log(err);
        });
    }
  }, [id, authHeader]);

  
  const fetchQuizData = async () => {
    let values = {
      quizId: id,
    };
    try {
      const response = await axios.post(`http://localhost:8000/api/quiz-results/`, values, {
        headers: { Authorization: authHeader() },
      });
      setQuizResultsId(response.data.id);
      setQuizResults({
        quizId: response.data.id,
        quizResults: [],
      });
      fetchQuizTime(response.data.id);
    } catch (err: any) {
      if (err.response !== undefined) {
        for (let [key, value] of Object.entries(err.response.data)) {
          message.error(`${value}`, 4);
        }
      }
      navigate("/dashboard");
    }
  };

  const fetchQuizTime = async (timeId: number) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/quiz-results/${timeId}/time-remaining/`, {
        headers: { Authorization: authHeader() },
      });
      setTimeRemaining(response.data.timeRemaining);
    } catch (err: any) {
      if (err.response !== undefined) {
        for (let [key, value] of Object.entries(err.response.data)) {
          message.error(`${value}`, 4);
        }
      }
      navigate("/dashboard");
    }
  };

  const handleStartQuiz = () => {
    fetchQuizData();
    setCountdownStarted(true);
    setHasStarted(true);
  };

  const formatTime = (timeInSeconds: any) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleAnswerChange = (checkedValues: CheckboxValueType[]) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = checkedValues.map(String);
    setAnswers(newAnswers);

    setQuizResults((prevResults) => {
      const updatedResults = {
        quizId: prevResults.quizId,
        quizResults: [...prevResults.quizResults],
      };
      updatedResults.quizResults[currentStep] = {
        question: quizData?.questions?.[currentStep]?.name || "",
        selectedAnswer: checkedValues.map(String),
      };

      return updatedResults;
    });
  };

  const handleNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleFinishQuiz = () => {
    
    const isAnswered = answers.every(answer => answer.length > 0);

    if (isAnswered) {
      setQuizCompleted(true);
    } else {
      
      message.info("Please answer all questions before finishing.",4);

    }
  };
  const checkAnswers = async() => {
       try {
      const response = await axios.post(
        "http://localhost:8000/api/check-answer/",
        quizResults, { headers: { 'Authorization': authHeader() } }
      );
      setScore(response.data);
      setResults(true);
    } catch (err: any) {
      if (err.response !== undefined) {
        for (let [key, value] of Object.entries(err.response.data)) {
                message.error(`${value}`, 4);
        }
    }}
    
};
const handleStepClick = (step: number) => {
  setCurrentStep(step);
};

const backToQuiz = () => {
  setQuizCompleted(false);
};

useEffect(() => {
  if (quizData.duration) {
    setTimeRemaining(quizData.duration * 60);
  }
}, [quizData]);

useEffect(() => {
  if (countdownStarted && timeRemaining > 0) {
    const intervalId = setInterval(() => {
      setTimeRemaining((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  } else if (timeRemaining <= 0 && hasStarted) {
    setTimeExpired(true);
    setResults(true);
    setQuizCompleted(true);
    checkAnswers();
  }
}, [countdownStarted, timeRemaining, hasStarted]);

const userAnswer = () => {
  return (
      <>
                  {quizData.questions.map((question, index) => (
                    <div key={index}>
                      <h3>{question.name}</h3>
                      <p>Twoje odpowiedzi: {answers[index].join(', ')}</p>
                    </div>
                  ))}
                  {/* Confirm Completion Button */}
                  <div style={{marginBottom:"10px"}}>
                  <Button type="primary" style={{width:"auto"}} onClick={backToQuiz}>
                    Powrót
                  </Button></div>
                  <div style={{marginBottom:"10px"}}>
                  <Button type="primary" style={{width:"auto"}} onClick={checkAnswers}>
                  Potwierdź zakończenie
                  </Button></div>
      </>
    );
  };
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };
  
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const userScore = () => {
    return (
      <>
        
        
          <h3>Twój wynik: {score.overall_score}</h3>
          <div style={{marginBottom:"10px"}}>
            <Link to="/dashboard">
              
              <Button type="primary"style={{width:"auto"}} >
                Przejdź do quizów
              </Button>
            </Link></div>
            <div style={{marginBottom:"10px"}}>
            <Button type="primary" style={{width:"auto"}}  onClick={showModal}>
              Sprawdź odpowiedzi
            </Button>
        </div>
        <Modal title="Podsumowanie" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
          {score.questions.map((question, index) => (
            <div key={index}>
              <h3>Pytanie: {question.question_text}</h3>
              <p>Twoje odpowiedzi: {question.selected_answers ? question.selected_answers.join(', ') : 'Brak odpowiedzi'}</p>
              <p>Prawidłowe odpowiedzi: {question.correct_answers ? question.correct_answers.join(', ') : 'Brak odpowiedzi'}</p>
              <p>Poprawna odpowiedź: {question.is_correct ? 'Tak' : 'Nie'}</p>
            </div>
          ))}
        </Modal>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', }}>
      <div>
        {!hasStarted ? (
          <Card title={quizData.name} style={{ width: "50vw" }}>
            <p>{quizData.description}</p>
            <Button type="primary" onClick={handleStartQuiz}>
              Rozpocznij quiz
            </Button>
          </Card>
        ) : (
          <>
            {!quizCompleted && (
              <Card title={`Pytanie ${currentStep + 1} - ${formatTime(timeRemaining)} minut`} style={{ width: "50vw"}}>
                <Steps current={currentStep} responsive>
                  {quizData?.questions?.map((question, index) => {
                    const status =
                      index < currentStep
                        ? answers[index].length > 0
                          ? 'finish'
                          : 'error'
                        : index === currentStep
                        ? 'process'
                        : answers[index].length > 0
                        ? 'finish'
                        : 'wait';

                    return (
                      <Step
                        key={index}
                        status={status}
                        onClick={() => handleStepClick(index)}
                      />
                    );
                  })}
                </Steps>
                <div>
                  <h3>{quizData?.questions?.[currentStep]?.name}</h3>
                  <Checkbox.Group onChange={handleAnswerChange} value={answers[currentStep]}>
                    {quizData?.questions?.[currentStep]?.answers?.map((answer, index) => (
                      <Checkbox key={`${currentStep}+${index}`} value={answer.answer}>
                        {answer.answer}
                      </Checkbox>
                    ))}
                  </Checkbox.Group>
                  <div style={{ marginTop: '24px' }}>
                    {currentStep > 0 && (
                      <Button
                        style={{ marginRight: '8px' }}
                        onClick={() => setCurrentStep((prevStep) => prevStep - 1)}
                      >
                        Poprzedni
                      </Button>
                    )}
                    {currentStep < quizData.questions.length - 1 ? (
                      <Button type="primary" onClick={handleNextStep}>
                        Następny
                      </Button>
                    ) : (
                      <Button type="primary" onClick={handleFinishQuiz}>
                        Zakończ
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
            {quizCompleted && (
              <Card title="Wynik" style={{ width: "auto" }}>
                {results ? userScore() : userAnswer()}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuizComponent;