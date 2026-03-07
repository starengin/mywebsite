import { NavLink } from "react-router-dom";
import { getUser, logout } from "../../lib/auth.js";

const nav = [
  { to: "/app", label: "Home" },
  { to: "/app/transactions", label: "Transactions" },
];

export default function Sidebar() {
  const user = getUser();

  function handleLogout() {
    logout();

    const PUBLIC_HOME =
      import.meta.env.VITE_PUBLIC_HOME_URL ||
      (import.meta.env.DEV
        ? "http://localhost:5173"
        : "https://www.stareng.co.in");

    window.location.href = PUBLIC_HOME;
  }

  const initial = String(user?.name || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <aside className="h-screen w-72 border-r border-slate-200/70 bg-white/88 backdrop-blur-xl shadow-[0_14px_40px_rgba(15,23,42,0.06)] flex flex-col">
      {/* HEADER */}
      <div className="h-20 px-5 border-b border-slate-200/70 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.08)] grid place-items-center overflow-hidden shrink-0">
            <img
              src="https://www.stareng.co.in/brand/logo.jpg"
              alt="STAR"
              className="h-8 w-8 object-contain rounded-lg"
            />
          </div>

          <div className="min-w-0">
            <div
              className="truncate text-[20px] font-extrabold tracking-tight"
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
            <div className="text-xs text-slate-500 -mt-0.5">
              Customer Portal
            </div>
          </div>
        </div>

        <span className="rounded-full border border-fuchsia-100 bg-fuchsia-50 px-2.5 py-1 text-[10px] font-bold text-fuchsia-700">
          LIVE
        </span>
      </div>

      {/* USER */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#ff2d55] via-[#7c3aed] to-[#2563eb] text-white grid place-items-center text-sm font-extrabold shadow-[0_10px_24px_rgba(124,58,237,0.22)]">
            {initial}
          </div>

          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">
              {user?.name || "Customer"}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {user?.email || "Portal User"}
            </div>
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="flex-1 p-4 space-y-2">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/app"}
            className={({ isActive }) =>
              `flex items-center rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#ff2d55] via-[#7c3aed] to-[#2563eb] text-white shadow-[0_12px_28px_rgba(124,58,237,0.22)]"
                  : "text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-200/70">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition"
        >
          Logout
        </button>

        <div className="mt-4 text-center text-xs text-slate-500">
          Secure • Fast • Mobile Ready
        </div>
      </div>
    </aside>
  );
}