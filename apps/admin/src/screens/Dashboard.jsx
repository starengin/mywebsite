import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";

function toISO(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function moneyINR(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const pageAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const gridAnim = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22 } },
};

export default function Welcome() {
  const [isMobile, setIsMobile] = useState(
  typeof window !== "undefined" ? window.innerWidth <= 768 : false
);

useEffect(() => {
  const onResize = () => setIsMobile(window.innerWidth <= 768);
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}, []);
  const [from, setFrom] = useState(() =>
    toISO(new Date(Date.now() - 30 * 86400000))
  );
  const [to, setTo] = useState(() => toISO(new Date()));
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await api.dashboard({ from, to });
      setData(res?.data ?? res);
    } catch (e) {
      setErr(
        e?.response?.data?.message || e.message || "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = useMemo(() => {
    const d = data || {};
    return [
      { label: "Users", value: d.usersCount ?? 0, hint: "Total users / parties" },
      {
        label: "Transactions",
        value: d.transactionsCount ?? 0,
        hint: "Selected period",
      },
      {
        label: "Total Sales",
        value: `₹ ${moneyINR(d.totalSales)}`,
        hint: "SALE",
      },
      {
        label: "Total Purchase",
        value: `₹ ${moneyINR(d.totalPurchase)}`,
        hint: "PURCHASE",
      },
      {
        label: "Total Receipt",
        value: `₹ ${moneyINR(d.totalReceipt)}`,
        hint: "RECEIPT",
      },
      {
        label: "Total Payment",
        value: `₹ ${moneyINR(d.totalPayment)}`,
        hint: "PAYMENT",
      },
      {
        label: "Sales Return",
        value: `₹ ${moneyINR(d.totalSalesReturn)}`,
        hint: "SALES RETURN",
      },
      {
        label: "Purchase Return",
        value: `₹ ${moneyINR(d.totalPurchaseReturn)}`,
        hint: "PURCHASE RETURN",
      },
    ];
  }, [data]);

  return (
    <motion.div variants={pageAnim} initial="hidden" animate="show" style={S.page}>
      <div style={S.bgGlow1} />
      <div style={S.bgGlow2} />
      <div style={S.bgGlow3} />

      <div style={S.wrap}>
        <motion.div
          variants={cardAnim}
          initial="hidden"
          animate="show"
          style={S.hero}
        >
          <div style={S.heroShine} />

          <div style={S.heroTop}>
            <div>
              <div style={S.kicker}>STAR ENGINEERING</div>
              <div style={S.h1}>Admin Dashboard</div>
              <div style={S.sub}>
                Welcome back. Here is your premium operational overview for the
                selected period.
              </div>
            </div>

            <div style={S.topBtns}>
              <a style={S.btn} href="/customers">
                Users
              </a>
              <a style={S.btn} href="/transactions">
                Transactions
              </a>
              <a style={S.btnPrimary} href="/ledger">
                Ledger
              </a>
            </div>
          </div>

          <div style={S.heroStats}>
            <div style={S.heroMiniCard}>
              <div style={S.heroMiniLabel}>Period From</div>
              <div style={S.heroMiniValue}>{from}</div>
            </div>
            <div style={S.heroMiniCard}>
              <div style={S.heroMiniLabel}>Period To</div>
              <div style={S.heroMiniValue}>{to}</div>
            </div>
            <div style={S.heroMiniCard}>
              <div style={S.heroMiniLabel}>Status</div>
              <div style={S.heroMiniValue}>{loading ? "Loading..." : "Ready"}</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={cardAnim}
          initial="hidden"
          animate="show"
          style={S.filterBar}
        >
          <div style={S.filterTitleWrap}>
            <div style={S.filterTitle}>Filter Summary</div>
            <div style={S.filterSub}>Select a date range and refresh dashboard</div>
          </div>

          <div style={S.filterFields}>
            <div style={S.field}>
              <label style={S.label}>From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={S.input}
              />
            </div>

            <div style={S.field}>
              <label style={S.label}>To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={S.input}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ y: -1 }}
              onClick={load}
              style={S.apply}
              disabled={loading}
            >
              {loading ? "Loading..." : "Apply Filter"}
            </motion.button>
          </div>
        </motion.div>

        {err ? <div style={S.err}>{err}</div> : null}

        {loading ? (
          <div style={S.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={S.skelCard}>
                <div style={S.skelTop}>
                  <div style={S.skelLine1} />
                  <div style={S.skelPill} />
                </div>
                <div style={S.skelLine2} />
                <div style={S.skelLine3} />
              </div>
            ))}
          </div>
        ) : (
          <motion.div variants={gridAnim} initial="hidden" animate="show" style={S.grid}>
            {cards.map((c, idx) => (
              <motion.div
                key={c.label}
                variants={cardAnim}
                whileHover={{ y: -3 }}
                style={S.card}
              >
                <div style={S.cardGlow(idx)} />

                <div style={S.cardTop}>
                  <div style={S.cardLabel}>{c.label}</div>
                  <div style={S.pill}>PERIOD</div>
                </div>

                <div style={S.cardValue}>{c.value}</div>
                <div style={S.cardHint}>{c.hint}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div
  style={{
    ...S.bottomGrid,
    gridTemplateColumns: isMobile
      ? "1fr"
      : "minmax(0, 2fr) minmax(280px, 1fr)",
  }}
>
          <motion.div
            variants={cardAnim}
            initial="hidden"
            animate="show"
            style={S.bigCard}
          >
            <div style={S.bigHead}>
              <div>
                <div style={S.bigTitle}>Quick Actions</div>
                <div style={S.bigSub}>
                  Jump directly to the most used admin sections
                </div>
              </div>
            </div>

            <div
  style={{
    ...S.quickGrid,
    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
  }}
>
              <a style={S.q} href="/transactions">
                + New Transaction
              </a>
              <a style={S.q} href="/ledger">
                View Ledger
              </a>
              <a style={S.q} href="/customers">
                Manage Users
              </a>
            </div>
          </motion.div>

          <motion.div
            variants={cardAnim}
            initial="hidden"
            animate="show"
            style={S.sideInfo}
          >
            <div style={S.sideInfoTitle}>Admin Overview</div>
            <div style={S.sideInfoText}>
              Use the filters above to review the selected date range. Cards
              update based on sales, purchases, receipts, payments and returns.
            </div>

            <div style={S.infoList}>
              <div style={S.infoItem}>
                <span style={S.infoDot} />
                Financial summary by period
              </div>
              <div style={S.infoItem}>
                <span style={S.infoDot} />
                Quick navigation to core modules
              </div>
              <div style={S.infoItem}>
                <span style={S.infoDot} />
                Premium STAR dashboard styling
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

const S = {
  page: {
    position: "relative",
    overflow: "hidden",
    fontFamily: "Arial, Helvetica, sans-serif",
    padding: 14,
  },

  wrap: {
    maxWidth: 1240,
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  },

  bgGlow1: {
    position: "absolute",
    top: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "rgba(255,0,102,0.10)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  bgGlow2: {
    position: "absolute",
    top: 120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "rgba(0,102,255,0.10)",
    filter: "blur(75px)",
    pointerEvents: "none",
  },

  bgGlow3: {
    position: "absolute",
    bottom: -120,
    left: "25%",
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(255,170,0,0.10)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

hero: {
  position: "relative",
  overflow: "hidden",
  borderRadius: 24,
  padding: 20,
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
  marginBottom: 18,
  background:
    "linear-gradient(90deg, rgba(161,0,255,0.10), rgba(255,122,0,0.22), rgba(0,102,255,0.10))",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
},

  heroTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
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
  fontSize: "clamp(24px, 3vw, 34px)",
  fontWeight: 900,
  lineHeight: 1.05,
  color: "#111827",
},

sub: {
  fontSize: 14,
  color: "#334155",
  fontWeight: 700,
  marginTop: 8,
  lineHeight: 1.7,
  maxWidth: 720,
},

  topBtns: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
btn: {
  padding: "10px 13px",
  borderRadius: 14,
  border: "1px solid rgba(255,232,190,0.34)",
  background: "rgba(255,255,255,0.82)",
  color: "#7a0000",
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 13,
  boxShadow: "0 8px 18px rgba(17,24,39,0.05)",
},

btnPrimary: {
  padding: "10px 13px",
  borderRadius: 14,
  border: "1px solid rgba(255,232,190,0.40)",
  background: "linear-gradient(135deg,#a100ff,#ff0066,#ff7a00)",
  color: "#fff",
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 13,
  boxShadow: "0 10px 22px rgba(161,0,255,0.14)",
},

  heroStats: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },

heroMiniCard: {
  borderRadius: 18,
  padding: "14px 14px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.90), rgba(255,255,255,0.78))",
  border: "1px solid rgba(255,232,190,0.34)",
  boxShadow: "0 8px 18px rgba(17,24,39,0.04)",
},

heroMiniLabel: {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 7,
},
heroMiniValue: {
  fontSize: 16,
  color: "#111827",
  fontWeight: 900,
},

  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    flexWrap: "wrap",
    background:
      "radial-gradient(900px 260px at 12% 0%, rgba(255,170,0,0.08), transparent 60%), radial-gradient(820px 240px at 88% 0%, rgba(163,0,255,0.06), transparent 60%), linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.90))",
    border: "1px solid rgba(255,232,190,0.42)",
    borderRadius: 20,
    padding: "14px 16px",
    boxShadow: "0 12px 24px rgba(17,24,39,0.06)",
    marginBottom: 14,
  },

  filterTitleWrap: {
    minWidth: 180,
  },

  filterTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
  },

  filterSub: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 700,
    marginTop: 4,
  },

  filterFields: {
    display: "flex",
    gap: 10,
    alignItems: "end",
    flexWrap: "wrap",
  },

  field: {
    display: "grid",
    gap: 6,
  },

  label: {
    fontSize: 12,
    fontWeight: 900,
    color: "#111827",
  },

  input: {
    width: 165,
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid rgba(17,24,39,0.10)",
    outline: "none",
    fontSize: 13,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.90))",
    boxSizing: "border-box",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#111827",
    fontWeight: 700,
  },

  apply: {
    padding: "11px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,232,190,0.45)",
    background: "linear-gradient(135deg,#3b0000,#a100ff,#ff0066,#ff7a00)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    boxShadow:
      "0 16px 28px rgba(17,24,39,0.16), inset 0 1px 0 rgba(255,255,255,0.20)",
  },

  err: {
    background: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(239,68,68,0.22)",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: 16,
    fontWeight: 900,
    fontSize: 13,
    marginBottom: 14,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },

  card: {
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
    borderRadius: 20,
    border: "1px solid rgba(255,232,190,0.36)",
    boxShadow: "0 14px 30px rgba(17,24,39,0.07)",
    padding: 16,
    minHeight: 118,
  },

  cardGlow: (idx) => ({
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      idx % 4 === 0
        ? "radial-gradient(280px 120px at 0% 0%, rgba(255,0,102,0.08), transparent 60%)"
        : idx % 4 === 1
        ? "radial-gradient(280px 120px at 100% 0%, rgba(0,102,255,0.08), transparent 60%)"
        : idx % 4 === 2
        ? "radial-gradient(280px 120px at 0% 100%, rgba(255,170,0,0.08), transparent 60%)"
        : "radial-gradient(280px 120px at 100% 100%, rgba(163,0,255,0.08), transparent 60%)",
  }),

  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    position: "relative",
    zIndex: 1,
  },

  cardLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#4b5563",
    letterSpacing: 0.2,
  },

  pill: {
    fontSize: 11,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    color: "#7a0000",
    background: "rgba(255,170,0,0.10)",
    border: "1px solid rgba(255,170,0,0.18)",
  },

  cardValue: {
    marginTop: 12,
    fontSize: "clamp(20px, 2.3vw, 26px)",
    fontWeight: 900,
    color: "#111827",
    position: "relative",
    zIndex: 1,
    lineHeight: 1.15,
  },

  cardHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 700,
    position: "relative",
    zIndex: 1,
  },

