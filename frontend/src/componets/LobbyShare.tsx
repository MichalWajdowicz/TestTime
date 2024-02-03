import React, { useEffect, useState,useRef } from 'react';
import { Card, List, Input, Button, Select, Modal, Form, message } from 'antd';
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
  type Lobby = {
    id: number;
    name: string;
    password: string;
    quiz: Quiz;
    questionTime: number;
    creator: string;
  };
  const navigate = useNavigate();
  const authHeader = useAuthHeader();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filteredLobby, setFilteredLobby] = useState<Lobby[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const shouldLog=useRef(true);
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Authorization': authHeader() },
  });


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

  const fetchLobbyData = (searchQuery: string, categories: string[]) => {
    axiosInstance
      .get('/api/lobby/', {
        params: { searchQuery, categories: categories.join(',') } , 
      })
      .then((response: AxiosResponse) => {
        setFilteredLobby(response.data);
      })
      .catch((err: AxiosError) => {
        console.log(err);
      });
  };
  useEffect(() => {
    if (shouldLog.current) {
      shouldLog.current = false
    fetchCategories();
    fetchLobbyData("", []);
    }
  }, []);


  const handleSearch = () => {
    fetchLobbyData(searchQuery, selectedCategories);
  };

  const handleCategoryChange = (value: string[]) => {
    setSelectedCategories(value);
    // Fetch data when categories change
    fetchLobbyData(searchQuery, value);
  };
  const goToLobby = (n:number) => {
    navigate(`/lobby/${n}`)
  };

  return (
    <Content style={{paddingTop:"2rem"}}>
      <div style={{ display: 'flex', marginBottom: '16px',  paddingBottom:"2rem"}}>
        <Input
          placeholder="Search..."
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
        dataSource={filteredLobby}
        renderItem={(item: Lobby) => (
          <List.Item>
            <Card
              actions={[          
                <PlayCircleOutlined onClick={() => goToLobby(item.id)} style={{ fontSize: 20 }}  />,
              ]}
            >
              <Meta title={item.name} />
              <br />
              <div>
                <div style={{marginBottom:10}}>
                  Quiz: {item.quiz.name}
                </div>
                <div style={{marginBottom:10}} >
                  Autor: {item.creator}
                  <br />
                </div>
                <div style={{marginBottom:10}} >
                  Kategoria: {item.quiz.quizCategory}
                  <br />
                  </div>
                <div >
                  Czas na pytanie: {item.questionTime} sec
                  <br />

                
                </div>
              </div>

            </Card>
          </List.Item>
        )}
      />
    </Content>
    
  );
};

export default App;
