import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Space, Typography, Select } from 'antd';
import { Checkbox } from 'antd';
import {useAuthUser} from 'react-auth-kit'
import {useAuthHeader} from 'react-auth-kit'
import axios, { AxiosError, AxiosResponse } from "axios";
const { TextArea } = Input;
const { Option } = Select;

const App: React.FC = () => {
  const [form] = Form.useForm();
  type Answer = { 
    answer: string;
    good_answer: boolean;
  };
  type Question = {
    name: string;
    answers: Answer[];
  };
  type Categories = { 
    name: string;
  };
  type Quiz = {
    name: string;
    user: string;
    description: string;
    quizCategories: Categories[];
    questions: Question[];
  };
  const authUser = useAuthUser();
  const authHeader = useAuthHeader();
  
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

  let question: Question;
  
  const onFinish = async (values: any) => {
    let questions: Question[] = [];
    let answers: Answer[] = [];
    let answer: Answer;
    let quiz: Quiz;
    //kategorie dodac
    for (let i = 0; i < values.items.length; i++) {
      for (let j = 0; j < values.items[i].Answer.length; j++) {
        if (values.items[i].Answer[j].goodAnswer === undefined) {
          values.items[i].Answer[j].goodAnswer = false;
        }
        answer = {
          answer: values.items[i].Answer[j].Answer,
          good_answer: values.items[i].Answer[j].goodAnswer,
        };
        answers.push(answer);
      }
      question = {
        name: values.items[i].qustion,
        answers: answers,

      };
      answers = [];
      questions.push(question);
    }
    let categories: Categories[] = [];
    for (let i = 0; i < values.categorys.length; i++) {
      let category: Categories = {
        name: values.categorys[i],
      };
      categories.push(category);
    } 
    
    quiz = {
      name: values.name,
      description: values.description,
      user: authUser()?.values,
      questions: questions,
      quizCategories: categories,
    };
    console.log();
    console.log(JSON.stringify(quiz, null, 2));
    try {
        const response = await axios.post(
          "http://localhost:8000/quiz/addQuiz/",
          quiz, { headers: { 'Authorization': authHeader() } }
        );
        console.log(response);
      } catch (error) {
        console.error(error);
      }
  };
  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      form={form}
      onFinish={onFinish}
      name="Question"
      style={{ maxWidth: 600 }}
      autoComplete="off"
      initialValues={{ items: [{}] }}
    >
      <Form.Item label="Nazwa Quizu" name="name">
        <Input />
      </Form.Item>
      <Form.Item label="Nazwa Quizu" name="description">
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item
      name="categorys"
      label="Select[multiple]"
      rules={[{ required: true, message: 'Please select your favourite colors!', type: 'array' }]}
    >
      <Select mode="multiple" placeholder="Please select favourite colors">
        <Option value="red">Red</Option>
        <Option value="green">Green</Option>
        <Option value="blue">Blue</Option>
      </Select>
    </Form.Item>
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
            {fields.map((field) => (
              <Card
                size="small"
                title={`Item ${field.name + 1}`}
                key={field.key}
                extra={
                  <CloseOutlined
                    onClick={() => {
                      remove(field.name);
                    }}
                  />
                }
              >
                <Form.Item label="Pytanie" name={[field.name, 'qustion']}>
                  <Input />
                </Form.Item>

                {/* Nest Form.List */}
                <Form.Item label="Odpowiedzi">
                  <Form.List name={[field.name, 'Answer']}>
                    {(subFields, subOpt) => (
                      <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
                        {subFields.map((subField) => (
                          <Space key={subField.key}>
                            <Form.Item noStyle name={[subField.name, 'Answer']}>
                              <Input placeholder="Answer" />
                            </Form.Item>
                            <Form.Item  noStyle name={[subField.name, 'goodAnswer']} valuePropName="checked">
                              <Checkbox>Prawidłowa odpowiedź</Checkbox>
                            </Form.Item>
                            <CloseOutlined
                              onClick={() => {
                                subOpt.remove(subField.name);
                              }}
                            />
                          </Space>
                        ))}
                         {subFields.length < 6 && (
                        <Button type="dashed" onClick={() => subOpt.add()} block>
                          + Add Sub Item
                        </Button>)}
                      </div>
                    )}
                  </Form.List>
                </Form.Item>
              </Card>
            ))}

            {fields.length < 30 && (
              <Button type="dashed" onClick={() => add()} block>
                + Add Item
              </Button>
            )}
          </div>
        )}
      </Form.List>
      <Form.Item {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit" >
          Add Quiz
        </Button>
      </Form.Item>
    </Form>
  );
};

export default App;