bottomGrid: {
  marginTop: 14,
  display: "grid",
  gap: 14,
},

  bigCard: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
    borderRadius: 20,
    border: "1px solid rgba(255,232,190,0.36)",
    boxShadow: "0 14px 30px rgba(17,24,39,0.07)",
    padding: 16,
  },

  bigHead: {
    marginBottom: 12,
  },

  bigTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
  },

  bigSub: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 700,
    marginTop: 4,
  },

quickGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
},

q: {
  padding: "13px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,232,190,0.34)",
  background:
    "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.06), transparent 55%), radial-gradient(760px 200px at 95% 0%, rgba(0,102,255,0.06), transparent 60%), linear-gradient(180deg,#ffffff,#fff7fb)",
  fontWeight: 900,
  color: "#111827",
  textDecoration: "none",
  textAlign: "center",
  fontSize: 13,
  boxShadow: "0 10px 20px rgba(17,24,39,0.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  wordBreak: "break-word",
},

  sideInfo: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
    borderRadius: 20,
    border: "1px solid rgba(255,232,190,0.36)",
    boxShadow: "0 14px 30px rgba(17,24,39,0.07)",
    padding: 16,
  },

  sideInfoTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
  },

  sideInfoText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 1.8,
    color: "#4b5563",
    fontWeight: 700,
  },

  infoList: {
    marginTop: 14,
    display: "grid",
    gap: 10,
  },

  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    color: "#111827",
    fontWeight: 800,
  },

  infoDot: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#a100ff,#ff7a00)",
    flexShrink: 0,
    boxShadow: "0 0 0 4px rgba(161,0,255,0.08)",
  },

  skeletonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },

  skelCard: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
    borderRadius: 20,
    border: "1px solid rgba(255,232,190,0.36)",
    padding: 16,
    boxShadow: "0 14px 30px rgba(17,24,39,0.05)",
  },

  skelTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  skelLine1: {
    height: 12,
    width: "45%",
    borderRadius: 10,
    background: "rgba(17,24,39,0.08)",
  },

  skelPill: {
    height: 26,
    width: 62,
    borderRadius: 999,
    background: "rgba(255,170,0,0.10)",
  },

  skelLine2: {
    height: 24,
    width: "72%",
    borderRadius: 10,
    background: "rgba(17,24,39,0.10)",
    marginTop: 14,
  },

  skelLine3: {
    height: 12,
    width: "50%",
    borderRadius: 10,
    background: "rgba(17,24,39,0.08)",
    marginTop: 12,
  },
};