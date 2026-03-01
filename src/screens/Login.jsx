import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import Loader from "../components/ui/Loader";

const block = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // captcha from server
  const [captchaId, setCaptchaId] = useState("");
  const [captchaQ, setCaptchaQ] = useState("");
  const [captchaAns, setCaptchaAns] = useState("");

  const brand = useMemo(
    () => ({
      title: "STAR Engineering",
      subtitle: "Admin Portal",
    }),
    []
  );

  async function loadCaptcha() {
    setErr("");
    try {
      const data = await api.adminCaptcha();
      setCaptchaId(data?.captchaId || "");
      setCaptchaQ(data?.question || "");
      setCaptchaAns("");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Captcha failed");
      setCaptchaId("");
      setCaptchaQ("");
      setCaptchaAns("");
    }
  }

  useEffect(() => {
    loadCaptcha();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!email.trim()) return setErr("Enter Admin ID");
    if (!password) return setErr("Enter Password");
    if (!captchaAns.trim()) return setErr("Solve the captcha");
    if (!captchaId) return setErr("Captcha missing. Please refresh.");

    setLoading(true);
    try {
      // ✅ NO OTP now
      const data = await api.adminLogin({
        email: email.trim(),
        password,
        captchaId,
        captchaAnswer: captchaAns.trim(),
      });

      const token = data?.token || "";
      if (!token) {
        setErr("Token not received. Please try again.");
        await loadCaptcha();
        return;
      }

      localStorage.setItem("token", token);
      window.location.href = "/";
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2?.message || "Login failed");
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        style={styles.card}
      >
        <div style={styles.header}>
          <div style={styles.logo}>★</div>
          <div>
            <div style={styles.hTitle}>{brand.title}</div>
            <div style={styles.hSub}>{brand.subtitle}</div>
          </div>
        </div>

        <div style={styles.divider} />

        {loading && <Loader />}

        {!loading && (
          <form onSubmit={onSubmit} style={{ width: "100%" }}>
            {/* anti-autofill decoys */}
            <input style={{ display: "none" }} autoComplete="username" />
            <input style={{ display: "none" }} autoComplete="current-password" />

            <label style={styles.label}>Admin ID</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter corporate email"
              style={styles.input}
              inputMode="email"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              onCopy={block}
              onCut={block}
              onPaste={block}
              onContextMenu={block}
            />

            <label style={{ ...styles.label, marginTop: 12 }}>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={styles.input}
              type="password"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              onCopy={block}
              onCut={block}
              onPaste={block}
              onContextMenu={block}
            />

            <div style={styles.captchaWrap}>
              <div style={styles.captchaQ}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Captcha</div>
                <div style={{ fontWeight: 700 }}>{captchaQ || "—"}</div>
              </div>
              <button type="button" onClick={loadCaptcha} style={styles.ghostBtn}>
                Refresh
              </button>
            </div>

            <input
              value={captchaAns}
              onChange={(e) => setCaptchaAns(e.target.value)}
              placeholder="Answer"
              style={styles.input}
              inputMode="numeric"
              autoComplete="off"
              onCopy={block}
              onCut={block}
              onPaste={block}
              onContextMenu={block}
            />

            {err ? <div style={styles.err}>{err}</div> : null}

            <motion.button
              whileTap={{ scale: 0.99 }}
              whileHover={{ y: -1 }}
              type="submit"
              style={styles.primaryBtn}
            >
              Login
            </motion.button>

            <div style={styles.note}>Copy/Paste & Autofill are blocked for security.</div>
          </form>
        )}
      </motion.div>

      <div style={styles.footer}>© {new Date().getFullYear()} STAR Engineering</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 18,
    fontFamily: "Arial, Helvetica, sans-serif",
    background: "#f8fafc",
    position: "relative",
    overflow: "hidden",
  },
  bgGlow: {
    position: "absolute",
    inset: -200,
    background:
      "radial-gradient(700px 380px at 15% 15%, rgba(37,99,235,0.14), transparent 55%)," +
      "radial-gradient(680px 360px at 90% 20%, rgba(16,185,129,0.10), transparent 55%)," +
      "radial-gradient(900px 500px at 70% 90%, rgba(245,158,11,0.10), transparent 60%)",
    filter: "blur(0px)",
  },
  card: {
    width: "min(460px, 92vw)",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(2,6,23,0.08)",
    borderRadius: 18,
    boxShadow: "0 18px 60px rgba(2,6,23,0.10)",
    padding: 18,
    position: "relative",
    backdropFilter: "blur(8px)",
  },
  header: { display: "flex", gap: 12, alignItems: "center" },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "white",
    fontWeight: 900,
  },
  hTitle: { fontSize: 18, fontWeight: 900, color: "#0f172a" },
  hSub: { fontSize: 12, opacity: 0.75, marginTop: 2 },
  divider: { height: 1, background: "rgba(2,6,23,0.08)", margin: "14px 0" },

  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(2,6,23,0.12)",
    outline: "none",
    fontSize: 14,
    background: "white",
  },

  captchaWrap: { marginTop: 12, display: "flex", gap: 10, alignItems: "stretch" },
  captchaQ: {
    flex: 1,
    border: "1px dashed rgba(2,6,23,0.22)",
    borderRadius: 12,
    padding: "10px 12px",
    background: "rgba(248,250,252,0.8)",
  },
  ghostBtn: {
    width: 110,
    borderRadius: 12,
    border: "1px solid rgba(2,6,23,0.12)",
    background: "white",
    fontWeight: 800,
  },

  primaryBtn: {
    width: "100%",
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "white",
    fontWeight: 900,
    fontSize: 14,
  },

  err: {
    marginTop: 10,
    background: "rgba(239,68,68,0.10)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#991b1b",
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
  },
  note: { marginTop: 10, fontSize: 12, opacity: 0.75, textAlign: "center" },
  footer: { position: "absolute", bottom: 14, fontSize: 12, opacity: 0.6 },
};