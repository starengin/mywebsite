import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { motion } from "framer-motion";
import { getToken } from "../../lib/auth.js";

const TYPE_LABEL = {
  SALE: "Sales",
  PURCHASE: "Purchase",
  RECEIPT: "Receipt",
  PAYMENT: "Payment",
  SALES_RETURN: "Sales Return",
  PURCHASE_RETURN: "Purchase Return",
  JOURNAL: "Journal",
};

function nNum(x) {
  const v = Number(x || 0);
  return Number.isFinite(v) ? v : 0;
}

// header badges me 0 bhi dikhana hai, so fmt keeps 0
function fmt(n) {
  const x = Number(n || 0);
  return x ? x.toLocaleString("en-IN") : "0";
}

// table me 0 blank chahiye
function fmtBlank(n) {
  const x = Number(n || 0);
  return x ? x.toLocaleString("en-IN") : "";
}

function fmtMoney(n) {
  const x = nNum(n);
  return x ? x.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
}

function amountMeta(r) {
  const debit = nNum(r?.debit);
  const credit = nNum(r?.credit);
  if (debit > 0) return { sign: "+", value: debit, kind: "plus" };
  if (credit > 0) return { sign: "-", value: credit, kind: "minus" };
  return { sign: "", value: 0, kind: "zero" };
}

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [opening, setOpening] = useState(0);
  const [closing, setClosing] = useState(0);
  

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [openRowId, setOpenRowId] = useState("");

  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  // ✅ date format: dd-MMM-yyyy
  function fmtDateISO(iso) {
    if (!iso) return "-";
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mmm = d.toLocaleString("en-GB", { month: "short" });
    const yyyy = d.getFullYear();
    return `${dd}-${mmm}-${yyyy}`;
  }

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const q = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const r = await api.transactions(q);

      const items = Array.isArray(r.items) ? r.items : [];
      const sorted = items
        .slice()
        .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

      setRows(sorted);
      setOpening(Number(r.opening || 0));
      setClosing(Number(r.closing || 0));
    } catch (e) {
      setErr(e.message || "Failed");
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
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);
  function rowKey(r) {
  return String(r.id || `${r.date || ""}-${r.voucherNo || ""}-${r.voucherType || r.type || ""}`);
}

