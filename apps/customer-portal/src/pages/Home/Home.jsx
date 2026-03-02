import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = {
  SALE: "#2563eb",
  RECEIPT: "#10b981",
  SALES_RETURN: "#f59e0b",
  JOURNAL: "#64748b",
  PURCHASE: "#7c3aed",
  PAYMENT: "#ef4444",
  PURCHASE_RETURN: "#0ea5e9",
  YELLOW_NEG: "#facc15", // negative slice
};

export default function Home() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [journalSplit, setJournalSplit] = useState({ dr: 0, cr: 0 });

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((e) => setErr(e.message || "Failed"));
  }, []);

  // ✅ Compute Journal DR/CR from transactions (robust)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        let res;

        // ✅ try multiple signatures (because api.transactions sometimes needs/no-need param)
        try {
          res = await api.transactions("");
        } catch (e1) {
          try {
            res = await api.transactions();
          } catch (e2) {
            try {
              res = await api.transactions({});
            } catch (e3) {
              res = null;
            }
          }
        }

        const rows =
          (Array.isArray(res) && res) ||
          res?.rows ||
          res?.data ||
          res?.items ||
          res?.transactions ||
          res?.result ||
          [];

        let dr = 0;
        let cr = 0;

        const toNum = (v) => {
          const n = Number(v ?? 0);
          return Number.isFinite(n) ? n : 0;
        };

        for (const r of rows) {
          const type = String(
            r?.type ??
              r?.voucherType ??
              r?.voucher_type ??
              r?.vType ??
              r?.voucher ??
              ""
          ).toUpperCase();

          if (type !== "JOURNAL") continue;

          // ✅ most common debit/credit field possibilities
          const debit = toNum(
            r?.debit ??
              r?.dr ??
              r?.debitAmount ??
              r?.debit_amount ??
              r?.drAmount ??
              r?.Dr ??
              r?.DR
          );
          const credit = toNum(
            r?.credit ??
              r?.cr ??
              r?.creditAmount ??
              r?.credit_amount ??
              r?.crAmount ??
              r?.Cr ??
              r?.CR
          );

          if (debit || credit) {
            dr += debit;
            cr += credit;
            continue;
          }

          // ✅ fallback: amount + side
          const amt = toNum(r?.amount ?? r?.net ?? r?.value ?? r?.amt);
          const side = String(
            r?.side ?? r?.dc ?? r?.drcr ?? r?.DrCr ?? r?.dcFlag ?? ""
          ).toUpperCase();

          if (amt) {
            if (side === "DR" || side === "DEBIT") dr += amt;
            if (side === "CR" || side === "CREDIT") cr += amt;
          }
        }

        if (alive) setJournalSplit({ dr, cr });
      } catch (e) {
        // ignore silently
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // ✅ KEEP ALL HOOKS ABOVE RETURNS (rules-of-hooks fix)
  const baseOutstanding = Number(data?.summary?.outstanding ?? 0);

  // ✅ ratios for splitting JOURNAL between CR (sales) and DR (purchase) (ONLY for area chart)
  const journalRatios = useMemo(() => {
    const dr = Number(journalSplit.dr || 0);
    const cr = Number(journalSplit.cr || 0);
    const t = dr + cr;

    // IMPORTANT: if only DR exists => crRatio=0, drRatio=1 (no 50/50 split)
    if (t > 0) return { drRatio: dr / t, crRatio: cr / t };

    // fallback if truly nothing
    return { drRatio: 0, crRatio: 0 };
  }, [journalSplit]);

  const salesTrend = useMemo(() => {
    const arr = normalizeTrend(data?.charts?.salesTrend || []);
    return arr.map((r) => {
      const j = Number(r.JOURNAL || 0);
      return { ...r, JOURNAL_CR: j * journalRatios.crRatio };
    });
  }, [data, journalRatios]);

  const purchaseTrend = useMemo(() => {
    const arr = normalizeTrend(data?.charts?.purchaseTrend || []);
    return arr.map((r) => {
      const j = Number(r.JOURNAL || 0);
      return { ...r, JOURNAL_DR: j * journalRatios.drRatio };
    });
  }, [data, journalRatios]);

  // ✅ KPI totals (including Journal DR/CR)
  const kpiTotals = useMemo(() => {
    const s = data?.summary || {};
    const byType =
      s.byType ||
      s.totalsByType ||
      s.typeTotals ||
      s.voucherTotals ||
      s.totals ||
      {};

    const pick = (...vals) => {
      for (const v of vals) {
        if (v !== undefined && v !== null && v !== "") return Number(v || 0);
      }
      return 0;
    };

    const sumKey = (arr, key) =>
      (arr || []).reduce((acc, r) => acc + Number(r?.[key] || 0), 0);

    // fallback totals from charts (if backend not providing)
    const saleSum = sumKey(salesTrend, "SALE");
    const receiptSum = sumKey(salesTrend, "RECEIPT");
    const salesReturnSum = sumKey(salesTrend, "SALES_RETURN");

    const purchaseSum = sumKey(purchaseTrend, "PURCHASE");
    const paymentSum = sumKey(purchaseTrend, "PAYMENT");
    const purchaseReturnSum = sumKey(purchaseTrend, "PURCHASE_RETURN");

    return {
      sales: pick(byType.SALE, byType.sales, s.totalSales, s.sales, saleSum),
      receipt: pick(
        byType.RECEIPT,
        byType.receipt,
        s.totalReceipt,
        s.receipt,
        receiptSum
      ),
      salesReturn: pick(
        byType.SALES_RETURN,
        byType.salesReturn,
        s.totalSalesReturn,
        s.salesReturn,
        salesReturnSum
      ),

      purchase: pick(
        byType.PURCHASE,
        byType.purchase,
        s.totalPurchase,
        s.purchase,
        purchaseSum
      ),
      payment: pick(
        byType.PAYMENT,
        byType.payment,
        s.totalPayment,
        s.payment,
        paymentSum
      ),
      purchaseReturn: pick(
        byType.PURCHASE_RETURN,
        byType.purchaseReturn,
        s.totalPurchaseReturn,
        s.purchaseReturn,
        purchaseReturnSum
      ),

      // ✅ BEST: backend split OR frontend computed split
      journalDr: pick(
        s.totalJournalDr,
        s.journalDr,
        s.journalDebit,
        byType.JOURNAL_DR,
        journalSplit.dr
      ),
      journalCr: pick(
        s.totalJournalCr,
        s.journalCr,
        s.journalCredit,
        byType.JOURNAL_CR,
        journalSplit.cr
      ),
    };
  }, [data, salesTrend, purchaseTrend, journalSplit]);

  // ✅ Outstanding (as-is from backend). If you want net-adjust later, we can.
  const outstanding = baseOutstanding;
  const osIsRed = outstanding > 0;

  // ✅ NEW PIE LOGIC (Voucher-wise)
  const salesPieData = useMemo(() => {
    return buildVoucherPie(
      [
        { key: "SALE", label: "Sale", value: kpiTotals.sales },
        { key: "RECEIPT", label: "Receipt", value: kpiTotals.receipt },
        { key: "SALES_RETURN", label: "Sales Return", value: kpiTotals.salesReturn },
        { key: "JOURNAL_CR", label: "Journal CR", value: kpiTotals.journalCr },
      ],
      COLORS
    );
  }, [kpiTotals]);

  const purchasePieData = useMemo(() => {
    return buildVoucherPie(
      [
        { key: "PURCHASE", label: "Purchase", value: kpiTotals.purchase },
        { key: "PAYMENT", label: "Payment", value: kpiTotals.payment },
        { key: "PURCHASE_RETURN", label: "Purchase Return", value: kpiTotals.purchaseReturn },
        { key: "JOURNAL_DR", label: "Journal DR", value: kpiTotals.journalDr },
      ],
      COLORS
    );
  }, [kpiTotals]);

  const dynamicKpis = useMemo(() => {
    const items = [
      { title: "Total Sales", value: kpiTotals.sales, hint: "Sum of sale" },
      { title: "Total Purchase", value: kpiTotals.purchase, hint: "Sum of purchase" },
      { title: "Total Payment", value: kpiTotals.payment, hint: "Sum of payment" },
      { title: "Total Receipt", value: kpiTotals.receipt, hint: "Sum of receipt" },
      { title: "Total Sales Return", value: kpiTotals.salesReturn, hint: "Sum of sales return" },
      { title: "Total Purchase Return", value: kpiTotals.purchaseReturn, hint: "Sum of purchase return" },
      { title: "Total Journal DR", value: kpiTotals.journalDr, hint: "Journal debit" },
      { title: "Total Journal CR", value: kpiTotals.journalCr, hint: "Journal credit" },
    ];

    return items.filter((x) => Math.abs(Number(x.value || 0)) > 0);
  }, [kpiTotals]);

  if (err)
    return <div className="card p-5 text-sm text-red-700">Error: {err}</div>;
  if (!data)
    return (
      <div className="card p-5 text-sm text-slate-500">Loading dashboard...</div>
    );

  return (
    <div className="space-y-6">
      {/* OVERVIEW */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Overview</div>
            <div className="text-sm text-slate-500">Your latest account insights</div>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi
            title="Outstanding"
            value={outstanding}
            hint="Current balance"
            className={osIsRed ? "kpi-glow-red" : "kpi-glow-green"}
            valueClassName={osIsRed ? "text-red-600" : "text-emerald-600"}
          />

          {dynamicKpis.map((k) => (
            <Kpi key={k.title} title={k.title} value={k.value} hint={k.hint} />
          ))}

          <Kpi title="Transactions" value={data.summary?.txnCount ?? 0} hint="All time" />
        </div>
      </motion.div>

      {/* LEFT: GRAPHS | RIGHT: PIE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: GRAPHS */}
        <div className="space-y-6">
          {/* SALES GROUP */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Sales Group</div>
                <div className="text-xs text-slate-500">
                  SALE • RECEIPT • SALES_RETURN
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <LegendDot label="Sale" color={COLORS.SALE} />
                <LegendDot label="Receipt" color={COLORS.RECEIPT} />
                <LegendDot label="Sales Return" color={COLORS.SALES_RETURN} />

              </div>
            </div>

            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gSale" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.SALE} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.SALE} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gReceipt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.RECEIPT} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.RECEIPT} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gSalesReturn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.SALES_RETURN} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.SALES_RETURN} stopOpacity={0.02} />
                    </linearGradient>

                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickMargin={8} tick={{ fontSize: 12 }} />
                  <YAxis tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={fmtCompactINR} />
                  <Tooltip content={<ProTooltip />} />

                  <Area type="monotone" dataKey="SALE" stroke={COLORS.SALE} fill="url(#gSale)" strokeWidth={2.4} dot={false} isAnimationActive />
                  <Area type="monotone" dataKey="RECEIPT" stroke={COLORS.RECEIPT} fill="url(#gReceipt)" strokeWidth={2.4} dot={false} isAnimationActive />
                  <Area type="monotone" dataKey="SALES_RETURN" stroke={COLORS.SALES_RETURN} fill="url(#gSalesReturn)" strokeWidth={2.4} dot={false} isAnimationActive />
                  
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* PURCHASE GROUP */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Purchase Group</div>
                <div className="text-xs text-slate-500">
                  PURCHASE • PAYMENT • PURCHASE_RETURN
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <LegendDot label="Purchase" color={COLORS.PURCHASE} />
                <LegendDot label="Payment" color={COLORS.PAYMENT} />
                <LegendDot label="Purchase_Return" color={COLORS.PURCHASE_RETURN} />
              </div>
            </div>

            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={purchaseTrend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gPurchase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.PURCHASE} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.PURCHASE} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gPayment" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.PAYMENT} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.PAYMENT} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gPurchaseReturn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.PURCHASE_RETURN} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.PURCHASE_RETURN} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickMargin={8} tick={{ fontSize: 12 }} />
                  <YAxis tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={fmtCompactINR} />
                  <Tooltip content={<ProTooltip />} />

                  <Area type="monotone" dataKey="PURCHASE" stroke={COLORS.PURCHASE} fill="url(#gPurchase)" strokeWidth={2.4} dot={false} isAnimationActive />
                  <Area type="monotone" dataKey="PAYMENT" stroke={COLORS.PAYMENT} fill="url(#gPayment)" strokeWidth={2.4} dot={false} isAnimationActive />
                  <Area type="monotone" dataKey="PURCHASE_RETURN" stroke={COLORS.PURCHASE_RETURN} fill="url(#gPurchaseReturn)" strokeWidth={2.4} dot={false} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* RIGHT: PIE */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5"
          >
            <div className="text-sm font-semibold">Sales Split</div>
            <div className="text-xs text-slate-500 mb-3">
              SALE • RECEIPT • SALES RETURN
            </div>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={105}
                    isAnimationActive
                  >
                    {salesPieData.map((d, idx) => (
                      <Cell key={idx} fill={sliceColor(d)} />
                    ))}
                  </Pie>
                  <Tooltip content={<PctTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5"
          >
            <div className="text-sm font-semibold">Purchase Split</div>
            <div className="text-xs text-slate-500 mb-3">
              PURCHASE • PAYMENT • PURCHASE RETURN
            </div>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purchasePieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={105}
                    isAnimationActive
                  >
                    {purchasePieData.map((d, idx) => (
                      <Cell key={idx} fill={sliceColor(d)} />
                    ))}
                  </Pie>
                  <Tooltip content={<PctTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="text-xs text-slate-500 text-center">
        Thank you for choosing STAR ENGINEERING. Need help? Contact support from your company.
      </div>
    </div>
  );
}

/* ========================= Helpers ========================= */

function normalizeTrend(arr) {
  return (arr || []).map((r) => ({
    ...r,
    SALE: Number(r.SALE || 0),
    RECEIPT: Number(r.RECEIPT || 0),
    SALES_RETURN: Number(r.SALES_RETURN || 0),
    JOURNAL: Number(r.JOURNAL || 0),
    PURCHASE: Number(r.PURCHASE || 0),
    PAYMENT: Number(r.PAYMENT || 0),
    PURCHASE_RETURN: Number(r.PURCHASE_RETURN || 0),
  }));
}

function fmtCompactINR(v) {
  const n = Number(v || 0);
  if (n >= 10000000) return (n / 10000000).toFixed(1) + "Cr";
  if (n >= 100000) return (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(Math.round(n));
}

function prettyKey(k) {
  return String(k || "").replaceAll("_", " ").toUpperCase();
}

function LegendDot({ label, color }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
          display: "inline-block",
        }}
      />
      <span>{label}</span>
    </span>
  );
}

function ProTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const rows = payload
    .filter((p) => Number(p?.value || 0) !== 0)
    .map((p) => ({
      name: p.dataKey,
      value: Number(p.value || 0),
      color: p.stroke,
    }));

  return (
    <div
      style={{
        background: "white",
        border: "1px solid rgba(148,163,184,0.35)",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
        minWidth: 180,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
        {label}
      </div>
      <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
        {rows.length ? (
          rows.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: r.color,
                  }}
                />
                <span style={{ fontSize: 12, color: "#334155" }}>
                  {prettyKey(r.name)}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                {r.value.toLocaleString("en-IN")}
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: "#64748b" }}>No movement</div>
        )}
      </div>
    </div>
  );
}

