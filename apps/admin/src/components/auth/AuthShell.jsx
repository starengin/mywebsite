import React from "react";
import { motion } from "framer-motion";
import "../../styles/admin-auth.css";

export default function AuthShell({
  title,
  subtitle,
  badge = "Admin",
  children,
}) {
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
            <div className="logoWrap">
              <img
                src="https://www.stareng.co.in/brand/logo.jpg"
                alt="STAR Engineering"
                className="logoImg"
              />
            </div>

            <div>
              <h1>STAR Engineering</h1>
              <p>Admin Portal</p>
            </div>
          </div>

          <h2>Secure access, clean workflow.</h2>

          <p className="lead">
            Manage customers, transactions, ledger, PDFs and email workflows
            from one premium admin panel with a fast and responsive interface.
          </p>

          <div className="chips">
            <span className="chip">Secure Login</span>
            <span className="chip">Customer Control</span>
            <span className="chip">Ledger Ready</span>
            <span className="chip">PDF Workflow</span>
            <span className="chip">Email Center</span>
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
              <p className="title" style={{ margin: 0 }}>
                {title}
              </p>
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