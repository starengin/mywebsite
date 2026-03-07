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

function fmt(n) {
  const x = Number(n || 0);
  return x ? x.toLocaleString("en-IN") : "0";
}

function fmtBlank(n) {
  const x = Number(n || 0);
  return x ? x.toLocaleString("en-IN") : "";
}

function fmtMoney(n) {
  const x = nNum(n);
  return x
    ? x.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";
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
  const [dateErr, setDateErr] = useState("");

  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().slice(0, 10);
  });

  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  function fmtDateISO(iso) {
    if (!iso) return "-";

    const raw = String(iso).slice(0, 10);
    const d = new Date(`${raw}T00:00:00`);

    if (Number.isNaN(d.getTime())) return "-";

    const dd = String(d.getDate()).padStart(2, "0");
    const mmm = d.toLocaleString("en-GB", { month: "short" });
    const yyyy = d.getFullYear();

    return `${dd}-${mmm}-${yyyy}`;
  }

  function clampRange(nextFrom, nextTo) {
    if (!nextFrom || !nextTo) {
      return { from: nextFrom, to: nextTo, err: "" };
    }

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

  const load = async () => {
    setErr("");
    setLoading(true);

    try {
      let r;

      try {
        r = await api.transactions({ from, to });
      } catch {
        const q = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
        r = await api.transactions(q);
      }

      const items = Array.isArray(r?.items)
        ? r.items
        : Array.isArray(r)
        ? r
        : [];

      const sorted = items
        .slice()
        .sort((a, b) =>
          String(a?.date || "").localeCompare(String(b?.date || ""))
        );

      setRows(sorted);
      setOpening(Number(r?.opening || 0));
      setClosing(Number(r?.closing || 0));
    } catch (e) {
      setErr(e?.message || "Failed");
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
    return String(
      r?.id ||
        `${r?.date || ""}-${r?.voucherNo || ""}-${r?.voucherType || r?.type || ""}`
    );
  }

  function fileHref(p, token) {
    const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const u = p?.url || "";
    return `${base}${u}${u.includes("?") ? "&" : "?"}token=${encodeURIComponent(
      token || ""
    )}`;
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

  const tableRows = useMemo(() => {
    if (loading) return [];
    return rows;
  }, [rows, loading]);

  function buildParticulars(r) {
    const debit = nNum(r?.debit);
    const credit = nNum(r?.credit);
    const side = debit > 0 ? "To" : credit > 0 ? "By" : "To";

    const typeRaw = String(r?.voucherType || r?.type || "").toUpperCase();
    const label =
      TYPE_LABEL[typeRaw] || (typeRaw ? typeRaw.replaceAll("_", " ") : "Entry");
    const narration = String(r?.narration || "").trim();

    if (typeRaw === "JOURNAL") {
      const txt = narration && narration !== "-" ? narration : "Journal";
      return `${side} ${txt}`;
    }

    let p = `${side} ${label}`;
    if (narration && narration !== "-") p += ` — ${narration}`;
    return p;
  }

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5 sm:p-6 overflow-hidden relative"
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(700px_180px_at_12%_0%,rgba(255,45,85,0.06),transparent_55%),radial-gradient(760px_220px_at_95%_0%,rgba(37,99,235,0.05),transparent_60%)]" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="text-lg sm:text-xl font-extrabold star-animated-gradient-text">
              Transactions
            </div>
            <div className="text-sm text-slate-500 mt-1">
              All your entries are shown here (Old → New).
            </div>

            <div className="mt-3 flex gap-2 flex-wrap text-xs">
              <span className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                Opening: <b className="text-slate-900">{fmt(opening)}</b>
              </span>
              <span className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                Closing: <b className="text-slate-900">{fmt(closing)}</b>
              </span>
            </div>
          </div>

          <div className="w-full xl:w-auto flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_1fr] gap-2 items-center">
              <span className="text-slate-500 text-sm font-medium">From</span>

              <input
                type="date"
                value={from}
                onChange={(e) => onChangeFrom(e.target.value)}
                className="input h-10"
              />

              <span className="text-slate-500 text-sm font-medium">To</span>

              <input
                type="date"
                value={to}
                onChange={(e) => onChangeTo(e.target.value)}
                className="input h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end sm:gap-2">
              <button
                className="btn-ghost w-full sm:w-auto"
                onClick={load}
                type="button"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                className="btn-gradient w-full sm:w-auto"
                onClick={onExport}
                type="button"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {dateErr ? (
          <div className="relative mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            {dateErr}
          </div>
        ) : null}
      </motion.div>

      {err ? (
        <div className="card p-5 text-sm text-red-700">Error: {err}</div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        <div className="w-full overflow-x-hidden">
          <table className="hidden md:table w-full table-auto">
            <thead className="bg-slate-50 border-b">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Voucher</th>
                <th className="px-4 py-3">Particulars</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Debit</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Credit</th>
                <th className="px-4 py-3 text-right whitespace-nowrap w-[56px]">
                  👁️
                </th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    No transactions found
                  </td>
                </tr>
              ) : (
                tableRows.map((r) => {
                  const k = rowKey(r);
                  const isOpen = openRowId === k;
                  const particulars = buildParticulars(r);
                  const pdfs = Array.isArray(r?.pdfs) ? r.pdfs : [];

                  return (
                    <FragmentRows
                      keyValue={k}
                      desktop
                      row={r}
                      isOpen={isOpen}
                      particulars={particulars}
                      pdfs={pdfs}
                      fmtDateISO={fmtDateISO}
                      fmtBlank={fmtBlank}
                      setOpenRowId={setOpenRowId}
                      fileHref={fileHref}
                    />
                  );
                })
              )}
            </tbody>
          </table>

          <table className="md:hidden w-full table-fixed">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "38%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>

            <thead className="bg-slate-50 border-b">
              <tr className="text-left text-[11px] text-slate-500">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Particulars</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-2 py-2 text-right">👁️</th>
              </tr>
            </thead>

            <tbody className="text-[11px]">
              {loading ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={4}>
                    Loading...
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={4}>
                    No transactions found
                  </td>
                </tr>
              ) : (
                tableRows.map((r) => {
                  const k = rowKey(r);
                  const isOpen = openRowId === k;
                  const particulars = buildParticulars(r);
                  const amt = amountMeta(r);
                  const pdfs = Array.isArray(r?.pdfs) ? r.pdfs : [];

                  return (
                    <FragmentRows
                      keyValue={k}
                      desktop={false}
                      row={r}
                      isOpen={isOpen}
                      particulars={particulars}
                      pdfs={pdfs}
                      amt={amt}
                      fmtDateISO={fmtDateISO}
                      fmtMoney={fmtMoney}
                      setOpenRowId={setOpenRowId}
                      fileHref={fileHref}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="text-xs text-slate-500 text-center">
        Thank you for choosing STAR ENGINEERING. Need help? Contact support from your company.
      </div>
    </div>
  );
}

function FragmentRows({
  keyValue,
  desktop,
  row,
  isOpen,
  particulars,
  pdfs,
  amt,
  fmtDateISO,
  fmtBlank,
  fmtMoney,
  setOpenRowId,
  fileHref,
}) {
  const token = getToken();

  if (desktop) {
    return (
      <>
        <tr className="border-b hover:bg-slate-50/70">
          <td className="px-4 py-3 whitespace-nowrap">{fmtDateISO(row?.date)}</td>
          <td className="px-4 py-3 font-medium whitespace-nowrap">
            {row?.voucherNo || "—"}
          </td>
          <td
            className="px-4 py-3 max-w-[620px] truncate"
            title={particulars}
          >
            {particulars}
          </td>
          <td className="px-4 py-3 text-right">{fmtBlank(row?.debit)}</td>
          <td className="px-4 py-3 text-right">{fmtBlank(row?.credit)}</td>

          <td className="px-4 py-3 text-right w-[56px]">
            {pdfs.length ? (
              <button
                type="button"
                className="attachBtn attachBtn--grad"
                title="View attachments"
                onClick={() =>
                  setOpenRowId((prev) => (prev === keyValue ? "" : keyValue))
                }
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

        {isOpen &&
          pdfs.map((p, idx) => (
            <tr
              key={`${keyValue}-pdf-${p?.id || idx}`}
              className="border-b bg-slate-50/60"
            >
              <td className="px-4 py-3" colSpan={6}>
                <a
                  href={fileHref(p, token)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
                  title={p?.name || `PDF ${idx + 1}`}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-slate-50">
                    📄
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">
                      PDF {idx + 1}
                    </div>
                    <div className="text-xs text-slate-500 truncate max-w-[520px]">
                      {p?.name || "Attachment"}
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
  }

  return (
    <>
      <tr className="border-b">
        <td className="px-2 py-2 align-top whitespace-nowrap">
          {fmtDateISO(row?.date)}
        </td>

        <td className="px-2 py-2 align-top">
          <div className="whitespace-normal break-words leading-4 font-semibold">
            {particulars}
          </div>

          <div className="mt-0.5 text-[10px] text-slate-500 whitespace-nowrap">
            V. No.:{" "}
            <span className="font-semibold text-slate-600">
              {row?.voucherNo || "—"}
            </span>
          </div>
        </td>

        <td
          className={
            "px-2 py-2 text-right font-extrabold whitespace-nowrap " +
            (amt?.kind === "plus"
              ? "text-emerald-600"
              : amt?.kind === "minus"
              ? "text-rose-600"
              : "text-slate-400")
          }
        >
          {amt?.kind === "zero" ? "" : `${amt?.sign}${fmtMoney(amt?.value)}`}
        </td>

        <td className="px-2 py-2 text-right">
          {pdfs.length ? (
            <button
              type="button"
              className="attachBtn attachBtn--grad"
              onClick={() =>
                setOpenRowId((prev) => (prev === keyValue ? "" : keyValue))
              }
              title="Attachments"
            >
              <span className="attachBtn__icon" aria-hidden="true">
                ⬇
              </span>
            </button>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
      </tr>

      {isOpen &&
        pdfs.map((p, idx) => (
          <tr
            key={`${keyValue}-mpdf-${p?.id || idx}`}
            className="border-b bg-slate-50/60"
          >
            <td className="px-2 py-2" colSpan={4}>
              <a
                href={fileHref(p, token)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2"
                title={p?.name || `PDF ${idx + 1}`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border bg-slate-50">
                  📄
                </span>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold">PDF {idx + 1}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[210px]">
                    {p?.name || "Attachment"}
                  </div>
                </div>
                <span className="ml-auto text-[11px] font-bold text-slate-600 whitespace-nowrap">
                  Open →
                </span>
              </a>
            </td>
          </tr>
        ))}
    </>
  );
}