import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const COMMISSION_RATE = 0.25;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;600;700;800&display=swap');

  .txn-root {
    --bg:          #080b0f;
    --surface:     #0d1117;
    --surface2:    #161b22;
    --surface3:    #1c2330;
    --border:      #21262d;
    --border-hi:   #30363d;
    --accent:      #00d4aa;
    --accent-dim:  rgba(0,212,170,.10);
    --accent-glow: rgba(0,212,170,.22);
    --red:         #f85149;
    --red-dim:     rgba(248,81,73,.10);
    --green:       #3fb950;
    --green-dim:   rgba(63,185,80,.10);
    --yellow:      #e3b341;
    --yellow-dim:  rgba(227,179,65,.10);
    --blue:        #58a6ff;
    --blue-dim:    rgba(88,166,255,.10);
    --text:        #e6edf3;
    --muted:       #7d8590;
    --subtle:      #484f58;
    --mono:        'JetBrains Mono', monospace;
    --sans:        'Syne', sans-serif;

    background: var(--bg);
    color: var(--text);
    font-family: var(--mono);
    min-height: 100vh;
    padding: 36px 28px;
    position: relative;
    overflow-x: hidden;
  }

  .txn-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,212,170,.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,212,170,.015) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 0;
  }

  .txn-inner {
    position: relative;
    z-index: 1;
    max-width: 1320px;
    margin: 0 auto;
  }

  /* ── Header ── */
  .txn-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 28px;
    margin-bottom: 28px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 16px;
  }

  .txn-logo {
    font-family: var(--sans);
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -.4px;
    display: flex;
    align-items: center;
    gap: 10px;
    line-height: 1;
  }

  .txn-logo-pip {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 10px var(--accent);
    flex-shrink: 0;
  }
  .txn-logo-pip.idle    { background: var(--subtle); box-shadow: none; }
  .txn-logo-pip.loading { background: var(--yellow); box-shadow: 0 0 8px var(--yellow); animation: txn-blink .7s ease-in-out infinite; }
  .txn-logo-pip.error   { background: var(--red);    box-shadow: 0 0 8px var(--red); }
  .txn-logo-pip.success { background: var(--accent);  box-shadow: 0 0 10px var(--accent); }

  @keyframes txn-blink { 0%,100%{opacity:1} 50%{opacity:.25} }

  .txn-subtitle {
    margin-top: 5px;
    font-size: 10px;
    color: var(--muted);
    letter-spacing: .1em;
    text-transform: uppercase;
  }

  .txn-emp-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 4px 10px;
    background: var(--accent-dim);
    border: 1px solid rgba(0,212,170,.20);
    border-radius: 6px;
    font-size: 11px;
    color: var(--accent);
    font-family: var(--mono);
    letter-spacing: .04em;
  }

  /* KPIs */
  .txn-kpis {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  .txn-kpi { text-align: right; }
  .txn-kpi-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--muted);
    margin-bottom: 3px;
  }
  .txn-kpi-val {
    font-family: var(--sans);
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -1px;
    color: var(--text);
    line-height: 1;
  }
  .txn-kpi-val.green  { color: var(--green); }
  .txn-kpi-val.red    { color: var(--red); }
  .txn-kpi-val.accent { color: var(--accent); }
  .txn-kpi-divider { width: 1px; height: 34px; background: var(--border); }

  /* ── Controls ── */
  .txn-controls {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 10px;
    align-items: end;
    margin-bottom: 14px;
  }
  @media (max-width: 720px) {
    .txn-controls { grid-template-columns: 1fr 1fr; }
    .txn-query-btn { grid-column: span 2; }
  }

  .txn-field { display: flex; flex-direction: column; gap: 5px; }
  .txn-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: var(--muted);
    font-weight: 500;
  }
  .txn-label-hint {
    font-size: 9px;
    color: var(--subtle);
    letter-spacing: .04em;
    text-transform: none;
    margin-left: 5px;
    font-weight: 400;
  }

  .txn-input, .txn-select {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 12px;
    padding: 9px 12px;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    width: 100%;
    box-sizing: border-box;
    -webkit-appearance: none;
  }
  .txn-input::placeholder { color: var(--subtle); }
  .txn-input:focus, .txn-select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }
  .txn-input.prefilled {
    border-color: rgba(0,212,170,.30);
    background: rgba(0,212,170,.04);
  }
  .txn-select {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%237d8590' d='M5 7L0 2h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 11px center;
    padding-right: 28px;
  }
  .txn-select option { background: var(--surface2); }

  .txn-query-btn {
    background: var(--accent);
    border: none;
    border-radius: 6px;
    color: #000;
    cursor: pointer;
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .06em;
    padding: 0 20px;
    text-transform: uppercase;
    transition: opacity .15s, transform .1s, box-shadow .15s;
    white-space: nowrap;
    height: 38px;
  }
  .txn-query-btn:hover:not(:disabled) {
    opacity: .85;
    box-shadow: 0 0 20px var(--accent-glow);
    transform: translateY(-1px);
  }
  .txn-query-btn:active:not(:disabled) { transform: translateY(0); }
  .txn-query-btn:disabled { opacity: .3; cursor: not-allowed; }

  /* ── Status bar ── */
  .txn-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-bottom: 14px;
    font-size: 11px;
    color: var(--muted);
    min-height: 36px;
  }
  .txn-status-left { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
  .txn-elapsed { font-size: 11px; color: var(--subtle); font-variant-numeric: tabular-nums; }

  .txn-day-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    background: var(--accent-dim);
    border: 1px solid rgba(0,212,170,.20);
    border-radius: 4px;
    font-size: 10px;
    color: var(--accent);
    letter-spacing: .04em;
    font-variant-numeric: tabular-nums;
  }

  .txn-warn-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 8px;
    background: var(--yellow-dim);
    border: 1px solid rgba(227,179,65,.25);
    border-radius: 4px;
    font-size: 10px;
    color: var(--yellow);
    letter-spacing: .04em;
  }

  /* ── Error ── */
  .txn-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--red-dim);
    border: 1px solid rgba(248,81,73,.25);
    border-radius: 6px;
    color: var(--red);
    font-size: 12px;
    margin-bottom: 14px;
  }
  .txn-error-icon { font-size: 14px; flex-shrink: 0; }

  /* ── Table ── */
  .txn-table-wrap {
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    overflow-x: auto;
  }
  .txn-table { width: 100%; border-collapse: collapse; min-width: 640px; }

  .txn-table thead th {
    padding: 9px 14px;
    text-align: left;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: var(--muted);
    background: var(--surface2);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  .txn-table thead th.th-comm { color: var(--accent); }

  .txn-table tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background .1s;
  }
  .txn-table tbody tr:last-child { border-bottom: none; }
  .txn-table tbody tr:hover { background: var(--surface2); }
  .txn-table td { padding: 10px 14px; font-size: 12px; color: var(--text); vertical-align: middle; }

  @keyframes txn-row-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .txn-row-anim { animation: txn-row-in .2s ease both; }

  .txn-refcode {
    font-family: var(--mono);
    font-size: 11px;
    padding: 2px 7px;
    background: var(--surface3);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--accent);
    letter-spacing: .05em;
  }
  .txn-refcode.null-ref {
    color: var(--subtle);
    border-style: dashed;
    font-style: italic;
  }
  .txn-amt { font-weight: 500; white-space: nowrap; }
  .txn-amt.pos { color: var(--green); }
  .txn-amt.neg { color: var(--red); }
  .txn-comm { font-weight: 500; color: var(--accent); white-space: nowrap; }

  .txn-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .05em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .txn-bdot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .txn-badge.success { background: var(--green-dim);  color: var(--green);  }
  .txn-badge.success .txn-bdot { background: var(--green); }
  .txn-badge.danger  { background: var(--red-dim);    color: var(--red);    }
  .txn-badge.danger  .txn-bdot { background: var(--red); }
  .txn-badge.warning { background: var(--yellow-dim); color: var(--yellow); }
  .txn-badge.warning .txn-bdot { background: var(--yellow); }
  .txn-badge.other   { background: var(--blue-dim);   color: var(--blue);   }
  .txn-badge.other   .txn-bdot { background: var(--blue); }

  .txn-muted   { color: var(--muted);  font-size: 11px; }
  .txn-subtle  { color: var(--subtle); font-size: 11px; }
  .txn-truncate { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .txn-fail-reason { color: var(--red); opacity: .8; }

  .txn-totals-ok   { background: rgba(63,185,80,.04)  !important; }
  .txn-totals-fail { background: rgba(248,81,73,.04)  !important; }
  .txn-totals-ok:hover   { background: rgba(63,185,80,.07)  !important; }
  .txn-totals-fail:hover { background: rgba(248,81,73,.07)  !important; }
  .txn-totals-ok td, .txn-totals-fail td { padding: 10px 14px; }
  .txn-totals-ok td   { border-top: 1px solid var(--border-hi) !important; }
  .txn-totals-fail td { border-top: 1px solid var(--border) !important; }
  .txn-totals-label {
    font-family: var(--sans);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
  }
  .txn-totals-label.ok   { color: var(--green); }
  .txn-totals-label.fail { color: var(--red); }
  .txn-totals-amt  { font-family: var(--sans); font-size: 13px; font-weight: 800; letter-spacing: -.4px; color: var(--text); }
  .txn-totals-comm { font-family: var(--sans); font-size: 13px; font-weight: 800; letter-spacing: -.4px; color: var(--accent); }
  .txn-totals-fail .txn-totals-comm { color: var(--subtle); }

  .txn-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 24px;
    gap: 8px;
    text-align: center;
  }
  .txn-empty-icon { font-size: 28px; opacity: .2; margin-bottom: 4px; }
  .txn-empty-title { font-family: var(--sans); font-size: 14px; font-weight: 600; color: var(--subtle); }
  .txn-empty-sub   { font-size: 11px; color: var(--subtle); }

  .txn-spinner {
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--border-hi);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: txn-spin .65s linear infinite;
    margin-bottom: 8px;
  }
  @keyframes txn-spin { to { transform: rotate(360deg); } }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function badgeProps(status = "") {
  const s = status.toUpperCase();
  if (s === "SUCCESS" || s === "COMPLETED")  return "txn-badge success";
  if (s === "FAILED"  || s === "FAILURE")    return "txn-badge danger";
  if (s === "PENDING" || s === "PROCESSING") return "txn-badge warning";
  return "txn-badge other";
}

