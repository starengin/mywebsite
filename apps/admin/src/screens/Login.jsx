import { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { setToken, markLoginNow } from "../lib/auth.js";
import { motion } from "framer-motion";

const PUBLIC_HOME =
  import.meta.env.VITE_PUBLIC_HOME_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5173"
    : "https://www.stareng.co.in");

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [captchaId, setCaptchaId] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadCaptcha() {
    try {
      setErr("");
      const data = await api.adminCaptcha();
      setCaptchaId(data?.captchaId || "");
      setCaptchaQuestion(data?.question || "");
      setCaptchaInput("");
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Captcha failed");
      setCaptchaId("");
      setCaptchaQuestion("");
      setCaptchaInput("");
    }
  }

  useEffect(() => {
    loadCaptcha();
  }, []);

  function validateEmail(value) {
    return /\S+@\S+\.\S+/.test(value);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!email.trim()) return setErr("Admin ID is required");
    if (!validateEmail(email.trim())) {
      return setErr("Please enter a valid email address");
    }
    if (!password) return setErr("Password is required");
    if (!captchaInput.trim()) return setErr("Captcha is required");
    if (!captchaId) return setErr("Captcha missing. Please refresh.");

    setLoading(true);

    try {
      const res = await api.adminLogin({
        email: email.trim(),
        password,
        captchaId,
        captchaAnswer: captchaInput.trim(),
      });

      const token = res?.token || null;

      if (!token) {
        await loadCaptcha();
        throw new Error("Login successful but token not received");
      }

      setToken(token);
      markLoginNow();
      window.location.replace("/");
    } catch (e2) {
      setErr(
        e2?.response?.data?.message ||
          e2?.message ||
          "Invalid admin ID or password"
      );
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGlow3} />
      <div style={styles.bgGlow4} />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={styles.card}
      >
        <div style={styles.shineBar} />

        <div style={styles.header}>
          <div style={styles.headerRow}>
            <img
              src="https://www.stareng.co.in/brand/logo.jpg"
              alt="STAR ENGINEERING"
              style={styles.logo}
            />
            <div>
              <div style={styles.title}>STAR ENGINEERING</div>
              <div style={styles.subtitle}>Admin Portal Login</div>
            </div>
          </div>
        </div>

        <div style={styles.body}>
          <div style={{ marginBottom: 18 }}>
            <div style={styles.headline}>
              Login with your admin email and password
            </div>
            <div style={styles.desc}>
              Secure admin access for customers, transactions, ledger, PDFs and
              email operations.
            </div>
          </div>

          {err ? <div style={styles.err}>{err}</div> : null}

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={styles.label}>Admin ID</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="corporate@stareng.co.in"
                autoComplete="username"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                style={inputStyle}
              />
            </div>

            <div>
              <div style={styles.captchaHead}>
                <label style={styles.labelInline}>
                  Solve: {captchaQuestion || "Loading..."}
                </label>

                <button
                  type="button"
                  onClick={loadCaptcha}
                  style={styles.refreshBtn}
                >
                  Refresh
                </button>
              </div>

              <input
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter answer"
                inputMode="numeric"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.loginBtn,
                opacity: loading ? 0.82 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div style={styles.bottomBtns}>
            <a href={PUBLIC_HOME} style={ghostBtnStyle}>
              Back to Website
            </a>
          </div>

          <div style={styles.footerText}>
            Secure login • Fast loading • Mobile friendly
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px 16px",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    fontFamily: "Arial, Helvetica, sans-serif",
    background:
      "radial-gradient(900px 420px at 15% 0%, rgba(255,0,102,0.16), transparent 60%)," +
      "radial-gradient(760px 380px at 95% 18%, rgba(0,102,255,0.15), transparent 55%)," +
      "radial-gradient(920px 520px at 80% 110%, rgba(255,170,0,0.16), transparent 60%)," +
      "radial-gradient(820px 420px at 52% 105%, rgba(163,0,255,0.12), transparent 65%)," +
      "linear-gradient(145deg,#fbfcff,#f2f6ff,#ffffff)",
  },

  bgGlow1: {
    position: "absolute",
    width: 320,
    height: 320,
    top: -90,
    left: -70,
    borderRadius: "50%",
    background: "rgba(255,0,102,0.10)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  bgGlow2: {
    position: "absolute",
    width: 280,
    height: 280,
    top: 50,
    right: -80,
    borderRadius: "50%",
    background: "rgba(0,102,255,0.10)",
    filter: "blur(75px)",
    pointerEvents: "none",
  },

  bgGlow3: {
    position: "absolute",
    width: 320,
    height: 320,
    bottom: -110,
    left: "8%",
    borderRadius: "50%",
    background: "rgba(255,170,0,0.12)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

  bgGlow4: {
    position: "absolute",
    width: 320,
    height: 320,
    bottom: -120,
    right: "10%",
    borderRadius: "50%",
    background: "rgba(163,0,255,0.10)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

  card: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 28,
    overflow: "hidden",
    border: "1px solid rgba(255,232,190,0.50)",
    background: "rgba(255,255,255,0.80)",
    backdropFilter: "blur(14px)",
    boxShadow:
      "0 24px 60px rgba(17,24,39,0.14), 0 10px 24px rgba(17,24,39,0.08)",
    position: "relative",
    zIndex: 2,
  },

  shineBar: {
    height: 4,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,232,190,0.58), rgba(255,255,255,0.10))",
    boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
  },

  header: {
    padding: "26px 24px 20px",
    background:
      "radial-gradient(900px 260px at 18% 0%, rgba(255,220,160,0.18), transparent 55%), linear-gradient(135deg,#3b0000,#6a0000,#9a0000,#a100ff,#ff0066,#ff7a00)",
    color: "#fff",
  },

  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  logo: {
    width: 58,
    height: 58,
    objectFit: "cover",
    borderRadius: 14,
    background: "#fff",
    boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
    flex: "0 0 auto",
    border: "1px solid rgba(255,232,190,0.45)",
  },

  title: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: 0.2,
    lineHeight: 1.1,
    color: "#ffffff",
    textShadow: "0 4px 14px rgba(0,0,0,0.35)",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
    fontWeight: 700,
  },

  body: {
    padding: 24,
    background:
      "radial-gradient(900px 260px at 12% 0%, rgba(255,170,0,0.08), transparent 60%), radial-gradient(820px 240px at 88% 0%, rgba(163,0,255,0.06), transparent 60%), linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.84))",
  },

  headline: {
    fontSize: 15,
    color: "#111827",
    fontWeight: 700,
    marginBottom: 6,
  },

  desc: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 1.6,
  },

  err: {
    marginBottom: 14,
    borderRadius: 16,
    border: "1px solid rgba(239,68,68,0.22)",
    background: "rgba(254,242,242,0.92)",
    color: "#b91c1c",
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 700,
  },

  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 800,
  },

  captchaHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 10,
    flexWrap: "wrap",
  },

  labelInline: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 800,
  },

  refreshBtn: {
    border: "1px solid rgba(255,232,190,0.45)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))",
    height: 32,
    padding: "0 10px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    color: "#7a0000",
    boxShadow: "0 8px 18px rgba(17,24,39,0.08)",
  },

  loginBtn: {
    height: 46,
    border: "1px solid rgba(255,232,190,0.45)",
    borderRadius: 16,
    fontWeight: 800,
    fontSize: 14,
    color: "#fff",
    background: "linear-gradient(135deg,#3b0000,#a100ff,#ff0066,#ff7a00)",
    boxShadow:
      "0 16px 30px rgba(17,24,39,0.18), inset 0 1px 0 rgba(255,255,255,0.20)",
  },

  bottomBtns: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  footerText: {
    marginTop: 18,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 1.6,
  },
};

const inputStyle = {
  width: "100%",
  height: 46,
  borderRadius: 14,
  border: "1px solid rgba(17,24,39,0.10)",
  background: "rgba(255,255,255,0.94)",
  padding: "0 14px",
  outline: "none",
  color: "#111827",
  fontSize: 14,
  fontFamily: "Arial, Helvetica, sans-serif",
  boxSizing: "border-box",
};

const ghostBtnStyle = {
  height: 44,
  padding: "0 14px",
  borderRadius: 14,
  border: "1px solid rgba(17,24,39,0.12)",
  background: "rgba(255,255,255,0.90)",
  color: "#111827",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 14,
  boxSizing: "border-box",
};