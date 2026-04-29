import maleIcon from "../assets/icons/gender-male-vector.svg";
import videoIcon from "../assets/icons/video-vector.svg";

export default function ProfileScreen() {
  return (
    <div style={styles.screen}>
      {/* PROFILE HEADER */}
      <div style={styles.header}>
        {/* AVATAR */}
        <img
          src="https://i.pravatar.cc/150?img=12"
          alt="profile"
          style={styles.avatar}
        />

        {/* INFO */}
        <div style={styles.info}>
          
          <h2 style={styles.name}>Username</h2>

          {/* META ROW */}
          <div style={styles.metaRow}>
            {/* AGE */}
            <div style={styles.metaItem}>
              <img
            src={maleIcon}
                alt="gender"
                style={styles.iconSmall}
              />
              <span style={styles.metaText}>21</span>
            </div>

            {/* REGION */}
            <div style={styles.metaItem}>
              <img
                src="https://flagcdn.com/w40/ke.png"
                alt="flag"
                style={styles.flag}
              />
              <span style={styles.metaText}>Kenya</span>
            </div>

            {/* VERIFIED */}
            <span style={styles.verified}>Verified</span>
          </div>
        </div>
      </div>

      {/* STATS CARD */}
      <div style={styles.card}>
        <div style={styles.stats}>
          <img
            src={videoIcon}
            alt="videos"
            style={styles.videoIcon}
          />
          <span style={styles.statNumber}>10</span>
        </div>

        <button style={styles.button}>
          Get Minutes
        </button>
        
      </div>
    </div>
  );
}

const styles = {
  screen: {
    padding: "16px",
  },

  header: {
    display: "flex",
    alignItems: "center", // ✅ FIXED ALIGNMENT
    gap: "12px",
    marginTop: "20px",
  },

  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    border: "4px solid #362459",
    objectFit: "cover",
    flexShrink: 0,
  },

  info: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    lineHeight: 1.2,
  },

  name: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "bold",
    color: "#000",
    lineHeight: 1.1,
  },

  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "6px",
    flexWrap: "wrap",
  },

  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    lineHeight: 1,
  },

  metaText: {
    fontSize: "13px",
    color: "#000",
  },

  iconSmall: {
    width: "14px",
    height: "14px",
    display: "block", // ✅ FIX SVG alignment issue
  },

  flag: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    display: "block",
  },

  verified: {
    fontSize: "12px",
    backgroundColor: "#EDECEC",
    padding: "2px 10px",
    borderRadius: "8px",
    color: "#9B9B9B",
  },

  card: {
    marginTop: "24px",
    backgroundColor: "#4E3480",
    padding: "16px",
    borderRadius: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  stats: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  videoIcon: {
    width: "20px",
    height: "20px",
    filter: "brightness(0) invert(1)",
  },

  statNumber: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#fff",
  },

  button: {
  backgroundColor: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "500",
  color: "#000", // ✅ ADD THIS
},
};