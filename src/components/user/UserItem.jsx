import { useState } from "react";
import videoIcon from "../../assets/icons/video-vector.svg";

function UserItem({ image, name, region, flag, isOnline, onVideoClick }) {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...styles.card,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 20px 40px rgba(0,0,0,0.35)"
          : "0 4px 16px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* BACKGROUND IMAGE */}
      {!loaded && <div style={styles.placeholder} />}
      <img
        src={image}
        alt="user"
        style={{
          ...styles.image,
          opacity: loaded ? 1 : 0,
          transform: hovered ? "scale(1.05)" : "scale(1)",
        }}
        onLoad={() => setLoaded(true)}
      />

      {/* GRADIENT OVERLAY */}
      <div style={styles.overlay} />

      {/* ONLINE BADGE — top right */}
      {isOnline && (
        <div style={styles.onlineBadge}>
          <div style={styles.onlinePulse} />
          <span style={styles.onlineText}>Live</span>
        </div>
      )}

      {/* BOTTOM CONTENT */}
      <div style={styles.content}>
        <div style={styles.left}>
          <div style={styles.nameRow}>
            <div
              style={{
                ...styles.statusDot,
                backgroundColor: isOnline ? "#34D399" : "#6B7280",
                boxShadow: isOnline ? "0 0 0 3px rgba(52,211,153,0.25)" : "none",
              }}
            />
            <span style={styles.name}>{name}</span>
          </div>

          <div style={styles.regionRow}>
            <img src={flag} alt="flag" style={styles.flag} />
            <span style={styles.region}>{region}</span>
          </div>
        </div>

        {/* VIDEO BUTTON */}
        <button
          style={{
            ...styles.videoBtn,
            transform: hovered ? "scale(1.08)" : "scale(1)",
          }}
          onClick={onVideoClick}
          aria-label={`Start video call with ${name}`}
        >
          <img src={videoIcon} alt="" style={styles.videoIcon} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    position: "relative",
    width: "100%",
    height: "300px",
    borderRadius: "20px",
    overflow: "hidden",
    backgroundColor: "#0f0f0f",
    transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease",
    cursor: "pointer",
  },

  image: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "opacity 0.4s ease, transform 0.4s ease",
  },

  placeholder: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#1a1a1a",
    backgroundImage:
      "linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.0) 100%)",
  },

  onlineBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "999px",
    padding: "4px 10px 4px 8px",
  },

  onlinePulse: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#34D399",
    boxShadow: "0 0 0 2px rgba(52,211,153,0.35)",
  },

  onlineText: {
    color: "#fff",
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },

  content: {
    position: "absolute",
    bottom: "14px",
    left: "14px",
    right: "14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  left: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    minWidth: 0,
    flex: 1,
  },

  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    minWidth: 0,
  },

  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
    transition: "box-shadow 0.2s ease",
  },

  name: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "15px",
    letterSpacing: "-0.01em",
    maxWidth: "150px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  regionRow: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    paddingLeft: "15px",
  },

  flag: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },

  region: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "12px",
    fontWeight: "500",
    letterSpacing: "0.01em",
  },

  videoBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
    padding: 0,
  },

  videoIcon: {
    width: "20px",
    height: "20px",
    filter:
      "invert(28%) sepia(18%) saturate(2500%) hue-rotate(225deg) brightness(90%) contrast(90%)",
  },
};

export default UserItem;