import { getToken, logout } from "./auth.js";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";
const PUBLIC_HOME = import.meta.env.VITE_PUBLIC_HOME_URL || "https://www.stareng.co.in";

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

  // ✅ 401 => token exists => session expired => logout + go public home
  if (res.status === 401 && token) {
    logout();
    window.location.href = PUBLIC_HOME;
    throw new Error(data?.message || "Session expired. Please login again.");
  }

  if (!res.ok) throw new Error(data?.message || "Request failed");

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