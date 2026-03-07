import React from "react";

export default function Card({ children, style = {}, ...props }) {
  return (
    <div
      {...props}
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
        borderRadius: 20,
        border: "1px solid rgba(255,232,190,0.36)",
        boxShadow: "0 14px 30px rgba(17,24,39,0.07)",
        padding: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}