import React from "react";

export default function Button({
  children,
  variant = "primary",
  style = {},
  ...props
}) {
  const base = {
    padding: "11px 14px",
    borderRadius: 14,
    fontWeight: 900,
    fontSize: 13,
    fontFamily: "Arial, Helvetica, sans-serif",
    cursor: "pointer",
    border: "1px solid rgba(17,24,39,0.12)",
  };

  const variants = {
    primary: {
      border: "1px solid rgba(255,232,190,0.45)",
      background: "linear-gradient(135deg,#a100ff,#ff0066,#ff7a00)",
      color: "#fff",
      boxShadow: "0 12px 24px rgba(161,0,255,0.12)",
    },
    ghost: {
      background: "#fff",
      color: "#111827",
      boxShadow: "0 8px 18px rgba(17,24,39,0.04)",
    },
  };

  return (
    <button
      {...props}
      style={{
        ...base,
        ...(variants[variant] || variants.primary),
        ...style,
      }}
    >
      {children}
    </button>
  );
}