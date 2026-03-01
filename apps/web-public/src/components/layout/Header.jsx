import { useState } from "react";
import { NavLink } from "react-router-dom";
import MobileMenu from "./MobileMenu";
import Button from "../ui/Button";

const PORTAL =
  import.meta.env.VITE_CUSTOMER_PORTAL_URL || "https://portal.stareng.co.in";

export default function Header() {
  const [open, setOpen] = useState(false);

  const goLogin = () => {
    const url = `${PORTAL}/login`;
    if (window.location.href === url) return;
    window.location.assign(url);
  };

  return (
    <>
      <header className="header">
        <div className="container headerRow">
          <div className="leftRow">
            <button className="hamburger" onClick={() => setOpen(true)}>
              <span></span><span></span><span></span>
            </button>

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

          <Button onClick={goLogin}>Login</Button>
        </div>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}