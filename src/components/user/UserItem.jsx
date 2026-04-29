import videoIcon from "../../assets/icons/video-vector.svg";

function UserItem({ image, name, region, flag, isOnline, onVideoClick }) {
  return (
    <div style={styles.card}>
      <img src={image} alt="user" style={styles.image} />

      <div style={styles.overlay} />

      <div style={styles.content}>
        <div style={styles.left}>
          <div style={styles.row}>
            <div
              style={{
                ...styles.dot,
                backgroundColor: isOnline ? "#42ED54" : "#999",
              }}
            />
            <span style={styles.name}>{name}</span>
          </div>

          <div style={styles.rowSmall}>
            <img src={flag} alt="flag" style={styles.flag} />
            <span style={styles.region}>{region}</span>
          </div>
        </div>

        {/* VIDEO BUTTON */}
        <div style={styles.videoBtn} onClick={onVideoClick}>
          <div style={styles.circle}>
            <img
              src={videoIcon}
              alt="video"
              style={styles.videoIcon}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    position: "relative",
    width: "100%",
    height: "300px",
    borderRadius: "16px",
    overflow: "hidden",
    marginTop: "0dp",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
  },

  content: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  left: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0, // important for layout stability
  },

  row: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    minWidth: 0,
  },

  rowSmall: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  name: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: "14px",

    maxWidth: "140px", // 👈 key fix (controls alignment)

    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  region: {
    color: "#eee",
    fontSize: "12px",
  },

  flag: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    flexShrink: 0,
  },

  videoBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  videoIcon: {
    width: "24px",
    height: "24px",
    filter: "invert(28%) sepia(18%) saturate(2500%) hue-rotate(225deg) brightness(90%) contrast(90%)"
  },

  circle: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default UserItem;