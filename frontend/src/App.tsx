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
import QuizShare from './componets/QuizShare';

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
                    <Route path="/login" element={<LoginForm/>}>
                      
                    </Route>
                  )
                }
              })()}

              <Route path={'/dashboard'} element={
                <RequireAuth loginPath={'/login'}>
                  <Dashboard/>
                </RequireAuth> }>
                <Route path="quizAdd" element={<QuizAdd/>}></Route>
                <Route path="quiz" element={<QuizShare/>}></Route>
              </Route>

              {/* <Route path={'/quizAdd'} element={
              <RequireAuth loginPath={'/login'}>
                <QuizAdd/>
              </RequireAuth> }
              /> */}

        <Route path="/register" element={<Register/>}></Route>
        
      </Routes>
      </div>
  );
}

export default App;
