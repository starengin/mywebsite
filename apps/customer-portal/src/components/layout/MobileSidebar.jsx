import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getUser, logout } from "../../lib/auth.js";

const nav = [
  { to: "/app", label: "Home" },
  { to: "/app/transactions", label: "Transactions" },
];

export default function MobileSidebar({ open, onClose }) {
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
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-[84vw] max-w-[320px] bg-white shadow-2xl flex flex-col lg:hidden"
            initial={{ x: -340 }}
            animate={{ x: 0 }}
            exit={{ x: -340 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className="h-20 px-4 border-b border-slate-200 flex items-center justify-between">
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
                    className="truncate text-[17px] font-extrabold tracking-tight"
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
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Customer Portal
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700">
                  LIVE
                </span>

                <button
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 transition"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="px-4 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#ff2d55] via-[#7c3aed] to-[#2563eb] text-white grid place-items-center text-sm font-extrabold shadow-[0_10px_24px_rgba(124,58,237,0.22)]">
                  {initial}
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {user?.name || "Customer"}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.email || "Portal User"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-2 flex-1">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === "/app"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#ff2d55] via-[#7c3aed] to-[#2563eb] text-white shadow-[0_12px_28px_rgba(124,58,237,0.22)]"
                        : "text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </div>

            <div className="p-3 border-t border-slate-200">
              <button
                className="w-full rounded-2xl px-4 py-3 text-sm font-semibold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                onClick={handleLogout}
              >
                Logout
              </button>

              <div className="mt-4 text-xs text-slate-500 text-center">
                Industrial • Reliable • Mobile Ready
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}