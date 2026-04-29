import React, { useEffect, useState } from "react";

import answerIcon from "../assets/icons/accept-vector.svg";
import rejectIcon from "../assets/icons/reject-vector.svg";
import "spinkit/spinkit.min.css";

export default function CallOverlay({
  visible,
  name,
  profileUrl,
  onAnswer,
  onReject,
}) {
  const [locked, setLocked] = useState(false);

  // ✅ IMAGE LOAD STATE (NEW FIX)
  const [loaded, setLoaded] = useState(false);

  // ⏱️ AUTO DISMISS AFTER 30 SECONDS
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onReject?.();
    }, 30000);
    return () => clearTimeout(timer);
  }, [visible, onReject]);

  // reset state when closed
  useEffect(() => {
    if (!visible) {
      setLocked(false);
      setLoaded(false); // ✅ reset image state
    }
  }, [visible]);

  // ✅ ANSWER
  const handleAnswer = () => {
    if (locked) return;
    setLocked(true);
    onAnswer?.();
  };

  // ❌ REJECT
  const handleReject = () => {
    onReject?.();
  };

  if (!visible) return null;

  return (
    <div style={styles.overlay}>

      {/* CENTER */}
      <div style={styles.center}>
        <div style={styles.avatarWrapper}>

          {/* 🔥 SMOOTH LOAD FIX */}
          {!loaded && (
            <div className="sk-pulse" style={styles.pulseSpinner} />
          )}

          <img
            src={profileUrl}
            alt="profile"
            style={{
              ...styles.avatar,
              opacity: loaded ? 1 : 0,
              transform: loaded ? "scale(1)" : "scale(1.05)",
              transition: "all 0.3s ease",
            }}
            onLoad={() => setLoaded(true)}
          />
        </div>

        <div style={styles.name}>{name}</div>
        <div style={styles.callingText}>Incoming video call...</div>
      </div>

      {/* ACTIONS */}
      <div style={styles.actions}>

        {/* REJECT */}
        <div style={styles.actionItem} onClick={handleReject}>
          <div style={styles.buttonWrapper}>
            <div className="sk-bounce" style={styles.spinner}>
              <div className="sk-bounce-dot" style={{ backgroundColor: "#E53935" }} />
              <div className="sk-bounce-dot" style={{ backgroundColor: "#E53935" }} />
            </div>
            <div style={{ ...styles.circle, backgroundColor: "#E53935" }}>
              <img
                src={rejectIcon}
                alt="reject"
                style={{ ...styles.icon, transform: "rotate(136deg)" }}
              />
            </div>
          </div>
          <span style={styles.label}>Reject</span>
        </div>

        {/* ANSWER */}
        <div style={styles.actionItem} onClick={handleAnswer}>
          <div style={styles.buttonWrapper}>
            <div className="sk-bounce" style={styles.spinner}>
              <div className="sk-bounce-dot" style={{ backgroundColor: "#43A047" }} />
              <div className="sk-bounce-dot" style={{ backgroundColor: "#43A047" }} />
            </div>
            <div style={{ ...styles.circle, backgroundColor: "#43A047" }}>
              <img src={answerIcon} alt="answer" style={styles.icon} />
            </div>
          </div>
          <span style={styles.label}>Answer</span>
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "#6A4FB3",
    zIndex: 9999,
    overflow: "hidden",
  },

  center: {
    position: "absolute",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },

  avatarWrapper: {
    width: 220,
    height: 220,
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  pulseSpinner: {
    position: "absolute",
    width: "320px",
    height: "320px",
    transform: "scale(1.3)",
    opacity: 0.5,
    zIndex: 1,
  },

  avatar: {
    width: "170px",
    height: "170px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #7D5CD1",
    zIndex: 2,
  },

  name: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "bold",
  },

  callingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "14px",
  },

  actions: {
    position: "absolute",
    bottom: "40px",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "space-between",
    padding: "0 40px",
  },

  actionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
  },

  buttonWrapper: {
    position: "relative",
    width: "80px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  spinner: {
    position: "absolute",
    width: "110px",
    height: "110px",
    opacity: 0.6,
    zIndex: 1,
  },

  circle: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  icon: {
    width: "30px",
    height: "30px",
    objectFit: "contain",
    filter: "brightness(0) invert(1)",
  },

  label: {
    marginTop: "8px",
    color: "#fff",
    fontSize: "14px",
  },
};