function formatTs(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-KE", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function fmt(n) {
  return Number(n).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function todayDateStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayBounds(dateStr) {
  const start = new Date(dateStr + "T00:00:00");
  const end   = new Date(dateStr + "T23:59:59.999");
  return {
    start: Timestamp.fromDate(start),
    end:   Timestamp.fromDate(end),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransactionExplorer() {
  const location = useLocation();
  const fromEmployee = location.state || {};

  const [refCode,    setRefCode]    = useState(fromEmployee.employeeRefCode || "");
  const [filterDate, setFilterDate] = useState(todayDateStr());
  const [txnStatus,  setTxnStatus]  = useState("");
  const [rows,       setRows]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [elapsed,    setElapsed]    = useState(null);
  const [queriedDay, setQueriedDay] = useState("");
  const [broadScan,  setBroadScan]  = useState(false);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = (() => {
    if (!rows) return { total: "—", ok: "—", fail: "—", totalAmt: null, totalComm: null, okAmt: 0, failAmt: 0, okComm: 0 };
    const okRows   = rows.filter(r => ["SUCCESS", "COMPLETED"].includes((r.transactionStatus || "").toUpperCase()));
    const failRows = rows.filter(r => (r.transactionStatus || "").toUpperCase().includes("FAIL"));
    const okAmt    = okRows.reduce((s, r) => s + (r.amount ?? 0), 0);
    const failAmt  = failRows.reduce((s, r) => s + (r.amount ?? 0), 0);
    const okComm   = okAmt * COMMISSION_RATE;
    const totalAmt = rows.reduce((s, r) => s + (r.amount ?? 0), 0);
    return {
      total: rows.length,
      ok: okRows.length,
      fail: failRows.length,
      totalAmt,
      totalComm: okComm,
      okAmt,
      failAmt,
      okComm,
    };
  })();

  // ── Query ──────────────────────────────────────────────────────────────────
  const runQuery = useCallback(async () => {
    setError("");

    const currentRefCode = document.querySelector(".txn-refcode-input")?.value ?? refCode;
    const currentDate    = document.querySelector(".txn-date-input")?.value    ?? filterDate;
    const currentStatus  = document.querySelector(".txn-status-select")?.value ?? txnStatus;

    const hasRefCode = refCode.trim() !== "";
    const hasDate    = filterDate !== "";

    setLoading(true);
    setRows(null);
    setQueriedDay("");
    setBroadScan(false);
    const t0 = performance.now();

    try {
      const constraints = [];

      if (hasRefCode) {
        constraints.push(where("refCode", "==", refCode.trim().toUpperCase()));
      }

      if (hasDate) {
        const { start, end } = dayBounds(filterDate);
        constraints.push(where("createdAt", ">=", start));
        constraints.push(where("createdAt", "<=", end));
        setQueriedDay(filterDate);
      }

      if (txnStatus) {
        constraints.push(where("transactionStatus", "==", txnStatus));
      }

      constraints.push(orderBy("createdAt", "desc"));

      if (!hasRefCode && !hasDate) {
        setBroadScan(true);
      }

      const snap = await getDocs(query(collection(db, "transactions"), ...constraints));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      setRows(data);
      setElapsed(((performance.now() - t0) / 1000).toFixed(2));
    } catch (e) {
      setError("Firestore error: " + (e.message || String(e)));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [refCode, filterDate, txnStatus]);

  // ── Auto-run when arriving from employee screen ────────────────────────────
  useEffect(() => {
    if (fromEmployee.employeeRefCode) {
      runQuery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pip state ──────────────────────────────────────────────────────────────
  const pipState = loading      ? "loading"
    : error        ? "error"
    : rows !== null ? "success"
    : "idle";

  const statusMsg = loading      ? "Fetching transactions…"
    : error         ? "Query failed — see error above"
    : rows === null ? "Set filters and click Query."
    : `${rows.length} record${rows.length !== 1 ? "s" : ""} found`;

  const COLS = 6;

  return (
    <>
      <style>{styles}</style>
      <div className="txn-root">
        <div className="txn-inner">

          {/* ── Header ── */}
          <div className="txn-header">
            <div>
              <div className="txn-logo">
                <span className={`txn-logo-pip ${pipState}`} />
                {fromEmployee.employeeName || "TxnLedger"}
              </div>
              <div className="txn-subtitle">
                {fromEmployee.employeeRefCode
                  ? `Ref #${fromEmployee.employeeRefCode} · transaction explorer`
                  : "Firestore transaction explorer"}
              </div>
              {fromEmployee.employeeName && (
                <div className="txn-emp-badge">
                  👤 {fromEmployee.employeeName}
                  {fromEmployee.employeeRefCode && (
                    <span style={{ opacity: 0.6 }}>· #{fromEmployee.employeeRefCode}</span>
                  )}
                </div>
              )}
            </div>

            <div className="txn-kpis">
              <div className="txn-kpi">
                <div className="txn-kpi-label">Total</div>
                <div className="txn-kpi-val">{stats.total}</div>
              </div>
              <div className="txn-kpi-divider" />
              <div className="txn-kpi">
                <div className="txn-kpi-label">Success</div>
                <div className="txn-kpi-val green">{stats.ok}</div>
              </div>
              <div className="txn-kpi-divider" />
              <div className="txn-kpi">
                <div className="txn-kpi-label">Failed</div>
                <div className="txn-kpi-val red">{stats.fail}</div>
              </div>
              {stats.totalComm !== null && (
                <>
                  <div className="txn-kpi-divider" />
                  <div className="txn-kpi">
                    <div className="txn-kpi-label">Commission</div>
                    <div className="txn-kpi-val accent">KES {fmt(stats.totalComm)}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Controls ── */}
          <div className="txn-controls">
            <div className="txn-field">
              <span className="txn-label">
                Ref code
                <span className="txn-label-hint">optional — blank finds all</span>
              </span>
              <input
                className={`txn-input txn-refcode-input${fromEmployee.employeeRefCode ? " prefilled" : ""}`}
                placeholder="e.g. HSY7YP — or leave blank"
                value={refCode}
                onChange={e => setRefCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runQuery()}
                maxLength={20}
              />
            </div>
            <div className="txn-field">
              <span className="txn-label">
                Date
                <span className="txn-label-hint">00:00 → 23:59</span>
              </span>
              <input
                type="date"
                className="txn-input txn-date-input prefilled"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              />
            </div>
            <div className="txn-field">
              <span className="txn-label">Status</span>
              <select
                className="txn-select txn-status-select"
                value={txnStatus}
                onChange={e => setTxnStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <button
              className="txn-query-btn"
              onClick={runQuery}
              disabled={loading}
            >
              {loading ? "…" : "Query →"}
            </button>
          </div>

          {/* ── Status bar ── */}
          <div className="txn-status">
            <div className="txn-status-left">
              <span className={`txn-logo-pip ${pipState}`} />
              <span>{statusMsg}</span>
              {queriedDay && !loading && rows !== null && (
                <span className="txn-day-chip">
                  📅 {queriedDay} · 00:00 – 23:59
                </span>
              )}
              {broadScan && !loading && rows !== null && (
                <span className="txn-warn-chip">
                  ⚠ Full scan — consider adding a date filter
                </span>
              )}
            </div>
            {elapsed && !loading && (
              <span className="txn-elapsed">{elapsed}s</span>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="txn-error">
              <span className="txn-error-icon">⚠</span>
              {error}
            </div>
          )}

          {/* ── Table ── */}
          <div className="txn-table-wrap">
            <table className="txn-table">
              <thead>
                <tr>
                  <th>Ref code</th>
                  <th>Amount (KES)</th>
                  <th className="th-comm">Commission (25%)</th>
                  <th>Status</th>
                  <th>Completed at</th>
                  <th>Failure reason</th>
                </tr>
              </thead>
              <tbody>

                {loading && (
                  <tr>
                    <td colSpan={COLS}>
                      <div className="txn-empty">
                        <div className="txn-spinner" />
                        <div className="txn-empty-sub">Querying Firestore…</div>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && rows === null && (
                  <tr>
                    <td colSpan={COLS}>
                      <div className="txn-empty">
                        <div className="txn-empty-icon">⬡</div>
                        <div className="txn-empty-title">No data loaded</div>
                        <div className="txn-empty-sub">Use the filters above to query transactions.</div>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && rows !== null && rows.length === 0 && (
                  <tr>
                    <td colSpan={COLS}>
                      <div className="txn-empty">
                        <div className="txn-empty-icon">◌</div>
                        <div className="txn-empty-title">No transactions found</div>
                        <div className="txn-empty-sub">Try a different ref code or adjust your filters.</div>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && rows && rows.map((row, i) => {
                  const isOk = ["SUCCESS", "COMPLETED"].includes((row.transactionStatus || "").toUpperCase());
                  const commission = isOk ? (row.amount ?? 0) * COMMISSION_RATE : null;
                  const hasRef = row.refCode && row.refCode.trim() !== "";
                  return (
                    <tr
                      key={row.id}
                      className="txn-row-anim"
                      style={{ animationDelay: `${Math.min(i * 25, 250)}ms` }}
                    >
                      <td>
                        {hasRef
                          ? <span className="txn-refcode">{row.refCode}</span>
                          : <span className="txn-refcode null-ref">null</span>
                        }
                      </td>
                      <td>
                        <span className={`txn-amt ${(row.amount ?? 0) >= 0 ? "pos" : "neg"}`}>
                          {fmt(row.amount ?? 0)}
                        </span>
                      </td>
                      <td>
                        {commission !== null
                          ? <span className="txn-comm">{fmt(commission)}</span>
                          : <span className="txn-subtle">—</span>
                        }
                      </td>
                      <td>
                        <span className={badgeProps(row.transactionStatus)}>
                          <span className="txn-bdot" />
                          {row.transactionStatus || "—"}
                        </span>
                      </td>
                      <td className="txn-subtle">{formatTs(row.completedAt)}</td>
                      <td>
                        <div
                          className={`txn-muted txn-truncate${row.failureReason ? " txn-fail-reason" : ""}`}
                          title={row.failureReason || ""}
                        >
                          {row.failureReason || "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && rows && rows.length > 0 && (
                  <tr className="txn-totals-ok">
                    <td>
                      <span className="txn-totals-label ok">
                        ✓ Success ({stats.ok})
                      </span>
                    </td>
                    <td><span className="txn-totals-amt">KES {fmt(stats.okAmt)}</span></td>
                    <td><span className="txn-totals-comm">KES {fmt(stats.okComm)}</span></td>
                    <td colSpan={3} />
                  </tr>
                )}

                {!loading && rows && rows.length > 0 && (
                  <tr className="txn-totals-fail">
                    <td>
                      <span className="txn-totals-label fail">
                        ✕ Failed ({stats.fail})
                      </span>
                    </td>
                    <td><span className="txn-totals-amt">KES {fmt(stats.failAmt)}</span></td>
                    <td><span className="txn-totals-comm txn-subtle">—</span></td>
                    <td colSpan={3} />
                  </tr>
                )}

              </tbody>
            </table>
          </div>

        </div>
      </div>
    </>
  );
}