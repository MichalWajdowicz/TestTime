import React, { useState, useEffect, useRef } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Space, Select, message, Row, Col, InputNumber, } from 'antd';
import { Checkbox } from 'antd';
import { useAuthHeader } from 'react-auth-kit';
import axios, { AxiosError, AxiosResponse } from 'axios';

const { TextArea } = Input;
const { Option } = Select;

const App: React.FC = () => {

  const [form] = Form.useForm();
  const [hasQuestions, setHasQuestions] = useState(false);
  const authHeader = useAuthHeader();
  const [categories, setCategories] = useState<Category[]>([]);
  const shouldLog = useRef(true);
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Authorization': authHeader() },
  });

  type Answer = {
    answer: string;
    good_answer: boolean;
  };

  type Question = {
    name: string;
    answers: Answer[];
  };

  type Category = {
    name: string;
  };

  type Quiz = {
    name: string;
    description: string;
    quizCategory: Category;
    questions: Question[];
    duration: number;
  };

  let question: Question;

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
      shouldLog.current = false;
      fetchCategories();
    }
  }, []);

  const checkDuplicateAnswers = (answers: string[]) => {
    const uniqueAnswers = new Set(answers);
    return uniqueAnswers.size === answers.length;
  };

  const onFinish = async (values: any) => {
    let questions: Question[] = [];
    let answers: Answer[] = [];
    let answer: Answer;
    let quiz: Quiz;

    for (let i = 0; i < values.Pytania.length; i++) {
      let isAnyAnswerCorrect = false;
      let answersCount = 0;

      for (let j = 0; j < values.Pytania[i].Answer.length; j++) {
        if (values.Pytania[i].Answer[j].goodAnswer === undefined) {
          values.Pytania[i].Answer[j].goodAnswer = false;
        }
        answer = {
          answer: values.Pytania[i].Answer[j].Answer,
          good_answer: values.Pytania[i].Answer[j].goodAnswer,
        };
        answers.push(answer);

        if (values.Pytania[i].Answer[j].goodAnswer) {
          isAnyAnswerCorrect = true;
        }

        answersCount += values.Pytania[i].Answer[j].Answer.trim().length > 0 ? 1 : 0;
      }

      if (!isAnyAnswerCorrect) {
        message.error(`Pytanie ${i + 1} musi mieć przynajmniej jedną poprawną odpowiedź.`, 4);
        return;
      }

      if (answersCount < 2) {
        message.error(`Pytanie ${i + 1} musi zawierać przynajmniej dwie odpowiedzi.`, 4);
        return;
      }

      if (!checkDuplicateAnswers(answers.map(ans => ans.answer))) {
        message.error(`Pytanie ${i + 1} nie może mieć identycznych odpowiedzi.`, 4);
        return;
      }

      question = {
        name: values.Pytania[i].qustion,
        answers: answers,
      };
      answers = [];
      questions.push(question);
    }

    quiz = {
      name: values.name,
      description: values.description,
      questions: questions,
      quizCategory: values.category,
      duration: values.time,
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/api/quiz/",
        quiz, { headers: { 'Authorization': authHeader() } }
      );
      message.success('Quiz został dodany!', 4);
      form.resetFields();
    } catch (err: any) {
      if (err.response !== undefined) {
        for (let [key, value] of Object.entries(err.response.data)) {
          message.error(`${value}`, 4);
        }
      }
    }
  };

  const handleFieldsChange = (changedFields: any) => {
    const currentFields = form.getFieldValue('Pytania') || [];
    setHasQuestions(currentFields.length >= 3);
  };


  return (
    <Row justify="center" align="middle">
      <Col xs={24} sm={20} md={16} lg={12} xl={10}>
        <Card title="Dodaj Quiz" style={{ textAlign: 'center', boxShadow: '0px 0px 23px 5px' }}>
        <Form
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            form={form}
            onFinish={onFinish}
            onFieldsChange={(_, allFields) => handleFieldsChange(allFields)}
            name="Question"
            style={{ maxWidth: 600 }}
            autoComplete="off"
            initialValues={{ Pytania: [{}] }}
          >
            <Form.Item label="Nazwa Quizu" name="name" rules={[{ required: true, max: 200, message: 'Nazwa Quizu jest wymagana (max 200 znaków)' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Opis Quizu" name="description" rules={[{ required: true, max: 600, message: 'Opis Quizu jest wymagany (max 600 znaków)' }]}>
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item
              name="category"
              label="Select"
              rules={[{ required: true, message: 'Proszę wybrać kategorię' }]}
            >
              <Select placeholder="Wybierz kategorie">
              {categories.map((category) => (
            <Option key={category.name} value={category.name}>
              {category.name}
            </Option>
          ))}
              </Select>
            </Form.Item>
            <Form.Item label="Czas na quiz" name="time" rules={[{ required: true, message: 'Czas jest wymagany' }]}>
              <InputNumber min={1} max={120} />
            </Form.Item>
            <Form.List name="Pytania">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', rowGap: 16, flexDirection: 'column' }}>
                  {fields.map((field) => (
                    <Card
                      size="small"
                      title={`Pytanie ${field.name + 1}`}
                      key={field.key}
                      extra={
                        <CloseOutlined
                          onClick={() => {
                            remove(field.name);
                          }}
                        />
                      }
                    >
                      <Form.Item label="Pytanie" name={[field.name, 'qustion']} rules={[{ required: true, max: 200, message: 'Pytanie jest wymagane (max 200 znaków)' }]}>
                        <Input />
                      </Form.Item>

                      <Form.Item label="Odpowiedzi">
                        <Form.List name={[field.name, 'Answer']}>
                          {(subFields, subOpt) => (
                            <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
                              {subFields.map((subField) => (
                                <Space key={subField.key}>
                                  <Form.Item noStyle name={[subField.name, 'Answer']} rules={[{ required: true, max: 200, message: 'Odpowiedź jest wymagana (max 200 znaków)' }]}>
                                    <Input placeholder="Answer" />
                                  </Form.Item>
                                  <Form.Item noStyle name={[subField.name, 'goodAnswer']} valuePropName="checked">
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
                                  + Dodaj odpowiedź
                                </Button>
                              )}
                            </div>
                          )}
                        </Form.List>
                      </Form.Item>
                    </Card>
                  ))}

                  {fields.length < 30 && (
                    <Button type="dashed" onClick={() => add()} block>
                      + Dodaj pytanie
                    </Button>
                  )}
                </div>
              )}
            </Form.List>
            <Form.Item
              style={{ paddingTop: '1rem' }}
              wrapperCol={{ span: 24 }}
              shouldUpdate={() => true}
  
              noStyle
            >
              {() => (
                <Button type="primary" style={{marginTop:"1rem"}} htmlType="submit" disabled={!hasQuestions}>
                  Dodaj Quiz
                </Button>
              )}
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default App;