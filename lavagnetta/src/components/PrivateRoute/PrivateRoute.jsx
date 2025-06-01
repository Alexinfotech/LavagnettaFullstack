// src/components/PrivateRoute/PrivateRoute.jsx

import React from "react";
import { Navigate } from "react-router-dom";
import authService from "../../services/authService";

const PrivateRoute = ({ children }) => {
  return authService.isLoggedIn() ? children : <Navigate to="/auth/login" />;
};

export default PrivateRoute;
