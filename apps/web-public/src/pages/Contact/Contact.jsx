import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Button from "../../components/ui/Button";

const CTA_TEXT = "Send Requirement →";

const MATERIALS = [
  { key: "ALL", label: "All / Not sure" },
  { key: "MS", label: "MS (Mild Steel)" },
  { key: "SS", label: "SS (Stainless Steel)" },
  { key: "GI", label: "GI (Galvanized Iron)" },
  { key: "GP", label: "GP (Pre-Galvanized)" },
  { key: "HR", label: "HR (Hot Rolled)" },
  { key: "CR", label: "CR (Cold Rolled)" },
  { key: "PPGI", label: "PPGI (Color Coated GI)" },
  { key: "PPGL", label: "PPGL (Color Coated Galvalume)" },
  { key: "GL", label: "Galvalume (Al-Zn)" },
];

const WHATSAPP_NUMBER = "917045276723"; // ✅ without +
const DEFAULT_SUBJECT = "STAR ENGINEERING – Requirement Enquiry";

// ✅ API base (dev/prod)
const API = import.meta.env.VITE_API_URL || "https://api.stareng.co.in";

async function sendRequirement(payload) {
  const res = await fetch(`${API}/public/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Failed");
  return data;
}

function cleanPhone(v) {
  return String(v || "")
    .replace(/[^\d+]/g, "")
    .replace(/^00/, "+")
    .trim();
}

function isValidEmail(v) {
  const s = String(v || "").trim();
  if (!s) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function Contact() {
  const loc = useLocation();

  const preSubject = loc?.state?.subject ? String(loc.state.subject) : "";

  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    city: "",
    material: "ALL",
    details: "",
    subject: preSubject || DEFAULT_SUBJECT,
    preferred: "Call",
  });

  const canSend = useMemo(() => {
    const nameOk = String(form.name).trim().length >= 2;
    const phoneOk = cleanPhone(form.phone).replace(/\D/g, "").length >= 10;
    const cityOk = String(form.city).trim().length >= 2;
    const detailsOk = String(form.details).trim().length >= 10;
    const emailOk = isValidEmail(form.email);
    return nameOk && phoneOk && cityOk && detailsOk && emailOk;
  }, [form]);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!canSend) {
      setErr("Please fill required fields properly (Name, Phone, City, Details).");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        company: form.company.trim(),
        phone: cleanPhone(form.phone),
        email: form.email.trim(),
        city: form.city.trim(),
        material: form.material,
        details: form.details.trim(),
        subject: (form.subject || DEFAULT_SUBJECT).trim(),
        preferred: form.preferred,
        page: window.location.href,
      };

      const res = await fetch(`${API_BASE}/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to send enquiry");

      setSent(true);

      const waText =
        `Hello STAR Engineering,%0A%0A` +
        `Requirement Enquiry:%0A` +
        `Name: ${encodeURIComponent(payload.name)}%0A` +
        (payload.company ? `Company: ${encodeURIComponent(payload.company)}%0A` : "") +
        `Phone: ${encodeURIComponent(payload.phone)}%0A` +
        (payload.email ? `Email: ${encodeURIComponent(payload.email)}%0A` : "") +
        `City: ${encodeURIComponent(payload.city)}%0A` +
        `Material: ${encodeURIComponent(payload.material)}%0A` +
        `Details: ${encodeURIComponent(payload.details)}%0A`;

      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch (e2) {
      setErr(e2?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 18, paddingBottom: 40 }}>
      <div className="contactHero">
        <div className="heroBadge" style={{ marginBottom: 10 }}>
          <span className="dot" />
          Sales Enquiry / Requirement
        </div>

        <h1 className="h1">
          Let’s discuss your <span className="gradText">requirement</span>
        </h1>
        <p className="sub">
          Submit your details and requirement. We will respond with availability & specifications.
          <b> After submission, please call Sales for faster processing.</b>
        </p>
      </div>

      {sent ? (
        <div className="contactThanks card">
          <div className="thanksTop">
            <div className="thanksTick">✓</div>
            <div>
              <div className="h2" style={{ marginBottom: 6 }}>
                Thank you! We received your requirement.
              </div>
              <div className="sub">
                For fastest support, please call Sales:{" "}
                <a className="link" href="tel:+917045276723">+91-7045276723</a> (8:30 am to 7:30 pm)
              </div>
            </div>
          </div>

          <div className="thanksActions">
            <a className="btn" href="tel:+917045276723">Call Sales →</a>
            <a className="btnGhost" href="mailto:corporate@stareng.co.in">Email Corporate →</a>
            <a className="btnGhost" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
              WhatsApp →
            </a>
          </div>
        </div>
      ) : (
        <div className="contactGrid">
          <div className="card contactInfo">
            <div className="h2" style={{ marginBottom: 10 }}>STAR ENGINEERING</div>

            <div className="infoRow">
              <div className="infoLabel">Address</div>
              <div className="infoVal">
                Shop No. 5, Chunawala Compound, Opp. BEST Depot / Kanakia Zillion,
                LBS Marg, Kurla (W), Mumbai - 400070, Maharashtra.
              </div>
            </div>

            <div className="infoRow">
              <div className="infoLabel">Phone</div>
              <div className="infoVal">
                <a className="link" href="tel:+917045276723">+91-7045276723</a>
              </div>
            </div>

            <div className="infoRow">
              <div className="infoLabel">Email</div>
              <div className="infoVal">
                <a className="link" href="mailto:corporate@stareng.co.in">corporate@stareng.co.in</a>
              </div>
            </div>

            <div className="infoRow">
              <div className="infoLabel">Working Hours</div>
              <div className="infoVal">8:30 am to 7:30 pm</div>
            </div>

            <div className="infoActions">
              <a className="btn" href="tel:+917045276723">Call Sales →</a>
              <a className="btnGhost" href="https://maps.app.goo.gl/LnhcYdKkpSciJ1wf6" target="_blank" rel="noreferrer">
                Open Maps →
              </a>
              <a className="btnGhost" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
                WhatsApp →
              </a>
            </div>

            <div className="mapWrap">
              <iframe
                title="STAR Engineering Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3078.4641880413465!2d72.87410010968183!3d19.074709051940676!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c9006064e9b5%3A0x18fa5097ab4a837e!2sStar%20Engineering!5e1!3m2!1sen!2sin!4v1772242311463!5m2!1sen!2sin"
                loading="lazy"
                style={{ border: 0, width: "100%", height: 260, borderRadius: 18 }}
                allowFullScreen
              />
            </div>
          </div>

          <div className="card contactFormCard">
            <div className="h2" style={{ marginBottom: 6 }}>Send Requirement</div>
            <div className="sub" style={{ marginBottom: 14 }}>
              Fill details and we’ll get back. For urgent support, call Sales.
            </div>

            {err ? <div className="contactErr">{err}</div> : null}

            <form onSubmit={onSubmit} className="contactForm">
              <div className="row2">
                <div>
                  <div className="label">Full Name *</div>
                  <input className="input" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <div className="label">Company</div>
                  <input className="input" value={form.company} onChange={(e) => setField("company", e.target.value)} placeholder="Company name (optional)" />
                </div>
              </div>

              <div className="row2">
                <div>
                  <div className="label">Phone *</div>
                  <input className="input" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+91 9XXXXXXXXX" />
                </div>
                <div>
                  <div className="label">Email</div>
                  <input className="input" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="you@company.com (optional)" />
                </div>
              </div>

              <div className="row2">
                <div>
                  <div className="label">City / Location *</div>
                  <input className="input" value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="Mumbai / Navi Mumbai / Thane..." />
                </div>
                <div>
                  <div className="label">Material Type</div>
                  <select className="input" value={form.material} onChange={(e) => setField("material", e.target.value)}>
                    {MATERIALS.map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row2">
                <div>
                  <div className="label">Preferred Contact</div>
                  <select className="input" value={form.preferred} onChange={(e) => setField("preferred", e.target.value)}>
                    <option value="Call">Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
                <div>
                  <div className="label">Subject</div>
                  <input className="input" value={form.subject} onChange={(e) => setField("subject", e.target.value)} placeholder={DEFAULT_SUBJECT} />
                </div>
              </div>

              <div>
                <div className="label">Requirement Details *</div>
                <textarea
                  className="input"
                  rows={5}
                  value={form.details}
                  onChange={(e) => setField("details", e.target.value)}
                  placeholder="Example: ISMC 200, 12m length, qty 2 ton, delivery Kurla..."
                />
                <div className="hint">Tip: Mention size, thickness/grade, length, qty, delivery location.</div>
              </div>

              <div className="formActions">
                <Button className="btnAnim" disabled={loading} type="submit">
                  {loading ? "Sending..." : CTA_TEXT}
                </Button>

                <button type="button" className="btnGhost" onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, "_blank")}>
                  WhatsApp Now →
                </button>

                <a className="btnGhost" href="tel:+917045276723">Call Sales →</a>
              </div>

              {!canSend ? (
                <div className="hint" style={{ marginTop: 10 }}>
                  Required: Name, Phone, City, Details (min 10 chars). Email optional.
                </div>
              ) : null}
            </form>
          </div>
        </div>
      )}

      <style>{`
        .contactHero{ margin-top: 8px; margin-bottom: 14px; }
        .contactGrid{ display:grid; grid-template-columns: 1.05fr .95fr; gap: 14px; align-items: start; }
        @media (max-width: 980px){ .contactGrid{ grid-template-columns: 1fr; } }

        .card{ border-radius: 22px; border: 1px solid rgba(15,23,42,.10); background: rgba(255,255,255,.78); box-shadow: 0 10px 30px rgba(2,6,23,.06); }

        .contactInfo{ padding: 16px; }
        .infoRow{ display:grid; gap:4px; padding: 10px 0; border-bottom: 1px solid rgba(15,23,42,.06); }
        .infoLabel{ font-size: 12px; color:#64748b; font-weight: 800; }
        .infoVal{ color:#0f172a; line-height: 1.6; font-size: 13.5px; font-weight: 600; }
        .link{ color: #2b67f6; font-weight: 600; text-decoration: none; }
        .link:hover{ text-decoration: underline; }

        .infoActions{ display:flex; gap:10px; flex-wrap:wrap; margin-top: 12px; }
        .mapWrap{ margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(15,23,42,.06); }

        .contactFormCard{ padding: 16px; }
        .contactErr{ border: 1px solid rgba(239,68,68,.25); background: rgba(239,68,68,.06); color: #b91c1c; border-radius: 16px; padding: 10px 12px; font-weight: 800; margin-bottom: 12px; }

        .contactForm{ display:grid; gap: 12px; }
        .row2{ display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px){ .row2{ grid-template-columns: 1fr; } }

        .label{ font-size: 12px; color:#64748b; font-weight: 900; margin-bottom: 6px; }
        .input{ width: 100%; border-radius: 14px; border: 1px solid rgba(15,23,42,.10); background: rgba(255,255,255,.88); padding: 10px 12px; outline: none; font-family: Arial, Helvetica, sans-serif; color:#0f172a; }
        .input:focus{ border-color: rgba(124,58,237,.35); box-shadow: 0 12px 30px rgba(124,58,237,.10); }

        .hint{ color:#64748b; font-size: 12px; margin-top: 6px; line-height: 1.55; }

        .formActions{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top: 6px; }

        .btnGhost{
          height: 44px; padding: 0 14px; border-radius: 14px;
          border: 1px solid rgba(15,23,42,.12); background: rgba(255,255,255,.88);
          font-weight: 600; font-family: Arial, Helvetica, sans-serif;
          display:inline-flex; align-items:center; justify-content:center; line-height: 1;
          transition: transform .12s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
          cursor:pointer; text-decoration:none; color:#0f172a;
        }
        .btnGhost:hover{ border-color: rgba(124,58,237,.25); box-shadow: 0 10px 24px rgba(124,58,237,.12); transform: translateY(-1px); }
        .btnGhost:active{ transform: translateY(0) scale(.99); }

        .contactThanks{ padding: 16px; }
        .thanksTop{ display:flex; gap:12px; align-items:flex-start; }
        .thanksTick{
          width: 42px; height: 42px; border-radius: 16px;
          background: rgba(16,185,129,.14); color: rgb(16,185,129);
          display:flex; align-items:center; justify-content:center;
          font-weight: 900; font-size: 18px; border: 1px solid rgba(16,185,129,.25);
          flex: 0 0 auto;
        }
        .thanksActions{ display:flex; gap:10px; flex-wrap:wrap; margin-top: 14px; }
      `}</style>
    </div>
  );
}