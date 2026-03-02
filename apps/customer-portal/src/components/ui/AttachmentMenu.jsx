import React, { useEffect, useRef } from "react";
import { getToken } from "../../lib/auth";

function DownloadViewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3a1 1 0 0 1 1 1v8.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4.0 4.0a1 1 0 0 1-1.4 0l-4.0-4.0a1 1 0 1 1 1.4-1.4L11 12.6V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 1.5V9h4.5L14 4.5ZM9 12h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2Zm0 4h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2Z"
      />
    </svg>
  );
}

export default function AttachmentMenu({
  pdfs = [],
  makeUrl, // (p, idx, token) => full url
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
  className={"attachBtn attachBtn--grad " + (isOpen ? "isOpen" : "")}
  title="View attachment"
  onClick={() => setOpenId(isOpen ? "" : rowId)}
>
  <span className="attachBtn__icon">
    <DownloadViewIcon />
  </span>
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
              <span className="attachItemIcon">
                <DocIcon />
              </span>

              <div className="attachItemBody">
                <div className="attachItemTitle">PDF {idx + 1}</div>
                <div className="attachMeta">
                  {(p.name || "Attachment").slice(0, 34)}
                </div>
              </div>

              <span className="attachItemArrow" aria-hidden="true">›</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}