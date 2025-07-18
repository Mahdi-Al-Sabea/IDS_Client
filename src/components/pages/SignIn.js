import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useUser } from "../../hooks/UserContext";
import { FaEnvelope, FaLock } from "react-icons/fa";
import "./SignIn.css";
export default function SignIn() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const tokenExp = localStorage.getItem("token_exp");

    if (token && user && tokenExp) {
      const expiration = new Date(tokenExp);
      if (expiration > new Date()) {
        const parsedUser = JSON.parse(user);
        parsedUser?.role === "Admin"
          ? navigate("/dashboardAdmin")
          : navigate("/dashboardEmployee");
      }
    }
  }, []);

  const SignInSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().min(6, "Min 6 characters").required("Required"),
  });

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login", values);
      const { token, user } = res.data.data;

      setUser(user);
      const exp = new Date();
      exp.setDate(exp.getDate() + 7);

      localStorage.setItem("token", JSON.stringify(token));
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token_exp", exp.toISOString());

      navigate(
        user.role === "Admin" ? "/dashboardAdmin" : "/dashboardEmployee"
      );
    } catch (err) {
      setErrors({ password: "Invalid email or password" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="left-pane">
        <div className="balls-container">
          {[...Array(10)].map((_, i) => (
            <div key={i} className={`ball ball-${i + 1}`}></div>
          ))}
        </div>
        <h1 style={{zIndex :99}}>Welcome Back 👋</h1>
        <p>Log in to manage your meetings and tasks efficiently.</p>
      </div>

      <div className="right-pane">
        <div className="form-container">
          <h2>Sign In</h2>
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={SignInSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="input-group">
                  <FaEnvelope className="input-icon" />
                  <Field type="email" name="email" placeholder="Email" />
                </div>
                <ErrorMessage name="email" component="div" className="error" />

                <div className="input-group">
                  <FaLock className="input-icon" />
                  <Field
                    type="password"
                    name="password"
                    placeholder="Password"
                  />
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="error"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="submit-btn"
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
