import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const PUBLIC_HOME =
      import.meta.env.VITE_PUBLIC_HOME_URL || "http://localhost:5173/";

    window.location.replace(PUBLIC_HOME);
  }

  return (
    <div className="adminShell">
      <aside className="sidebar desktopOnly">
        <Brand />
        <Nav setOpen={setOpen} />
        <button
          className="btnGhost logoutBtn"
          onClick={handleLogout}
          style={{ marginTop: "auto" }}
        >
          Logout
        </button>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topLeft">
            <button
              className="iconBtn mobileOnly"
              onClick={() => setOpen(true)}
              aria-label="Menu"
            >
              ☰
            </button>

            <div>
              <div className="topTitle">STAR Engineering</div>
              <div className="topSub">Admin Portal</div>
            </div>
          </div>

          <button className="btnGhost desktopOnly" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="container">
          <Outlet />
        </div>
      </main>

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
              <div className="drawerHead">
                <Brand />
                <button
                  className="iconBtn"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <Nav setOpen={setOpen} />

              <button
                className="btnGhost logoutBtn"
                onClick={handleLogout}
                style={{ marginTop: "auto" }}
              >
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
    <div className="brandWrap">
      <div className="brandGlow" />
      <div className="brand">
        <div className="logoBox">
          <img
            src="https://www.stareng.co.in/brand/logo.jpg"
            alt="STAR"
            className="logoImg"
          />
        </div>

        <div className="brandText">
          <div className="brandTitle">STAR Engineering</div>
          <div className="brandSub">Admin Portal</div>
        </div>
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
      <SideLink to="/emails" label="Email Center" onClick={() => setOpen(false)} />
    </nav>
  );
}

function SideLink({ to, label, end, onClick }) {
  const isNew = label === "Email Center";

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => "sideLink" + (isActive ? " active" : "")}
    >
      <span className="sideLinkText">
        {label}
        {isNew && <span className="newBadge">NEW</span>}
      </span>
    </NavLink>
  );
}

