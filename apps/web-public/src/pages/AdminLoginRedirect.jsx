import { useEffect } from "react";

export default function AdminLoginRedirect() {
  useEffect(() => {
    const url =
      import.meta.env.VITE_ADMIN_PORTAL_URL ||
      "http://localhost:5174/admin/login"; // dev fallback
    window.location.replace(url);
  }, []);

  return null;
}