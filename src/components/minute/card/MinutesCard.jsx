import videoIcon from "../../../assets/icons/video-vector.svg";

export default function MinutesCard({
  minutes = "10 Mins",
  price = "Ksh 100",
  showHot = false,
}) {
  return (
    <div style={styles.card} className="minutes-pkg-card">
      <style>{`
        .minutes-pkg-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .minutes-pkg-card:active {
          transform: scale(0.96);
          box-shadow: 0 2px 8px rgba(0,0,0,0.10) !important;
        }
        @media (hover: hover) {
          .minutes-pkg-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 28px rgba(0,0,0,0.13) !important;
          }
        }
      `}</style>

      {showHot && <div style={styles.hotBadge}>🔥 HOT</div>}

      <div style={styles.content}>
        <div style={styles.iconWrap}>
          <img src={videoIcon} alt="video" style={styles.icon} />
        </div>
        <span style={styles.minutes}>{minutes}</span>
        <div style={styles.priceStrip}>{price}</div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    position: "relative",
    backgroundColor: "#1A1A2E",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "24px",
  },
  iconWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,174,41,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10px",
    border: "1.5px solid rgba(255,174,41,0.25)",
  },
  icon: {
    width: "22px",
    height: "22px",
    filter: "brightness(0) saturate(100%) invert(72%) sepia(75%) saturate(600%) hue-rotate(5deg) brightness(103%) contrast(101%)",
  },
  minutes: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: "0.2px",
    marginBottom: "14px",
    fontFamily: "'DM Sans', sans-serif",
  },
  priceStrip: {
    width: "100%",
    background: "linear-gradient(90deg, #FFAE29 0%, #FF8C00 100%)",
    color: "#1A1A2E",
    fontWeight: "800",
    fontSize: "12px",
    textAlign: "center",
    padding: "8px 0",
    letterSpacing: "0.3px",
    fontFamily: "'DM Sans', sans-serif",
  },
  hotBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "linear-gradient(135deg, #FF4D4D, #FF1A75)",
    color: "#fff",
    fontSize: "9px",
    fontWeight: "800",
    padding: "3px 7px",
    borderRadius: "20px",
    letterSpacing: "0.5px",
    zIndex: 2,
    boxShadow: "0 2px 8px rgba(255,26,117,0.4)",
    fontFamily: "'DM Sans', sans-serif",
  },
};