import React, { useState } from 'react';
import { Card, Radio, Button, Result } from 'antd';
import 'antd/dist/antd.css';
import { RadioChangeEvent } from 'antd/lib/radio';
interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
}

const questions: Question[] = [
  {
    question: 'Co to jest React?',
    options: ['Framework', 'Biblioteka', 'Język programowania'],
    correctAnswer: 'Biblioteka',
  },
  // Dodaj więcej pytań według potrzeb
];

const Quiz: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const handleOptionChange = (e: RadioChangeEvent) => {
    setSelectedOption(e.target.value);
  };

  const handleNextQuestion = () => {
    if (selectedOption === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    setCurrentQuestion(currentQuestion + 1);
    setSelectedOption(null);
  };

  return (
    <Card title={`Pytanie ${currentQuestion + 1}`}>
      {currentQuestion < questions.length ? (
        <>
          <p>{questions[currentQuestion].question}</p>
          <Radio.Group onChange={(e) => handleOptionChange(e)} value={selectedOption}>
            {questions[currentQuestion].options.map((option, index) => (
              <Radio key={index} value={option}>
                {option}
              </Radio>
            ))}
          </Radio.Group>
          <Button type="primary" onClick={handleNextQuestion} style={{ marginTop: '10px' }}>
            Dalej
          </Button>
        </>
      ) : (
        <Result
          title={`Twój wynik: ${score}/${questions.length}`}
          extra={<Button type="primary">Powrót do quizów</Button>}
        />
      )}
    </Card>
  );
};

export {};
