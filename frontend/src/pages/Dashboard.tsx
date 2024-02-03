import React from 'react';
import { useNavigate } from "react-router-dom";
import { useSignOut } from 'react-auth-kit'
import '../css/dashboard.css'
import useWindowWidth from '../context/screenSize';
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme } from 'antd';
import { Button } from 'antd';
import { Link,Outlet } from 'react-router-dom';
const {  Content, Footer, Sider } = Layout;
type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    icon,
    children,
    label,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem(<Link to=""> Profil </Link>,<DesktopOutlined />),
  
  getItem(<Link to="quiz">Quizy</Link>,<PieChartOutlined />),
  getItem(<Link to="quizAdd"> Stwórz wlasny quiz </Link>,<DesktopOutlined />),
  
  getItem(<Link to="history"> Historia </Link>,<FileOutlined />),
  getItem(<Link to="lobby"> Rywalizuj z innymi</Link>,<FileOutlined />),
];

const Dashboard: React.FC = () => {

  const {
    token: { colorBgContainer },
  } = theme.useToken();
  
  const signOut = useSignOut()
  const navigate = useNavigate();
  const logout = () => {
    signOut();
    navigate("/");
  };

  
  const windowWidth = useWindowWidth();
  return (
    <Layout>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={windowWidth <=992 ? {position: 'fixed', zIndex: 10, height: '100vh', left: 0} : {}}
        
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']} items={items}
          // onClick={({ key }) => handleMenuClick(key as string)}
        />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' }}>
        <Button type="primary" onClick={logout}>Wyloguj</Button>
      </div>
      </Sider>
      <Layout>
        <Content style={{ margin: '24px 16px 0' }}>
          {/* <div className = "side"style={{ padding: 24, background: colorBgContainer }}>{getContentForSelectedKey()}</div> */}
          <div
            className={"side"}
            style={{ padding: 24, background: colorBgContainer }}
          >
            <Outlet/>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
        {'Copyright © '}
                    {new Date().getFullYear()}
            </Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
