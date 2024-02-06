import  StartPage from './pages/StartPage';
import { Route, Routes } from "react-router-dom";
import LoginForm from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import {useIsAuthenticated} from 'react-auth-kit';
import { RequireAuth } from 'react-auth-kit'
import QuizAdd from './componets/QuizAdd';
import QuizShare from './componets/QuizShare';
import LobbyShare from './componets/LobbyShare';
import Quiz from './pages/Quiz';
import Lobby from './pages/Lobby';
import QuizHistory from './componets/QuizHistory';
import Profil from './componets/Profil';
import Err from './pages/errorPage';

function App() {
  const isAuthenticated = useIsAuthenticated()
  return (
    <div>
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
                      {(() => {
                if (isAuthenticated()) {
                  return (
                    <Route path="/register" element={<StartPage/>}></Route>
                  )
                } else {
                  return (
                    <Route path="/register" element={<Register/>}>
                      
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
                <Route path="history" element={<QuizHistory/>}></Route>
                <Route path="" element={<Profil/>}></Route>
                <Route path="lobby" element={<LobbyShare/>}></Route>
              </Route>

        <Route path="/quiz/:id" element={
                <RequireAuth loginPath={'/login'}>
                 <Quiz/>
                </RequireAuth> }></Route>
          <Route path="/lobby/:id" element={
                <RequireAuth loginPath={'/login'}>
                 <Lobby/>
                </RequireAuth> }></Route>

          <Route path="*" element={<Err/>}></Route>
          
      </Routes>
      </div>
  );
}

export default App;
