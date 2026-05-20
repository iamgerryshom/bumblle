import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

const formatKES = (amount) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount || 0);

const StatPill = ({ label, value, accent }) => (
  <div style={{
    display: "flex", flexDirection: "column", gap: 2,
    background: "rgba(255,255,255,0.04)", border: `1px solid ${accent}22`,
    borderRadius: 10, padding: "10px 16px", minWidth: 110,
  }}>
    <span style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{label}</span>
    <span style={{ fontSize: 15, fontWeight: 700, color: accent, fontFamily: "'DM Mono', monospace" }}>{value}</span>
  </div>
);

const EmployeeRow = ({ emp, index, onClick }) => {
  const [expanded, setExpanded] = useState(false);
  const successRate = emp.successfulSalesCount + emp.failedSalesCount > 0
    ? Math.round((emp.successfulSalesCount / (emp.successfulSalesCount + emp.failedSalesCount)) * 100)
    : 0;

  const handleClick = () => setExpanded(!expanded);

  const handleNavigate = (e) => {
    e.stopPropagation();
    onClick(emp);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: expanded ? "rgba(99,179,237,0.06)" : "rgba(255,255,255,0.02)",
        border: "1px solid",
        borderColor: expanded ? "rgba(99,179,237,0.25)" : "rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "18px 22px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        animationDelay: `${index * 40}ms`,
        animation: "fadeSlideIn 0.35s ease both",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: `hsl(${(emp.name?.charCodeAt(0) || 65) * 7}, 55%, 30%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Syne', sans-serif",
          border: "2px solid rgba(255,255,255,0.1)",
        }}>
          {emp.name?.charAt(0)?.toUpperCase() || "?"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f1f5f9", fontFamily: "'Syne', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {emp.name || "Unnamed Employee"}
          </div>
          <div style={{ fontSize: 12, color: "#4ade80", fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
            #{emp.refCode || "—"}
          </div>
        </div>

        <div style={{
          padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
          fontFamily: "'DM Mono', monospace",
          background: successRate >= 70 ? "rgba(74,222,128,0.12)" : successRate >= 40 ? "rgba(251,191,36,0.12)" : "rgba(248,113,113,0.12)",
          color: successRate >= 70 ? "#4ade80" : successRate >= 40 ? "#fbbf24" : "#f87171",
          border: `1px solid ${successRate >= 70 ? "rgba(74,222,128,0.25)" : successRate >= 40 ? "rgba(251,191,36,0.25)" : "rgba(248,113,113,0.25)"}`,
        }}>
          {successRate}% success
        </div>

        <div style={{ textAlign: "right", minWidth: 100 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#63b3ed", fontFamily: "'DM Mono', monospace" }}>
            {formatKES(emp.totalCommissionEarned)}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>earned</div>
        </div>

        <button
          onClick={handleNavigate}
          style={{
            background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.25)",
            borderRadius: 8, padding: "6px 14px", color: "#63b3ed",
            fontSize: 12, fontFamily: "'DM Mono', monospace", cursor: "pointer",
            transition: "all 0.15s ease", whiteSpace: "nowrap",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(99,179,237,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(99,179,237,0.1)"}
        >
          Transactions →
        </button>

        <div style={{ color: "#6b7280", fontSize: 14, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</div>
      </div>

      {expanded && (
        <div style={{
          marginTop: 18, paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexWrap: "wrap", gap: 10,
          animation: "fadeSlideIn 0.2s ease",
        }}>
          <StatPill label="Successful Sales" value={emp.successfulSalesCount || 0} accent="#4ade80" />
          <StatPill label="Failed Sales" value={emp.failedSalesCount || 0} accent="#f87171" />
          <StatPill label="Commission Earned" value={formatKES(emp.totalCommissionEarned)} accent="#63b3ed" />
          <StatPill label="Failed Commission" value={formatKES(emp.totalFailedCommission)} accent="#f87171" />
          {emp.phone && <StatPill label="Phone" value={emp.phone} accent="#a78bfa" />}
          {emp.email && <StatPill label="Email" value={emp.email} accent="#a78bfa" />}
        </div>
      )}
    </div>
  );
};

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(query(collection(db, "employees"), orderBy("name")));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmployees(data);
        setFiltered(data);
      } catch (e) {
        setError("Failed to load employees.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const term = search.trim().toLowerCase();
    if (!term) { setFiltered(employees); return; }
    setFiltered(
      employees.filter(e =>
        e.refCode?.toLowerCase().includes(term) ||
        e.name?.toLowerCase().includes(term)
      )
    );
  }, [search, employees]);

  const handleEmployeeClick = (emp) => {
    navigate("/employee-transaction", {
      state: { employeeId: emp.id, employeeName: emp.name, employeeRefCode: emp.refCode },
    });
  };

  const totalEarned = employees.reduce((s, e) => s + (e.totalCommissionEarned || 0), 0);
  const totalSales  = employees.reduce((s, e) => s + (e.successfulSalesCount  || 0), 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0c10",
      backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,179,237,0.08), transparent)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#f1f5f9",
      padding: "0 0 60px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        input::placeholder { color: #4b5563; }
        input:focus { outline: none; }
        .create-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: #4ade80;
          border: none;
          border-radius: 10px;
          color: #0a0c10;
          cursor: pointer;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          padding: 10px 18px;
          transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .create-btn:hover {
          opacity: 0.88;
          box-shadow: 0 0 22px rgba(74,222,128,0.35);
          transform: translateY(-1px);
        }
        .create-btn:active { transform: translateY(0); }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "48px 32px 32px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.01)",
        backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
                Operations
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: "#f8fafc", lineHeight: 1.1 }}>
                Employee Directory
              </h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Summary pills */}
              <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>{employees.length}</div>
                <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Employees</div>
              </div>
              <div style={{ background: "rgba(99,179,237,0.08)", border: "1px solid rgba(99,179,237,0.18)", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#63b3ed", fontFamily: "'DM Mono', monospace" }}>{formatKES(totalEarned)}</div>
                <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Earned</div>
              </div>
              <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 10, padding: "8px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#a78bfa", fontFamily: "'DM Mono', monospace" }}>{totalSales}</div>
                <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Sales</div>
              </div>

              {/* Create Employee button */}
              <button className="create-btn" onClick={() => navigate("/create-employee")}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                New Employee
              </button>
            </div>
          </div>

          {/* Search */}
          <div
            onClick={() => inputRef.current?.focus()}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "12px 18px",
              cursor: "text", transition: "border-color 0.2s",
            }}
          >
            <svg width="16" height="16" fill="none" stroke="#6b7280" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ref code or name…"
              style={{
                flex: 1, background: "transparent", border: "none",
                color: "#f1f5f9", fontSize: 14, fontFamily: "'DM Mono', monospace",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
              >×</button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "32px auto", padding: "0 32px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
            <div style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>LOADING EMPLOYEES…</div>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: "16px 20px", color: "#f87171", fontSize: 14 }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
            <div style={{ color: "#6b7280", fontSize: 14, fontFamily: "'DM Mono', monospace" }}>
              {search ? `No employee found for "${search}"` : "No employees found"}
            </div>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
              {filtered.length} of {employees.length} employees
              {search && <span style={{ color: "#4ade80" }}> · filtered by "{search}"</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((emp, i) => (
                <EmployeeRow key={emp.id} emp={emp} index={i} onClick={handleEmployeeClick} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}