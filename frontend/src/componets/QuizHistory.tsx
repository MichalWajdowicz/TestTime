import React, { useEffect, useState, useRef } from 'react';
import {  Input, Button, Select, List,Row,Col,Modal } from 'antd';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { SearchOutlined } from '@ant-design/icons';
import { useAuthHeader } from 'react-auth-kit';
import { Content } from 'antd/es/layout/layout';
const { Option } = Select;

const QuizHistory: React.FC = () => {
  type Quiz = {
    id: number;
    name: string;
    user: string;
    description?: string;
    quizCategory: string;
  };
  type QuizResults = {
    quiz: Quiz;
    score: number;
    date: string;
    userAnswers:{
      question: string;
      answers: {
        answer:string
        good_answer:boolean
      }[];
    }[];
  };
  type Category = {
    name: string;
  };
  const authHeader = useAuthHeader();
  const [filteredQuiz, setFilteredQuiz] = useState<QuizResults[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const shouldLog = useRef(true);
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { Authorization: authHeader() },
  });

  const fetchQuizData = (searchQuery: string, categories: string[], date?: string) => {
    axiosInstance
      .get('/api/quiz-results/', {
        params: { searchQuery, categories: categories.join(','), date },
      })
      .then((response: AxiosResponse) => {
        setFilteredQuiz(response.data);
      })
      .catch((err: AxiosError) => {
        console.log(err);
      });
  };

  const fetchCategories = () => {
    axiosInstance
      .get('/api/categories/')
      .then((response: AxiosResponse) => {
        setCategories(response.data);
      })
      .catch((err: AxiosError) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (shouldLog.current) {
      shouldLog.current = false;
      fetchQuizData('', []);
      fetchCategories();
    }
  }, []);

  const handleSearch = () => {
    fetchQuizData(searchQuery, selectedCategories,  selectedDate || undefined);
  };

  const handleCategoryChange = (value: string[]) => {
    setSelectedCategories(value);
    // Fetch data when categories change
    fetchQuizData(searchQuery, value, selectedDate || undefined);
  };

  const handleDateChange = (date: string | null) => {
    setSelectedDate(date);
    fetchQuizData(searchQuery, selectedCategories, date || undefined);
  };
  const formatDateString = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    });
  };
  const [selectedQuiz, setSelectedQuiz] = useState<QuizResults | null>(null);

  const handleQuizDetails = (quiz: QuizResults) => {
    setSelectedQuiz(quiz);
  };

  const closeModal = () => {
    setSelectedQuiz(null);
  };
  return (
    <Content style={{paddingTop:"3rem"}}>
      <div style={{ display: 'flex', marginBottom: '16px' }}>
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
          style={{ marginRight: '8px' }}
        />
        <Select
          mode="multiple"
          style={{ width: '40%', marginRight: '8px' }}
          placeholder="Select categories"
          onChange={handleCategoryChange}
          value={selectedCategories}
        >
          {categories.map((category) => (
            <Option key={category.name} value={category.name}>
              {category.name}
            </Option>
          ))}
        </Select>
        <Input
          type="date"
          placeholder="Select date"
          onChange={(e) => handleDateChange(e.target.value)}
          style={{ marginRight: '8px' }}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          Search
        </Button>
      </div>

      <List style={{paddingTop:"20px"}} 
        grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
        dataSource={filteredQuiz}
        bordered
        pagination={{position: 'bottom',align: 'start' ,
          onChange: (page) => setCurrentPage(page),
          pageSize: 7,
        }}
        renderItem={(item: QuizResults, index: number) => (
          <List.Item>
                <Row style={{border: '1px solid #ccc'}}>
                    <Col xs={{ span: 24 }} lg={{ span: 1, offset: 0 }}>
                    <div style={{ margin: '10px'}}>
                    {`Nr ${index + 1 + (7 * (currentPage - 1))}`}
                            </div>
                    </Col>
                    <Col xs={{ span: 24 }} lg={{ span: 8, offset: 0 }}>
                    <div style={{  margin: '10px' }}>
                                <p>{`Nazwa Quizu ${item.quiz.name}`}</p>
                            </div>
                    </Col>
                    <Col xs={{ span: 24}} lg={{ span: 2, offset: 0 }}>
                    <div style={{  margin: '10px'}}>
                                <p>{`Punkty ${item.score} `}</p>
                            </div>
                    </Col>
                    <Col xs={{ span: 24}} lg={{ span: 6, offset: 0 }}>
                    <div style={{  margin: '10px'}}>
                     <p>{`Kategorie ${item.quiz.quizCategory} `}</p>
                    </div>
                    </Col>
                    <Col xs={{ span: 24 }} lg={{ span: 6, offset: 0}}>
                    <div style={{ margin: '10px'}}>
                                <p>{`Data: ${formatDateString(item.date)}`}</p>
                            </div>
                    </Col>
                    <Col xs={{ span: 24 }} lg={{ span: 2, offset: 0 }}>
                      <div style={{ margin: '10px' }}>
                        <Button type="primary" onClick={() => handleQuizDetails(item)}>
                          Szczegóły
                        </Button>
                      </div>
                    </Col>
                </Row>
          </List.Item>
        )}
      />
<Modal
  title="Szczegóły Quizu"
  open={!!selectedQuiz}
  onCancel={closeModal}
  footer={null}
>
  {selectedQuiz && (
    <>
      <p>Nazwa Quizu: {selectedQuiz.quiz.name}</p>
      <p>Opis: {selectedQuiz.quiz.description}</p>
      <p>Kategoria: {selectedQuiz.quiz.quizCategory}</p>
      <p>Data: {formatDateString(selectedQuiz.date)}</p>
      <p>Wynik: {selectedQuiz.score}</p>
      <p>Odpowiedzi:</p>
      <List
        dataSource={selectedQuiz.userAnswers}
        renderItem={(item) => (
          <List.Item>
            <p>Pytanie: {item.question}</p>
            <p>
              Odpowiedzi:{' '}
              {item.answers.map((answer, index) => (
                <span key={index} style={{ color: answer.good_answer ? 'green' : 'red' }}>
                  {answer.answer}
                  {index < item.answers.length - 1 ? '; ' : ''}
                </span>
              ))}
            </p>
          </List.Item>
        )}
      />
    </>
  )}
</Modal>
    </Content>
  );
};

export default QuizHistory;
