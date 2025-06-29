import React, { use } from 'react';
import { data, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useEffect } from 'react';

export default function SignIn() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const tokenExp = localStorage.getItem('token_exp');

    if (token && user && tokenExp) {
      const expirationDate = new Date(tokenExp);
      if (expirationDate > new Date()) {
        if (user) {
          if(user.role=="Employee"){
            navigate('/dashboardEmployee');
          }else if(user.role==="Admin"){
            navigate('/dashboardAdmin');
          }
      }
      }
    }
  });

  // Yup validation schema
  const SignInSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email format').required('Email is required'),
    password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  });

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/login', {
        email: values.email,
        password: values.password,
      });

    const response = res.data;
    const { token, user } = response.data;

    const expiresInDays = 7;
    const expirationTimestamp = new Date();
    expirationTimestamp.setDate(expirationTimestamp.getDate() + expiresInDays);

    localStorage.setItem('token', JSON.stringify(token));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token_exp', expirationTimestamp.toISOString()); // Store full response data

    console.log('User data:', user); // Log user data to console
    console.log('Token:', token); // Log token to console
    console.log('Response:', response); // Log full response data to console

      if(user.role === 'Employee') {
        navigate('/dashboardEmployee');
      }else if(user.role === 'Admin') {
        navigate('/dashboardAdmin');
      }
      
    } catch (error) {
      setErrors({ password: 'Invalid credentials' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card shadow-lg border-0 p-4" style={{ width: '100%', maxWidth: '420px' }}>
        <h3 className="text-center mb-4">Welcome Back</h3>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={SignInSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="form-floating mb-3">
                <Field
                  type="email"
                  name="email"
                  id="floatingEmail"
                  className="form-control"
                  placeholder="Email"
                />
                <label htmlFor="floatingEmail">Email address</label>
                <div className="text-danger small mt-1">
                  <ErrorMessage name="email" />
                </div>
              </div>

              <div className="form-floating mb-4">
                <Field
                  type="password"
                  name="password"
                  id="floatingPassword"
                  className="form-control"
                  placeholder="Password"
                />
                <label htmlFor="floatingPassword">Password</label>
                <div className="text-danger small mt-1">
                  <ErrorMessage name="password" />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => navigate('/signup')}
              >
                Forgot your password?
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
