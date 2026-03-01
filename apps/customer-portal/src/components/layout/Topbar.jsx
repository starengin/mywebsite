import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { getUser, logout } from "../../lib/auth.js";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const nav = useNavigate();
  const [me, setMe] = useState(getUser());

  useEffect(() => {
    api.me().then((r) => setMe(r.user)).catch(() => {});
  }, []);

  const onLogout = () => {
    // friendly logout message
    const ok = confirm("Thank you! Are you sure you want to logout?");
    if (!ok) return;
logout();

// ✅ always go to public website home (no back to portal pages)
const PUBLIC_HOME =
  import.meta.env.VITE_PUBLIC_HOME_URL || "https://www.stareng.co.in";

window.location.replace(PUBLIC_HOME);
  };

  return (
    <header className="hidden lg:flex sticky top-0 z-20 h-16 items-center justify-between px-6 bg-white/80 backdrop-blur border-b">
      <div>
        <div className="star-animated-gradient-text text-base font-semibold">Welcome{me?.name ? `, ${me.name}` : ""} 👋</div>
        <div className="text-xs text-slate-500">Your account dashboard</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="star-animated-gradient-text text-sm font-semibold">{me?.name || "Customer"}</div>
          <div className="text-xs text-slate-500">{me?.email || ""}</div>
        </div>
        <button className="btn-primary" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
