import React, { useEffect, useState, useRef } from 'react';
import { Card, Input, Button, Select, List,Row,Col } from 'antd';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { PlayCircleOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useAuthHeader } from 'react-auth-kit';
import { useNavigate } from 'react-router-dom';
import { Content } from 'antd/es/layout/layout';
const { Meta } = Card;
const { Option } = Select;

const QuizHistory: React.FC = () => {
  type Quiz = {
    id: number;
    name: string;
    user: string;
    description?: string;
    quizCategories: string;
  };
  type QuizResults = {
    quiz: Quiz;
    score: number;
    date: string;
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
      .get('/api/quizResults/', {
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
      .get('/api/listCategory/')
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
  return (
    <Content>
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

      <List 
        grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 }}
        dataSource={filteredQuiz}
        bordered
        pagination={{position: 'bottom',align: 'start' ,
          onChange: (page) => setCurrentPage(page),
          pageSize: 6,
        }}
        renderItem={(item: QuizResults, index: number) => (
          <List.Item>
                <Row style={{border: '1px solid #ccc'}}>
                    <Col xs={{ span: 24 }} lg={{ span: 1, offset: 0 }}>
                    <div style={{ margin: '10px'}}>
                    {`Nr ${index + 1 + (6 * (currentPage - 1))}`}
                            </div>
                    </Col>
                    <Col xs={{ span: 24 }} lg={{ span: 8, offset: 0 }}>
                    <div style={{  margin: '10px' }}>
                                <p>{`Nazwa Quizu ${item.quiz.name}`}</p>
                            </div>
                    </Col>
                    <Col xs={{ span: 24}} lg={{ span: 1, offset: 0 }}>
                    <div style={{  margin: '10px'}}>
                                <p>{`Punkty ${item.score} `}</p>
                            </div>
                    </Col>
                    <Col xs={{ span: 24}} lg={{ span: 8, offset: 0 }}>
                    <div style={{  margin: '10px'}}>
                     <p>{`Kategorie ${item.quiz.quizCategories} `}</p>
                    </div>
                    </Col>
                    <Col xs={{ span: 24 }} lg={{ span: 6, offset: 0}}>
                    <div style={{ margin: '10px'}}>
                                <p>{`Data: ${formatDateString(item.date)}`}</p>
                            </div>
                    </Col>
                </Row>
          </List.Item>
        )}
      />
    </Content>
  );
};

export default QuizHistory;
