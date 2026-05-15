import { useEffect, useState } from "react";
import MinutesBottomSheet from "../components/minute/bottom-sheet/MinuteBottomSheet";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const STORAGE_KEY = "profile_name";

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedName = localStorage.getItem(STORAGE_KEY);
    if (savedName) {
      setName(savedName);
    } else {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const generated = `User_${randomId}`;
      localStorage.setItem(STORAGE_KEY, generated);
      setName(generated);
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) { setLoading(false); return; }
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setSeconds(snap.data().seconds ?? null);
        } else {
          setSeconds(null);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setSeconds(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const minutes = seconds !== null && seconds !== undefined
    ? (seconds / 60).toFixed(1)
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        .profile-screen * { box-sizing: border-box; }

        .profile-screen {
          font-family: 'DM Sans', sans-serif;
          background: #0B0B12;
          min-height: 100vh;
          padding: 0 20px 40px;
          color: #fff;
          position: relative;
          overflow: hidden;
        }

        .profile-screen::before {
          content: '';
          position: absolute;
          top: -120px;
          right: -80px;
          width: 340px;
          height: 340px;
          background: radial-gradient(circle, rgba(108, 77, 200, 0.22) 0%, transparent 70%);
          pointer-events: none;
        }

        .profile-screen::after {
          content: '';
          position: absolute;
          top: 60px;
          left: -100px;
          width: 260px;
          height: 260px;
          background: radial-gradient(circle, rgba(80, 50, 160, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 56px;
          margin-bottom: 32px;
        }

        .top-bar-title {
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }

        .settings-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .settings-btn svg {
          width: 18px;
          height: 18px;
          stroke: rgba(255,255,255,0.5);
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
        }

        .hero-header {
          display: flex;
          align-items: flex-end;
          gap: 18px;
          margin-bottom: 28px;
        }

        .avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .avatar {
          width: 88px;
          height: 88px;
          border-radius: 26px;
          object-fit: cover;
          display: block;
          border: 2px solid rgba(255,255,255,0.08);
        }

        .avatar-ring {
          position: absolute;
          inset: -4px;
          border-radius: 30px;
          background: linear-gradient(135deg, #7C5CE8, #B490FF, #7C5CE8);
          z-index: -1;
        }

        .online-dot {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 14px;
          height: 14px;
          background: #3DDB85;
          border-radius: 50%;
          border: 2.5px solid #0B0B12;
        }

        .hero-info {
          flex: 1;
          padding-bottom: 4px;
        }

        .hero-name {
          font-family: 'Sora', sans-serif;
          font-size: 26px;
          font-weight: 700;
          margin: 0 0 6px;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .meta-pills {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.65);
          font-weight: 500;
        }

        .pill img {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          object-fit: cover;
        }

        .verified-pill {
          background: rgba(61, 219, 133, 0.1);
          border-color: rgba(61, 219, 133, 0.2);
          color: #3DDB85;
        }

        .verified-pill svg {
          width: 12px;
          height: 12px;
          fill: #3DDB85;
        }

        .divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin-bottom: 24px;
        }

        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          padding: 16px 12px;
          text-align: center;
        }

        .stat-value {
          font-family: 'Sora', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
          line-height: 1;
        }

        .stat-label {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .minutes-card {
          background: linear-gradient(135deg, #5B3FD4 0%, #7C5CE8 50%, #9B7AF5 100%);
          border-radius: 24px;
          padding: 24px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
        }

        .minutes-card::before {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 180px;
          height: 180px;
          background: rgba(255,255,255,0.06);
          border-radius: 50%;
          pointer-events: none;
        }

        .minutes-card::after {
          content: '';
          position: absolute;
          bottom: -60px;
          left: -20px;
          width: 200px;
          height: 200px;
          background: rgba(0,0,0,0.1);
          border-radius: 50%;
          pointer-events: none;
        }

        .minutes-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }

        .minutes-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.6);
          margin-bottom: 6px;
        }

        .minutes-value {
          font-family: 'Sora', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -1px;
          line-height: 1;
        }

        .minutes-unit {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          margin-left: 4px;
        }

        .minutes-icon-box {
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.15);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .minutes-icon-box svg {
          width: 24px;
          height: 24px;
          stroke: #fff;
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .get-minutes-btn {
          position: relative;
          z-index: 1;
          width: 100%;
          background: rgba(255,255,255,0.95);
          color: #5B3FD4;
          border: none;
          border-radius: 14px;
          padding: 15px;
          font-family: 'Sora', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: background 0.2s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .get-minutes-btn:active {
          transform: scale(0.98);
          background: #f0ebff;
        }

        .get-minutes-btn svg {
          width: 18px;
          height: 18px;
          stroke: #5B3FD4;
          fill: none;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .section-title {
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 14px;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 14px 16px;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .activity-icon svg {
          width: 20px;
          height: 20px;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .activity-icon.purple {
          background: rgba(124, 92, 232, 0.15);
          color: #A78BFA;
        }

        .activity-icon.green {
          background: rgba(61, 219, 133, 0.12);
          color: #3DDB85;
        }

        .activity-icon.amber {
          background: rgba(251, 191, 36, 0.12);
          color: #FBBF24;
        }

        .activity-text {
          flex: 1;
        }

        .activity-name {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          margin-bottom: 2px;
        }

        .activity-time {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
        }

        .activity-badge {
          font-family: 'Sora', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
        }

        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }

        .shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>

      <div className="profile-screen">

        <div className="top-bar">
          <span className="top-bar-title">Profile</span>
          <div className="settings-btn">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
        </div>

        <div className="hero-header">
          <div className="avatar-wrapper">
            <div className="avatar-ring" />
            <img
              src="https://i.pravatar.cc/150?img=12"
              alt="profile"
              className="avatar"
            />
            <div className="online-dot" />
          </div>
          <div className="hero-info">
            <h1 className="hero-name">{name || "Loading..."}</h1>
            <div className="meta-pills">
              <span className="pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,255,255,0.65)" stroke="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Kenya
              </span>
              <span className="pill">21 yrs</span>
              <span className="pill verified-pill">
                <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#3DDB85" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Verified
              </span>
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">4.9</div>
            <div className="stat-label">Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">128</div>
            <div className="stat-label">Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {loading ? (
                <span className="shimmer" style={{ fontSize: 16 }}>—</span>
              ) : minutes !== null ? minutes : "0"}
            </div>
            <div className="stat-label">Minutes</div>
          </div>
        </div>

        <div className="minutes-card">
          <div className="minutes-card-top">
            <div>
              <div className="minutes-label">Available Balance</div>
              <div className="minutes-value">
                {loading ? (
                  <span className="shimmer">—</span>
                ) : minutes !== null ? (
                  <>
                    {minutes}
                    <span className="minutes-unit">min</span>
                  </>
                ) : (
                  <span style={{ fontSize: 22 }}>No minutes</span>
                )}
              </div>
            </div>
            <div className="minutes-icon-box">
              <svg viewBox="0 0 24 24">
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
            </div>
          </div>
          <button className="get-minutes-btn" onClick={() => setOpen(true)}>
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12l7-7 7 7"/>
            </svg>
            Get Minutes
          </button>
        </div>

        <div className="section-title">Recent Activity</div>
        <div className="activity-list">
          {[
            {
              icon: (
                <svg viewBox="0 0 24 24"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
              ),
              color: "purple",
              name: "Video session",
              time: "Today, 2:40 PM",
              badge: "−12 min",
            },
            {
              icon: (
                <svg viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              ),
              color: "green",
              name: "Minutes purchased",
              time: "Yesterday, 9:15 AM",
              badge: "+60 min",
            },
            {
              icon: (
                <svg viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
              ),
              color: "amber",
              name: "Review received",
              time: "Mon, 11:00 AM",
              badge: "★ 5.0",
            },
          ].map((item, i) => (
            <div key={i} className="activity-item">
              <div className={`activity-icon ${item.color}`}>
                {item.icon}
              </div>
              <div className="activity-text">
                <div className="activity-name">{item.name}</div>
                <div className="activity-time">{item.time}</div>
              </div>
              <div className="activity-badge">{item.badge}</div>
            </div>
          ))}
        </div>
      </div>

      <MinutesBottomSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}