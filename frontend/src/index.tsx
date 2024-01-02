import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {AuthProvider} from "react-auth-kit";
import { BrowserRouter } from "react-router-dom";
import refreshApi from './context/refreshApi';



const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
 
  <React.StrictMode>
    <AuthProvider
          authType={"cookie"}
          authName={"_auth"}
          cookieDomain={window.location.hostname}
          cookieSecure={window.location.protocol === "https:"}
          refresh={refreshApi}
          
        >
    <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

