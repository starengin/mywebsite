import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import API, { api } from "../lib/api";
function normName(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findPartyByName(customers, partyName) {
  const target = normName(partyName);
  if (!target) return null;

  let m = customers.find((c) => normName(c.name) === target);
  if (m) return m;

  m = customers.find((c) => {
    const n = normName(c.name);
    return n && (target.includes(n) || n.includes(target));
  });
  if (m) return m;

  return null;
}

const TYPES = [
  { key: "SALE", label: "Sales" },
  { key: "PURCHASE", label: "Purchase" },
  { key: "PAYMENT", label: "Payment" },
  { key: "RECEIPT", label: "Receipt" },
  { key: "SALES_RETURN", label: "Sales Return" },
  { key: "PURCHASE_RETURN", label: "Purchase Return" },
  { key: "JOURNAL", label: "Journal" },
];

function drcrForType(type) {
  const map = {
    SALE: "DR",
    PURCHASE: "CR",
    PAYMENT: "DR",
    RECEIPT: "CR",
    SALES_RETURN: "CR",
    PURCHASE_RETURN: "DR",
  };
  return map[type] || "";
}

function voucherLabel(type) {
  switch (type) {
    case "SALE":
      return "Voucher No. / Invoice No.";
    case "PURCHASE":
      return "Voucher No. / Supplier Ref";
    case "PAYMENT":
      return "Advice No. / Payment No.";
    case "RECEIPT":
      return "Receipt No.";
    case "SALES_RETURN":
      return "Credit Note No.";
    case "PURCHASE_RETURN":
      return "Debit Note No.";
    case "JOURNAL":
      return "Journal No.";
    default:
      return "Voucher No.";
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDDMMMYYYY(d) {
  if (!d) return "-";
  const dt = new Date(String(d).slice(0, 10));
  if (Number.isNaN(dt.getTime())) return String(d).slice(0, 10);
  const dd = String(dt.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${dd}-${months[dt.getMonth()]}-${dt.getFullYear()}`;
}

// robust attach shape -> {id,name,url}
function normalizePdfList(row) {
  const arr = row?.pdfs || row?.attachments || row?.docs || [];
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p, idx) => {
      const id = p?.id ?? p?.pdfId ?? p?.docId ?? `${idx}`;
      const name =
        p?.originalName ||
        p?.filename ||
        p?.fileName ||
        p?.name ||
        p?.path?.split?.("/")?.pop?.() ||
        `PDF-${idx + 1}.pdf`;
      const url =
  p?.url ||
  p?.fileUrl ||
  p?.publicUrl ||
  (p?.id != null ? `/pdfs/${p.id}` : "") ||   // ✅ default route by id
  "";
      return { id: String(id), name: String(name), url: String(url) };
    })
    .filter((x) => x.name);
}

// call api method if exists else fallback to axios instance
async function callApiMaybe(fn, fallback) {
  if (typeof fn === "function") return fn();
  return fallback();
}

const IconBtn = ({ title, onClick, danger, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    style={{
      height: 34,
      width: 38,
      borderRadius: 12,
      border: "1px solid rgba(2,6,23,0.12)",
      background: danger ? "rgba(239,68,68,0.08)" : "white",
      color: danger ? "#991b1b" : "#0f172a",
      fontWeight: 900,
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}
  >
    {children}
  </button>
);

const Modal = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={S.modalBackdrop} onMouseDown={onClose}>
      <motion.div
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        style={S.modalCard}
      >
        <div style={S.modalHead}>
          <div style={S.modalTitle}>{title}</div>
          <button type="button" onClick={onClose} style={S.modalClose}>
            ✕
          </button>
        </div>
        <div style={S.modalBody}>{children}</div>
      </motion.div>
    </div>
  );
};

function Field({ label, children, hint }) {
  return (
    <div style={S.field}>
      <div style={S.labelRow}>
        <div style={S.label}>{label}</div>
        {hint ? <div style={S.hint}>{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [customers, setCustomers] = useState([]);
  const [rows, setRows] = useState([]);

  // filters
  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => todayISO());
  const [q, setQ] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | view | edit
  const [saving, setSaving] = useState(false);

  const blank = {
    type: "SALE",
    partyId: "",
    date: todayISO(),
    voucherNo: "",
    amount: "",
    drcr: drcrForType("SALE"),
    narration: "",
  };
  const [form, setForm] = useState(blank);

  // selected row for edit/view
  const [selectedRow, setSelectedRow] = useState(null);

  // scan
  const [scanLoading, setScanLoading] = useState(false);
  const [scanFile, setScanFile] = useState(null);
  const [scanFileName, setScanFileName] = useState("");
  const [scanError, setScanError] = useState("");

  // attachments: create/edit new files
  const [newFiles, setNewFiles] = useState([]); // File[]
  const [existingPdfs, setExistingPdfs] = useState([]); // normalized {id,name,url}

  async function loadAll() {
    setErr("");
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        api.customers(),
        api.transactions({ from, to, q: q || undefined }),
      ]);

      const cRows = cRes?.data ?? cRes ?? [];
      const tRows = tRes?.data ?? tRes ?? [];

      setCustomers(Array.isArray(cRows) ? cRows : []);
      setRows(Array.isArray(tRows) ? tRows : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilter() {
    if (String(from) > String(to)) {
      setErr("From date must be <= To date");
      return;
    }
    await loadAll();
  }

  const filtered = useMemo(() => {
    // backend already filters by q, still keep safe local filter
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((x) => {
      const v = `${x?.voucherNo || ""} ${x?.narration || ""} ${x?.type || ""}`.toLowerCase();
      return v.includes(s);
    });
  }, [rows, q]);

  const partyNameById = useMemo(() => {
    const map = new Map();
    for (const c of customers || []) map.set(String(c.id), c.name);
    return map;
  }, [customers]);

  function resetAttachState() {
    setScanFile(null);
    setScanFileName("");
    setNewFiles([]);
    setExistingPdfs([]);
  }

  function openCreate() {
  setMode("create");
  setSelectedRow(null);

  const t = "SALE";
  setForm({
    ...blank,
    type: t,
    drcr: drcrForType(t),
    partyId: "", // ✅ no default party
    date: todayISO(),
  });

  resetAttachState();
    setScanError("");
  setOpen(true);
}

  function openView(row) {
    setMode("view");
    setSelectedRow(row || null);

    setForm({
      type: row?.type || "SALE",
      partyId: row?.partyId ? String(row.partyId) : "",
      date: row?.date ? String(row.date).slice(0, 10) : "",
      voucherNo: row?.voucherNo || "",
      amount: String(row?.amount ?? ""),
      drcr: row?.drcr || drcrForType(row?.type),
      narration: row?.narration || "",
    });

    resetAttachState();
    setExistingPdfs(normalizePdfList(row));
    setOpen(true);
  }

  function openEdit(row) {
    setMode("edit");
    setSelectedRow(row || null);

    setForm({
      type: row?.type || "SALE",
      partyId: row?.partyId ? String(row.partyId) : "",
      date: row?.date ? String(row.date).slice(0, 10) : "",
      voucherNo: row?.voucherNo || "",
      amount: String(row?.amount ?? ""),
      drcr: row?.drcr || drcrForType(row?.type),
      narration: row?.narration || "",
    });

    resetAttachState();
    setExistingPdfs(normalizePdfList(row));
    setOpen(true);
  }

  function onTypeChange(nextType) {
    const t = nextType;
    const auto = drcrForType(t);
    setForm((p) => ({
      ...p,
      type: t,
      drcr: t === "JOURNAL" ? (p.drcr || "DR") : auto,
      narration: t === "JOURNAL" ? p.narration : "",
    }));

    // for create/edit: scanning not for journal
    if (t === "JOURNAL") {
      setScanFile(null);
      setScanFileName("");
    }
  }

  async function onScanPdf(file) {
    if (!file) return;
    setErr("");
    setScanLoading(true);
    setScanFile(file);
    setScanFileName(file.name || "PDF");

    try {
      // ✅ supports both names: scanTransactionPDF / scanTransactionPdf
      const res = await callApiMaybe(
        () => api.scanTransactionPDF?.(file),
        async () => {
          const fd = new FormData();
          fd.append("pdf", file);
          return API.post("/transactions/scan", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      );

      // ✅ accept multiple backend shapes
// ✅ accept multiple backend shapes (ultra-robust)
const payload = res?.data ?? res ?? {};

function pickExtracted(obj) {
  const candidates = [
    obj?.extracted,
    obj?.extractedData,
    obj?.data?.extracted,
    obj?.data,
    obj?.result,
    obj,
  ];

  for (const c of candidates) {
    if (!c) continue;

    // sometimes backend may return JSON string
    if (typeof c === "string") {
      try {
        const j = JSON.parse(c);
        if (j) {
          const got = pickExtracted(j);
          if (got) return got;
        }
      } catch {}
      continue;
    }

    if (typeof c === "object") {
      // nested again
      if (c?.extracted && typeof c.extracted === "object") return c.extracted;

      // if it already looks like extracted object
      if (c.type || c.partyName || c.voucherNo || c.amount || c.date || c.narration) return c;
    }
  }
  return null;
}

const rawExtracted = pickExtracted(payload);

console.log("SCAN RAW PAYLOAD:", payload);
console.log("SCAN PICKED EXTRACTED:", rawExtracted);

if (!rawExtracted) {
  setScanError("Scan failed: extracted object not found (check server response in console)");
  return;
}

// ✅ normalize field names (different backends use different keys)
const data = {
  type: rawExtracted.type || rawExtracted.txnType || rawExtracted.voucherType || "",
  partyName: rawExtracted.partyName || rawExtracted.party || rawExtracted.customerName || rawExtracted.customer || "",
  voucherNo: rawExtracted.voucherNo || rawExtracted.vchNo || rawExtracted.invoiceNo || rawExtracted.no || "",
  date: rawExtracted.date || rawExtracted.txnDate || rawExtracted.transactionDate || "",
  amount: rawExtracted.amount || rawExtracted.total || rawExtracted.totalAmount || "",
  narration: rawExtracted.narration || "",
  drcr: rawExtracted.drcr || "",
};

const hasAny =
  !!(data.type || data.partyName || data.voucherNo || data.amount || data.date || data.narration);

if (!hasAny) {
  setScanError("Scan failed: extracted object empty (check server logs + console payload)");
  return;
}

setScanError(""); // ✅ clear if scan worked

// ✅ Ensure customers loaded before matching
let partyList = customers;

if (!partyList || partyList.length === 0) {
  try {
    const cRes = await api.customers();
    partyList = cRes?.data ?? cRes ?? [];
    setCustomers(partyList);
  } catch {}
}

const match = findPartyByName(partyList, data.partyName);
const pid = match ? String(match.id) : "";

if (!pid) {
  setScanError(`Party "${data.partyName || "Unknown"}" customer list me nahi hai. Please select/create customer.`);
} else {
  setScanError("");
}

setForm((p) => ({
  ...p,
  type: data.type || p.type,
  partyId: pid || p.partyId,
  date: data.date || p.date,
  voucherNo: data.voucherNo || p.voucherNo,
  amount: data.amount ? String(data.amount) : p.amount,
  drcr: (data.type || p.type) === "JOURNAL" ? (p.drcr || "DR") : drcrForType(data.type || p.type),
  narration: (data.type || p.type) === "JOURNAL" ? (data.narration || p.narration) : "",
}));
} catch (e) {
  setScanError(e?.response?.data?.message || e.message || "Scan failed");
  // ✅ don't use setErr here, warna top red banner show hoga
} finally {
      setScanLoading(false);
    }
  }

  async function onSave() {
    setErr("");

    if (!form.type) return setErr("Transaction type required");
    if (!form.partyId) return setErr("Party required");
    if (!form.date) return setErr("Date required");
    if (!String(form.amount || "").trim()) return setErr("Amount required");

    const amt = Number(String(form.amount).replace(/,/g, ""));
    if (!Number.isFinite(amt) || amt <= 0) return setErr("Amount must be a valid number > 0");

    // journal rules
    if (form.type === "JOURNAL") {
      if (!form.drcr) return setErr("Dr/Cr required for Journal");
      if (!String(form.narration || "").trim()) return setErr("Narration required for Journal");
    }

    // non-journal auto drcr
    const drcr = form.type === "JOURNAL" ? form.drcr : drcrForType(form.type);

    try {
      setSaving(true);

      if (mode === "create") {
        // ✅ Create = multipart (auto-attach scan pdf + selected pdfs)
        const fd = new FormData();
        fd.append("type", form.type);
        fd.append("partyId", String(form.partyId));
        fd.append("date", form.date);
        fd.append("voucherNo", form.voucherNo || "");
        fd.append("amount", String(amt));
        fd.append("drcr", drcr);
        fd.append("narration", form.type === "JOURNAL" ? String(form.narration || "") : (form.narration || ""));

        // ✅ auto attach scanned pdf (if any)
        if (scanFile) fd.append("pdfs", scanFile);

        // ✅ attach manually chosen pdfs (multi)
        for (const f of newFiles || []) fd.append("pdfs", f);

        await callApiMaybe(
          () => api.createTransaction?.(fd),
          () =>
            API.post("/transactions", fd, {
              headers: { "Content-Type": "multipart/form-data" },
            })
        );

        setOpen(false);
        await loadAll();
        return;
      }

      if (mode === "edit") {
        if (!selectedRow?.id) return setErr("Missing transaction id");

        // ✅ Update basic fields (no pdfs here)
        const payload = {
          type: form.type,
          partyId: String(form.partyId),
          date: form.date,
          voucherNo: form.voucherNo || "",
          amount: String(amt),
          drcr,
          narration: form.type === "JOURNAL" ? String(form.narration || "") : (form.narration || ""),
        };

        await callApiMaybe(
          () => api.updateTransaction?.(selectedRow.id, payload),
          () => API.put(`/transactions/${selectedRow.id}`, payload)
        );

        // ✅ If user added new PDFs OR scanned in edit mode (optional), upload them
        const uploadList = [];
        if (scanFile) uploadList.push(scanFile);
        for (const f of newFiles || []) uploadList.push(f);

        if (uploadList.length) {
          await callApiMaybe(
            () => api.addTransactionPDFs?.(selectedRow.id, uploadList),
            async () => {
              const fd = new FormData();
              for (const f of uploadList) fd.append("pdfs", f);
              return API.post(`/transactions/${selectedRow.id}/pdfs`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
              });
            }
          );
        }

        setOpen(false);
        await loadAll();
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e?.response?.data?.error || e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row) {
    if (!row?.id) return;
    const ok = confirm(`Delete this transaction?\n${row?.type || ""} ${row?.voucherNo || ""}`);
    if (!ok) return;

    setErr("");
    try {
      await callApiMaybe(
        () => api.deleteTransaction?.(row.id),
        () => API.delete(`/transactions/${row.id}`)
      );
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Delete failed");
    }
  }

  async function onRemoveExistingPdf(pdfId) {
    if (!selectedRow?.id) return;
    const ok = confirm("Remove this PDF?");
    if (!ok) return;

    setErr("");
    try {
      await callApiMaybe(
        () => api.deleteTransactionPDF?.(selectedRow.id, pdfId),
        () => API.delete(`/transactions/${selectedRow.id}/pdfs/${pdfId}`)
      );
      // refresh modal list (local) + refresh table
      setExistingPdfs((p) => p.filter((x) => String(x.id) !== String(pdfId)));
      await loadAll();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to remove PDF");
    }
  }

  const canScan = (mode === "create" || mode === "edit") && form.type !== "JOURNAL";
  const canEdit = mode === "create" || mode === "edit";
  const isView = mode === "view";

  return (
    <div style={S.page}>
      <div style={S.topRow}>
        <div>
          <div style={S.h1}>Transactions</div>
          <div style={S.sub}>Manual entry + PDF scan autofill</div>
        </div>

        <div style={S.topActions}>
          <div style={S.filters}>
            <div style={S.filterBox}>
              <div style={S.filterLabel}>From</div>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={S.date} />
            </div>
            <div style={S.filterBox}>
              <div style={S.filterLabel}>To</div>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={S.date} />
            </div>

            <motion.button whileTap={{ scale: 0.98 }} onClick={applyFilter} style={S.secondary}>
              Apply
            </motion.button>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search voucher / narration..."
            style={S.search}
          />

          <motion.button whileTap={{ scale: 0.98 }} onClick={openCreate} style={S.primary}>
            + New Transaction
          </motion.button>
        </div>
      </div>

      {err ? <div style={S.err}>{err}</div> : null}

      <div style={S.card}>
        <div style={S.cardHead}>
          <div style={S.cardTitle}>All Transactions</div>
          <div style={S.muted}>{loading ? "Loading..." : `${filtered.length} record(s)`}</div>
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Date</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Party</th>
                <th style={S.th}>Voucher No.</th>
                <th style={{ ...S.th, textAlign: "right" }}>Amount</th>
                <th style={S.th}>Dr/Cr</th>
                <th style={S.th}>Narration</th>
                <th style={{ ...S.th, width: 160, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td style={S.td} colSpan={8}>
                    <div style={S.muted}>Loading...</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td style={S.td} colSpan={8}>
                    <div style={S.muted}>No transactions found</div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={S.td}>{fmtDDMMMYYYY(r?.date)}</td>
                    <td style={S.td}>{r?.type || ""}</td>
                    <td style={S.td}>{partyNameById.get(String(r?.partyId || "")) || "-"}</td>
                    <td style={S.td}>{r?.voucherNo || "-"}</td>
                    <td style={{ ...S.td, textAlign: "right", fontWeight: 900 }}>
                      ₹{" "}
                      {Number(r?.amount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td style={S.td}>{r?.type === "JOURNAL" ? (r?.drcr || "-") : drcrForType(r?.type)}</td>
                    <td style={S.td}>{r?.type === "JOURNAL" ? (r?.narration || "-") : (r?.narration || "-")}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <IconBtn title="View" onClick={() => openView(r)}>
                          👁
                        </IconBtn>
                        <IconBtn title="Edit" onClick={() => openEdit(r)}>
                          ✏️
                        </IconBtn>
                        <IconBtn title="Delete" danger onClick={() => onDelete(r)}>
                          🗑
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={mode === "create" ? "New Transaction" : mode === "edit" ? "Edit Transaction" : "View Transaction"}
        onClose={() => setOpen(false)}
      >
        {/* PDF Scan (not for Journal) */}
        {canScan && (
          <div style={S.scanBox}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={S.scanTitle}>Upload PDF & Auto Fill</div>
                <div style={S.scanSub}>
                  Upload voucher PDF → scan → fields auto fill. ✅ This PDF will auto-attach on save.
                </div>
              </div>

              <label style={S.scanBtn}>
                {scanLoading ? "Scanning..." : "Upload PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => onScanPdf(e.target.files?.[0])}
                />
              </label>
            </div>

            {scanFileName ? (
              <div style={S.scanFile}>
                Scanned File: <b>{scanFileName}</b> (auto attach enabled)
              </div>
            ) : null}
          </div>
        )}

        <div style={S.formGrid}>
          <Field label="Transaction Type">
            <select style={S.input} value={form.type} disabled={isView} onChange={(e) => onTypeChange(e.target.value)}>
              {TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Party Name">
            <select
              style={S.input}
              value={form.partyId}
              disabled={isView}
              onChange={(e) => setForm((p) => ({ ...p, partyId: e.target.value }))}
            >
              <option value="" disabled>
                Select party
              </option>
              {(customers || []).map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
                        {scanError ? (
              <div style={{
                marginTop: 8,
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(239,68,68,0.10)",
                border: "1px solid rgba(239,68,68,0.22)",
                color: "#991b1b",
                fontWeight: 900,
                fontSize: 12
              }}>
                {scanError}
              </div>
            ) : null}
          </Field>

          <Field label="Date of Transaction">
            <input
              type="date"
              style={S.input}
              value={form.date}
              disabled={isView}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </Field>

          <Field label={voucherLabel(form.type)}>
            <input
              style={S.input}
              value={form.voucherNo}
              disabled={isView}
              onChange={(e) => setForm((p) => ({ ...p, voucherNo: e.target.value }))}
              placeholder="Optional (but recommended)"
            />
          </Field>

          <Field label="Total Amount">
            <input
              style={S.input}
              value={form.amount}
              disabled={isView}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              inputMode="decimal"
              placeholder="e.g. 5000"
            />
          </Field>

          {form.type === "JOURNAL" ? (
            <Field label="Dr / Cr (Only for Journal)">
              <select
                style={S.input}
                value={form.drcr || "DR"}
                disabled={isView}
                onChange={(e) => setForm((p) => ({ ...p, drcr: e.target.value }))}
              >
                <option value="DR">DR</option>
                <option value="CR">CR</option>
              </select>
            </Field>
          ) : (
            <Field label="Dr / Cr (Auto)" hint="Locked (as per rules)">
              <input style={S.input} value={drcrForType(form.type)} disabled />
            </Field>
          )}

          <Field
            label={form.type === "JOURNAL" ? "Narration (Required for Journal)" : "Narration"}
            hint={form.type === "JOURNAL" ? "This will show in particulars instead of 'Journal'" : ""}
          >
            <input
              style={S.input}
              value={form.narration}
              disabled={isView || form.type !== "JOURNAL"}
              onChange={(e) => setForm((p) => ({ ...p, narration: e.target.value }))}
              placeholder={form.type === "JOURNAL" ? "e.g. To Being adjustment..." : "Only Journal uses narration"}
            />
          </Field>

          <Field label="Attachments (PDFs)" hint="Single / Multiple both supported">
            <input
              type="file"
              accept="application/pdf"
              multiple
              disabled={isView}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setNewFiles(files);
              }}
            />
            <div style={S.smallNote}>
              {scanFile ? (
                <div>
                  Auto-attach: <b>{scanFile.name}</b>
                </div>
              ) : null}
              {newFiles?.length ? (
                <div>
                  New selected: <b>{newFiles.length}</b> file(s)
                </div>
              ) : (
                <div>No new files selected</div>
              )}
            </div>

            {existingPdfs?.length ? (
              <div style={S.pdfBox}>
                <div style={S.pdfTitle}>Existing PDFs</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {existingPdfs.map((p) => {
                    function getAuthToken() {
  return localStorage.getItem("token") || localStorage.getItem("adminToken") || "";
}
  const base = API?.defaults?.baseURL || "http://localhost:5000";
const token = getAuthToken();

let href = "#";
if (p.url) {
  const abs = p.url.startsWith("http")
    ? p.url
    : `${base}${p.url.startsWith("/") ? "" : "/"}${p.url}`;

  // ✅ add token so new tab can access
  href = token ? `${abs}${abs.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : abs;
}
    

  return (
    <div key={p.id} style={S.pdfRow}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ color: "#0f172a", fontWeight: 900, textDecoration: "underline" }}
        onClick={(e) => {
          if (!p.url) e.preventDefault();
        }}
        title={p.url ? "Open PDF" : "No URL provided by backend"}
      >
        {p.name}
      </a>

      {mode === "edit" ? (
        <button type="button" onClick={() => onRemoveExistingPdf(p.id)} style={S.pdfRemove}>
          Remove
        </button>
      ) : null}
    </div>
  );
})}
                </div>
              </div>
            ) : null}
          </Field>
        </div>

        <div style={S.modalFoot}>
          <button type="button" onClick={() => setOpen(false)} style={S.secondary}>
            Close
          </button>

          {canEdit && (
            <motion.button
  whileTap={{ scale: 0.98 }}
  onClick={onSave}
  disabled={saving || !form.partyId || !!scanError}
  style={S.primary}
>
              {saving ? "Saving..." : mode === "create" ? "Save Transaction" : "Save Changes"}
            </motion.button>
          )}
        </div>

        <div style={S.note}>
          Rules: Sales/Payment/Purchase Return = DR, Purchase/Receipt/Sales Return = CR. Only Journal allows DR/CR selection + narration required. PDF scan → auto-fill + auto-attach on save.
        </div>
      </Modal>
    </div>
  );
}

