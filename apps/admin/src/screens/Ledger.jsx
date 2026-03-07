import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { getToken } from "../lib/auth.js";
import AttachmentMenu from "../components/ui/AttachmentMenu";

const pageAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Ledger() {
  const [openAttachId, setOpenAttachId] = useState("");
  const [customers, setCustomers] = useState([]);
  const [partyId, setPartyId] = useState("");

  const [rows, setRows] = useState([]);
  const [opening, setOpening] = useState(0);
  const [closing, setClosing] = useState(0);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateErr, setDateErr] = useState("");

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().slice(0, 10);
  });

  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function fmtDateISO(iso) {
    if (!iso) return "-";
    const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mmm = d.toLocaleString("en-GB", { month: "short" });
    const yyyy = d.getFullYear();
    return `${dd}-${mmm}-${yyyy}`;
  }

  function clampRange(nextFrom, nextTo) {
    if (!nextFrom || !nextTo) return { from: nextFrom, to: nextTo, err: "" };

    if (nextFrom > nextTo) {
      return {
        from: nextFrom,
        to: nextFrom,
        err: "To date cannot be earlier than From date.",
      };
    }

    return { from: nextFrom, to: nextTo, err: "" };
  }

  function onChangeFrom(val) {
    const out = clampRange(val, to);
    setFrom(out.from);
    setTo(out.to);
    setDateErr(out.err);
  }

  function onChangeTo(val) {
    const out = clampRange(from, val);
    setFrom(out.from);
    setTo(out.to);
    setDateErr(out.err);
  }

  useEffect(() => {
    (async () => {
      try {
        const list = await api.customers();
        const arr = Array.isArray(list) ? list : list?.items || [];
        setCustomers(arr);

        if (arr.length && !partyId) {
          setPartyId(String(arr[0].id));
        }
      } catch (e) {
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load customers"
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setErr("");
    setLoading(true);

    try {
      if (!partyId) {
        setRows([]);
        setOpening(0);
        setClosing(0);
        return;
      }

      const r = await api.adminLedger(partyId, from, to);

      const items = Array.isArray(r?.rows) ? r.rows : [];

      const sorted = items
        .slice()
        .sort((a, b) =>
          String(a.date || "").localeCompare(String(b.date || ""))
        );

      setRows(sorted);
      setOpening(Number(r?.opening || 0));
      setClosing(Number(r?.closing || 0));
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed";

      if (String(e?.response?.status) === "401") {
        setErr(`${msg} (401) — Token missing/expired. Please login again.`);
      } else {
        setErr(msg);
      }

      setRows([]);
      setOpening(0);
      setClosing(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyId, from, to]);

  const onExport = () => {
    const token = getToken();

    if (!token) {
      setErr("Session expired. Please login again.");
      return;
    }

    if (!partyId) {
      setErr("Please select a party.");
      return;
    }

    const url = api.exportAdminLedgerPdf(partyId, from, to, token);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const partyName = useMemo(() => {
    const c = customers.find((x) => String(x.id) === String(partyId));
    return c?.name || c?.companyName || c?.partyName || "";
  }, [customers, partyId]);

  const tableRows = useMemo(() => {
    if (loading) return [];

    const openingRow = {
      __type: "OPENING",
      id: "opening",
      date: from,
      voucherNo: "—",
      voucherType: "—",
      particulars: opening >= 0 ? "To Opening Balance" : "By Opening Balance",
      dr: opening > 0 ? opening : 0,
      cr: opening < 0 ? Math.abs(opening) : 0,
      pdfs: [],
    };

    const closingRow = {
      __type: "CLOSING",
      id: "closing",
      date: to,
      voucherNo: "—",
      voucherType: "—",
      particulars: closing >= 0 ? "By Closing Balance" : "To Closing Balance",
      dr: closing < 0 ? Math.abs(closing) : 0,
      cr: closing > 0 ? closing : 0,
      pdfs: [],
    };

    if (!rows.length) return [openingRow, closingRow];
    return [openingRow, ...rows, closingRow];
  }, [rows, from, to, opening, closing, loading]);

  return (
    <motion.div variants={pageAnim} initial="hidden" animate="show" style={S.page}>
      <div style={S.bgGlow1} />
      <div style={S.bgGlow2} />
      <div style={S.bgGlow3} />

      <div style={S.wrap}>
        <div style={S.hero}>
          <div style={S.heroShine} />

          <div style={S.heroTop}>
            <div>
              <div style={S.kicker}>STAR ENGINEERING</div>
              <div style={S.h1}>Ledger</div>
              <div style={S.sub}>
                Party-wise ledger with opening balance, closing balance and
                attachment access.
              </div>

              <div style={S.badges}>
                <span style={S.badge}>
                  Opening <b>{fmt(opening)}</b>
                </span>
                <span style={S.badge}>
                  Closing <b>{fmt(closing)}</b>
                </span>
              </div>
            </div>

            <div
              style={{
                ...S.filtersWrap,
                width: isMobile ? "100%" : "auto",
              }}
            >
              <div style={S.filters}>
  <div style={S.filterFieldParty}>
    <div style={S.filterLabel}>Party</div>
    <select
      value={partyId}
      onChange={(e) => setPartyId(e.target.value)}
      style={S.input}
    >
      {customers.length ? null : <option value="">No customers</option>}
      {customers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name || c.companyName || c.partyName || `Party #${c.id}`}
        </option>
      ))}
    </select>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, auto) 1fr",
      gap: 10,
      alignItems: "end",
    }}
  >
    <div style={S.filterFieldDate}>
      <div style={S.filterLabel}>From</div>
      <input
        type="date"
        value={from}
        onChange={(e) => onChangeFrom(e.target.value)}
        style={S.input}
      />
    </div>

    <div style={S.filterFieldDate}>
      <div style={S.filterLabel}>To</div>
      <input
        type="date"
        value={to}
        onChange={(e) => onChangeTo(e.target.value)}
        style={S.input}
      />
    </div>

    <div style={S.actions}>
      <button style={S.secondary} onClick={load}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>
      <button style={S.primary} onClick={onExport}>
        Export PDF
      </button>
    </div>
  </div>
</div>

              {partyName ? (
                <div style={S.selectedLine}>
                  Selected: <b>{partyName}</b>
                </div>
              ) : null}

              {dateErr ? <div style={S.dateErr}>{dateErr}</div> : null}
            </div>
          </div>
        </div>

        {err ? <div style={S.err}>{err}</div> : null}

        <div style={S.card}>
          <div style={S.cardHead}>
            <div>
              <div style={S.cardTitle}>Ledger Entries</div>
              <div style={S.muted}>
                {loading ? "Loading..." : `${tableRows.length} row(s)`}
              </div>
            </div>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Voucher</th>
                  <th style={S.th}>Type</th>
                  <th style={S.th}>Narration</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Debit</th>
                  <th style={{ ...S.th, textAlign: "right" }}>Credit</th>
                  
                  <th style={{ ...S.th, textAlign: "right" }}>Attachment</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td style={S.tdCenter} colSpan={8}>
                      Loading...
                    </td>
                  </tr>
                ) : (
                  tableRows.map((r) => (
                    <tr
                      key={r.id || `${r.date}-${r.voucherNo}-${r.particulars}`}
                      style={r.__type ? S.specialRow : undefined}
                    >
                      <td style={S.td}>{fmtDateISO(r.date)}</td>
                      <td style={S.td}>{r.voucherNo || "-"}</td>
                      <td style={S.td}>{r.voucherType || "-"}</td>
                      <td style={S.tdNarr} title={r.particulars || ""}>
                        {r.particulars || "-"}
                      </td>
                      <td style={{ ...S.td, textAlign: "right" }}>
                        {fmtBlank(r.dr)}
                      </td>
                      <td style={{ ...S.td, textAlign: "right" }}>
                        {fmtBlank(r.cr)}
                      </td>

                      <td style={{ ...S.td, textAlign: "right" }}>
                        {r.__type === "OPENING" || r.__type === "CLOSING" ? (
                          <span style={S.noAttach}>—</span>
                        ) : (
                          <AttachmentMenu
                            pdfs={r.pdfs || []}
                            rowId={String(r.id || `${r.date}-${r.voucherNo}`)}
                            openId={openAttachId}
                            setOpenId={setOpenAttachId}
                            makeUrl={(p, idx, token) => {
                              const base =
                                import.meta.env.VITE_API_URL || "http://localhost:5000";
                              const u = p.url || "";
                              return `${base}${u}${
                                u.includes("?") ? "&" : "?"
                              }token=${encodeURIComponent(token || "")}`;
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={S.footerNote}>
          STAR Admin • Ledger export uses token-protected PDFs.
        </div>
      </div>
    </motion.div>
  );
}

const S = {
  page: {
    position: "relative",
    overflow: "hidden",
    padding: 14,
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  wrap: {
    maxWidth: 1300,
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  },

  bgGlow1: {
    position: "absolute",
    top: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "rgba(255,0,102,0.08)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  bgGlow2: {
    position: "absolute",
    top: 140,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "rgba(0,102,255,0.08)",
    filter: "blur(80px)",
    pointerEvents: "none",
  },

  bgGlow3: {
    position: "absolute",
    bottom: -120,
    left: "25%",
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(255,170,0,0.08)",
    filter: "blur(95px)",
    pointerEvents: "none",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    background:
      "radial-gradient(900px 260px at 12% 0%, rgba(255,170,0,0.10), transparent 60%)," +
      "radial-gradient(820px 240px at 88% 0%, rgba(163,0,255,0.08), transparent 60%)," +
      "radial-gradient(760px 220px at 100% 100%, rgba(0,102,255,0.06), transparent 60%)," +
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
    color: "#111827",
    border: "1px solid rgba(255,232,190,0.42)",
    boxShadow:
      "0 18px 40px rgba(17,24,39,0.08), 0 8px 18px rgba(17,24,39,0.05)",
  },

  heroShine: {
    height: 4,
    borderRadius: 999,
    marginBottom: 16,
    background:
      "linear-gradient(90deg, rgba(161,0,255,0.10), rgba(255,122,0,0.22), rgba(0,102,255,0.10))",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },

  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },

  kicker: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.2,
    color: "#7a0000",
    marginBottom: 8,
  },

  h1: {
    fontSize: "clamp(24px, 3vw, 30px)",
    fontWeight: 900,
    lineHeight: 1.06,
    color: "#111827",
  },

  sub: {
    fontSize: 14,
    color: "#475569",
    fontWeight: 700,
    marginTop: 8,
    lineHeight: 1.7,
    maxWidth: 700,
  },

  badges: {
    marginTop: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  badge: {
    padding: "7px 12px",
    borderRadius: 999,
    fontSize: 12,
    color: "#111827",
    fontWeight: 700,
    background:
      "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.04), transparent 55%), linear-gradient(180deg,#ffffff,#fffaf8)",
    border: "1px solid rgba(255,232,190,0.34)",
    boxShadow: "0 8px 18px rgba(17,24,39,0.04)",
  },

  filtersWrap: {
    minWidth: 280,
    flex: 1,
  },

 filters: {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
  padding: 12,
  border: "1px solid rgba(255,232,190,0.34)",
  borderRadius: 18,
  background:
    "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.04), transparent 55%)," +
    "radial-gradient(760px 200px at 95% 0%, rgba(0,102,255,0.04), transparent 60%)," +
    "linear-gradient(180deg,#ffffff,#fffaf8)",
  boxShadow: "0 8px 18px rgba(17,24,39,0.04)",
},

filterFieldParty: {
  display: "grid",
  gap: 6,
  minWidth: 220,
},
filterFieldDate: {
  display: "grid",
  gap: 6,
  minWidth: 140,
},

  filterLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: "#475569",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(17,24,39,0.10)",
    fontSize: 13,
    fontFamily: "Arial, Helvetica, sans-serif",
    outline: "none",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
    color: "#111827",
    boxSizing: "border-box",
  },

actions: {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "end",
},

  primary: {
    padding: "11px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,232,190,0.45)",
    background: "linear-gradient(135deg,#a100ff,#ff0066,#ff7a00)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "Arial, Helvetica, sans-serif",
    boxShadow: "0 12px 24px rgba(161,0,255,0.12)",
  },

  secondary: {
    padding: "11px 14px",
    borderRadius: 14,
    border: "1px solid rgba(17,24,39,0.12)",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  selectedLine: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },

  dateErr: {
    marginTop: 8,
    fontSize: 12,
    color: "#991b1b",
    fontWeight: 800,
  },

  err: {
    marginBottom: 12,
    background: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(239,68,68,0.22)",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: 16,
    fontWeight: 900,
    fontSize: 13,
  },

  card: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
    borderRadius: 20,
    border: "1px solid rgba(255,232,190,0.36)",
    boxShadow: "0 14px 30px rgba(17,24,39,0.07)",
    padding: 14,
  },

  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
  },

  muted: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
  },

  tableWrap: {
    overflowX: "auto",
    borderRadius: 16,
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 980,
  },

  th: {
    textAlign: "left",
    fontSize: 11,
    fontWeight: 900,
    color: "#475569",
    padding: "12px 10px",
    borderBottom: "1px solid rgba(17,24,39,0.10)",
    background: "rgba(248,250,252,0.95)",
    position: "sticky",
    top: 0,
    zIndex: 1,
    whiteSpace: "nowrap",
  },

  td: {
    padding: "12px 10px",
    borderBottom: "1px solid rgba(17,24,39,0.08)",
    fontSize: 12,
    color: "#111827",
    verticalAlign: "top",
    whiteSpace: "nowrap",
    background: "transparent",
  },

  tdNarr: {
    padding: "12px 10px",
    borderBottom: "1px solid rgba(17,24,39,0.08)",
    fontSize: 12,
    color: "#111827",
    verticalAlign: "top",
    minWidth: 220,
    maxWidth: 420,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  tdCenter: {
    padding: 20,
    textAlign: "center",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 700,
  },

  specialRow: {
    background:
      "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.03), transparent 55%), linear-gradient(180deg,#fafafa,#f8fafc)",
    fontWeight: 800,
  },

  noAttach: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 700,
  },

  footerNote: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },
};

function fmt(n) {
  const x = Number(n || 0);
  return x ? x.toLocaleString("en-IN") : "0";
}

function fmtBlank(n) {
  const x = Number(n || 0);
  return x ? x.toLocaleString("en-IN") : "";
}