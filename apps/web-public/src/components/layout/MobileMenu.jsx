import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function MobileMenu({ open, onClose }) {
  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="mmOverlay" onClick={onClose}>
      <div className="mmDrawer" onClick={(e) => e.stopPropagation()}>
        <div className="mmTop">
          <div className="brandText gradText">SERVICE INDIA</div>
          <button className="mmClose" onClick={onClose}>✕</button>
        </div>

        <nav className="mmNav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              onClick={onClose}
              className={({ isActive }) => `mmLink ${isActive ? "active" : ""}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="mmBottom">
          <div className="muted">Secure • Fast • Mobile Ready</div>
        </div>
      </div>
    </div>
  );
}