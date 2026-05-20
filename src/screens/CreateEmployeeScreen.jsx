import { useState } from "react";

const FIREBASE_FUNCTION_URL = "https://us-central1-bumble-af496.cloudfunctions.net/createEmployee";

const ROLES = ["agent", "manager", "supervisor", "admin"];

export default function CreateEmployee() {
  const [form, setForm] = useState({ name: "", phoneNumber: "", role: "agent" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phoneNumber.trim()) {
      setErrorMsg("Name and phone number are required.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    try {
      const response = await fetch(FIREBASE_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phoneNumber: form.phoneNumber.trim(),
          role: form.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data);
      setStatus("success");
      setForm({ name: "", phoneNumber: "", role: "agent" });
    } catch (err) {
      setErrorMsg(err.message || "Failed to create employee.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080a0f;
          --surface: #0e1117;
          --surface2: #141820;
          --border: #1e2330;
          --border-accent: #2a3045;
          --text: #e8eaf0;
          --muted: #5a6078;
          --accent: #4f8ef7;
          --accent-glow: rgba(79, 142, 247, 0.18);
          --accent-dim: rgba(79, 142, 247, 0.08);
          --success: #34c07a;
          --success-glow: rgba(52, 192, 122, 0.15);
          --error: #f75a5a;
          --error-glow: rgba(247, 90, 90, 0.15);
          --label: #8892aa;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Syne', sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 48px 48px;
          opacity: 0.35;
          pointer-events: none;
        }

        .bg-glow {
          position: fixed;
          top: -180px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 500px;
          background: radial-gradient(ellipse at center, rgba(79,142,247,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .card {
          position: relative;
          width: 100%;
          max-width: 520px;
          background: var(--surface);
          border: 1px solid var(--border-accent);
          border-radius: 20px;
          padding: 48px 44px;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.02), 0 32px 80px rgba(0,0,0,0.5);
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(79,142,247,0.04) 0%, transparent 60%);
          pointer-events: none;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: var(--accent);
          background: var(--accent-dim);
          border: 1px solid rgba(79,142,247,0.2);
          border-radius: 100px;
          padding: 4px 12px;
          margin-bottom: 20px;
          text-transform: uppercase;
        }

        .badge::before {
          content: '';
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 6px var(--accent);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        h1 {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--text);
          margin-bottom: 6px;
        }

        .subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 40px;
          letter-spacing: 0.02em;
        }

        .divider {
          height: 1px;
          background: var(--border);
          margin: 32px 0;
        }

        .field {
          margin-bottom: 24px;
        }

        label {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--label);
          margin-bottom: 8px;
        }

        .required-mark {
          color: var(--accent);
          margin-left: 3px;
        }

        input, select {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border-accent);
          border-radius: 10px;
          padding: 13px 16px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: var(--text);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          appearance: none;
          -webkit-appearance: none;
        }

        input::placeholder { color: var(--muted); }

        input:focus, select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background: var(--surface);
        }

        .select-wrapper {
          position: relative;
        }

        .select-wrapper::after {
          content: '';
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 0; height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid var(--muted);
          pointer-events: none;
        }

        select option {
          background: #1a1f2e;
          color: var(--text);
        }

        .role-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .role-btn {
          background: var(--surface2);
          border: 1px solid var(--border-accent);
          border-radius: 8px;
          padding: 10px 12px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.18s;
          text-transform: capitalize;
          text-align: center;
        }

        .role-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--accent-dim);
        }

        .role-btn.active {
          border-color: var(--accent);
          background: var(--accent-dim);
          color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent);
        }

        .submit-btn {
          width: 100%;
          padding: 15px;
          background: var(--accent);
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #fff;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(79,142,247,0.3);
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(79,142,247,0.4);
        }

        .submit-btn:active:not(:disabled) { transform: translateY(0); }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .result-card {
          background: var(--surface2);
          border: 1px solid;
          border-radius: 12px;
          padding: 24px;
          margin-top: 28px;
          animation: fadeIn 0.4s ease both;
        }

        .result-card.success {
          border-color: rgba(52, 192, 122, 0.3);
          box-shadow: 0 0 0 1px rgba(52,192,122,0.08), 0 8px 24px var(--success-glow);
        }

        .result-card.error {
          border-color: rgba(247, 90, 90, 0.3);
          box-shadow: 0 0 0 1px rgba(247,90,90,0.08), 0 8px 24px var(--error-glow);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .result-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .result-icon.success { background: var(--success-glow); color: var(--success); }
        .result-icon.error   { background: var(--error-glow); color: var(--error); }

        .result-title {
          font-size: 14px;
          font-weight: 700;
        }

        .result-title.success { color: var(--success); }
        .result-title.error   { color: var(--error); }

        .result-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }

        .result-row:last-child { border-bottom: none; }

        .result-key {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .result-val {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: var(--text);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 4px 10px;
          letter-spacing: 0.04em;
        }

        .new-btn {
          width: 100%;
          margin-top: 16px;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--border-accent);
          border-radius: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.18s;
        }

        .new-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--accent-dim);
        }

        .error-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--error);
          margin-top: 12px;
        }
      `}</style>

      <div className="page">
        <div className="bg-grid" />
        <div className="bg-glow" />

        <div className="card">
          <div className="badge">HR Portal</div>
          <h1>New Employee</h1>
          <p className="subtitle">// provision access &amp; generate ref code</p>

          <div className="field">
            <label>Full Name <span className="required-mark">*</span></label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Jane Muthoni"
              disabled={status === "loading"}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label>Phone Number <span className="required-mark">*</span></label>
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="e.g. +254 700 000 000"
              disabled={status === "loading"}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label>Role</label>
            <div className="role-grid">
              {ROLES.map((r) => (
                <button
                  key={r}
                  className={`role-btn${form.role === r ? " active" : ""}`}
                  onClick={() => setForm((p) => ({ ...p, role: r }))}
                  disabled={status === "loading"}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="divider" />

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <span className="spinner" />
                Creating Employee…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                Create Employee
              </>
            )}
          </button>

          {status === "success" && result && (
            <div className="result-card success">
              <div className="result-header">
                <div className="result-icon success">✓</div>
                <span className="result-title success">Employee Created</span>
              </div>
              <div className="result-row">
                <span className="result-key">Employee ID</span>
                <span className="result-val">{result.employeeId}</span>
              </div>
              <div className="result-row">
                <span className="result-key">Ref Code</span>
                <span className="result-val">{result.refCode}</span>
              </div>
              <button className="new-btn" onClick={handleReset}>
                + Add Another Employee
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="result-card error">
              <div className="result-header">
                <div className="result-icon error">✕</div>
                <span className="result-title error">Creation Failed</span>
              </div>
              <p className="error-msg">{errorMsg}</p>
              <button className="new-btn" onClick={handleReset} style={{ marginTop: 16 }}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}