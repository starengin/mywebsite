import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { getToken } from "../lib/auth.js";
import AttachmentMenu from "../components/ui/AttachmentMenu";

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

  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  // dd-MMM-yyyy
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

  // load customers once
  useEffect(() => {
    (async () => {
      try {
        const list = await api.customers();
        const arr = Array.isArray(list) ? list : list?.items || [];
        setCustomers(arr);
        if (arr.length && !partyId) setPartyId(String(arr[0].id));
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Failed to load customers");
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
        .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

      setRows(sorted);
      setOpening(Number(r?.opening || 0));
      setClosing(Number(r?.closing || 0));
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed";

      // ✅ if 401, show better hint
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

  // ✅ Always show opening + closing rows (and keep same schema as server rows)
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
      runningBalance: opening,
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
      runningBalance: closing,
      pdfs: [],
    };

    if (!rows.length) return [openingRow, closingRow];
    return [openingRow, ...rows, closingRow];
  }, [rows, from, to, opening, closing, loading]);

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Ledger</div>
              <div className="text-sm text-slate-500">
                Party-wise ledger (Old → New).
              </div>

              <div className="mt-2 flex gap-2 flex-wrap text-xs text-slate-600">
                <span className="px-2 py-1 rounded-full bg-slate-100">
                  Opening: <b>{fmt(opening)}</b>
                </span>
                <span className="px-2 py-1 rounded-full bg-slate-100">
                  Closing: <b>{fmt(closing)}</b>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
             <div className="ledgerFilters">
  {/* Party */}
  <div className="fieldRow fieldRow--party">
    <div className="fieldLabel">Party</div>
    <select
      value={partyId}
      onChange={(e) => setPartyId(e.target.value)}
      className="fieldControl"
    >
      {customers.length ? null : <option value="">No customers</option>}
      {customers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name || c.companyName || c.partyName || `Party #${c.id}`}
        </option>
      ))}
    </select>
  </div>

  {/* Dates */}
  <div className="fieldRow fieldRow--dates">
    <div className="fieldLabel">From</div>
    <input
      type="date"
      value={from}
      onChange={(e) => onChangeFrom(e.target.value)}   // ✅ use clamp
      className="fieldControl"
    />

    <div className="fieldLabel">To</div>
    <input
      type="date"
      value={to}
      onChange={(e) => onChangeTo(e.target.value)}     // ✅ use clamp
      className="fieldControl"
    />
  </div>

  {/* Buttons */}
  <div className="fieldActions">
    <button className="btn-ghost" onClick={load}>
      {loading ? "Refreshing..." : "Refresh"}
    </button>
    <button className="btn-gradient" onClick={onExport}>
      Export PDF
    </button>
  </div>
</div>
            </div>
          </div>

          {partyName ? (
            <div className="text-xs text-slate-500">
              Selected: <b className="text-slate-700">{partyName}</b>
            </div>
          ) : null}
        </div>
      </motion.div>

      {err ? <div className="card p-5 text-sm text-red-700">Error: {err}</div> : null}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="card p-5"
      >
        <div className="table-wrap">
          <table className="table">
            <thead className="bg-slate-50 border-b">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Voucher</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Narration</th>
                <th className="t-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-right">Attachment</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={8}>
                    Loading...
                  </td>
                </tr>
              ) : (
                tableRows.map((r) => (
                  <tr
                    key={r.id || `${r.date}-${r.voucherNo}-${r.particulars}`}
                    className={
                      r.__type === "OPENING" || r.__type === "CLOSING"
                        ? "border-b bg-slate-50 font-semibold"
                        : "border-b last:border-b-0 hover:bg-slate-50/60"
                    }
                  >
                    <td className="px-4 py-3">{fmtDateISO(r.date)}</td>
                    <td className="px-4 py-3 font-medium">{r.voucherNo || "-"}</td>
                    <td className="px-4 py-3">{r.voucherType || "-"}</td>
                    <td className="px-4 py-3 max-w-[420px] truncate" title={r.particulars || ""}>
                      {r.particulars || "-"}
                    </td>

                    <td className="t-right">{fmtBlank(r.dr)}</td>
                    <td className="px-4 py-3 text-right">{fmtBlank(r.cr)}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {fmtBlank(r.runningBalance)}
                    </td>

                    <td className="px-4 py-3 text-right">
  {r.__type === "OPENING" || r.__type === "CLOSING" ? (
    <span className="text-xs text-slate-400">—</span>
  ) : (
    <AttachmentMenu
      pdfs={r.pdfs || []}
      rowId={String(r.id || `${r.date}-${r.voucherNo}`)}
      openId={openAttachId}
      setOpenId={setOpenAttachId}
      makeUrl={(p, idx, token) => {
        const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const u = p.url || "";
        return `${base}${u}${u.includes("?") ? "&" : "?"}token=${encodeURIComponent(token || "")}`;
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
      </motion.div>

      <div className="text-xs text-slate-500 text-center">
        STAR Admin • Ledger export uses token protected PDFs.
      </div>
    </div>
  );
}

function fmt(n) {
  const x = Number(n || 0);
  return x ? x.toLocaleString("en-IN") : "0";
}
function fmtBlank(n) {
  const x = Number(n || 0);
  return x ? x.toLocaleString("en-IN") : "";
}