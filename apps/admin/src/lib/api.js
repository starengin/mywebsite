import axios from "axios";

const base =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? "http://localhost:5000" : "https://api.stareng.co.in");

const API = axios.create({
  baseURL: base,
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
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

  // ✅ NEW: send credentials email later (backend endpoint needed)
sendCustomerCredentials: (id, password) =>
  getData(API.post(`/customers/${id}/send-welcome-email`, { password })),

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
    // ✅ resend transaction email later (backend endpoint needed)
  sendTransactionEmail: (id) =>
    getData(API.post(`/transactions/${id}/send-email`)),

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
    // ✅ Admin Email Center (send via backend)
  sendAdminEmail: ({ to, subject, html, mainPdf, extraFiles = [] }) => {
    const fd = new FormData();
    fd.append("to", to);
    fd.append("subject", subject);
    fd.append("html", html || "");

    if (mainPdf) fd.append("mainPdf", mainPdf);
    for (const f of extraFiles) fd.append("extraFiles", f);

    return getData(
      API.post("/admin/emails/send", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },
    // ✅ Email Center
  adminLeads: () => getData(API.get("/admin/leads")),

  adminSendEmail: (payload) => {
    // payload: { to, subject, html, mainPdf?: File, extraFiles?: File[] }
    const fd = new FormData();
    fd.append("to", payload.to);
    fd.append("subject", payload.subject);
    fd.append("html", payload.html);

    if (payload.mainPdf) fd.append("mainPdf", payload.mainPdf);
    (payload.extraFiles || []).forEach((f) => fd.append("extraFiles", f));

    return getData(
      API.post("/admin/emails/send", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },
};

export default API;