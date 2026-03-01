import React, { useEffect, useRef } from "react";
import { getToken } from "../../lib/auth";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5c5.5 0 9.6 4.1 11 7c-1.4 2.9-5.5 7-11 7S2.4 14.9 1 12c1.4-2.9 5.5-7 11-7Zm0 2C7.7 7 4.3 10 3.2 12c1.1 2 4.5 5 8.8 5s7.7-3 8.8-5C19.7 10 16.3 7 12 7Zm0 2.5A2.5 2.5 0 1 1 12 14a2.5 2.5 0 0 1 0-5Z"
      />
    </svg>
  );
}

export default function AttachmentMenu({
  pdfs = [],
  makeUrl,       // (p) => full url
  openId,
  setOpenId,
  rowId,
}) {
  const ref = useRef(null);
  const isOpen = openId === rowId;

  useEffect(() => {
    function onDown(e) {
      if (!isOpen) return;
      if (ref.current && !ref.current.contains(e.target)) setOpenId("");
    }
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [isOpen, setOpenId]);

  if (!pdfs || !pdfs.length) return <span className="text-xs text-slate-400">—</span>;

  return (
    <div className="attachWrap" ref={ref}>
      <button
        type="button"
        className="attachBtn"
        title={`Attachments (${pdfs.length})`}
        onClick={() => setOpenId(isOpen ? "" : rowId)}
      >
        <EyeIcon />
      </button>

      {isOpen && (
        <div className="attachMenu">
          {pdfs.map((p, idx) => (
            <a
              key={p.id || p.url || idx}
              className="attachItem"
              href={makeUrl(p, idx, getToken())}
              target="_blank"
              rel="noreferrer"
              title={p.name || `PDF ${idx + 1}`}
              onClick={() => setOpenId("")}
            >
              👁️ PDF {idx + 1}
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div className="attachMeta">{(p.name || "").slice(0, 24)}</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}