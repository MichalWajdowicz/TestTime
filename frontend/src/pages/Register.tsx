import React, { useState } from 'react';
import axios from "axios";
import type { CascaderProps } from 'antd';
import {
  Button,
  Form,
  Input,
} from 'antd';

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
  type registerUser = {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    
  };
  let register: registerUser ;
  const onFinish = async (values: any) => {
    register = {
        username: values.nickname,
        email: values.email,
        password: values.password,
        first_name: values.imie,
        last_name: values.nazwisko,
        };
    console.log('Received values of form: ', register);

    try {
        const response = await axios.post(
          "http://localhost:8000/auth/register/",
          register
        );
        console.log(response);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.log("Axios error: ", err.response?.data.message);
        } else {
          console.log("Error: ", err);
        }
      }
  };

  return (
    <Form
      {...formItemLayout}
      form={form}
      name="register"
      onFinish={onFinish}
      style={{ maxWidth: 600 }}
      scrollToFirstError
    >
      <Form.Item
        name="nickname"
        label="Nickname"
        tooltip="Podaj nickname?"
        rules={[{ required: true, message: 'Wprowadź swój nickname!', whitespace: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="imie"
        label="Imie"
        tooltip="Podaj imie?"
        rules={[{ required: true, message: 'Wprowadź swój imie!', whitespace: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="nazwisko"
        label="Nazwisko"
        tooltip="Podaj nazwisko?"
        rules={[{ required: true, message: 'Wprowadź swój nazwisko!', whitespace: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="email"
        label="E-mail"
        rules={[
          {
            type: 'email',
            message: 'Nie poprwany E-mail!',
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
        label="Password"
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
        label="Confirm Password"
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: 'potwierdź hasło!',
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
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
          Register
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Register;