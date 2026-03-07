import React from "react";

export default function Loader({ text = "Loading..." }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: "center",
        padding: 18,
        color: "#64748b",
        fontWeight: 800,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "2px solid rgba(161,0,255,0.18)",
          borderTopColor: "#ff0066",
          display: "inline-block",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span>{text}</span>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}