/**
 * ✅ Voucher-wise pie builder
 * - negative values => yellow slice (value uses abs)
 * - total percent based on abs sum
 */
function buildVoucherPie(items, COLORS) {
  const clean = (items || [])
    .map((x) => {
      const raw = Number(x.value || 0);
      const neg = raw < 0;
      const v = Math.abs(raw);
      return {
        name: x.label,
        value: v,
        key: x.key,
        neg,
      };
    })
    .filter((x) => x.value > 0);

  if (!clean.length) {
    return [{ name: "No Data", value: 1, key: "NONE", neg: false, __total: 1 }];
  }

  const total = clean.reduce((s, x) => s + Number(x.value || 0), 0) || 1;
  return clean.map((x) => ({ ...x, __total: total, __COLORS: COLORS }));
}

function sliceColor(d) {
  const C = d?.__COLORS || COLORS;
  if (d?.neg) return C.YELLOW_NEG;

  // map keys to colors
  if (d?.key === "SALE") return C.SALE;
  if (d?.key === "RECEIPT") return C.RECEIPT;
  if (d?.key === "SALES_RETURN") return C.SALES_RETURN;
  if (d?.key === "PURCHASE") return C.PURCHASE;
  if (d?.key === "PAYMENT") return C.PAYMENT;
  if (d?.key === "PURCHASE_RETURN") return C.PURCHASE_RETURN;
  if (d?.key === "JOURNAL_CR") return C.JOURNAL;
  if (d?.key === "JOURNAL_DR") return C.JOURNAL;

  return C.JOURNAL;
}

