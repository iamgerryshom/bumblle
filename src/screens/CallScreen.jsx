import noDataIcon from "../assets/icons/no_data_vector.svg";

const RECENT_CALLS = [
  { name: "Noah", time: "Today, 3:12 PM", duration: "8 min", type: "incoming" },
  { name: "James", time: "Today, 11:40 AM", duration: "23 min", type: "outgoing" },
  { name: "Oliver", time: "Yesterday, 7:05 PM", duration: "5 min", type: "missed" },
];

const HAS_DATA = false; // 🔁 flip to true to preview the list state

export default function CallScreen() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        .call-screen * { box-sizing: border-box; }

        .call-screen {
          font-family: 'DM Sans', sans-serif;
          background: #0B0B12;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 0 20px 40px;
          color: #fff;
          position: relative;
          overflow: hidden;
        }

        .call-screen::before {
          content: '';
          position: absolute;
          top: -100px;
          left: -80px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(108, 77, 200, 0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        /* TOP BAR */
        .call-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 56px;
          margin-bottom: 32px;
        }

        .call-title {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin: 0;
          color: #fff;
        }

        .icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .icon-btn svg {
          width: 18px;
          height: 18px;
          stroke: rgba(255,255,255,0.55);
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* FILTER TABS */
        .filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 28px;
        }

        .tab {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab.active {
          background: rgba(124, 92, 232, 0.2);
          border-color: rgba(124, 92, 232, 0.45);
          color: #A78BFA;
        }

        /* CALL LIST */
        .section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 12px;
        }

        .call-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .call-item {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 18px;
          padding: 14px 16px;
        }

        .call-avatar {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #5B3FD4, #9B7AF5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Sora', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }

        .call-info { flex: 1; }

        .call-name {
          font-size: 15px;
          font-weight: 500;
          color: #fff;
          margin-bottom: 3px;
        }

        .call-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: rgba(255,255,255,0.35);
        }

        .call-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }

        .call-type-icon {
          width: 18px;
          height: 18px;
        }

        .call-type-icon.incoming { color: #3DDB85; }
        .call-type-icon.outgoing { color: #A78BFA; }
        .call-type-icon.missed   { color: #F87171; }

        .call-type-icon svg {
          width: 18px;
          height: 18px;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .call-back-btn {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          background: rgba(124, 92, 232, 0.15);
          border: 1px solid rgba(124, 92, 232, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .call-back-btn svg {
          width: 16px;
          height: 16px;
          stroke: #A78BFA;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* EMPTY STATE */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding-bottom: 60px;
        }

        .empty-icon-wrap {
          width: 96px;
          height: 96px;
          border-radius: 28px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .empty-icon-wrap img {
          width: 52px;
          height: 52px;
          object-fit: contain;
          opacity: 0.5;
          filter: brightness(0) invert(1);
        }

        .empty-title {
          font-family: 'Sora', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          margin: 0 0 8px;
        }

        .empty-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.3);
          margin: 0;
          text-align: center;
          line-height: 1.6;
          max-width: 220px;
        }

        .empty-cta {
          margin-top: 28px;
          background: linear-gradient(135deg, #5B3FD4, #7C5CE8);
          color: #fff;
          border: none;
          border-radius: 14px;
          padding: 13px 28px;
          font-family: 'Sora', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }

        .empty-cta:active {
          opacity: 0.85;
          transform: scale(0.97);
        }

        .empty-cta svg {
          width: 16px;
          height: 16px;
          stroke: #fff;
          fill: none;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
      `}</style>

      <div className="call-screen">

        {/* TOP BAR */}
        <div className="call-top-bar">
          <h2 className="call-title">Calls</h2>
          <div className="icon-btn">
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
        </div>

        {HAS_DATA ? (
          <>
            {/* FILTER TABS */}
            <div className="filter-tabs">
              {["All", "Incoming", "Outgoing", "Missed"].map((tab, i) => (
                <button key={tab} className={`tab${i === 0 ? " active" : ""}`}>{tab}</button>
              ))}
            </div>

            {/* CALL LIST */}
            <div className="section-label">Recent</div>
            <div className="call-list">
              {RECENT_CALLS.map((call, i) => (
                <div key={i} className="call-item">
                  <div className="call-avatar">{call.name[0]}</div>
                  <div className="call-info">
                    <div className="call-name">{call.name}</div>
                    <div className="call-meta">
                      <span className={`call-type-icon ${call.type}`}>
                        <svg viewBox="0 0 24 24">
                          {call.type === "incoming" && <path d="M5 12h14M12 5l7 7-7 7" style={{ transform: "rotate(135deg)", transformOrigin: "center" }} />}
                          {call.type === "outgoing" && <path d="M5 12h14M12 5l7 7-7 7" style={{ transform: "rotate(-45deg)", transformOrigin: "center" }} />}
                          {call.type === "missed" && <path d="M18.36 6.64a9 9 0 010 10.72M15.54 9.46a5 5 0 010 5.07M3 3l18 18" />}
                        </svg>
                      </span>
                      <span>{call.time}</span>
                      <span className="call-dot" />
                      <span>{call.duration}</span>
                    </div>
                  </div>
                  <div className="call-back-btn">
                    <svg viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.08 6.08l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* EMPTY STATE */
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <img src={noDataIcon} alt="no calls" />
            </div>
            <p className="empty-title">No calls yet</p>
            <p className="empty-subtitle">Your call history will appear here once you start connecting.</p>
            <button className="empty-cta">
              <svg viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.08 6.08l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              Start a Call
            </button>
          </div>
        )}
      </div>
    </>
  );
}