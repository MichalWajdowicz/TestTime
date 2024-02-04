import React, { useState } from 'react';
import { Layout, Button, Col, Row, Drawer } from 'antd';
import logo from '../img/logo.png';
import homeImg from '../img/home.jpg';
import { useIsAuthenticated } from 'react-auth-kit';
import { useSignOut } from 'react-auth-kit';
import { useNavigate } from 'react-router-dom';
import useWindowWidth from '../context/screenSize';
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
    navigate('/siteAuth');
  };
  const register = () => {
    navigate('/register');
  };
  const dashboard = () => {
    navigate('/dashboard');
  };

  const headerHeight = 64; // Adjust this value based on the actual height of your header

  return (
    <Layout>
      <Header style={{ width: '100%', minHeight: '10vh' }}>
        <Row gutter={16} justify="space-between" align="middle">
          <Col xs={12} sm={12}>
            <Row gutter={12}>
              <Col style={{ paddingTop: 10 }}>
                <img src={logo} width={80} alt="Logo" />
              </Col>
              {windowWidth > 576 && (
                <Col>
                  <p style={{ float: 'left', color: 'white', fontSize: '30px', margin: '0 0 0 0', paddingTop: 16 }}>TestTime</p>
                </Col>
              )}
            </Row>
          </Col>
          <Col xs={12} sm={12} style={{ paddingBottom: 20 }}>
            {windowWidth > 576 ? (
              <Row justify="end">
                {isAuthenticated() ? (
                  <>
                    <Button type="primary" style={{ marginRight: '16px' }} onClick={logout}>
                      Wyloguj
                    </Button>
                    <Button type="primary" style={{ marginRight: '16px' }} onClick={dashboard}>
                      Panel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="primary" onClick={login} style={{ marginRight: '16px' }}>
                      Logowanie
                    </Button>
                    <Button type="primary" onClick={register} style={{ marginRight: '16px' }}>
                      Rejestracja
                    </Button>
                  </>
                )}
              </Row>
            ) : (
              <Row>
                <Button type="primary" onClick={showDrawer}>
                  Menu
                </Button>
                <Drawer title="Witamu w TestTime" onClose={onClose} open={open}>
                  {isAuthenticated() ? (
                    <div>
                      <Button type="primary" style={{ marginRight: '16px', marginBottom: 20 }} onClick={() => navigate('/dashboard')}>
                        Panel
                      </Button>
                      <Button type="primary" style={{ marginRight: '16px' }} onClick={logout}>
                        Wyloguj
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Button type="primary" onClick={login} style={{ marginRight: '16px', marginBottom: 20 }}>
                        Logowanie
                      </Button>
                      <Button type="primary" onClick={register} style={{ marginRight: '16px' }}>
                        Rejestracja
                      </Button>
                    </div>
                  )}
                </Drawer>
              </Row>
            )}
          </Col>
        </Row>
      </Header>

      <Content
        className="site-layout-background"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 24,
          margin: 0,
          minHeight: "80vh", // Adjust the calculation based on your needs
          backgroundColor: '#FFFFFF',
        }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <img src={homeImg} alt="Opis zdjęcia" style={{ maxWidth: '30vw', borderRadius: '30%' }} />
          </Col>

          <Col xs={24} sm={12} style={{ paddingTop: 100 }}>
            <h1 style={{ fontSize: '2.5em', wordBreak: 'break-word' }}>Quizy, Które Rozwijają: Wzmocnij Swoją Wiedzę Z Nami!</h1>
            <p style={{ fontSize: '1.25em', wordBreak: 'break-word' }}>
              Każdy quiz to nie tylko zabawa, ale także szansa na zdobycie nowej wiedzy. Przekonaj się, jakie to proste - wystarczy
              kilka kliknięć, aby rozpocząć swoją przygodę
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