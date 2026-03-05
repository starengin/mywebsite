import React from "react";
import { Navigate } from "react-router-dom";
import { getToken, getLoginAt, clearToken } from "../../lib/auth";

export default function ProtectedRoute({ children }) {
  const token = getToken();
  const loginAt = getLoginAt();

  // ✅ New tab/window => sessionStorage empty => token not found => goes login
  if (!token) return <Navigate to="/login" replace />;

  // ✅ extra safety: token exists but marker missing => force logout
  if (!loginAt) {
    clearToken();
    return <Navigate to="/login" replace />;
  }

  return children;
}