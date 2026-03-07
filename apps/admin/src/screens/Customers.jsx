import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api";

const pageAnim = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const modalAnim = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22 } },
};

const IconBtn = ({ title, onClick, danger, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    style={{
      ...S.iconBtn,
      ...(danger ? S.iconBtnDanger : {}),
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
        variants={modalAnim}
        initial="hidden"
        animate="show"
        onMouseDown={(e) => e.stopPropagation()}
        style={S.modalCard}
      >
        <div style={S.modalShine} />
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
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  const blank = { name: "", email: "", password: "", sendEmail: true };
  const [form, setForm] = useState(blank);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function load(keepSelectionId) {
    setErr("");
    setLoading(true);
    try {
      const res = await api.customers();
      const rows = res?.data ?? res ?? [];
      const arr = Array.isArray(rows) ? rows : [];
      setList(arr);

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
    return list.filter((x) => {
      const name = (x?.name || "").toLowerCase();
      const email = (x?.email || "").toLowerCase();
      return name.includes(s) || email.includes(s);
    });
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
      sendEmail: false,
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
      sendEmail: false,
    });
    setOpen(true);
  }

  async function onSave() {
    setErr("");

    if (!form.name.trim()) return setErr("Name required");
    if (!form.email.trim()) return setErr("Email required");
    if (mode === "create" && !form.password.trim()) {
      return setErr("Password required");
    }

    try {
      setSaving(true);

      if (mode === "create") {
        await api.createCustomer({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          sendEmail: !!form.sendEmail,
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

        if (form.password.trim()) {
          payload.password = form.password;
          payload.sendEmail = !!form.sendEmail;
        }

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
              <div style={S.h1}>Users</div>
              <div style={S.sub}>Create, view, edit and manage customer login accounts.</div>
            </div>

            <div style={S.topActions}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search user..."
                style={{
                  ...S.search,
                  width: isMobile ? "100%" : 240,
                }}
              />
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={openCreate}
                style={S.primary}
              >
                + Add User
              </motion.button>
            </div>
          </div>
        </div>

        {err ? <div style={S.err}>{err}</div> : null}

        <div style={S.listCard}>
          <div style={S.listHead}>
            <div>
              <div style={S.listTitle}>All Users</div>
              <div style={S.listSub}>
                {loading ? "Loading users..." : `${filtered.length} user(s) found`}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={S.skeletonWrap}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={S.skelRow}>
                  <div style={S.skelTextWrap}>
                    <div style={S.skelLine1} />
                    <div style={S.skelLine2} />
                  </div>
                  <div style={S.skelBtns}>
                    <div style={S.skelBtn} />
                    <div style={S.skelBtn} />
                    <div style={S.skelBtn} />
                    <div style={S.skelBtn} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={S.emptyBox}>
              <div style={S.emptyTitle}>No users found</div>
              <div style={S.emptySub}>
                Try a different search or create a new user.
              </div>
            </div>
          ) : (
            <div style={S.list}>
              {filtered.map((row) => (
                <div
                  key={row.id}
                  style={{
                    ...S.listItem,
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "stretch" : "center",
                  }}
                >
                  <div style={S.userInfo}>
                    <div style={S.userAvatar}>
                      {(row?.name || "U").slice(0, 1).toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={S.nameOnly}>{row.name}</div>
                      <div style={S.userEmail}>{row.email || "No email"}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      ...S.actions,
                      justifyContent: isMobile ? "flex-start" : "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    <IconBtn title="View" onClick={() => openView(row)}>👁</IconBtn>

                    <IconBtn title="Edit" onClick={() => openEdit(row)}>✏️</IconBtn>

                    <IconBtn
                      title="Send Credentials Email"
                      onClick={async () => {
                        try {
                          const newPass = prompt(
                            `Enter NEW password for "${row.name}" (min 4 chars).\n\nNote: Old password retrieve nahi ho sakta.`
                          );
                          if (newPass === null) return;
                          if (
                            !String(newPass).trim() ||
                            String(newPass).trim().length < 4
                          ) {
                            return alert("Password required (min 4 chars)");
                          }

                          await api.sendCustomerCredentials(
                            row.id,
                            String(newPass).trim()
                          );
                          alert("Email sent ✅ (password reset done)");
                        } catch (e) {
                          alert(
                            e?.response?.data?.message ||
                              e.message ||
                              "Failed to send email"
                          );
                        }
                      }}
                    >
                      ✉️
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
      </div>

      <Modal
        open={open}
        title={
          mode === "create"
            ? "Create User"
            : mode === "edit"
            ? "Edit User"
            : "View User"
        }
        onClose={() => setOpen(false)}
      >
        <div
          style={{
            ...S.formGrid,
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          }}
        >
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

          {mode !== "view" && (
            <div style={S.checkboxWrap}>
              <label style={S.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={!!form.sendEmail}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, sendEmail: e.target.checked }))
                  }
                />
                Send credentials email
              </label>

              <div style={S.checkboxHint}>
                Uncheck = user create ho jayega, email nahi jayega.
              </div>
            </div>
          )}
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
              {saving
                ? "Saving..."
                : mode === "create"
                ? form.sendEmail
                  ? "Create & Send Email"
                  : "Create User"
                : "Save Changes"}
            </motion.button>
          )}
        </div>

        <div style={S.note}>
          Note: Password email me jayega. Better security ke liye later reset password
          flow add kar denge.
        </div>
      </Modal>
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
    maxWidth: 1200,
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
    alignItems: "end",
    gap: 14,
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

  topActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  search: {
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid rgba(17,24,39,0.10)",
    fontSize: 13,
    outline: "none",
    fontFamily: "Arial, Helvetica, sans-serif",
    boxSizing: "border-box",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
    color: "#111827",
    boxShadow: "0 8px 18px rgba(17,24,39,0.04)",
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

  listCard: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
    borderRadius: 20,
    border: "1px solid rgba(255,232,190,0.36)",
    boxShadow: "0 14px 30px rgba(17,24,39,0.07)",
    padding: 14,
    minHeight: 420,
  },

  listHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
  },

  listTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
  },

  listSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },

  list: {
    display: "grid",
    gap: 12,
  },

  listItem: {
    width: "100%",
    border: "1px solid rgba(255,232,190,0.34)",
    borderRadius: 18,
    background:
      "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.04), transparent 55%)," +
      "radial-gradient(760px 200px at 95% 0%, rgba(0,102,255,0.04), transparent 60%)," +
      "linear-gradient(180deg,#ffffff,#fffdfb)",
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    boxShadow: "0 10px 20px rgba(17,24,39,0.04)",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
    flex: 1,
  },

  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    background: "linear-gradient(135deg,#a100ff,#ff0066,#ff7a00)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    fontSize: 16,
    flexShrink: 0,
    boxShadow: "0 10px 20px rgba(161,0,255,0.16)",
  },

  nameOnly: {
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
    textAlign: "left",
    wordBreak: "break-word",
  },

  userEmail: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    wordBreak: "break-word",
  },

  actions: {
    display: "flex",
    gap: 8,
    flexShrink: 0,
  },

  iconBtn: {
    height: 36,
    width: 40,
    borderRadius: 12,
    border: "1px solid rgba(17,24,39,0.10)",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    boxShadow: "0 8px 16px rgba(17,24,39,0.04)",
  },

  iconBtnDanger: {
    background: "rgba(239,68,68,0.08)",
    color: "#991b1b",
    border: "1px solid rgba(239,68,68,0.14)",
  },

  skeletonWrap: {
    display: "grid",
    gap: 12,
  },

  skelRow: {
    borderRadius: 18,
    border: "1px solid rgba(255,232,190,0.30)",
    background: "#fff",
    padding: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  skelTextWrap: {
    display: "grid",
    gap: 8,
    flex: 1,
  },

  skelLine1: {
    width: "35%",
    height: 14,
    borderRadius: 10,
    background: "rgba(17,24,39,0.09)",
  },

  skelLine2: {
    width: "48%",
    height: 12,
    borderRadius: 10,
    background: "rgba(17,24,39,0.06)",
  },

  skelBtns: {
    display: "flex",
    gap: 8,
  },

  skelBtn: {
    width: 40,
    height: 36,
    borderRadius: 12,
    background: "rgba(17,24,39,0.07)",
  },

  emptyBox: {
    padding: "26px 14px",
    textAlign: "center",
    borderRadius: 18,
    border: "1px dashed rgba(255,170,0,0.45)",
    background:
      "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.04), transparent 55%)," +
      "linear-gradient(180deg,#ffffff,#fffaf7)",
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
  },

  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    fontWeight: 700,
  },

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
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.94))",
    borderRadius: 22,
    border: "1px solid rgba(255,232,190,0.42)",
    boxShadow: "0 24px 90px rgba(2,6,23,0.30)",
    overflow: "hidden",
  },

  modalShine: {
    height: 4,
    background:
      "linear-gradient(90deg, rgba(161,0,255,0.10), rgba(255,122,0,0.22), rgba(0,102,255,0.10))",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },

  modalHead: {
    padding: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(17,24,39,0.08)",
  },

  modalTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
  },

  modalClose: {
    height: 36,
    width: 36,
    borderRadius: 12,
    border: "1px solid rgba(17,24,39,0.12)",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    color: "#111827",
  },

  modalBody: {
    padding: 16,
  },

  formGrid: {
    display: "grid",
    gap: 12,
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
    width: "100%",
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid rgba(17,24,39,0.10)",
    outline: "none",
    fontSize: 13,
    boxSizing: "border-box",
    fontFamily: "Arial, Helvetica, sans-serif",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
    color: "#111827",
  },

  checkboxWrap: {
    marginTop: 4,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,232,190,0.34)",
    background:
      "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.04), transparent 55%)," +
      "linear-gradient(180deg,#ffffff,#fffaf8)",
  },

  checkboxLabel: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    fontWeight: 900,
    fontSize: 12,
    color: "#111827",
  },

  checkboxHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    lineHeight: 1.6,
  },

  modalFoot: {
    marginTop: 14,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  },

  note: {
    marginTop: 12,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
    lineHeight: 1.7,
  },
};