function fileHref(p, token) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const u = p?.url || "";
  return `${base}${u}${u.includes("?") ? "&" : "?"}token=${encodeURIComponent(token || "")}`;
}

  const onExport = () => {
    const token = getToken();
    if (!token) {
      setErr("Session expired. Please login again.");
      return;
    }
    const url = api.exportLedgerPdf(from, to, token);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ✅ Always show opening + closing rows (even if no txns)
  const tableRows = useMemo(() => {
    if (loading) return [];

    const openingRow = {
      __type: "OPENING",
      id: "opening",
      date: from,
      voucherNo: "—",
      voucherType: "—",
      narration: "",
      debit: opening > 0 ? opening : 0,
      credit: opening < 0 ? Math.abs(opening) : 0,
      runningBalance: opening,
      pdfs: [],
    };

    const closingRow = {
      __type: "CLOSING",
      id: "closing",
      date: to,
      voucherNo: "—",
      voucherType: "—",
      narration: "",
      debit: closing > 0 ? closing : 0,
      credit: closing < 0 ? Math.abs(closing) : 0,
      runningBalance: closing,
      pdfs: [],
    };

    if (!rows.length) return [openingRow, closingRow];
    return [openingRow, ...rows, closingRow];
  }, [rows, from, to, opening, closing, loading]);

  // ✅ Particulars rule (To/By + type + journal narration)
  function buildParticulars(r) {
    const debit = nNum(r?.debit);
    const credit = nNum(r?.credit);
    const side = debit > 0 ? "To" : credit > 0 ? "By" : "To";

    if (r.__type === "OPENING") {
      if (opening > 0) return "To Opening Balance";
      if (opening < 0) return "By Opening Balance";
      return "Opening Balance";
    }

if (r.__type === "CLOSING") {
  if (closing > 0) return "By Closing Balance";
  if (closing < 0) return "To Closing Balance";
  return "Closing Balance";
}

    const typeRaw = String(r?.voucherType || r?.type || "").toUpperCase();
    const label = TYPE_LABEL[typeRaw] || (typeRaw ? typeRaw.replaceAll("_", " ") : "Entry");
    const narration = String(r?.narration || "").trim();

    if (typeRaw === "JOURNAL") {
      const txt = narration && narration !== "-" ? narration : "Journal";
      return `${side} ${txt}`;
    }

    let p = `${side} ${label}`;
    // narration optional after dash
    if (narration && narration !== "-") p += ` — ${narration}`;
    return p;
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Transactions</div>
            <div className="text-sm text-slate-500">
              All your entries are shown here (Old → New).
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

<div className="flex flex-col sm:flex-row gap-3 sm:items-center">
  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_1fr] gap-2 items-center w-full">
    <span className="text-slate-500 text-sm">From</span>

    <input
      type="date"
      value={from}
      onChange={(e) => setFrom(e.target.value)}
      className="border rounded-xl px-3 h-10 w-full"
    />

    <span className="text-slate-500 text-sm">To</span>

    <input
      type="date"
      value={to}
      onChange={(e) => setTo(e.target.value)}
      className="border rounded-xl px-3 h-10 w-full"
    />
  </div>

  <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2 w-full sm:w-auto">
    <button className="btn-ghost w-full sm:w-auto" onClick={load}>
      {loading ? "Refreshing..." : "Refresh"}
    </button>
    <button className="btn-gradient w-full sm:w-auto" onClick={onExport}>
      Export PDF
    </button>
  </div>
</div>
        </div>
      </motion.div>

      {err ? <div className="card p-5 text-sm text-red-700">Error: {err}</div> : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
{/* ✅ Desktop: no inner scroll. Mobile: allow horizontal only if truly needed */}
<div className="w-full overflow-x-auto md:overflow-x-visible">
  <table className="w-full table-fixed md:table-auto">
            <thead className="bg-slate-50 border-b">
              <tr className="text-left text-[11px] md:text-xs text-slate-500">
<th className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap w-[92px] md:w-auto">Date</th>
<th className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap w-[96px] md:w-auto">Voucher</th>

                {/* ✅ Desktop columns */}
                <th className="hidden md:table-cell px-3 md:px-4 py-3">Particulars</th>
                <th className="hidden md:table-cell px-3 md:px-4 py-3 text-right whitespace-nowrap">
                  Debit
                </th>
                <th className="hidden md:table-cell px-3 md:px-4 py-3 text-right whitespace-nowrap">
                  Credit
                </th>

                {/* ✅ Mobile columns */}
<th className="md:hidden px-2 py-2 w-[140px]">Particulars</th>
<th className="md:hidden px-2 py-2 text-right whitespace-nowrap w-[110px]">Amount</th>

                <th className="px-2 md:px-4 py-2 md:py-3 text-right whitespace-nowrap w-[44px] md:w-[52px]">👁️</th>
              </tr>
            </thead>

            <tbody className="text-[12px] md:text-sm">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : (
                tableRows.map((r) => {
  const k = rowKey(r);
  const isOpen = openRowId === k;
  const particulars = buildParticulars(r);
  const amt = amountMeta(r);
  const pdfs = Array.isArray(r.pdfs) ? r.pdfs : [];

  return (
    <>
      <tr
        key={k}
        className={
          r.__type === "OPENING" || r.__type === "CLOSING"
            ? "border-b bg-slate-50 font-semibold"
            : "border-b last:border-b-0 hover:bg-slate-50/60"
        }
      >
        <td className="px-2 md:px-4 py-3 whitespace-nowrap">
          {fmtDateISO(r.date)}
        </td>

        <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-[11px] leading-4 whitespace-normal break-words">
          {r.voucherNo || "—"}
        </td>

        {/* ✅ Desktop */}
        <td
          className="hidden md:table-cell px-3 md:px-4 py-3 max-w-[520px] truncate"
          title={particulars}
        >
          {particulars}
        </td>

        <td className="hidden md:table-cell px-3 md:px-4 py-3 text-right">
          {fmtBlank(r.debit)}
        </td>

        <td className="hidden md:table-cell px-3 md:px-4 py-3 text-right">
          {fmtBlank(r.credit)}
        </td>

        {/* ✅ Mobile */}
<td className="md:hidden px-2 py-2 align-top">
  <div
    className="font-semibold text-[11px] leading-4 whitespace-normal break-words"
    title={particulars}
  >
    {particulars}
  </div>
</td>

        <td
          className={
            "md:hidden px-2 py-2 text-right text-[11px] leading-4 font-extrabold whitespace-nowrap " +
            (amt.kind === "plus"
              ? "text-emerald-600"
              : amt.kind === "minus"
              ? "text-rose-600"
              : "text-slate-400")
          }
        >
          {amt.kind === "zero" ? "" : `${amt.sign}${fmtMoney(amt.value)}`}
        </td>

        {/* Attachment button */}
        <td className="px-2 md:px-4 py-2 md:py-3 text-right w-[52px]">
          {r.__type === "OPENING" || r.__type === "CLOSING" ? (
            <span className="text-xs text-slate-400">—</span>
          ) : pdfs.length ? (
            <button
              type="button"
              className="attachBtn attachBtn--grad"
              title="View attachments"
              onClick={() => setOpenRowId((prev) => (prev === k ? "" : k))}
            >
              <span className="attachBtn__icon" aria-hidden="true">
                ⬇
              </span>
            </button>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
      </tr>

      {/* ✅ Expanded attachment rows (same txn ke niche) */}
      {isOpen &&
        pdfs.map((p, idx) => (
          <tr key={`${k}-pdf-${p.id || idx}`} className="border-b bg-slate-50/60">
            <td className="px-2 md:px-4 py-2 md:py-3" colSpan={6}>
              <a
                href={fileHref(p, getToken())}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 hover:bg-slate-50"
                title={p.name || `PDF ${idx + 1}`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border bg-slate-50">
                  📄
                </span>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800">
                    PDF {idx + 1}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-[260px] md:max-w-[520px]">
                    {p.name || "Attachment"}
                  </div>
                </div>

                <span className="ml-auto text-xs font-bold text-slate-600">
                  Open →
                </span>
              </a>
            </td>
          </tr>
        ))}
    </>
  );
})
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="text-xs text-slate-500 text-center">
        Thank you for choosing STAR. Need help? Contact support from your company.
      </div>
    </div>
  );
}