const css = `
.adminShell{
  min-height:100vh;
  display:grid;
  grid-template-columns:270px 1fr;
  background:
    radial-gradient(900px 420px at 15% 0%, rgba(255,0,102,0.05), transparent 60%),
    radial-gradient(760px 380px at 95% 18%, rgba(0,102,255,0.05), transparent 55%),
    radial-gradient(920px 520px at 80% 110%, rgba(255,170,0,0.06), transparent 60%),
    linear-gradient(145deg,#f8fafc,#f8fafc,#f6f8fc);
}

.sidebar{
  position:relative;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.88));
  border-right:1px solid rgba(255,232,190,0.30);
  padding:14px;
  display:flex;
  flex-direction:column;
  gap:14px;
  backdrop-filter: blur(12px);
  box-shadow: 8px 0 30px rgba(17,24,39,0.04);
}

.brandWrap{
  position:relative;
  overflow:hidden;
  border-radius:22px;
  border:1px solid rgba(255,232,190,0.34);
  background:
    radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.05), transparent 55%),
    radial-gradient(760px 200px at 95% 0%, rgba(0,102,255,0.05), transparent 60%),
    linear-gradient(180deg,#ffffff,#fffaf8);
  box-shadow: 0 12px 26px rgba(17,24,39,0.05);
}

.brandGlow{
  height:4px;
  background:
    linear-gradient(90deg, rgba(161,0,255,0.10), rgba(255,122,0,0.24), rgba(0,102,255,0.10));
}

.brand{
  display:flex;
  gap:12px;
  align-items:center;
  padding:14px;
}

.logoBox{
  width:52px;
  height:52px;
  border-radius:16px;
  display:grid;
  place-items:center;
  background:
    linear-gradient(135deg,#ffffff,#fff4ea);
  border:1px solid rgba(255,232,190,0.45);
  box-shadow: 0 12px 22px rgba(17,24,39,0.08);
  flex-shrink:0;
}

.logoImg{
  width:34px;
  height:34px;
  object-fit:contain;
  border-radius:10px;
  display:block;
}

.brandText{
  min-width:0;
}

.brandTitle{
  font-weight:900;
  font-size:17px;
  color:#111827;
  line-height:1.15;
}

.brandSub{
  font-size:12px;
  color:#64748b;
  margin-top:4px;
  font-weight:700;
}

.nav{
  display:flex;
  flex-direction:column;
  gap:10px;
}

.sideLink{
  text-decoration:none;
  padding:12px 14px;
  border-radius:16px;
  border:1px solid rgba(17,24,39,0.08);
  background:
    linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.88));
  font-weight:800;
  font-size:14px;
  color:#111827;
  transition: all 0.18s ease;
  box-shadow: 0 8px 18px rgba(17,24,39,0.03);
}

.sideLink:hover{
  transform: translateY(-1px);
  border-color: rgba(255,232,190,0.34);
  box-shadow: 0 12px 22px rgba(17,24,39,0.05);
}

.sideLink.active{
  color:#7a0000;
  border-color: rgba(161,0,255,0.18);
  background:
    radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.06), transparent 55%),
    radial-gradient(760px 200px at 95% 0%, rgba(0,102,255,0.05), transparent 60%),
    linear-gradient(180deg,#fffafc,#fff6fb);
  box-shadow: 0 12px 24px rgba(161,0,255,0.08);
}

.sideLinkText{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
}

.newBadge{
  font-size:10px;
  font-weight:900;
  padding:3px 8px;
  border-radius:999px;
  color:#fff;
  border:1px solid rgba(255,232,190,0.35);
  background:linear-gradient(135deg,#3b0000,#a100ff,#ff0066,#ff7a00);
  box-shadow:0 10px 20px rgba(0,0,0,0.16);
}

.main{
  display:flex;
  flex-direction:column;
  min-width:0;
}

.topbar{
  position:sticky;
  top:0;
  z-index:10;
  background: rgba(255,255,255,0.86);
  backdrop-filter: blur(14px);
  border-bottom:1px solid rgba(255,232,190,0.28);
  padding:14px 16px;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.topLeft{
  display:flex;
  gap:10px;
  align-items:center;
}

.topTitle{
  font-weight:900;
  color:#111827;
  font-size:16px;
}

.topSub{
  font-size:12px;
  color:#64748b;
  font-weight:700;
  margin-top:3px;
}

.container{
  padding:16px;
  min-width:0;
}

.iconBtn{
  width:42px;
  height:42px;
  border-radius:14px;
  border:1px solid rgba(17,24,39,0.10);
  background:#fff;
  color:#111827;
  font-weight:900;
  cursor:pointer;
  box-shadow: 0 8px 18px rgba(17,24,39,0.04);
}

.btnGhost{
  padding:11px 14px;
  border-radius:14px;
  border:1px solid rgba(17,24,39,0.12);
  background:#fff;
  color:#111827;
  font-weight:900;
  cursor:pointer;
  font-size:13px;
  font-family:Arial, Helvetica, sans-serif;
  box-shadow: 0 8px 18px rgba(17,24,39,0.04);
}

.logoutBtn{
  margin-top:auto;
}

.backdrop{
  position:fixed;
  inset:0;
  background: rgba(2,6,23,0.45);
  z-index:50;
}

.drawer{
  position:fixed;
  left:0;
  top:0;
  bottom:0;
  width:290px;
  z-index:60;
  box-shadow: 20px 0 50px rgba(2,6,23,0.18);
}

.drawerHead{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
}

.mobileOnly{ display:none; }
.desktopOnly{ display:block; }

@media (max-width: 920px){
  .adminShell{
    grid-template-columns: 1fr;
  }

  .desktopOnly{ display:none; }
  .mobileOnly{ display:inline-grid; }

  .container{
    padding:12px;
  }

  .topbar{
    padding:12px;
  }
}
`;