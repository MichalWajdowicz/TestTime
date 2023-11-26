import React from 'react';
import './App.css';
import { StartPage } from './pages/StartPage';
import { Route, Routes } from "react-router-dom";
import LoginForm from './componets/LoginForm';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import {useIsAuthenticated} from 'react-auth-kit';
import { RequireAuth } from 'react-auth-kit'
import QuizAdd from './componets/QuizAdd';

function App() {
  const isAuthenticated = useIsAuthenticated()
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<StartPage />}></Route>
        {(() => {
                if (isAuthenticated()) {
                  return (
                    <Route path="/login" element={<StartPage/>}></Route>
                  )
                } else {
                  return (
                    <Route path="/login" element={<LoginForm/>}></Route>
                  )
                }
              })()}
              <Route path={'/dashboard'} element={
                <RequireAuth loginPath={'/login'}>
                  <Dashboard/>
                </RequireAuth> }
              />

              <Route path={'/quizAdd'} element={
              <RequireAuth loginPath={'/login'}>
                <QuizAdd/>
              </RequireAuth> }
              />

        <Route path="/register" element={<Register/>}></Route>
        {/* <Route path="/dashboard" element={<Dashboard/>}></Route> */}
        
      </Routes>
      </div>
  );
}

export default App;
