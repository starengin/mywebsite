import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { getUser, logout } from "../../lib/auth.js";

export default function Topbar({ onMenuClick }) {
  const [me, setMe] = useState(getUser());

  useEffect(() => {
    api
      .me()
      .then((r) => setMe(r.user))
      .catch(() => {});
  }, []);

  function handleLogout() {
    const ok = window.confirm("Thank you! Are you sure you want to logout?");
    if (!ok) return;

    logout();

    const PUBLIC_HOME =
      import.meta.env.VITE_PUBLIC_HOME_URL ||
      (import.meta.env.DEV
        ? "http://localhost:5173"
        : "https://www.stareng.co.in");

    window.location.href = PUBLIC_HOME;
  }

  const initial = String(me?.name || me?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/84 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 transition shadow-sm"
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="min-w-0">
            <div
              className="truncate text-base sm:text-lg font-extrabold tracking-tight"
              style={{
                background:
                  "linear-gradient(135deg, #ff2d55 0%, #7c3aed 48%, #2563eb 78%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              STAR ENGINEERING
            </div>
            <div className="text-xs text-slate-500 truncate -mt-0.5">
              Customer Portal
            </div>
          </div>

          <span className="hidden sm:inline-flex rounded-full border border-fuchsia-100 bg-fuchsia-50 px-2.5 py-1 text-[10px] font-bold text-fuchsia-700">
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden md:flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#ff2d55] via-[#7c3aed] to-[#2563eb] text-white grid place-items-center text-sm font-extrabold shadow-[0_10px_24px_rgba(124,58,237,0.22)]">
              {initial}
            </div>

            <div className="text-right min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate max-w-[180px]">
                {me?.name || "Customer"}
              </div>
              <div className="text-xs text-slate-500 truncate max-w-[240px]">
                {me?.email || ""}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 h-10 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition shadow-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}