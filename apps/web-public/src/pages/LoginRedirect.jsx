import { useEffect } from "react";

export default function LoginRedirect() {
  useEffect(() => {
    const url =
      import.meta.env.VITE_CUSTOMER_PORTAL_URL ||
      "http://localhost:5175/login"; // dev fallback
    window.location.replace(url);
  }, []);

  return null;
}