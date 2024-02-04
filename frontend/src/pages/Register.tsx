import React from 'react';
import axios from 'axios';
import { Button, Card, Form, Input, Layout, message } from 'antd';
import { useNavigate } from "react-router-dom";
const { Content } = Layout;

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

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  type registerUser = {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  };

  let register: registerUser;

  const onFinish = async (values: any) => {
    register = {
      username: values.username,
      email: values.email,
      password: values.password,
      first_name: values.imie,
      last_name: values.nazwisko,
    };

    try {
      const response = await axios.post('http://localhost:8000/auth/register/', register);
      message.success('Rejestracja przebiegła pomyślnie!', 4);
      navigate("/siteAuth");
    } catch (err: any) {
      if (err.response !== undefined) {
        for (let [key, value] of Object.entries(err.response.data)) {
                message.error(`${value}`, 4);
        }
    }
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Content style={{ padding: '50px', maxWidth: '600px', width: '100%' }}>
        <Card title="Rejstracja">
          <Form
            {...formItemLayout}
            form={form}
            name="register"
            onFinish={onFinish}
            scrollToFirstError
          >
            <Form.Item
              name="username"
              label="Username"
              tooltip="Podaj username?"
              rules={[{ required: true, message: 'Wprowadź swój username!', whitespace: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="imie"
              label="Imie"
              tooltip="Podaj imie?"
              rules={[
                { required: true, message: 'Wprowadź swoje imie!' },
                { pattern: /^[A-Za-z]+$/, message: 'Imie nie może zawierać cyfr!' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="nazwisko"
              label="Nazwisko"
              tooltip="Podaj nazwisko?"
              rules={[
                { required: true, message: 'Wprowadź swoje nazwisko!' },
                { pattern: /^[A-Za-z]+$/, message: 'Nazwisko nie może zawierać cyfr!' },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="E-mail"
              rules={[
                {
                  type: 'email',
                  message: 'Nie poprawny E-mail!',
                },
                {
                  required: true,
                  message: 'Podaj swój E-mail!',
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="password"
              label="Hasło"
              rules={[
                { required: true, message: 'Podaj hasło password!' },
                { min: 8, message: 'Hasło musi mieć co najmniej 8 znaków!' },
                {
                  pattern: /^(?=.*[A-Za-z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
                  message: 'Hasło musi zawierać przynajmniej jeden znak specjalny!',
                },
              ]}
              hasFeedback
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              name="confirm"
              label="Potwierdź hasło"
              dependencies={['password']}
              hasFeedback
              rules={[
                {
                  required: true,
                  message: 'Potwierdź hasło!',
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Hasła są różne!'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item {...tailFormItemLayout}>
              <Button type="primary" htmlType="submit">
                Zarejestruj
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default Register;
