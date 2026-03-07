import { useState, useEffect } from "react";
import { api } from "../../lib/api.js";
import { saveAuth, isAuthed } from "../../lib/auth.js";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`${a} + ${b}`);
    setCaptchaAnswer(a + b);
  };

  useEffect(() => {
    generateCaptcha();

    if (isAuthed()) {
      navigate("/app", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!email) return setErr("Email is required");
    if (!validateEmail(email)) return setErr("Please enter a valid email address");
    if (!password) return setErr("Password is required");
    if (!captchaInput) return setErr("Captcha is required");

    if (Number(captchaInput) !== captchaAnswer) {
      generateCaptcha();
      setCaptchaInput("");
      return setErr("Captcha is incorrect");
    }

    setLoading(true);

    try {
      const res = await api.login({
        email: email.trim(),
        password,
      });

      const token =
        res?.token ||
        res?.accessToken ||
        res?.data?.token ||
        res?.data?.accessToken ||
        null;

      const user = res?.user || res?.data?.user || null;

      if (!token) {
        generateCaptcha();
        setCaptchaInput("");
        throw new Error("Login successful but token not received");
      }

      saveAuth({ token, user });
      navigate("/app", { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Invalid email or password");
      generateCaptcha();
      setCaptchaInput("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGlow3} />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        style={styles.card}
      >
        <div style={styles.topStrip} />

        <div style={styles.hero}>
          <div style={styles.heroRow}>
            <div style={styles.logoWrap}>
              <img
                src="https://www.stareng.co.in/brand/logo.jpg"
                alt="STAR ENGINEERING"
                style={styles.logo}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={styles.brandTitle}>STAR ENGINEERING</div>
              <div style={styles.brandSub}>Customer Portal Login</div>
            </div>
          </div>
        </div>

        <div style={styles.body}>
          <div style={styles.headBlock}>
            <div style={styles.headline}>Welcome Back</div>
            <div style={styles.desc}>
              Login securely to view ledger, transactions, balances and portal updates.
            </div>
          </div>

          {err ? <div style={styles.err}>{err}</div> : null}

          <form onSubmit={onSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                autoComplete="email"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>

            <div style={styles.field}>
              <div style={styles.captchaHead}>
                <label style={styles.label}>Solve: {captchaQuestion}</label>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  style={styles.refreshBtn}
                >
                  Refresh
                </button>
              </div>

              <input
                style={styles.input}
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter answer"
                inputMode="numeric"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.primaryBtn,
                opacity: loading ? 0.82 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div style={styles.footerNote}>
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
      "radial-gradient(900px 420px at 15% 0%, rgba(255,0,102,0.12), transparent 60%)," +
      "radial-gradient(760px 380px at 95% 18%, rgba(0,102,255,0.12), transparent 55%)," +
      "radial-gradient(920px 520px at 80% 110%, rgba(255,170,0,0.14), transparent 60%)," +
      "radial-gradient(820px 420px at 52% 105%, rgba(163,0,255,0.10), transparent 65%)," +
      "linear-gradient(145deg,#fbfcff,#f5f7fc,#ffffff)",
  },

  bgGlow1: {
    position: "absolute",
    width: 320,
    height: 320,
    top: -90,
    left: -70,
    borderRadius: "50%",
    background: "rgba(255,0,102,0.08)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  bgGlow2: {
    position: "absolute",
    width: 280,
    height: 280,
    top: 60,
    right: -80,
    borderRadius: "50%",
    background: "rgba(0,102,255,0.08)",
    filter: "blur(75px)",
    pointerEvents: "none",
  },

  bgGlow3: {
    position: "absolute",
    width: 320,
    height: 320,
    bottom: -110,
    left: "10%",
    borderRadius: "50%",
    background: "rgba(255,170,0,0.10)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },

  card: {
    width: "100%",
    maxWidth: 470,
    borderRadius: 28,
    overflow: "hidden",
    border: "1px solid rgba(255,232,190,0.44)",
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(16px)",
    boxShadow:
      "0 24px 60px rgba(17,24,39,0.14), 0 10px 24px rgba(17,24,39,0.08)",
    position: "relative",
    zIndex: 2,
  },

  topStrip: {
    height: 4,
    background:
      "linear-gradient(90deg, rgba(161,0,255,0.10), rgba(255,122,0,0.24), rgba(0,102,255,0.10))",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },

  hero: {
    padding: "24px 22px 18px",
    background:
      "radial-gradient(900px 260px at 18% 0%, rgba(255,220,160,0.18), transparent 55%)," +
      "linear-gradient(135deg,#3b0000,#6a0000,#9a0000,#a100ff,#ff0066,#ff7a00)",
    color: "#fff",
  },

  heroRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  logoWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,232,190,0.42)",
    boxShadow: "0 14px 26px rgba(0,0,0,0.22)",
    flexShrink: 0,
  },

  logo: {
    width: 38,
    height: 38,
    objectFit: "contain",
    borderRadius: 10,
    display: "block",
  },

  brandTitle: {
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1.08,
    color: "#ffffff",
    textShadow: "0 4px 14px rgba(0,0,0,0.35)",
  },

  brandSub: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.92)",
    fontWeight: 700,
  },

  body: {
    padding: 24,
    background:
      "radial-gradient(900px 260px at 12% 0%, rgba(255,170,0,0.08), transparent 60%)," +
      "radial-gradient(820px 240px at 88% 0%, rgba(163,0,255,0.06), transparent 60%)," +
      "linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,255,0.86))",
  },

  headBlock: {
    marginBottom: 18,
  },

  headline: {
    fontSize: 18,
    color: "#111827",
    fontWeight: 900,
    marginBottom: 6,
  },

  desc: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.7,
    fontWeight: 700,
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

  form: {
    display: "grid",
    gap: 12,
  },

  field: {
    display: "grid",
    gap: 6,
  },

  label: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 800,
  },

  captchaHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },

  input: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(17,24,39,0.10)",
    background: "rgba(255,255,255,0.96)",
    padding: "0 14px",
    outline: "none",
    color: "#111827",
    fontSize: 14,
    fontFamily: "Arial, Helvetica, sans-serif",
    boxSizing: "border-box",
    boxShadow: "0 8px 18px rgba(17,24,39,0.04)",
  },

  refreshBtn: {
    border: "1px solid rgba(255,232,190,0.42)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.90))",
    height: 32,
    padding: "0 10px",
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    color: "#7a0000",
    boxShadow: "0 8px 18px rgba(17,24,39,0.06)",
  },

  primaryBtn: {
    height: 48,
    border: "1px solid rgba(255,232,190,0.45)",
    borderRadius: 16,
    fontWeight: 900,
    fontSize: 14,
    color: "#fff",
    background: "linear-gradient(135deg,#3b0000,#a100ff,#ff0066,#ff7a00)",
    boxShadow:
      "0 16px 30px rgba(17,24,39,0.18), inset 0 1px 0 rgba(255,255,255,0.20)",
  },

  footerNote: {
    marginTop: 18,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 1.6,
    fontWeight: 700,
  },
};