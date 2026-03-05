const TOKEN_KEY = "token";
const LOGIN_AT_KEY = "admin_login_at";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

export function setToken(t) {
  if (t) sessionStorage.setItem(TOKEN_KEY, t);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(LOGIN_AT_KEY);
}

export function markLoginNow() {
  sessionStorage.setItem(LOGIN_AT_KEY, String(Date.now()));
}

export function getLoginAt() {
  return Number(sessionStorage.getItem(LOGIN_AT_KEY) || 0);
}