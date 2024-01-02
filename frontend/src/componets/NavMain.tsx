import React, { useState } from 'react';
import LoginForm from './LoginForm';
import { useNavigate } from "react-router-dom";
import {useIsAuthenticated} from 'react-auth-kit';
import { useSignOut } from 'react-auth-kit'
import { Link, Outlet } from "react-router-dom";


const NavMain = () => {
  const signOut = useSignOut()
  const isAuthenticated = useIsAuthenticated()
  const navigate = useNavigate();
  const logout = () => {
    signOut();
    navigate("/");
  };
  const login = () => {
    navigate("/login");
  };
  const register = () => {
    navigate("/register");
  };
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container px-5">
        <a className="navbar-brand" href="/">Start Bootstrap</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
          {(() => {
                if (isAuthenticated()) {
                  return (
                    <li className="nav-item"><Link to="/dashboard" className="nav-link"> Dashboard </Link></li>
                  )
                } 
              })()}
            <li className="nav-item"><a className="nav-link" href="about.html">About</a></li>
            <li className="nav-item"><a className="nav-link" href="contact.html">Contact</a></li>
            <li className="nav-item"><a className="nav-link" href="pricing.html">Pricing</a></li>
            <li className="nav-item "><a className="nav-link " href="faq.html">FAQ</a></li>
          

                    {(() => {
                if (isAuthenticated()) {
                  return (
                    <div><button type="button" className="btn btn-primary nav-item mx-1" onClick={logout}>Logout</button></div>
                  )
                } else {
                  return (
                    <div>
                    <button type="button" className="btn btn-primary nav-item mx-1" onClick={register}>Register</button>
                    <button type="button" className="btn btn-primary nav-item mx-1" onClick={login}>Login</button></div>
                  )
                }
              })()}
              {/* <button type="button" className="btn btn-primary nav-item mx-1" >Register</button>
              <button type="button" className="btn btn-primary nav-item mx-1" onClick={logout}>Login</button> */}
              
            
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavMain;