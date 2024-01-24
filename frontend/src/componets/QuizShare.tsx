import React, { useEffect, useState,useRef } from 'react';
import { Card, List, Input, Button, Select, Modal } from 'antd';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { PlayCircleOutlined, InfoCircleOutlined, SearchOutlined } from '@ant-design/icons';
import {useAuthHeader} from 'react-auth-kit'
import { useNavigate  } from 'react-router-dom';
import { Content } from 'antd/es/layout/layout';
const { Meta } = Card;
const { Option } = Select;

const App: React.FC = () => {
  type Quiz = {
    id : number;
    name: string;
    user: string;
    description?: string;
    quizCategory: string;
  };
  type Category = {
    name: string;
  };
  const navigate = useNavigate();
  const authHeader = useAuthHeader();
  const [text, setText] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filteredQuiz, setFilteredQuiz] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [id, setId] = useState<number>(0);
  const shouldLog=useRef(true);
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Authorization': authHeader() },
  });

  const showModal = (description:string | undefined) => {
    setText(description);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };
  
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const openQuiz = (n:number) => {
    navigate(`/quiz/${n}`)
  };

  const fetchQuizData = (searchQuery: string, categories: string[]) => {
    axiosInstance
      .get('/api/quiz/', {
        params: { searchQuery, categories: categories.join(',') } , 
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
      shouldLog.current = false
    fetchQuizData("", []);
    fetchCategories();
    }
  }, []);


  const handleSearch = () => {
    fetchQuizData(searchQuery, selectedCategories);
  };

  const handleCategoryChange = (value: string[]) => {
    setSelectedCategories(value);
    // Fetch data when categories change
    fetchQuizData(searchQuery, value);
  };
  return (
    <Content style={{paddingTop:"2rem"}}>
      <div style={{ display: 'flex', marginBottom: '16px',  paddingBottom:"2rem"}}>
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
          },
          pageSize: 9,
        }}
        dataSource={filteredQuiz}
        renderItem={(item: Quiz) => (
          <List.Item>
            <Card
              actions={[
                <InfoCircleOutlined onClick={() => showModal(item.description)} style={{ fontSize: 20 }} />,
                
                <PlayCircleOutlined onClick={() => openQuiz(item.id)} style={{ fontSize: 20 }}  />,
                
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
                  {item.quizCategory}
                </div>
              </div>

            </Card>
          </List.Item>
        )}
      />
                    <Modal title="Opis Quizu" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        {text}
        </Modal>
    </Content>
    
  );
};

export default App;
