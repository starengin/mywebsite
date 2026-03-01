import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api"; // make sure api has endpoints below

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

function Field({ label, children }) {
  return (
    <div style={S.field}>
      <div style={S.label}>{label}</div>
      {children}
    </div>
  );
}

export default function Customers() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create | edit | view
  const [saving, setSaving] = useState(false);

  const blank = { name: "", email: "", password: "" };
  const [form, setForm] = useState(blank);

  async function load(keepSelectionId) {
    setErr("");
    setLoading(true);
    try {
      const res = await api.customers();
      const rows = res?.data ?? res ?? [];
      const arr = Array.isArray(rows) ? rows : [];
      setList(arr);

      // keep selection stable (optional)
      if (keepSelectionId) {
        const found = arr.find((x) => x.id === keepSelectionId);
        setSelected(found || null);
      } else {
        setSelected(null);
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((x) => (x?.name || "").toLowerCase().includes(s));
  }, [q, list]);

  function openCreate() {
    setMode("create");
    setSelected(null);
    setForm(blank);
    setOpen(true);
  }

  function openView(row) {
    setMode("view");
    setSelected(row);
    setForm({
      name: row?.name || "",
      email: row?.email || "",
      password: "",
    });
    setOpen(true);
  }

  function openEdit(row) {
    setMode("edit");
    setSelected(row);
    setForm({
      name: row?.name || "",
      email: row?.email || "",
      password: "",
    });
    setOpen(true);
  }

  async function onSave() {
    setErr("");

    if (!form.name.trim()) return setErr("Name required");
    if (!form.email.trim()) return setErr("Email required");
    if (mode === "create" && !form.password.trim()) return setErr("Password required");

    try {
      setSaving(true);

      if (mode === "create") {
        await api.createCustomer({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });

        await load();
        setOpen(false);
        return;
      }

      if (mode === "edit" && selected?.id) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
        };
        if (form.password.trim()) payload.password = form.password;

        await api.updateCustomer(selected.id, payload);
        await load(selected.id);
        setOpen(false);
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row) {
    if (!row?.id) return;
    const ok = confirm(`Delete "${row.name}"?`);
    if (!ok) return;

    setErr("");
    try {
      await api.deleteCustomer(row.id);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Delete failed");
    }
  }

  return (
    <div style={S.page}>
      <div style={S.topRow}>
        <div>
          <div style={S.h1}>Users</div>
          <div style={S.sub}>Create / View / Edit / Delete</div>
        </div>

        <div style={S.topActions}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search user..."
            style={S.search}
          />
          <motion.button whileTap={{ scale: 0.98 }} onClick={openCreate} style={S.primary}>
            + Add User
          </motion.button>
        </div>
      </div>

      {err ? <div style={S.err}>{err}</div> : null}

      <div style={S.layout}>
        {/* Left list (names only) */}
        <div style={S.listCard}>
          <div style={S.listTitle}>All Users</div>

          {loading ? (
            <div style={S.muted}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={S.muted}>No users found</div>
          ) : (
            <div style={S.list}>
              {filtered.map((row) => (
                <div key={row.id} style={S.listItem}>
                  <div style={S.nameOnly}>{row.name}</div>

                  <div style={S.actions}>
                    <IconBtn title="View" onClick={() => openView(row)}>
                      👁
                    </IconBtn>
                    <IconBtn title="Edit" onClick={() => openEdit(row)}>
                      ✏️
                    </IconBtn>
                    <IconBtn title="Delete" danger onClick={() => onDelete(row)}>
                      🗑
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel removed (as you asked) */}
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title={mode === "create" ? "Create User" : mode === "edit" ? "Edit User" : "View User"}
        onClose={() => setOpen(false)}
      >
        <div style={S.formGrid}>
          <Field label="Name">
            <input
              style={S.input}
              value={form.name}
              disabled={mode === "view"}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Email (Login)">
            <input
              style={S.input}
              value={form.email}
              disabled={mode === "view"}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              inputMode="email"
              autoComplete="off"
            />
          </Field>

          <Field label={mode === "create" ? "Password" : "Password (optional reset)"}>
            <input
              style={S.input}
              value={form.password}
              disabled={mode === "view"}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password"
              autoComplete="new-password"
              placeholder={mode === "edit" ? "Leave blank to keep same" : ""}
            />
          </Field>
        </div>

        <div style={S.modalFoot}>
          <button type="button" onClick={() => setOpen(false)} style={S.secondary}>
            Close
          </button>

          {mode !== "view" && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onSave}
              disabled={saving}
              style={S.primary}
            >
              {saving ? "Saving..." : mode === "create" ? "Create & Send Email" : "Save Changes"}
            </motion.button>
          )}
        </div>

        <div style={S.note}>
          Note: Password email me jayega (as you asked). Better security ke liye later “reset password”
          flow add kar denge.
        </div>
      </Modal>
    </div>
  );
}

const S = {
  page: {
    padding: 14,
    maxWidth: 1200,
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
  search: {
    width: 220,
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

  layout: { marginTop: 12, display: "grid", gridTemplateColumns: "1fr", gap: 12 },

  listCard: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid rgba(2,6,23,0.08)",
    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
    padding: 12,
    minHeight: 420,
  },
  listTitle: { fontSize: 13, fontWeight: 900, color: "#0f172a", marginBottom: 10 },
  list: { display: "grid", gap: 10 },

  listItem: {
    width: "100%",
    border: "1px solid rgba(2,6,23,0.10)",
    borderRadius: 14,
    background: "white",
    padding: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  nameOnly: { fontSize: 13, fontWeight: 900, color: "#0f172a", textAlign: "left" },
  actions: { display: "flex", gap: 8, flexShrink: 0 },

  muted: { fontSize: 13, color: "#64748b", fontWeight: 800 },

  // modal
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.45)",
    display: "grid",
    placeItems: "center",
    padding: 14,
    zIndex: 999,
  },
  modalCard: {
    width: "min(720px, 96vw)",
    background: "#fff",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 24px 90px rgba(2,6,23,0.30)",
    overflow: "hidden",
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
  modalBody: { padding: 14 },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, fontWeight: 900, color: "#0f172a" },
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

  modalFoot: { marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" },
  note: { marginTop: 10, fontSize: 12, color: "#64748b", fontWeight: 700 },
};

// responsive
const mq = window.matchMedia?.("(max-width: 980px)");
if (mq?.matches) {
  S.formGrid.gridTemplateColumns = "1fr";
  S.search.width = "min(260px, 92vw)";
}