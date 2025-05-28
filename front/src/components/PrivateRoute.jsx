// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import React from 'react'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token"); // or use cookies if you prefer

  return token ? children : <Navigate to="/" />;
};

export default PrivateRoute;