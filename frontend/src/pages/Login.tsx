import React from 'react';
import { Button, Card, Form, Input, Layout, Row, Col ,message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from 'react-auth-kit';
import axios from 'axios';

const { Content } = Layout;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const signIn = useSignIn();

  const onFinish = async (values: any) => {
    try {
      const response = await axios.post('http://localhost:8000/auth/token/', values);
      signIn({
        token: response.data.access,
        expiresIn: 5,
        tokenType: 'Bearer',
        authState: { values: values.username },
        refreshToken: response.data.refresh,
        refreshTokenExpireIn: 89 * 24 * 60,
      });
      message.success('Zalogowano pomyślnie!', 1);
      navigate('/');
    } catch (error: any) {
            if (error.response !== undefined) {
                for (let [, value] of Object.entries(error.response.data)) {
                    if (value === "No active account found with the given credentials") {
                        message.error('Nie znaleziono użytkownika o podanych danych!', 4);
                    }
                    else {
                        message.error(`${value}`, 4);
                    }
                }
            }
    }
  };

  return (
    <Layout>
      <Content style={{ padding: '50px' }}>
        <Row justify="center" align="middle" style={{ minHeight: 'calc(100vh - 100px)' }}>
          <Col span={24} sm={20} md={16} lg={12} xl={8}>
            <Card title="Login">
              <Form
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                autoComplete="off"
              >
                <Form.Item
                  label="Username"
                  name="username"
                  rules={[{ required: true, message: 'Podaj sowj username' }]}
                  labelCol={{ span: 4 }}  // Center the label
                  wrapperCol={{ span: 20 }}  // Center the input field
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true, message: 'Podaj swoje hasło' }]}
                  labelCol={{ span: 4 }}  // Center the label
                  wrapperCol={{ span: 20 }}  // Center the input field
                >
                  <Input.Password />
                </Form.Item>

                <Form.Item wrapperCol={{ span: 24 }}>
                  <Button type="primary" htmlType="submit">
                    Login
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default Login;
