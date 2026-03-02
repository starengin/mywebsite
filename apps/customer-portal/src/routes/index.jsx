import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// pages
import Login from "../pages/Login/Login.jsx";
import CustomerLayout from "../layouts/CustomerLayout";
import Home from "../pages/Home/Home.jsx";
import Ledger from "../pages/Ledger/Ledger.jsx";
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
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="ledger" element={<Ledger />} />
        <Route path="transactions" element={<Transactions />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}