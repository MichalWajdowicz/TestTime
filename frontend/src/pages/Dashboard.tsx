import React,{ useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useSignOut } from 'react-auth-kit'
import '../css/dashboard.css'
import QuizAdd from '../componets/QuizAdd';
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import { Button, Flex } from 'antd';
//import Link  from 'antd/es/typography/Link';
import { Link,Outlet } from 'react-router-dom';
const { Header, Content, Footer, Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem(<Link to=""> Profil </Link>,'profil',<DesktopOutlined />),
  // getItem('Stwórz wlasny quiz',"add",<DesktopOutlined />),
  getItem('Quizy',2,<PieChartOutlined />),
  getItem(<Link to="quizAdd"> Stwórz wlasny quiz </Link>,'add',<DesktopOutlined />),
  // getItem('Stwórz wlasny quiz',"add",<DesktopOutlined />),
  getItem('Historia', '4', <FileOutlined />),
];

const Dashboard: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const [selectedKey, setSelectedKey] = useState('1'); // Default selected key
  const signOut = useSignOut()
  const navigate = useNavigate();
  const logout = () => {
    signOut();
    navigate("/");
  };

  const handleMenuClick = (key: string) => {
    setSelectedKey(key);
  };

  const getContentForSelectedKey = () => {
    switch (selectedKey) {
      case '1':
        return <div>Profil Content</div>;
      case '2':
        return <div>Quizy Content</div>;
      case 'add':
        return <Link to="/addQuiz"> Add quiz </Link>;
      case '4':
        return <div>Historia Content</div>;
      default:
        return <div>Default Content</div>;
    }
  };
  return (
    <Layout>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']} items={items}
          onClick={({ key }) => handleMenuClick(key as string)}
        />
      <Button type="primary" onClick={logout}>Logout</Button>
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px 0' }}>
          {/* <div className = "side"style={{ padding: 24, background: colorBgContainer }}>{getContentForSelectedKey()}</div> */}
          <div className = "side"style={{ padding: 24, background: colorBgContainer }}>
            <Outlet/>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Ant Design ©2023 Created by Ant UED</Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
