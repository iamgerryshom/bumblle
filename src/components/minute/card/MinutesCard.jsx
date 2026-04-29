import videoIcon from "../../../assets/icons/video-vector.svg";

export default function MinutesCard({
  minutes = "10 Mins",
  price = "Ksh 100",
  showHot = false, // 🔥 NEW PROP
}) {
  return (
    <div style={styles.card}>
      <div style={styles.content}>

        {/* 🔥 HOT BADGE */}
        {showHot && (
          <div style={styles.hotBadge}>
            HOT
          </div>
        )}

        {/* ICON */}
        <img
          src={videoIcon}
          alt="video"
          style={styles.icon}
        />

        {/* MINUTES */}
        <span style={styles.minutes}>{minutes}</span>

        {/* PRICE BUTTON */}
        <div style={styles.price}>
          {price}
        </div>

      </div>
    </div>
  );
}

const styles = {
  card: {
    position: "relative", // 🔥 needed for badge positioning
    backgroundColor: "#fff",
    borderRadius: "16px",
    margin: "8px 4px",
    padding: "32px 0px 0px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.04)",
  },

  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    width: "30px",
    height: "30px",
    marginBottom: "16px",
    filter: "brightness(0)",
  },

  minutes: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#000",
    marginBottom: "8px",
  },

  price: {
    width: "100%",
    backgroundColor: "#FFAE29",
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    padding: "6px 0",
    borderRadius: "0px 0px 8px 8px",
  },

  // 🔥 HOT BADGE STYLE
  hotBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "linear-gradient(135deg, #ff4d4d, #ff1a75)",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "3px 8px",
    borderRadius: "12px",
    letterSpacing: "0.5px",
    boxShadow: "0 3px 8px rgba(255,0,0,0.3)",
  },
};