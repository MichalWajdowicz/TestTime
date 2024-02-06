import React, { useEffect, useState,useRef } from 'react';
import { Card, List, Input, Button, Select, Modal, Form, message,InputNumber } from 'antd';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { PlayCircleOutlined, InfoCircleOutlined, SearchOutlined,PlusCircleOutlined  } from '@ant-design/icons';
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
    name: string;
    password: string;
    quiz: number;
    questionTime: number;
  };
  const navigate = useNavigate();
  const authHeader = useAuthHeader();
  const [text, setText] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenDesc, setIsModalOpenDesc] = useState(false);
  const [filteredQuiz, setFilteredQuiz] = useState<Quiz[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [id, setId] = useState<number>(0);
  const shouldLog=useRef(true);
  const [form] = Form.useForm();
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Authorization': authHeader() },
  });

  const showModal = (description:string | undefined) => {
    setText(description);
    setIsModalOpenDesc(true);
  };

  const showModalCreateLobby = (id:number) => {
    setIsModalOpen(true);
    setId(id);
  };
  
  const handleOk = () => {
    setIsModalOpen(false);
  };
  
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const handleOkDesc = () => {
    setIsModalOpenDesc(false);
  };
  
  const handleCancelDesc = () => {
    setIsModalOpenDesc(false);
  };

  const openQuiz = (n:number) => {
    navigate(`/quiz/${n}`)
  };
  let temp : Lobby 
  const onFinish =  (values: any) => {
    temp = {
      name: values.lobbyName,
      password: values.lobbyPassword,
      quiz: id,
      questionTime: values.lobbyTime
    }
    createLobby(temp);
    form.resetFields();
    setIsModalOpen(false);
  };
  const createLobby =  async(lobby:Lobby) => {
    try {
       await axiosInstance.post(
        "http://localhost:8000/api/lobby/",
        lobby, 
      ).then((response: AxiosResponse) => {;
        navigate(`/lobby/${response.data.id}`)
      })
    } catch (err: any) {
      if (err.response !== undefined) {
        for (let [key, value] of Object.entries(err.response.data)) {
                message.error(`${value}`, 4);
        }
    }}
  }

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
                <PlusCircleOutlined onClick={() => showModalCreateLobby(item.id)} style={{ fontSize: 20 }}  />,
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
                    <Modal title="Opis Quizu" open={isModalOpenDesc} onOk={handleOkDesc} onCancel={handleCancelDesc}>
        {text}
        </Modal>

        <Modal title="Stworz lobby"
         open={isModalOpen} 
         footer={
         <Button key="back" onClick={handleCancel}>
          Zamknij
        </Button>}
         onCancel={handleCancel}>
        <p>Czy chcesz stworzyc lobby?</p>
        <Form
        name="addLobby"
        form={form}
        onFinish={onFinish}
        >
            <Form.Item
              name="lobbyName"
              tooltip="Podaj nazwe lobby"
              rules={[{ required: true, message: 'Wprowadź nazwe lobby!', whitespace: true }]}
            >
              <Input
              placeholder='Nazwa lobby' 
              />
            </Form.Item>
            <Form.Item

              name="lobbyPassword"
              tooltip="Podaj haslo lobby"
            >
              <Input.Password
              placeholder='Haslo lobby' 
              />
            </Form.Item>
        <Form.Item
        name="lobbyTime"
        tooltip="Podaj czas na pytanie"
        rules={[
          { required: true, message: 'Wprowadź czas na pytanie!'},
          {
            validator: (_, value) =>
              value && value >= 5 && value <= 30
                ? Promise.resolve()
                : Promise.reject(new Error('Czas na pytanie musi być między 5 a 30.')),
          },
        ]}
        >
        <InputNumber 
        placeholder='Czas na pytanie'
        />
        </Form.Item>
        <Form.Item>
              <Button type="primary" htmlType="submit">
              Stworz lobby
              </Button>
            </Form.Item>
        </Form>
        </Modal>
    </Content>
    
  );
};

export default App;