const S = {
  page: {
    padding: 14,
    maxWidth: 1300,
    margin: "0 auto",
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 10,
    flexWrap: "wrap",
  },
  h1: { fontSize: 20, fontWeight: 900, color: "#0f172a" },
  sub: { fontSize: 12, color: "#64748b", fontWeight: 700, marginTop: 4 },

  topActions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  filters: {
    display: "flex",
    alignItems: "end",
    gap: 10,
    padding: 10,
    border: "1px solid rgba(2,6,23,0.08)",
    borderRadius: 14,
    background: "#fff",
  },
  filterBox: { display: "grid", gap: 6 },
  filterLabel: { fontSize: 11, fontWeight: 900, color: "#334155" },
  date: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(2,6,23,0.12)",
    fontSize: 12,
    fontFamily: "Arial, Helvetica, sans-serif",
    outline: "none",
  },

  search: {
    width: 240,
    padding: "9px 10px",
    borderRadius: 12,
    border: "1px solid rgba(2,6,23,0.12)",
    fontSize: 13,
    outline: "none",
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  primary: {
    padding: "9px 12px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  secondary: {
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(2,6,23,0.12)",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  err: {
    marginTop: 10,
    background: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(239,68,68,0.22)",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: 14,
    fontWeight: 900,
    fontSize: 13,
  },

  card: {
    marginTop: 12,
    background: "#fff",
    borderRadius: 16,
    border: "1px solid rgba(2,6,23,0.08)",
    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
    padding: 12,
  },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" },
  cardTitle: { fontSize: 13, fontWeight: 900, color: "#0f172a" },
  muted: { fontSize: 12, color: "#64748b", fontWeight: 800 },

  tableWrap: { marginTop: 10, overflow: "auto" },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 980 },
  th: {
    textAlign: "left",
    fontSize: 11,
    fontWeight: 900,
    color: "#334155",
    padding: "10px 10px",
    borderBottom: "1px solid rgba(2,6,23,0.10)",
    background: "rgba(248,250,252,0.9)",
    position: "sticky",
    top: 0,
    zIndex: 1,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 10px",
    borderBottom: "1px solid rgba(2,6,23,0.08)",
    fontSize: 12,
    color: "#0f172a",
    verticalAlign: "top",
    whiteSpace: "nowrap",
  },

  // modal
