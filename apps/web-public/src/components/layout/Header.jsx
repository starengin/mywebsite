import { useState } from "react";
import { NavLink } from "react-router-dom";
import MobileMenu from "./MobileMenu";
import Button from "../ui/Button";

const CUSTOMER_URL = import.meta.env.VITE_CUSTOMER_PORTAL_URL || "https://portal.stareng.co.in";

export default function Header() {
  const [open, setOpen] = useState(false);

const goLogin = () => {
  if (!CUSTOMER_PORTAL_URL) return; // no redirect if not set
  if (window.location.href === CUSTOMER_PORTAL_URL) return; // prevent loop
  window.location.href = CUSTOMER_PORTAL_URL;
};

  return (
    <>
      <header className="header">
        <div className="container headerRow">
          
          <div className="leftRow">
            <button className="hamburger" onClick={() => setOpen(true)}>
              <span></span>
              <span></span>
              <span></span>
            </button>

            {/* ✅ IMPORTANT: gradText class yaha hona chahiye */}
            <NavLink to="/" className="brand brandWithLogo">
  <img className="brandLogo" src="/brand/logo.jpg" alt="STAR Engineering" />
  <span className="brandWord gradText">STAR ENGINEERING</span>
</NavLink>
          </div>

          <nav className="nav desktopOnly">
            <NavLink to="/" end className="navLink">Home</NavLink>
                        <NavLink to="/about" className="navLink">About</NavLink>
            <NavLink to="/shop" className="navLink">Shop</NavLink>

            <NavLink to="/contact" className="navLink">Contact</NavLink>
          </nav>

          {/* ✅ IMPORTANT: btnAnim add */}
<Button onClick={goLogin}>
  Login
</Button>

        </div>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}