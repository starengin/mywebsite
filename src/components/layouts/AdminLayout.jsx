import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  function handleLogout() {
    // ✅ clear auth
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // agar save karte ho

    // ✅ go to public website home (no back)
    const PUBLIC_HOME =
      import.meta.env.VITE_PUBLIC_HOME_URL || "http://localhost:5173/";

    window.location.replace(PUBLIC_HOME);
  }

  return (
    <div className="adminShell">
      {/* Desktop sidebar */}
      <aside className="sidebar desktopOnly">
        <Brand />
        <Nav setOpen={setOpen} />
        <button className="btn btn-ghost" onClick={handleLogout} style={{ marginTop: "auto" }}>
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="topbar">
          <div className="topLeft">
            <button className="iconBtn mobileOnly" onClick={() => setOpen(true)} aria-label="Menu">
              ☰
            </button>
            <div>
              <div style={{ fontWeight: 900 }}>STAR Engineering</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Admin Portal</div>
            </div>
          </div>

          <button className="btn btn-ghost desktopOnly" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="container">
          <Outlet />
        </div>
      </main>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="sidebar drawer"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Brand />
                <button className="iconBtn" onClick={() => setOpen(false)} aria-label="Close">
                  ✕
                </button>
              </div>

              <Nav setOpen={setOpen} />

              <button className="btn btn-ghost" onClick={handleLogout} style={{ marginTop: "auto" }}>
                Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{css}</style>
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="logo">★</div>
      <div>
        <div style={{ fontWeight: 900 }}>STAR</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Admin</div>
      </div>
    </div>
  );
}

function Nav({ setOpen }) {
  return (
    <nav className="nav">
      <SideLink to="/" end label="Dashboard" onClick={() => setOpen(false)} />
      <SideLink to="/customers" label="Customers" onClick={() => setOpen(false)} />
      <SideLink to="/transactions" label="Transactions" onClick={() => setOpen(false)} />
      <SideLink to="/ledger" label="Ledger" onClick={() => setOpen(false)} />
    </nav>
  );
}

function SideLink({ to, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => "sideLink" + (isActive ? " active" : "")}
    >
      {label}
    </NavLink>
  );
}


const css = `
.adminShell{
  min-height:100vh;
  display:grid;
  grid-template-columns:260px 1fr;
}

.sidebar{
  background:#fff;
  border-right:1px solid var(--line);
  padding:14px;
  display:flex;
  flex-direction:column;
  gap:12px;
}

.brand{ display:flex; gap:10px; align-items:center; padding:6px; }
.logo{
  width:40px; height:40px; border-radius:14px;
  display:grid; place-items:center;
  background: linear-gradient(135deg, var(--primary1), var(--primary2));
  color:#fff; font-weight:900;
}

.nav{ display:flex; flex-direction:column; gap:8px; padding:4px; }
.sideLink{
  text-decoration:none;
  padding:10px 12px;
  border-radius:14px;
  border:1px solid var(--line);
  background:#fff;
  font-weight:800;
  font-size:14px;
}
.sideLink.active{
  background: rgba(37,99,235,0.10);
  border-color: rgba(37,99,235,0.28);
  color:#1d4ed8;
}

.main{ display:flex; flex-direction:column; }

.topbar{
  position:sticky; top:0; z-index:10;
  background: rgba(255,255,255,0.90);
  backdrop-filter: blur(10px);
  border-bottom:1px solid var(--line);
  padding:12px 14px;
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.topLeft{ display:flex; gap:10px; align-items:center; }

.iconBtn{
  width:40px; height:40px;
  border-radius:12px;
  border:1px solid var(--line);
  background:#fff;
  font-weight:900;
  cursor:pointer;
}

.backdrop{
  position:fixed; inset:0;
  background: rgba(2,6,23,0.45);
  z-index:50;
}

.drawer{
  position:fixed;
  left:0; top:0; bottom:0;
  width:280px;
  z-index:60;
  box-shadow: 20px 0 50px rgba(2,6,23,0.18);
}

.mobileOnly{ display:none; }
.desktopOnly{ display:block; }

@media (max-width: 920px){
  .adminShell{ grid-template-columns: 1fr; }
  .desktopOnly{ display:none; }
  .mobileOnly{ display:inline-grid; }
}
`;