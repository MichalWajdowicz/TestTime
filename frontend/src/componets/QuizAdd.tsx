import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Space, Typography } from 'antd';

const App: React.FC = () => {
  const [form] = Form.useForm();
  type Question = {
    name: string;
    answer1: string;
    goodAnswer1: boolean;
    answer2: string;
    goodAnswer2: boolean;
    answer3?: string| null;
    goodAnswer3?: boolean | null;
    answer4?: string | null;
    goodAnswer4?: boolean | null;
    answer5?: string | null;
    goodAnswer5?: boolean | null;
    answer6?: string | null;
    goodAnswer6?: boolean | null;
    
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

  let question: Question;
  const onFinish = async (values: any) => {
    let questions: Question[] = [];
    //kategorie dodac
    for (let i = 0; i < values.items.length; i++) {
      question = {
        name: values.items[i].qustion,
        answer1: values.items[i].Answer[0].Answer,
        goodAnswer1: values.items[i].Answer[0].goodAnswer,
        answer2: values.items[i].Answer[1].Answer,
        goodAnswer2: values.items[i].Answer[1].goodAnswer,
        answer3: values.items[i].Answer[2]?.Answer || null,
        goodAnswer3: values.items[i].Answer[2]?.goodAnswer || null,
        answer4: values.items[i].Answer[3]?.Answer || null,
        goodAnswer4: values.items[i].Answer[3]?.goodAnswer || null,
        answer5: values.items[i].Answer[4]?.Answer || null,
        goodAnswer5: values.items[i].Answer[4]?.goodAnswer || null,
        answer6: values.items[i].Answer[5]?.Answer || null,
        goodAnswer6: values.items[i].Answer[5]?.goodAnswer || null,

      };
      questions.push(question);
    }
    console.log(questions);

    // try {
    //     const response = await axios.post(
    //       "http://localhost:8000/api/register/",
    //       register
    //     );
    //     console.log(response);
    //   } catch (error) {
    //     console.error(error);
    //   }
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

      {/* <Form.Item noStyle shouldUpdate>
        {() => (
          <Typography>
            <pre>{JSON.stringify(form.getFieldsValue(), null, 2)}</pre>
            
          </Typography>
        )}
      </Form.Item> */}
      <Form.Item {...tailFormItemLayout}>
        <Button type="primary" htmlType="submit" >
          Register
        </Button>
      </Form.Item>
    </Form>
  );
};

export default App;