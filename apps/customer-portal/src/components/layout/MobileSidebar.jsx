import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const nav = [
  { to: "/", label: "Home" },
  { to: "/transactions", label: "Transactions" },
];

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function logout() {
    // ✅ customer token clear
    localStorage.removeItem("token");
    localStorage.removeItem("customerToken"); // if you used any alt keys
    localStorage.removeItem("adminToken");    // safe no harm

    // ✅ always go public home (your architecture)
    const PUBLIC_HOME =
      import.meta.env.VITE_PUBLIC_HOME_URL || "https://www.stareng.co.in";

    // best: hard redirect (prevents back navigation into portal)
    window.location.href = PUBLIC_HOME;
  }

  return (
    <>
      <div className="h-14 bg-white/80 backdrop-blur border-b flex items-center px-3 justify-between">
        <button className="btn-ghost" onClick={() => setOpen(true)}>
          Menu
        </button>

        <div className="text-sm font-semibold">Your Reports</div>

        {/* ✅ LOGOUT button on top bar (mobile) */}
        <button className="btn-ghost" onClick={logout}>
          Logout
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-72 bg-white p-3 flex flex-col">
            <div className="h-12 flex items-center justify-between px-2">
              <div className="font-semibold">Navigation</div>
              <button className="btn-ghost" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <div className="space-y-1">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === "/"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-50"
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </div>

            {/* ✅ footer actions */}
            <div className="mt-auto pt-3 border-t flex gap-2">
              <button
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold bg-slate-900 text-white"
                onClick={logout}
              >
                Logout
              </button>
              <button
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold border border-slate-200 hover:bg-slate-50"
                onClick={() => {
                  setOpen(false);
                  navigate("/");
                }}
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}