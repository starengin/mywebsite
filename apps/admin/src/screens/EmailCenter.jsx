// EmailCenter.jsx (FULL REPLACE) — normal email + premium theme (Arial, logo, colours)
// ✅ Keeps your existing fields + attachments logic
// ✅ Only changes the EMAIL HTML preview template to match your Payment Advice theme
// ✅ Removes “Regarding…” vibe; makes subject/body feel like normal professional email

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

// ---------- helpers ----------
function escHtml(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fmtDateTime(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function bytes(n) {
  const v = Number(n || 0);
  if (!v) return "";
  const kb = v / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

const REPLY_TO = "corporate@stareng.co.in";

// ✅ same logo as your template example
const LOGO_URL =
  "https://docs5.odoo.com/documents/content/Qwj8oh-9TxiwpBBdUzte_gof4?download=0";

export default function EmailCenter() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [err, setErr] = useState("");

  // selection
  const [selectedLead, setSelectedLead] = useState(null);

  // compose
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("STAR Engineering – Notification");
  const [message, setMessage] = useState("");
  const [mainPdf, setMainPdf] = useState(null);
  const [extraFiles, setExtraFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  async function loadLeads() {
    try {
      setErr("");
      setOkMsg("");
      setLoading(true);
      const items = await api.adminLeads();
      setLeads(Array.isArray(items) ? items : []);
    } catch (e) {
      setErr(e?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  function clearComposer() {
    setSelectedLead(null);
    setTo("");
    setSubject("STAR Engineering – Notification");
    setMessage("");
    setMainPdf(null);
    setExtraFiles([]);
    setOkMsg("");
    setErr("");
  }

  function composeFromLead(l) {
    setOkMsg("");
    setErr("");
    setSelectedLead(l || null);

    const leadName = l?.name || "Customer";
    const leadEmail = l?.email || "";
    const leadSubject = (l?.subject || "Enquiry").trim();

    setTo(leadEmail);
    setSubject(`STAR Engineering – ${leadSubject}`);

    // ✅ normal professional email copy (no “regarding”)
    const baseMsg = [
      `Dear ${leadName},`,
      ``,
      `Thank you for reaching out to STAR Engineering.`,
      `We have received your requirement and our team will assist you shortly.`,
      ``,
      `Please find the relevant quotation / attachment with this email.`,
      ``,
      `If you have any questions, simply reply to this email or contact us at ${REPLY_TO}.`,
      ``,
      `Warm Regards,`,
      `STAR Engineering`,
      `${REPLY_TO}`,
      `www.stareng.co.in`,
    ].join("\n");

    setMessage(baseMsg);
  }

  const previewHtml = useMemo(() => {
    const lead = selectedLead;

    const titleLine = lead
      ? escHtml(lead.subject || "Enquiry")
      : "Notification";

    const introLine = lead
      ? `We received your requirement and will assist you shortly.`
      : `Please find the message below.`;

    const bodyText = escHtml(message || "").replace(/\n/g, "<br/>");

    const summaryBlock = lead
      ? `
      <div style="
        margin-top:18px;
        border-radius:12px;
        overflow:hidden;
        border:1px solid rgba(17,24,39,0.10);
        box-shadow:0 10px 18px rgba(17,24,39,0.08);
        background:#ffffff;
      ">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
          <tbody>
            <tr style="background:linear-gradient(90deg,#ffeeee,#ffffff);">
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;"><b>Name</b></td>
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;">${escHtml(lead.name || "-")}</td>
            </tr>
            <tr style="background:linear-gradient(90deg,#ffffff,#fbfbfb);">
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;"><b>Email</b></td>
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;">${escHtml(lead.email || "-")}</td>
            </tr>
            <tr style="background:linear-gradient(90deg,#ffeeee,#ffffff);">
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;"><b>Phone</b></td>
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;">${escHtml(lead.phone || "-")}</td>
            </tr>
            <tr style="background:linear-gradient(90deg,#ffffff,#fbfbfb);">
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;"><b>City</b></td>
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;">${escHtml(lead.city || "-")}</td>
            </tr>
            <tr style="background:linear-gradient(90deg,#ffeeee,#ffffff);">
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;"><b>Material</b></td>
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;">${escHtml(lead.material || "ALL")}</td>
            </tr>
            <tr style="background:linear-gradient(90deg,#ffffff,#fbfbfb);">
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;"><b>Details</b></td>
              <td style="padding:12px 14px;border-bottom:1px solid #eeeeee;line-height:1.7;">
                ${escHtml(lead.details || "-").replace(/\n/g, "<br/>")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      `
      : "";

    // ✅ Premium theme based on your Payment Advice template, but with generic subject/body
    return `
<table align="center" width="100%" cellpadding="0" cellspacing="0"
style="
max-width:600px;
margin:30px auto;
border-radius:16px;
overflow:hidden;
font-family:Arial,Helvetica,sans-serif;

/* 🌈 BODY: ROYAL COLORFUL LUXURY MULTI-LAYER BACKGROUND */
background:
radial-gradient(900px 420px at 15% 0%, rgba(255,0,102,0.16), transparent 60%),
radial-gradient(760px 380px at 95% 18%, rgba(0,102,255,0.15), transparent 55%),
radial-gradient(920px 520px at 80% 110%, rgba(255,170,0,0.16), transparent 60%),
radial-gradient(820px 420px at 52% 105%, rgba(163,0,255,0.12), transparent 65%),
linear-gradient(145deg,#fbfcff,#f2f6ff,#ffffff);

/* PREMIUM SHADOW */
box-shadow:
0 24px 60px rgba(17,24,39,0.24),
0 10px 24px rgba(17,24,39,0.12);
">
  <tbody>

    <!-- HEADER -->
    <tr>
      <td style="
        background:
          radial-gradient(900px 260px at 18% 0%, rgba(255,220,160,0.18), transparent 55%),
          linear-gradient(135deg,#3b0000,#6a0000,#9a0000,#a100ff,#ff0066,#ff7a00);
        padding:22px 24px;
        color:#ffffff;
        position:relative;
        box-shadow:
          inset 0 -10px 20px rgba(0,0,0,0.30),
          0 10px 22px rgba(0,0,0,0.18);
      ">

        <!-- premium shine strip -->
        <div style="
          height:4px;
          background:linear-gradient(90deg,
            rgba(255,255,255,0.06),
            rgba(255,232,190,0.58),
            rgba(255,255,255,0.10)
          );
          border-radius:999px;
          margin-bottom:14px;
          box-shadow:0 2px 10px rgba(0,0,0,0.25);
        "></div>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tbody>
            <tr>
              <td width="100" valign="middle">
                <img src="${LOGO_URL}"
                     alt="STAR ENGINEERING"
                     style="
                       max-width:80px;
                       display:block;
                       border-radius:10px;
                       box-shadow:0 14px 26px rgba(0,0,0,0.35);
                       border:1px solid rgba(255,232,190,0.45);
                     ">
              </td>
              <td valign="middle" style="padding-left:12px;">
                <h1 style="
                  margin:0;
                  font-size:20px;
                  letter-spacing:1px;
                  color:#ffffff;
                  font-weight:bold;
                  text-shadow:0 4px 14px rgba(0,0,0,0.50);
                ">
                  STAR ENGINEERING
                </h1>
                <p style="
                  margin:6px 0 0 0;
                  font-size:14px;
                  color:#fff1f7;
                  font-weight:bold;
                  text-shadow:0 3px 12px rgba(0,0,0,0.45);
                ">
                  ${titleLine}
                </p>

                <p style="
                  margin:10px 0 0 0;
                  font-size:12px;
                  color:rgba(255,255,255,0.92);
                  line-height:1.6;
                  text-shadow:0 3px 12px rgba(0,0,0,0.35);
                ">
                  ${escHtml(introLine)}<br/>
                  Reply-To: <b>${escHtml(REPLY_TO)}</b>
                </p>
              </td>
            </tr>
          </tbody>
        </table>

      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:0;">
        <div style="
          padding:22px 20px 18px 20px;
          color:#111827;
          background:
            radial-gradient(900px 260px at 12% 0%, rgba(255,170,0,0.12), transparent 60%),
            radial-gradient(820px 240px at 88% 0%, rgba(163,0,255,0.10), transparent 60%),
            linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.82));
          border-top:1px solid rgba(255,232,190,0.35);
          font-family:Arial,Helvetica,sans-serif;
        ">

          <div style="font-size:14px;line-height:1.85;color:#1f2937;">
            ${bodyText || "—"}
          </div>

          ${summaryBlock}

<br>

          <!-- SUPPORT BOX -->
          <div style="
            margin-top:18px;
            padding:16px;
            border-radius:12px;
            background:
              radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.12), transparent 55%),
              radial-gradient(760px 200px at 95% 0%, rgba(0,102,255,0.10), transparent 60%),
              linear-gradient(180deg,#ffffff,#fff7fb);
            border:1px dashed rgba(255,170,0,0.70);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.78);
            font-family:Arial,Helvetica,sans-serif;
          ">
            <p style="font-size:14px;line-height:1.65;margin:0;color:#1f2937;">
              For any clarification, please reply to this email or contact us at
              <a href="mailto:starengineering13@gmail.com"
                 style="color:#a100ff;text-decoration:none;font-weight:bold;"
                 target="_blank">
                starengineering13@gmail.com
              </a>
            </p>

            <p style="font-size:14px;margin:16px 0 0 0;color:#1f2937;line-height:1.7;">
              Warm Regards,<br/>
              <b>STAR ENGINEERING</b><br/>
              📧 <a target="_blank" href="mailto:${escHtml(REPLY_TO)}" style="color:#a100ff;text-decoration:none;">
                ${escHtml(REPLY_TO)}
              </a><br/>
              🌐 <a href="https://www.stareng.co.in" style="color:#a100ff;text-decoration:none;" target="_blank">
                www.stareng.co.in
              </a>
            </p>
          </div>

        </div>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="
        background:
          radial-gradient(900px 220px at 20% 0%, rgba(255,0,102,0.10), transparent 60%),
          radial-gradient(900px 220px at 80% 0%, rgba(0,102,255,0.10), transparent 60%),
          linear-gradient(180deg,#f4f4f6,#efeff2);
        padding:16px;
        text-align:center;
        font-size:12px;
        color:#6b7280;
        border-top:1px solid rgba(17,24,39,0.08);
        font-family:Arial,Helvetica,sans-serif;
      ">
        <div style="font-weight:bold; color:#111827; margin-bottom:6px;">
          This is a system-generated email. Please reply only to the Reply-To address mentioned above.
        </div>

        <div style="
          height:2px;
          width:160px;
          margin:10px auto 10px auto;
          border-radius:999px;
          background:linear-gradient(90deg, rgba(161,0,255,0.25), rgba(255,122,0,0.35), rgba(0,102,255,0.25));
        "></div>

        <div style="line-height:1.7;">
          📧
          <a target="_blank" href="mailto:${escHtml(REPLY_TO)}"
             style="color:#a100ff;text-decoration:none;font-weight:bold;">
            ${escHtml(REPLY_TO)}
          </a><br/>

          📞
          <a href="tel:+919702485922"
             style="color:#111827;text-decoration:none;font-weight:bold;">
            Call Now: +91-9702485922
          </a><br/>

          💬
          <a target="_blank" href="https://wa.me/917045276723"
             style="color:#111827;text-decoration:none;font-weight:bold;">
            WhatsApp: +91-7045276723
          </a>
        </div>

        <div style="
          height:2px;
          width:160px;
          margin:10px auto 10px auto;
          border-radius:999px;
          background:linear-gradient(90deg, rgba(161,0,255,0.25), rgba(255,122,0,0.35), rgba(0,102,255,0.25));
        "></div>

        <div style="margin-top:6px; line-height:1.7;">
          Terms &amp; Conditions:
          <a href="https://www.stareng.co.in/terms" style="color:#6b7280; text-decoration:none;" target="_blank">
            www.stareng.co.in/terms
          </a>
        </div>
      </td>
    </tr>

  </tbody>
</table>
    `;
  }, [message, selectedLead]);

  function removeExtra(i) {
    setExtraFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function send() {
    setOkMsg("");
    setErr("");

    if (!to.trim()) return setErr("To email required");
    if (!subject.trim()) return setErr("Subject required");
    if (!message.trim()) return setErr("Message required");

    setSending(true);
    try {
      const res = await api.adminSendEmail({
        to: to.trim(),
        subject: subject.trim(),
        html: previewHtml,
        mainPdf,
        extraFiles,
        // NOTE: reply-to backend me set hoga (Resend)
      });

      setOkMsg(`✅ Email sent successfully. Attachments: ${res?.attached || 0}`);
      setMainPdf(null);
      setExtraFiles([]);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Email failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 1000, fontSize: 18 }}>Email Center</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Reply-To will be set to <b>{REPLY_TO}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={loadLeads} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Leads"}
          </button>
          <button className="btn btn-ghost" onClick={clearComposer} disabled={sending}>
            Clear
          </button>
        </div>
      </div>

      <div
        className="emailCenterGrid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 380px) 1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 1000 }}>Leads</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{leads.length}</div>
          </div>

          {loading ? (
            <div style={{ padding: 10, color: "#64748b" }}>Loading...</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: 10, color: "#64748b" }}>No leads</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {leads.map((l) => {
                const active = selectedLead?.id === l.id;
                return (
                  <button
                    key={l.id}
                    className="sideLink"
                    style={{
                      textAlign: "left",
                      border: active ? "1px solid rgba(124,58,237,0.45)" : "1px solid var(--line)",
                      background: active ? "rgba(124,58,237,0.06)" : "transparent",
                      borderRadius: 14,
                      padding: 10,
                    }}
                    onClick={() => composeFromLead(l)}
                    title="Click to compose email"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 1000 }}>{l.name || "Lead"}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{fmtDateTime(l.createdAt) || ""}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                      {l.email || "-"} • {l.city || "-"}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 6, color: "#0f172a" }}>
                      {l.subject || "Enquiry"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {err ? <div style={{ marginTop: 10, color: "#b91c1c", fontWeight: 900 }}>{err}</div> : null}
          {okMsg ? <div style={{ marginTop: 10, color: "#166534", fontWeight: 1000 }}>{okMsg}</div> : null}
        </div>

        {/* RIGHT */}
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 1000 }}>Compose & Send</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Attach PDFs and send directly to customer.
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <label>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>To</div>
              <input className="input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="customer@email.com" />
            </label>

            <label>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>Subject</div>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>

            <label>
              <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>Message</div>
              <textarea className="input" rows={8} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>Main PDF (optional)</div>
                <input type="file" accept="application/pdf" onChange={(e) => setMainPdf(e.target.files?.[0] || null)} />
                {mainPdf ? (
                  <div style={{ fontSize: 12, color: "#0f172a" }}>
                    ✅ <b>{mainPdf.name}</b> <span style={{ color: "var(--muted)" }}>({bytes(mainPdf.size)})</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>No main PDF selected</div>
                )}
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: "var(--muted)" }}>Extra Files (optional)</div>
                <input type="file" multiple onChange={(e) => setExtraFiles(Array.from(e.target.files || []))} />

                {extraFiles?.length ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {extraFiles.map((f, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          border: "1px solid var(--line)",
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: "rgba(2,6,23,0.02)",
                          fontSize: 12,
                        }}
                      >
                        <b>{f.name}</b>
                        <span style={{ color: "var(--muted)" }}>{bytes(f.size)}</span>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ height: 24, padding: "0 8px" }}
                          onClick={() => removeExtra(i)}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>No extra files selected</div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button className="btn" onClick={send} disabled={sending}>
                {sending ? "Sending..." : "Send Email"}
              </button>

              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Customer will reply to: <b>{REPLY_TO}</b>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 1000, marginBottom: 8 }}>Preview</div>
              <div
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 16,
                  padding: 10,
                  background: "#fff",
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* responsive tweak */}
      <style>{`
        @media (max-width: 980px){
          .emailCenterGrid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}