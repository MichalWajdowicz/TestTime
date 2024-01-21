import React, { useState, useRef, useEffect } from 'react';
import { Steps, Button, Checkbox } from 'antd';
import { useParams } from 'react-router-dom';
import { useAuthHeader } from 'react-auth-kit';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { CheckboxValueType } from 'antd/lib/checkbox/Group';
import { Link } from 'react-router-dom';

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
};

type QuestioResults = {
  question: string;
  selectedAnswer: string[];
};
type QuizResults = {
  quizId: number;
  quizResults: QuestioResults[];
};

const QuizComponent: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Array<Array<string>>>([]);
  const [quizResults, setQuizResults] = useState<QuizResults>({} as QuizResults);
  const [quizData, setQuizData] = useState<Quiz>({} as Quiz);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState(false);
  const { id } = useParams();
  const authHeader = useAuthHeader();
  const shouldLog = useRef(true);
  const [quizResultsId, setQuizResultsId] = useState(Number);
 

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
      const response = await axios.post(`http://localhost:8000/api/quizResults/`, values, {
        headers: { Authorization: authHeader() },
      });
      setQuizResultsId(response.data.id);
    } catch (error) {
      console.error(error);
    }
  }

  const handleStartQuiz = () => {
    setHasStarted(true);
    fetchQuizData();
  };


  const handleAnswerChange = (checkedValues: CheckboxValueType[]) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = checkedValues.map(String);
    setAnswers(newAnswers);
  };

  const handleNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleFinishQuiz = () => {
    // Sprawdź, czy na każde pytanie udzielono odpowiedzi
    const isAnswered = answers.every(answer => answer.length > 0);

    if (isAnswered) {
      handleFinishQuiz2();
    } else {
      // Wyświetl powiadomienie, że należy odpowiedzieć na wszystkie pytania messag antd
      console.log("Please answer all questions before finishing.");
      // Możesz również wyświetlić powiadomienie lub podjąć inne działania
    }
  };

  const handleFinishQuiz2 = () => {
    setQuizResults({
      quizId: quizResultsId,
      quizResults: quizData.questions.map((question, index) => ({
        question: question.name,
        selectedAnswer: answers[index],
      })),
    });
    setQuizCompleted(true);
  };

  const senToBackend = async() => {
       try {
      const response = await axios.post(
        "http://localhost:8000/api/checkAnswer/",
        quizResults, { headers: { 'Authorization': authHeader() } }
      );
      setScore(response.data.overall_score);
      setResults(true);
    } catch (error) {
      console.error(error);
    }
};
const handleStepClick = (step: number) => {
  setCurrentStep(step);
};

const backToQuiz = () => {
  setQuizCompleted(false);
};

const userAnswer = () => {
  return (
      <>
                  {quizData.questions.map((question, index) => (
                    <div key={index}>
                      <h3>{question.name}</h3>
                      <p>User's Answer: {answers[index].join(', ')}</p>
                    </div>
                  ))}
                  {/* Confirm Completion Button */}
                  <Button type="primary" onClick={backToQuiz}>
                    Back
                  </Button>
                  <Button type="primary" onClick={senToBackend}>
                    Confirm Completion
                  </Button>
      </>
    );
  };

  const userScore = () => {
    return (
      <>
        <h3>Your score is: {score}</h3>
        <Link to="/dashboard"> <Button type="primary" >
          Przejdz do quizów
        </Button></Link>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        {!hasStarted ? (
          <Button type="primary" onClick={handleStartQuiz}>
            Start
          </Button>
        ) : (
          <>{!quizCompleted &&(
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
                  // Dodaj tę linię do obsługi kliknięcia na krok
                />
              );
            })}
          </Steps>)}
            <div>
              {quizCompleted ? 
              (
                results ? (
                userScore()
                ) :
                userAnswer()
              ) 
              : (
                <>
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
                    <Button style={{ marginRight: '8px' }} onClick={() => setCurrentStep((prevStep) => prevStep - 1)}>
                      Previous
                    </Button>
                  )}
                  {currentStep < quizData.questions.length - 1 ? (
                    <Button type="primary" onClick={handleNextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button type="primary" onClick={handleFinishQuiz}>
                      Finish
                    </Button>
                  )}
                </div>
              </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizComponent;