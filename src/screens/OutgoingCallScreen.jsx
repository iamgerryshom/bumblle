import { useState, useEffect } from "react";

export default function OutgoingCallScreen({ user, onEnd }) {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  useEffect(() => {
    const delay = Math.floor(Math.random() * 20000) + 10000; // 10s–30s
    const timer = setTimeout(() => onEnd(), delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.screen}>
      <div style={styles.bgGlow} />

      <div style={styles.content}>
        <div style={styles.avatarRing}>
          <div style={{ ...styles.pulseRing, animationDelay: "0s" }} />
          <div style={{ ...styles.pulseRing, animationDelay: "0.6s" }} />
          {user?.image ? (
            <img src={user.image} alt={user.name} style={styles.avatarImg} />
          ) : (
            <div style={styles.avatarInitials}>{initials}</div>
          )}
        </div>

        <p style={styles.callerName}>{user?.name ?? "Unknown"}</p>
        <p style={styles.callerInfo}>Mobile</p>

        <div style={styles.statusRow}>
          <div style={styles.dot} />
          <span style={styles.callingText}>Calling…</span>
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.actionRow}>
          <ActionButton
            icon={muted ? "🔇" : "🎙️"}
            label={muted ? "Unmute" : "Mute"}
            active={muted}
            onPress={() => setMuted((m) => !m)}
          />

          <button style={styles.endBtn} onClick={onEnd} aria-label="End call">
            <EndCallIcon />
          </button>

          <ActionButton
            icon="🔊"
            label="Speaker"
            active={speaker}
            onPress={() => setSpeaker((s) => !s)}
          />
        </div>

        <p style={styles.swipeHint}>swipe up to message</p>
      </div>

      <style>{keyframes}</style>
    </div>
  );
}

function ActionButton({ icon, label, active, onPress }) {
  return (
    <button style={styles.actionBtn} onClick={onPress} aria-label={label}>
      <div
        style={{
          ...styles.actionIcon,
          background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)",
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <span style={styles.actionLabel}>{label}</span>
    </button>
  );
}

function EndCallIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: "rotate(135deg)" }}
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.1 2.22 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91A16 16 0 0016.09 17.91l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

const keyframes = `
  @keyframes pulse {
    0% { transform: scale(0.92); opacity: 1; }
    100% { transform: scale(1.4); opacity: 0; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes ringGlow {
    0% { box-shadow: 0 0 0 0 rgba(229,62,62,0.45); }
    70% { box-shadow: 0 0 0 12px rgba(229,62,62,0); }
    100% { box-shadow: 0 0 0 0 rgba(229,62,62,0); }
  }
`;

const styles = {
  screen: {
    position: "fixed",
    inset: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#0d0d0d",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'DM Sans', -apple-system, sans-serif",
    zIndex: 999999,
    overflow: "hidden",
  },
  bgGlow: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse 320px 320px at 50% 38%, #1a3a2a 0%, #0d0d0d 70%)",
    zIndex: 0,
  },
  content: {
    position: "relative",
    zIndex: 1,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    position: "relative",
    width: 120,
    height: 120,
    marginBottom: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    inset: -18,
    borderRadius: "50%",
    border: "1.5px solid rgba(52,211,153,0.25)",
    animation: "pulse 2s ease-out infinite",
  },
  avatarImg: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(52,211,153,0.4)",
    position: "relative",
    zIndex: 2,
  },
  avatarInitials: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1e3a2e, #0f2319)",
    border: "2px solid rgba(52,211,153,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    fontWeight: 300,
    color: "rgba(255,255,255,0.85)",
    position: "relative",
    zIndex: 2,
  },
  callerName: {
    fontSize: 26,
    fontWeight: 500,
    color: "#fff",
    letterSpacing: "-0.5px",
    margin: "0 0 6px",
  },
  callerInfo: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    margin: 0,
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#34d399",
    animation: "blink 1.5s ease-in-out infinite",
  },
  callingText: {
    fontSize: 13,
    color: "#34d399",
    letterSpacing: "0.06em",
  },
  footer: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
    paddingBottom: 52,
  },
  actionRow: {
    display: "flex",
    gap: 44,
    alignItems: "center",
  },
  actionBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "0.5px solid rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s",
  },
  actionLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "0.03em",
  },
  endBtn: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#e53e3e",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "ringGlow 2s ease-out infinite",
    transition: "transform 0.1s, background 0.15s",
  },
  swipeHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.18)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    margin: 0,
  },
};