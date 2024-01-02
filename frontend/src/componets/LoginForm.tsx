import React, { useState } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import { useSignIn } from "react-auth-kit"
import { useFormik } from "formik";
import axios, { AxiosError, AxiosResponse } from "axios";
import { useNavigate } from "react-router-dom";

function LoginForm(props: any) {

  const navigate = useNavigate();
  
  
  const signIn = useSignIn();

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: async (values: any) => {
      try {
        const response = await axios.post(
          "http://localhost:8000/api/token/",
          values
        );
        signIn({
          token: response.data.access,
          expiresIn: 5,
          tokenType: "Bearer",
          authState: { values: values.username },
          refreshToken: response.data.refresh,                    
          refreshTokenExpireIn: 89 * 24 * 60    
        });
        navigate("/"); // Navigate to the home page after the user has successfully logged in.
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          console.log("Axios error: ", err.response?.data.message);
        } else {
          console.log("Error: ", err);
        }
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} method="post">

      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="input-group mb-3">
            <label form="name">Imię</label>
            <input
              name="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              placeholder="username"
              className="form-control"
              type="username"
            />
          </div>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="input-group mb-3">
            <label form="password">Hasło</label>
            <input
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              placeholder="Password"
              className="form-control"
              type="password"
            />
          </div>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <button type="submit" className="btn btn-primary">Zaloguj się</button>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-6">
          <p className="mt-2">Nie masz konta? <a href="#">Zarejestruj się</a></p>
        </div>
      </div>
    </form>
  );
}
export default LoginForm;