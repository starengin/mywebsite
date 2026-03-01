import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.stareng.co.in",
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// helper: always return data
async function getData(promise) {
  const res = await promise;
  return res.data;
}

export const api = {
  // ✅ Admin Auth
  adminCaptcha: () => getData(API.get("/admin/captcha")),

  // ✅ NEW: Admin Login (NO OTP) — frontend will call this
  adminLogin: (data) => getData(API.post("/admin/login", data)),

  // ✅ Dashboard
  dashboard: (params) => getData(API.get("/dashboard", { params })),

  // ✅ Customers
  customers: () => getData(API.get("/customers")),
  createCustomer: (data) => getData(API.post("/customers", data)),
  updateCustomer: (id, data) => getData(API.put(`/customers/${id}`, data)),
  deleteCustomer: (id) => getData(API.delete(`/customers/${id}`)),

  // ✅ Transactions
  transactions: (params) => getData(API.get("/transactions", { params })),

  // ✅ Create txn (with pdfs)
  createTransaction: (formData) =>
    getData(
      API.post("/transactions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ),

  updateTransaction: (id, data) => getData(API.put(`/transactions/${id}`, data)),
  deleteTransaction: (id) => getData(API.delete(`/transactions/${id}`)),

  // ✅ Scan PDF
  scanTransactionPDF: (file) => {
    const fd = new FormData();
    fd.append("pdf", file);
    return getData(
      API.post("/transactions/scan", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  // ✅ Add / Remove PDFs on existing txn
  addTransactionPDFs: (id, files) => {
    const fd = new FormData();
    for (const f of files) fd.append("pdfs", f);
    return getData(
      API.post(`/transactions/${id}/pdfs`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  deleteTransactionPDF: (id, pdfId) =>
    getData(API.delete(`/transactions/${id}/pdfs/${pdfId}`)),

  // ✅ Admin Ledger (JSON) — uses existing backend route /ledger/:partyId
  adminLedger: (partyId, from, to) =>
    getData(
      API.get(`/ledger/${encodeURIComponent(partyId)}`, {
        params: { from, to },
      })
    ),

  // ✅ Admin Ledger PDF — uses existing backend route /ledger/:partyId/pdf
  exportAdminLedgerPdf: (partyId, from, to, token) => {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return `${base}/ledger/${encodeURIComponent(
      partyId
    )}/pdf?from=${encodeURIComponent(from)}&to=${encodeURIComponent(
      to
    )}&token=${encodeURIComponent(token)}`;
  },
};

export default API;