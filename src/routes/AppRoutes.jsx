import { Routes, Route } from "react-router-dom";
import Login from "../screens/Login";
import Dashboard from "../screens/Dashboard";
import Customers from "../screens/Customers";
import Transactions from "../screens/Transactions";
import Ledger from "../screens/Ledger";
import AdminLayout from "../components/layouts/AdminLayout";
import ProtectedRoute from "../components/layouts/ProtectedRoute";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="ledger" element={<Ledger />} />
      </Route>
    </Routes>
  );
}