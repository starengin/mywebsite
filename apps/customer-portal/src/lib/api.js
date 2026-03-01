import { getToken, logout } from "./auth.js";

const API = import.meta.env.VITE_API_URL;

async function request(path, { method = "GET", body } = {}) {
  const token = getToken();

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  // ✅ 401: logout ONLY if token exists (means session expired)
  // ✅ login route par token nahi hota, so error message will show properly
  if (res.status === 401 && token) {
    logout();
    window.location.href = "https://www.stareng.co.in";
    throw new Error(data?.message || "Session expired. Please login again.");
  }

  // ✅ Normal errors (including login wrong email/password)
  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

function qs(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const api = {
  login: (payload) => request("/customer-auth/login", { method: "POST", body: payload }),
  me: () => request("/customer-auth/me"),
  dashboard: () => request("/customer-portal/dashboard"),
  transactions: (q = "") => request(`/customer-portal/transactions${q}`),

  fileUrl: (path) => (path?.startsWith("http") ? path : `${API}${path || ""}`),

  exportLedgerPdf: (from, to, token) => {
    return `${API}/customer-portal/export-ledger-pdf${qs({ from, to, token })}`;
  },
};