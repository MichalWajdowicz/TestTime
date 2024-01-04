import React, { useEffect, useState } from 'react';
import { Card, List, Input, Button, Select } from 'antd';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { PlayCircleOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';

const { Meta } = Card;
const { Option } = Select;

const App: React.FC = () => {
  type Quiz = {
    name: string;
    user: string;
    description?: string;
    quizCategories: string;
  };
  type Category = {
      name: string;
    };
  const [quiz, setQuiz] = useState<Quiz[]>([]);
  const [filteredQuiz, setFilteredQuiz] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const fetchQuizData = (searchQuery: string, categories: string[]) => {
    axios
      .get('http://localhost:8000/quiz/listQuiz/', {
        params: { searchQuery, categories: categories.join(',') }, // Pass categories as a comma-separated string
      })
      .then((response: AxiosResponse) => {
        setFilteredQuiz(response.data);
      })
      .catch((err: AxiosError) => {
        console.log(err);
      });
  };

  useEffect(() => {
    axios
      .get('http://localhost:8000/quiz/listQuiz/')
      .then((response: AxiosResponse) => {
        setQuiz(response.data);
        setFilteredQuiz(response.data);
      })
      .catch((err: AxiosError) => {
        console.log(err);
      });
  }, []);

  const fetchCategories = () => {
    axios
      .get('http://localhost:8000/quiz/listCategory/')
      .then((response: AxiosResponse) => {
        setCategories(response.data);
      })
      .catch((err: AxiosError) => {
        console.log(err);
      });
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  const handleSearch = () => {
    fetchQuizData(searchQuery, selectedCategories);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCategoryChange = (value: string[]) => {
    setSelectedCategories(value);
    // Fetch data when categories change
    fetchQuizData(searchQuery, value);
  };

  return (
    <div>
      <div style={{ display: 'flex', marginBottom: '16px'  }}>
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
          style={{ marginRight: '8px' }}
        />
                <Select
          mode="multiple"
          style={{ width: '40%' }}
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
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          Search
        </Button>
      </div>
      <List
        grid={{
          gutter: 16,
          xs: 1,
          sm: 2,
          md: 3,
          lg: 3,
          xl: 3,
          xxl: 3,
        }}
        pagination={{
          onChange: (page) => {
            console.log(page);
          },
          pageSize: 9,
        }}
        dataSource={filteredQuiz}
        renderItem={(item: Quiz) => (
          <List.Item>
            <Card
              actions={[
                <PlayCircleOutlined style={{ fontSize: 20 }} />,
                <InfoCircleOutlined style={{ fontSize: 20 }} />,
              ]}
            >
              <Meta title={item.name} />
              <br />
              <div>
                <div style={{ float: 'left' }}>
                  Autor:
                  <br />
                  {item.user}
                </div>
                <div style={{ float: 'right' }}>
                  Kategoria:
                  <br />
                  {item.quizCategories}
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default App;