/* ✅ keeping your old buildPie (not deleting) */
function buildPie(p) {
  if (!p) return [];
  const net = Number(p.net || 0);

  if (!p.total || Math.abs(net) === 0) {
    return [{ name: "All Clear", value: 1, kind: "greenFull", __total: 1 }];
  }

  const arr = [
    {
      name: "Outstanding",
      value: Number(p.outstanding || 0),
      kind: net > 0 ? "red" : "green",
    },
    { name: "Settled", value: Number(p.settled || 0), kind: "green" },
  ].filter((x) => x.value > 0);

  const total = arr.reduce((s, x) => s + Number(x.value || 0), 0) || 1;
  return arr.map((x) => ({ ...x, __total: total }));
}

function Kpi({ title, value, hint, className = "", valueClassName = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white p-4 ${className}`}>
      <div className="text-xs text-slate-500">{title}</div>
      <div className={`text-xl font-semibold mt-1 ${valueClassName}`}>
        {Number(value).toLocaleString("en-IN")}
      </div>
      <div className="text-xs text-slate-400 mt-1">{hint}</div>
    </div>
  );
}

function PctTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const name = item?.name || item?.payload?.name || "";
  const val = Number(item?.value || 0);

  const total = Number(item?.payload?.__total || 0);
  const pct = total ? (val / total) * 100 : 0;

  const neg = Boolean(item?.payload?.neg);

  return (
    <div
      style={{
        background: "white",
        border: "1px solid rgba(148,163,184,0.35)",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
        {name} {neg ? "(negative)" : ""}
      </div>
      <div style={{ fontSize: 12, color: "#334155", marginTop: 2 }}>
        {val.toLocaleString("en-IN")} &nbsp;•&nbsp; {pct.toFixed(1)}%
      </div>
    </div>
  );
}