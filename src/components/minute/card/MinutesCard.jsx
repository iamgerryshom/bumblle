export default function MinutesCard({ minutes = "10 Mins", price = "Ksh 100" }) {
  return (
    <div style={styles.card}>
      <div style={styles.content}>

        {/* ICON */}
        <img
          src="/src/assets/icons/video-vector.svg"
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
    backgroundColor: "#fff",
    borderRadius: "8px",
    margin: "8px 4px",
    padding: "32px 0px 0px",
    borderRadius: "16px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.04)"
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
    filter: "brightness(0)", // black tint like Android
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
};