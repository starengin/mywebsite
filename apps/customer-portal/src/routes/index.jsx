import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// pages
import Login from "../pages/Login/Login.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import Home from "../pages/Home/Home.jsx";
import Transactions from "../pages/Transactions/Transactions.jsx";

import { isAuthed } from "../lib/auth.js";

export default function AppRoutes() {
  return (
    <Routes>
      {/* portal.stareng.co.in hit -> login OR app */}
      <Route
        path="/"
        element={isAuthed() ? <Navigate to="/app" replace /> : <Navigate to="/login" replace />}
      />

      <Route path="/login" element={<Login />} />

      {/* Protected area */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
             <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="transactions" element={<Transactions />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}