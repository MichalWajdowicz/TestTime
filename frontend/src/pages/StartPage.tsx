import React, { useState } from 'react';
import { Layout, Button, Col, Row, Drawer } from 'antd';
import logo from '../img/logo.png';
import homeImg from '../img/home.jpg';
import { useIsAuthenticated } from 'react-auth-kit';
import { useSignOut } from 'react-auth-kit';
import { useNavigate } from 'react-router-dom';
import useWindowWidth from '../context/screenSize';
import { MenuOutlined } from '@ant-design/icons';
const { Header, Footer, Content } = Layout;

const StartPage: React.FC = () => {
  const signOut = useSignOut();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const windowWidth = useWindowWidth();

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  const logout = () => {
    signOut();
    navigate('/');
  };
  const login = () => {
    navigate('/login');
  };
  const register = () => {
    navigate('/register');
  };
  const dashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Layout style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '20px' }}>
        <img src={logo} alt="Logo" style={{ height: '64px' }} />
        <h1 style={{ marginLeft: '20px', color: '#FFFFFF' }}>TestTime</h1>
        </div>
        <div className="header-actions">
          {/* Display the drawer button on sm and md screens */}
          <Button className="drawer-button" onClick={showDrawer} style={{ display: windowWidth <= 768 ? 'inline-block' : 'none' }}>
            <MenuOutlined />
          </Button>
          {/* Display the login and register buttons on larger screens */}
          <div style={{ display: windowWidth > 768 ? 'inline-block' : 'none' }}>
            {isAuthenticated() ? (
              <>
                <Button onClick={logout} style={{ marginRight: '16px' }}>
                  Wyloguj
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  Panel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/login')} style={{ marginRight: '16px' }}>
                  Logowanie
                </Button>
                <Button onClick={() => navigate('/register')}>
                  Rejestracja
                </Button>
              </>
            )}
          </div>
        </div>
      </Header>
      <Drawer title="Witamu w TestTime" onClose={onClose} open={open}>
                  {isAuthenticated() ? (
                    <div>
                      <div>
                      <Button type="primary" style={{ marginRight: '16px', marginBottom: 20 }} onClick={() => navigate('/dashboard')}>
                        Panel
                      </Button></div>
                      <div>
                      <Button type="primary" style={{ marginRight: '16px' }} onClick={logout}>
                        Wyloguj
                      </Button></div>
                    </div>
                  ) : (
                    <div><div>
                      <Button type="primary" onClick={login} style={{ marginRight: '16px', marginBottom: 20 }}>
                        Logowanie
                      </Button></div><div>
                      <Button type="primary" onClick={register} style={{ marginRight: '16px' }}>
                        Rejestracja
                      </Button></div>
                    </div>
                  )}
                </Drawer>
      <Content style={{ padding: '50px', flex:1, backgroundColor:"#FFFFFF" }}>
        <Row gutter={16} align="middle" justify="center">
          <Col xs={24} sm={24} md={12} lg={8}>
            <img src={homeImg} alt="Quiz" style={{ width: '100%', marginBottom: '20px',borderRadius: '30%' }} />
          </Col>
          <Col xs={24} sm={24} md={12} lg={16}>
            <h2 style={{ fontSize: '36px', color: '#000', marginBottom: '20px' }}>
              Quizy, Które Rozwijają: Wzmocnij Swoją Wiedzę Z Nami!
            </h2>
            <p style={{ fontSize: '18px', color: '#000', marginBottom: '20px' }}>
              Każdy quiz to nie tylko zabawa, ale także szansa na zdobycie nowej wiedzy.
              Przekonaj się, jakie to proste - wystarczy kilka kliknięć, aby rozpocząć swoją przygodę.
            </p>
            <Button type="primary" size="large" onClick={isAuthenticated() ? dashboard : register}>
              Dołącz do nas
            </Button>
          </Col>
        </Row>
      </Content>

      <Footer style={{ fontSize: '1em', textAlign: 'center', backgroundColor: '#001529', color: 'white', minHeight:"10vh"  }}>
        TestTime ©2024 Created by Michal Wajdowicz
      </Footer>
    </Layout>
  );
};

export default StartPage;