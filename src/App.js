import logo from "./logo.svg";
import "./App.css";
import React from "react";
import SignIn from "./components/pages/SignIn";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/pages/Dashboard";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Profile from "./components/pages/Employee/Profile";
import Rooms from "./components/pages/Admin/Rooms";
import Users from "./components/pages/Admin/Users";
import Features from "./components/pages/Admin/Features";
import Meetings from "./components/pages/Employee/Meetings";
import MeetingDetails from "./components/pages/Employee/MeetingDetails";


axios.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem("token"));
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const isTokenExpired = () => {
  const exp = localStorage.getItem("token_exp");
  return exp ? Date.now() > new Date(exp).getTime() : true;
};

const PrivateRoute = ({ children /* , allowedRoles */ }) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  /* const userRole = data.user.role; */ // Adjust this based on your token structure

  if (!token || !user || isTokenExpired()) {
    return <Navigate to="/signin" replace />;
  }

  /*   if (!allowedRoles.includes(userRole)) {
    // Redirect if the user doesn't have the correct role
    return <Navigate to="/" replace />;
  } */

  return children;
};

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />

        {/* Protected routes wrapped with Layout */}
        <Route element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/users" element={<Users />} />
          <Route path="/features" element={<Features />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meetings/:id" element={<MeetingDetails />} />
          {/* Add more protected routes here */}


        </Route>

        
      </Routes>
    </Router>
  );
}

export default App;
