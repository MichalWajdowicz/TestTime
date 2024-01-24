import React, { useEffect, useState,useRef } from 'react';
import { Layout, Card, List, Row, Col, Form, Input, Button, Modal,message } from 'antd';
import axios, { AxiosError, AxiosResponse } from 'axios';
import {useAuthHeader} from 'react-auth-kit'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Radar, Pie, Bar } from 'react-chartjs-2';

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 8 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 16 },
  },
};

const tailFormItemLayout = {
  wrapperCol: {
    xs: {
      span: 24,
      offset: 0,
    },
    sm: {
      span: 16,
      offset: 8,
    },
  },
};
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend
  
);

const { Header, Content } = Layout;

type Quiz ={
  name: string;
  num_attempts: number;
  avg_score: number;
}

type profileData = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  
};
type CombinedStats ={
  user_skills_data: { category: string; avg_score: number }[];
  category_pie_data: { category: string; num_quizzes: number }[];
  user_comparison_data: {avg_category_score: number; avg_score: number,category:string}[];
}
type passwordChange = {
  oldPassword: string;
  newPassword: string;
};

const ProfilePage: React.FC = () => {

  const authHeader = useAuthHeader();
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Authorization': authHeader() },
  });
  const shouldLog=useRef(true);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [user, setUser] = useState<profileData>();
  const [userCreatedQuizs, setUserCreatedQuizs] = useState<Quiz[]>([]);
  const [combinedStats, setCombinedStats] = useState<CombinedStats | null>(null);
  const [form] = Form.useForm();
  const fetchUserData = () => {
    axiosInstance
      .get('/api/users/')
      .then((response: AxiosResponse) => {
        setUser(response.data);
      })
      .catch((error: AxiosError) => {
        console.log(error);
      });
  };

  const fetchUserQuizsData = () => {
    axiosInstance
      .get('/api/users/userQuizs')
      .then((response: AxiosResponse) => {
        setUserCreatedQuizs(response.data);
      })
      .catch((error: AxiosError) => {
        console.log(error);
      });
  };
  const fetchUserStats = () => {
    axiosInstance
      .get('/api/users/user-stats')
      .then((response: AxiosResponse) => {
        setCombinedStats(response.data);
        console.log(response.data)
        
      })
      .catch((error: AxiosError) => {
        console.log(error);
      });
  }


  useEffect(() => {
    if (shouldLog.current) {
      shouldLog.current = false
    fetchUserData();
    fetchUserQuizsData();
    fetchUserStats();}
  }, []);

  const showPasswordModal = () => {
    setIsPasswordModalVisible(true);
  };

 
  const handlePasswordOk = () => {
    // Tutaj możesz dodać logikę do aktualizacji hasła w zależności od potrzeb

    setIsPasswordModalVisible(false);
  };

  const handleCancel = () => {
    setIsPasswordModalVisible(false);
    form.resetFields();
  };

  
  const data = {
    
    labels: combinedStats?.user_skills_data?.map((item) => item.category) || [],
    datasets: [
      {
        label: 'Sredni wynik',
        data: combinedStats?.user_skills_data?.map((item) => item.avg_score) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,

      },
    ],
  };

  const dataPie = {

    labels: combinedStats?.category_pie_data?.map((item) => item.category) || [],
    datasets: [
      {
        label: 'Ilosc quizow',
        data: combinedStats?.category_pie_data?.map((item) => item.num_quizzes) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  const dataBar = {
    labels: combinedStats?.user_comparison_data?.map((item) => item.category) || [],
    datasets: [
      {
        label:'Twoj sredni wynik',
        data: combinedStats?.user_comparison_data?.map((item) => item.avg_score) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Sredni wynik kategorii',
        data: combinedStats?.user_comparison_data?.map((item) => item.avg_category_score) || [],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };
  
  let password: passwordChange;
  const onPasswordChange = async (values: any) => {
    console.log(values)
    password={
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    };

    try {
        const response = await axiosInstance.put(
          "/api/users/userChangePassword/",
          password
        );
        console.log(response);
      } catch (err: any) {
        if (err.response !== undefined) {
          for (let [key, value] of Object.entries(err.response.data)) {
                  message.error(`${value}`, 4);
          }
      }}
  };
  return (
    <Layout style={{ minHeight: '80vh' }}>
      <Header style={{ background: '#fff', padding: '0 16px' }}>
        <h2>Twój Profil</h2>
      </Header>
      <Content style={{ margin: '16px' }}>
        <Row gutter={16}>
          <Col style={{paddingBottom:"0.5rem"}} xs={24} sm={24} md={10} lg={10} xl={10}>
            <Card style={{wordWrap:"break-word"}} title="Informacje o Profilu">
              <p>Imię: {user?.first_name}</p>
              <p>Nazwisko: {user?.last_name}</p>
              <p>E-mail: {user?.email}</p>
              <p>Username: {user?.username}</p>
              <Row>
                <Col style={{paddingBottom:"0.5rem"}} xs={24} sm={24} md={24} lg={24} xl={24}>
                <Button type="primary" onClick={showPasswordModal}>
                Zmień Hasło
              </Button>
                </Col>
              </Row>
              <Modal
                title="Zmień Hasło"
                open={isPasswordModalVisible}
                onOk={handlePasswordOk}
                onCancel={handleCancel}
              >
                 <Form
      {...formItemLayout}
      form={form}
      name="register"
      onFinish={onPasswordChange}
      style={{ maxWidth: 600 }}
      scrollToFirstError
    >
      <Form.Item
        name="oldPassword"
        label="Stare Hasło"
        rules={[
          {
            required: true,
            message: 'Podaj stare hasło!',
          },
        ]}
        hasFeedback >
        <Input.Password />
        </Form.Item>

      <Form.Item
        name="newPassword"
        label="Nowe Hasło"
        rules={[
          {
            required: true,
            message: 'Podaj haso password!',
          },
        ]}
        hasFeedback
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="confirm"
        label="Potwierdź Hasło"
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: 'potwierdź hasło!',
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Hasła sa różne!'));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit" >
          Zmien haslo
        </Button>
      </Form.Item>
    </Form>
              </Modal>
            </Card>
          </Col>
          <Col style={{paddingBottom:"0.5rem"}} xs={24} sm={24} md={14} lg={14} xl={14}>
            <Card title="Twoje Quizy">
              <List
                dataSource={userCreatedQuizs}
                renderItem={(quiz) => (
                  <List.Item>
                    <p>Nazwa:{quiz.name}</p>
                    <p>Średni wynik: {quiz.avg_score !== null ? quiz.avg_score : "Brak rozwiązania"}</p>
                    <p>Ilość rozwiozanych: {quiz.num_attempts}</p>
                  </List.Item>
                )}
                style={{ overflowY: 'auto', maxHeight: '15rem' }}
              />
            </Card>
          </Col>
        </Row>
        <Layout style={{ marginTop: '16px' }}>
                    <Header style={{ background: '#fff',display: 'flex', justifyContent: 'center', alignItems: 'center' }}><h2 >Wykresy</h2></Header>
                    <Content style={{ margin: '16px' }}>
                    <Row gutter={16}>
                        <Col style={{paddingBottom:"0.5rem"}} xs={24} sm={24} md={12} lg={8} xl={8}>
                            <Card title=" Średni wynik w danej kategori">
                            <Radar data={data} style={{maxHeight:"20rem"}}  options={{ responsive: true}} />
                            </Card>
                        </Col>
                        <Col style={{paddingBottom:"0.5rem"}} xs={24} sm={24} md={12} lg={8} xl={8}>
                            <Card title="Ilość rozwiązanych quizow z kategori" >
                            <Pie data={dataPie} style={{maxHeight:"20rem"}} options={{ responsive: true}} />

                            </Card>
                        </Col>
                        <Col style={{paddingBottom:"0.5rem"}} xs={24} sm={24} md={12} lg={8} xl={8}>
                            <Card title="Porównanie średni wyników z kategori">
                            <Bar data={dataBar} style={{maxHeight:"20rem"}} options={{ responsive: true}} />
                            </Card>
                        </Col>
                    </Row>
                    </Content>
            
        </Layout>
      </Content>
    </Layout>
  );
};

export default ProfilePage;