modalBackdrop: {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.45)",
  display: "grid",
  placeItems: "center",
  padding: 14,
  zIndex: 999,
  overflowY: "auto",            // ✅ if needed
},
modalCard: {
  width: "min(880px, 96vw)",
  background: "#fff",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 24px 90px rgba(2,6,23,0.30)",
  overflow: "hidden",
  maxHeight: "min(86vh, 780px)", // ✅ modal never goes out of screen
  display: "flex",
  flexDirection: "column",
},
  modalHead: {
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(2,6,23,0.08)",
  },
  modalTitle: { fontSize: 14, fontWeight: 900, color: "#0f172a" },
  modalClose: {
    height: 34,
    width: 34,
    borderRadius: 12,
    border: "1px solid rgba(2,6,23,0.12)",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
 modalBody: {
  padding: 14,
  overflowY: "auto",            // ✅ scroll inside modal
  WebkitOverflowScrolling: "touch",
},

  scanBox: {
    border: "1px solid rgba(2,6,23,0.10)",
    borderRadius: 16,
    padding: 12,
    background: "rgba(248,250,252,0.9)",
    marginBottom: 12,
  },
  scanTitle: { fontSize: 13, fontWeight: 900, color: "#0f172a" },
  scanSub: { marginTop: 4, fontSize: 12, color: "#64748b", fontWeight: 700 },
  scanBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 12px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#2563eb,#7c3aed)",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 13,
  },
  scanFile: { marginTop: 10, fontSize: 12, color: "#0f172a", fontWeight: 800 },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "grid", gap: 6 },
  labelRow: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" },
  label: { fontSize: 12, fontWeight: 900, color: "#0f172a" },
  hint: { fontSize: 11, fontWeight: 800, color: "#64748b" },
  input: {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid rgba(2,6,23,0.12)",
    outline: "none",
    fontSize: 13,
    boxSizing: "border-box",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  smallNote: { marginTop: 6, fontSize: 12, color: "#64748b", fontWeight: 700 },

  pdfBox: {
    marginTop: 10,
    border: "1px solid rgba(2,6,23,0.10)",
    borderRadius: 14,
    padding: 10,
    background: "rgba(248,250,252,0.9)",
  },
  pdfTitle: { fontSize: 12, fontWeight: 900, color: "#0f172a", marginBottom: 8 },
  pdfRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  pdfRemove: {
    padding: "7px 10px",
    borderRadius: 12,
    border: "1px solid rgba(239,68,68,0.25)",
    background: "rgba(239,68,68,0.08)",
    color: "#991b1b",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "Arial, Helvetica, sans-serif",
    whiteSpace: "nowrap",
  },

  modalFoot: { marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" },
  note: { marginTop: 10, fontSize: 12, color: "#64748b", fontWeight: 700 },
};

// responsive
const mq = window.matchMedia?.("(max-width: 980px)");
if (mq?.matches) {
  S.formGrid.gridTemplateColumns = "1fr";
  S.search.width = "min(280px, 92vw)";
  S.table.minWidth = 880;
}