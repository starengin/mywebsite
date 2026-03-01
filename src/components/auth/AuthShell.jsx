import React from "react";
import { motion } from "framer-motion";
import "../../styles/admin-auth.css";

export default function AuthShell({ title, subtitle, badge = "Admin", children }) {
  return (
    <div className="star-auth">
      <div className="wrap">
        <motion.aside
          className="left"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="brand">
            <div className="logo" />
            <div>
              <h1>STAR Engineering</h1>
              <p>Admin Portal</p>
            </div>
          </div>

          <h2>Secure access, clean workflow.</h2>
          <p className="lead">
            Login with OTP, manage customers, transactions, ledger and PDFs — fast, responsive and device-friendly UI.
          </p>

          <div className="chips">
            <span className="chip">OTP Login</span>
            <span className="chip">Ledger Ready</span>
            <span className="chip">PDF Reports</span>
            <span className="chip">Prisma + SQLite</span>
          </div>
        </motion.aside>

        <motion.section
          className="right"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
        >
          <div className="panelHead">
            <div>
              <p className="title" style={{ margin: 0 }}>{title}</p>
              <p className="sub">{subtitle}</p>
            </div>
            <span className="badge">{badge}</span>
          </div>

          {children}
        </motion.section>
      </div>
    </div>
  );
}