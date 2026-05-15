import React, { useEffect, useState } from "react";

export default function CallOverlay({ visible, name, profileUrl, onAnswer, onReject }) {
  const [locked, setLocked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => onReject?.(), 30000);
    return () => clearTimeout(timer);
  }, [visible, onReject]);

  useEffect(() => {
    if (!visible) {
      setLocked(false);
      setLoaded(false);
    }
  }, [visible]);

  const handleAnswer = () => {
    if (locked) return;
    setLocked(true);
    onAnswer?.();
  };

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  if (!visible) return null;

  return (
    <div style={styles.screen}>
      <style>{keyframes}</style>

      {/* Blurred profile image background with dark gradient fallback while loading */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 320px 320px at 50% 38%, #1a1a3a 0%, #0d0d0d 70%)",
        backgroundImage: profileUrl ? `url(${profileUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: profileUrl ? "blur(6px) brightness(0.55) saturate(1.2)" : "none",
        transform: profileUrl ? "scale(1.08)" : "none",
        zIndex: 0,
      }} />

      {/* Dark overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: profileUrl
          ? "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%)"
          : "none",
        zIndex: 0,
      }} />

      {/* Avatar + caller info */}
      <div style={styles.content}>
        <div style={styles.avatarRing}>
          <div style={{ ...styles.pulseRing, animationDelay: "0s" }} />
          <div style={{ ...styles.pulseRing, animationDelay: "0.6s" }} />

          {profileUrl ? (
            <>
              {!loaded && <div style={styles.avatarInitials}>{initials}</div>}
              <img
                src={profileUrl}
                alt={name}
                style={{
                  ...styles.avatarImg,
                  opacity: loaded ? 1 : 0,
                  position: loaded ? "relative" : "absolute",
                  transform: loaded ? "scale(1)" : "scale(1.05)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                }}
                onLoad={() => setLoaded(true)}
              />
            </>
          ) : (
            <div style={styles.avatarInitials}>{initials}</div>
          )}
        </div>

        <p style={styles.callerName}>{name ?? "Unknown"}</p>
        <p style={styles.callerInfo}>Incoming video call</p>

        <div style={styles.statusRow}>
          <div style={styles.dot} />
          <span style={styles.callingText}>Ringing…</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={styles.footer}>
        <div style={styles.actionRow}>
          {/* Reject */}
          <div style={styles.actionItem} onClick={onReject}>
            <div style={styles.btnWrap}>
              <div style={{ ...styles.ripple, background: "rgba(229,62,62,0.18)", animation: "ripple 2s ease-out infinite" }} />
              <div style={{ ...styles.circle, background: "#e53e3e", animation: "ringGlowRed 2s ease-out infinite" }}>
                <EndCallIcon />
              </div>
            </div>
            <span style={styles.label}>Decline</span>
          </div>

          {/* Answer */}
          <div style={styles.actionItem} onClick={handleAnswer}>
            <div style={styles.btnWrap}>
              <div style={{ ...styles.ripple, background: "rgba(52,211,153,0.18)", animation: "ripple 2s ease-out infinite 0.3s" }} />
              <div style={{ ...styles.circle, background: "#16a34a", animation: "ringGlowGreen 2s ease-out infinite" }}>
                <AnswerCallIcon />
              </div>
            </div>
            <span style={styles.label}>Answer</span>
          </div>
        </div>

        <p style={styles.swipeHint}>swipe up to message</p>
      </div>
    </div>
  );
}

function EndCallIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: "rotate(135deg)" }}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.1 2.22 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91A16 16 0 0016.09 17.91l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function AnswerCallIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.1 2.22 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91A16 16 0 0016.09 17.91l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

const keyframes = `
  @keyframes pulse {
    0% { transform: scale(0.92); opacity: 1; }
    100% { transform: scale(1.45); opacity: 0; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes ripple {
    0% { transform: scale(0.85); opacity: 0.8; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes ringGlowRed {
    0% { box-shadow: 0 0 0 0 rgba(229,62,62,0.45); }
    70% { box-shadow: 0 0 0 12px rgba(229,62,62,0); }
    100% { box-shadow: 0 0 0 0 rgba(229,62,62,0); }
  }
  @keyframes ringGlowGreen {
    0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.45); }
    70% { box-shadow: 0 0 0 12px rgba(22,163,74,0); }
    100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
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
    border: "1.5px solid rgba(139,92,246,0.3)",
    animation: "pulse 2s ease-out infinite",
  },
  avatarImg: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(139,92,246,0.5)",
    zIndex: 2,
  },
  avatarInitials: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2e1e5a, #1a0f38)",
    border: "2px solid rgba(139,92,246,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    fontWeight: 300,
    color: "rgba(255,255,255,0.85)",
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
    background: "#a78bfa",
    animation: "blink 1.5s ease-in-out infinite",
  },
  callingText: {
    fontSize: 13,
    color: "#a78bfa",
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
    gap: 80,
    alignItems: "center",
  },
  actionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    gap: 8,
  },
  btnWrap: {
    position: "relative",
    width: 72,
    height: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 2,
  },
  label: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: "0.04em",
  },
  swipeHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.18)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    margin: 0,
  },
};