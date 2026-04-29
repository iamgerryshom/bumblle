export default function CallScreen() {
  return (
    <div style={styles.screen}>
      {/* HEADER (same as People screen) */}
      <div style={styles.header}>
        <h2 style={styles.title}>Calls</h2>

        {/* optional right icon space for future consistency */}
        <div style={styles.iconPlaceholder} />
      </div>

      {/* EMPTY STATE */}
      <div style={styles.empty}>
        <img
          src="/src/assets/icons/no_data_vector.svg"
          alt="no data"
          style={styles.image}
        />

        <p style={styles.text}>No more data</p>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: "16px",
  },

  header: {
    display: "flex",              // 👈 SAME AS HOME
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  title: {
    fontSize: "20px",
    fontWeight: "bold",
    margin: 0,
    color: "#111",
  },

  iconPlaceholder: {
    width: "36px",  // keeps alignment identical to HomeScreen icon button
    height: "36px",
  },

  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100px",
    height: "100px",
    objectFit: "contain",
  },

  text: {
    marginTop: "24px",
    fontSize: "14px",
    color: "#666",
  },
};