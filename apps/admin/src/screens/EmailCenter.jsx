import React, { useEffect, useMemo, useRef, useState } from "react";
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
    return dt.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
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

function textToEditorHtml(text = "") {
  return escHtml(text).replace(/\n/g, "<br>");
}

function normalizeEditorHtml(html = "") {
  let out = String(html || "");

  out = out.replace(/<div><br><\/div>/gi, "<br>");
  out = out.replace(/<div>/gi, "<br>");
  out = out.replace(/<\/div>/gi, "");
  out = out.replace(/<p[^>]*>/gi, "<br>");
  out = out.replace(/<\/p>/gi, "");
  out = out.replace(/&nbsp;/gi, " ");

  out = out.replace(/(<br>\s*){3,}/gi, "<br><br>");
  out = out.replace(/^(\s*<br>\s*)+/gi, "");

  return out.trim();
}

function getPlainTextFromHtml(html = "") {
  if (typeof document === "undefined") return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

function insertHtmlAtCursor(html) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const temp = document.createElement("div");
  temp.innerHTML = html;

  const frag = document.createDocumentFragment();
  let node;
  let lastNode = null;

  while ((node = temp.firstChild)) {
    lastNode = frag.appendChild(node);
  }

  range.insertNode(frag);

  if (lastNode) {
    const newRange = document.createRange();
    newRange.setStartAfter(lastNode);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
}

const REPLY_TO = "corporate@stareng.co.in";

export default function EmailCenter() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [err, setErr] = useState("");

  const [selectedLead, setSelectedLead] = useState(null);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("STAR Engineering – Notification");
  const [messageHtml, setMessageHtml] = useState("");
  const [mainPdf, setMainPdf] = useState(null);
  const [extraFiles, setExtraFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [okMsg, setOkMsg] = useState("");

  const editorRef = useRef(null);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 980 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 980);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== messageHtml) {
      editorRef.current.innerHTML = messageHtml || "";
    }
  }, [messageHtml]);

  function focusEditor() {
    editorRef.current?.focus();
  }

  function syncFromEditor() {
    const html = normalizeEditorHtml(editorRef.current?.innerHTML || "");
    setMessageHtml(html);
  }

  function runCmd(command, value = null) {
    focusEditor();
    document.execCommand(command, false, value);
    syncFromEditor();
  }

  function setFontSize(size) {
    focusEditor();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("fontSize", false, size);
    syncFromEditor();
  }

  function clearComposer() {
    setSelectedLead(null);
    setTo("");
    setSubject("STAR Engineering – Notification");
    setMessageHtml("");
    setMainPdf(null);
    setExtraFiles([]);
    setOkMsg("");
    setErr("");

    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
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

    const html = textToEditorHtml(baseMsg);
    setMessageHtml(html);

    if (editorRef.current) {
      editorRef.current.innerHTML = html;
    }
  }

  function onEditorInput() {
    syncFromEditor();
  }

  function onEditorKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      focusEditor();
      insertHtmlAtCursor("<br>");
      syncFromEditor();
    }
  }

  function onEditorPaste(e) {
    e.preventDefault();
    const text = e.clipboardData?.getData("text/plain") || "";
    const safe = escHtml(text).replace(/\r\n/g, "\n").replace(/\n/g, "<br>");
    focusEditor();
    insertHtmlAtCursor(safe);
    syncFromEditor();
  }

  const previewHtml = useMemo(() => {
    const lead = selectedLead;

    const titleLine = lead
      ? escHtml(lead.subject || "Enquiry")
      : "Notification";

    const introLine = lead
      ? `We received your requirement and will assist you shortly.`
      : `Please find the message below.`;

    const bodyHtml = normalizeEditorHtml(messageHtml || "");

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

    return `
<table align="center" width="100%" cellpadding="0" cellspacing="0"
style="
max-width:600px;
margin:30px auto;
border-radius:16px;
overflow:hidden;
font-family:Arial,Helvetica,sans-serif;
background:
radial-gradient(900px 420px at 15% 0%, rgba(255,0,102,0.16), transparent 60%),
radial-gradient(760px 380px at 95% 18%, rgba(0,102,255,0.15), transparent 55%),
radial-gradient(920px 520px at 80% 110%, rgba(255,170,0,0.16), transparent 60%),
radial-gradient(820px 420px at 52% 105%, rgba(163,0,255,0.12), transparent 65%),
linear-gradient(145deg,#fbfcff,#f2f6ff,#ffffff);
box-shadow:
0 24px 60px rgba(17,24,39,0.24),
0 10px 24px rgba(17,24,39,0.12);
">
  <tbody>
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
                <img src="https://www.stareng.co.in/brand/logo.jpg"
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
            ${bodyHtml || "—"}
          </div>

          ${summaryBlock}

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
  }, [messageHtml, selectedLead]);

  function removeExtra(i) {
    setExtraFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function send() {
    setOkMsg("");
    setErr("");

    const plainText = getPlainTextFromHtml(messageHtml);

    if (!to.trim()) return setErr("To email required");
    if (!subject.trim()) return setErr("Subject required");
    if (!plainText.trim()) return setErr("Message required");

    setSending(true);
    try {
      const res = await api.adminSendEmail({
        to: to.trim(),
        subject: subject.trim(),
        html: previewHtml,
        mainPdf,
        extraFiles,
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
    <div style={S.page}>
      <div style={S.bgGlow1} />
      <div style={S.bgGlow2} />
      <div style={S.bgGlow3} />

      <div style={S.wrap}>
        <div style={S.hero}>
          <div style={S.heroShine} />

          <div style={S.heroTop}>
            <div>
              <div style={S.kicker}>STAR ENGINEERING</div>
              <div style={S.h1}>Email Center</div>
              <div style={S.sub}>
                Compose, preview and send premium branded emails with attachments.
              </div>
              <div style={S.replyLine}>
                Reply-To will be set to <b>{REPLY_TO}</b>
              </div>
            </div>

            <div style={S.topBtns}>
              <button style={S.secondary} onClick={loadLeads} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh Leads"}
              </button>
              <button style={S.secondary} onClick={clearComposer} disabled={sending}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {(err || okMsg) && (
          <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
            {err ? <div style={S.err}>{err}</div> : null}
            {okMsg ? <div style={S.ok}>{okMsg}</div> : null}
          </div>
        )}

        <div
          style={{
            ...S.grid,
            gridTemplateColumns: isMobile
              ? "1fr"
              : "minmax(280px, 380px) minmax(0, 1fr)",
          }}
        >
          <div style={S.sideCard}>
            <div style={S.sideHead}>
              <div>
                <div style={S.sideTitle}>Leads</div>
                <div style={S.sideSub}>{loading ? "Loading..." : `${leads.length} lead(s)`}</div>
              </div>
            </div>

            {loading ? (
              <div style={S.emptyBox}>Loading leads...</div>
            ) : leads.length === 0 ? (
              <div style={S.emptyBox}>No leads found</div>
            ) : (
              <div style={S.leadList}>
                {leads.map((l) => {
                  const active = selectedLead?.id === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => composeFromLead(l)}
                      title="Click to compose email"
                      style={{
                        ...S.leadItem,
                        ...(active ? S.leadItemActive : {}),
                      }}
                    >
                      <div style={S.leadTop}>
                        <div style={S.leadName}>{l.name || "Lead"}</div>
                        <div style={S.leadDate}>{fmtDateTime(l.createdAt) || ""}</div>
                      </div>

                      <div style={S.leadMeta}>
                        {l.email || "-"} • {l.city || "-"}
                      </div>

                      <div style={S.leadSubject}>{l.subject || "Enquiry"}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={S.mainCard}>
            <div style={S.mainHead}>
              <div>
                <div style={S.sideTitle}>Compose & Send</div>
                <div style={S.sideSub}>
                  Attach PDFs and send directly to customer.
                </div>
              </div>
            </div>

            <div style={S.formGrid}>
              <label style={S.labelWrap}>
                <div style={S.label}>To</div>
                <input
                  style={S.input}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="customer@email.com"
                />
              </label>

              <label style={S.labelWrap}>
                <div style={S.label}>Subject</div>
                <input
                  style={S.input}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </label>

              <div style={S.labelWrap}>
                <div style={S.label}>Message</div>

                <div style={S.editorWrap}>
                  <div style={S.toolbar}>
                    <button type="button" style={S.toolBtn} onClick={() => runCmd("bold")} title="Bold">
                      <b>B</b>
                    </button>
                    <button type="button" style={S.toolBtn} onClick={() => runCmd("italic")} title="Italic">
                      <i>I</i>
                    </button>
                    <button type="button" style={S.toolBtn} onClick={() => runCmd("underline")} title="Underline">
                      <u>U</u>
                    </button>
                    <button type="button" style={S.toolBtn} onClick={() => setFontSize(2)} title="Small text">
                      A-
                    </button>
                    <button type="button" style={S.toolBtn} onClick={() => setFontSize(3)} title="Normal text">
                      A
                    </button>
                    <button type="button" style={S.toolBtn} onClick={() => setFontSize(5)} title="Large text">
                      A+
                    </button>
                    <button type="button" style={S.toolBtn} onClick={() => runCmd("insertUnorderedList")} title="Bullet list">
                      • List
                    </button>
                    <button type="button" style={S.toolBtn} onClick={() => runCmd("insertOrderedList")} title="Number list">
                      1. List
                    </button>
                    <button type="button" style={S.toolBtn} onClick={() => runCmd("removeFormat")} title="Clear format">
                      Clear
                    </button>
                    <button type="button" style={S.toolBtn} onClick={() => runCmd("undo")} title="Undo">
                      Undo
                    </button>
                    <button type="button" style={S.toolBtn} onClick={() => runCmd("redo")} title="Redo">
                      Redo
                    </button>
                  </div>

                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={onEditorInput}
                    onKeyDown={onEditorKeyDown}
                    onPaste={onEditorPaste}
                    data-placeholder="Type your email here..."
                    style={S.editor}
                  />
                </div>

                <div style={S.editorHint}>
                  Enter = single line break. Paste will keep plain text only.
                </div>
              </div>

              <div style={S.attachGrid}>
                <div style={S.attachCard}>
                  <div style={S.label}>Main PDF (optional)</div>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setMainPdf(e.target.files?.[0] || null)}
                  />
                  {mainPdf ? (
                    <div style={S.fileMeta}>
                      ✅ <b>{mainPdf.name}</b>{" "}
                      <span style={S.fileSize}>({bytes(mainPdf.size)})</span>
                    </div>
                  ) : (
                    <div style={S.fileMuted}>No main PDF selected</div>
                  )}
                </div>

                <div style={S.attachCard}>
                  <div style={S.label}>Extra Files (optional)</div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setExtraFiles(Array.from(e.target.files || []))
                    }
                  />

                  {extraFiles?.length ? (
                    <div style={S.fileTags}>
                      {extraFiles.map((f, i) => (
                        <div key={i} style={S.fileTag}>
                          <b>{f.name}</b>
                          <span style={S.fileSize}>{bytes(f.size)}</span>
                          <button
                            type="button"
                            style={S.removeBtn}
                            onClick={() => removeExtra(i)}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={S.fileMuted}>No extra files selected</div>
                  )}
                </div>
              </div>

              <div style={S.actionBar}>
                <button style={S.primary} onClick={send} disabled={sending}>
                  {sending ? "Sending..." : "Send Email"}
                </button>

                <div style={S.replyInfo}>
                  Customer will reply to: <b>{REPLY_TO}</b>
                </div>
              </div>

              <div style={S.previewWrap}>
                <div style={S.previewHead}>Preview</div>
                <div style={S.previewBox}>
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          display: block;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          margin: 8px 0 8px 20px;
        }

        [contenteditable] b,
        [contenteditable] strong {
          font-weight: 700;
        }

        [contenteditable] i,
        [contenteditable] em {
          font-style: italic;
        }

        [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>
    </div>
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

  replyLine: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },

  topBtns: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },

  grid: {
    display: "grid",
    gap: 14,
    alignItems: "start",
  },

  sideCard: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
    borderRadius: 20,
    border: "1px solid rgba(255,232,190,0.36)",
    boxShadow: "0 14px 30px rgba(17,24,39,0.07)",
    padding: 14,
  },

  mainCard: {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))",
    borderRadius: 20,
    border: "1px solid rgba(255,232,190,0.36)",
    boxShadow: "0 14px 30px rgba(17,24,39,0.07)",
    padding: 14,
  },

  sideHead: {
    marginBottom: 12,
  },

  mainHead: {
    marginBottom: 12,
  },

  sideTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
  },

  sideSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },

  leadList: {
    display: "grid",
    gap: 10,
  },

  leadItem: {
    textAlign: "left",
    border: "1px solid rgba(255,232,190,0.30)",
    background:
      "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.03), transparent 55%), linear-gradient(180deg,#ffffff,#fffdfb)",
    borderRadius: 16,
    padding: 12,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(17,24,39,0.04)",
  },

  leadItemActive: {
    border: "1px solid rgba(161,0,255,0.28)",
    background:
      "radial-gradient(700px 180px at 15% 0%, rgba(161,0,255,0.05), transparent 55%), linear-gradient(180deg,#fffafd,#fff7fb)",
    boxShadow: "0 10px 22px rgba(161,0,255,0.08)",
  },

  leadTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
  },

  leadName: {
    fontWeight: 900,
    color: "#111827",
    fontSize: 14,
  },

  leadDate: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  leadMeta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: 700,
    lineHeight: 1.6,
  },

  leadSubject: {
    fontSize: 12,
    marginTop: 8,
    color: "#111827",
    fontWeight: 800,
  },

  emptyBox: {
    padding: "20px 12px",
    borderRadius: 16,
    border: "1px dashed rgba(255,170,0,0.42)",
    background:
      "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.03), transparent 55%), linear-gradient(180deg,#ffffff,#fffaf8)",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "center",
  },

  formGrid: {
    display: "grid",
    gap: 12,
  },

  labelWrap: {
    display: "grid",
    gap: 6,
  },

  label: {
    fontSize: 12,
    fontWeight: 900,
    color: "#475569",
  },

  input: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid rgba(17,24,39,0.10)",
    fontSize: 13,
    outline: "none",
    fontFamily: "Arial, Helvetica, sans-serif",
    boxSizing: "border-box",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
    color: "#111827",
    boxShadow: "0 8px 18px rgba(17,24,39,0.04)",
  },

  editorWrap: {
    border: "1px solid rgba(17,24,39,0.10)",
    borderRadius: 16,
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
    boxShadow: "0 8px 18px rgba(17,24,39,0.04)",
  },

  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: 10,
    borderBottom: "1px solid rgba(17,24,39,0.08)",
    background:
      "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.04), transparent 55%), linear-gradient(180deg,#fff,#fffafc)",
  },

  toolBtn: {
    height: 34,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(17,24,39,0.10)",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  editor: {
    minHeight: 190,
    padding: 12,
    outline: "none",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#111827",
    whiteSpace: "normal",
    wordBreak: "break-word",
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  editorHint: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
  },

  attachGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  },

  attachCard: {
    border: "1px solid rgba(255,232,190,0.32)",
    borderRadius: 16,
    padding: 12,
    background:
      "radial-gradient(700px 180px at 15% 0%, rgba(255,0,102,0.03), transparent 55%), linear-gradient(180deg,#ffffff,#fffdfb)",
  },

  fileMeta: {
    marginTop: 8,
    fontSize: 12,
    color: "#111827",
    fontWeight: 700,
    lineHeight: 1.6,
  },

  fileMuted: {
    marginTop: 8,
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },

  fileTags: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  fileTag: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    border: "1px solid rgba(255,232,190,0.30)",
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.92)",
    fontSize: 12,
    boxShadow: "0 6px 14px rgba(17,24,39,0.04)",
  },

  fileSize: {
    color: "#64748b",
    fontWeight: 700,
  },

  removeBtn: {
    height: 24,
    padding: "0 8px",
    borderRadius: 999,
    border: "1px solid rgba(17,24,39,0.12)",
    background: "#fff",
    cursor: "pointer",
    fontSize: 12,
    color: "#111827",
  },

  actionBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },

  replyInfo: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },

  previewWrap: {
    borderTop: "1px solid rgba(17,24,39,0.08)",
    paddingTop: 12,
  },

  previewHead: {
    fontSize: 12,
    fontWeight: 1000,
    marginBottom: 8,
    color: "#111827",
  },

  previewBox: {
    border: "1px solid rgba(255,232,190,0.34)",
    borderRadius: 18,
    padding: 10,
    background: "#fff",
    overflow: "auto",
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
    background: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(239,68,68,0.22)",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: 16,
    fontWeight: 900,
    fontSize: 13,
  },

  ok: {
    background: "rgba(34,197,94,0.10)",
    border: "1px solid rgba(34,197,94,0.22)",
    color: "#166534",
    padding: "12px 14px",
    borderRadius: 16,
    fontWeight: 900,
    fontSize: 13,
  },
};