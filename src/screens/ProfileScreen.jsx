import { useEffect, useState } from "react";

import maleIcon from "../assets/icons/gender-male-vector.svg";
import videoIcon from "../assets/icons/video-vector.svg";
import MinutesBottomSheet from "../components/minute/bottom-sheet/MinuteBottomSheet";

const NAMES = [
  "Liam",
  "Noah",
  "James",
  "Oliver",
  "Elijah",
  "William",
  "Henry",
  "Lucas",
  "Benjamin",
  "Theodore",
];

const STORAGE_KEY = "profile_name";

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false); // ✅ bottom sheet state

  useEffect(() => {
    const savedName = localStorage.getItem(STORAGE_KEY);

    if (savedName) {
      setName(savedName);
    } else {
      const randomName =
        NAMES[Math.floor(Math.random() * NAMES.length)];

      localStorage.setItem(STORAGE_KEY, randomName);
      setName(randomName);
    }
  }, []);

  return (
    <div style={styles.screen}>
      {/* PROFILE HEADER */}
      <div style={styles.header}>
        <img
          src="https://i.pravatar.cc/150?img=12"
          alt="profile"
          style={styles.avatar}
        />

        <div style={styles.info}>
          <h2 style={styles.name}>{name || "Loading..."}</h2>

          <div style={styles.metaRow}>
            <div style={styles.metaItem}>
              <img src={maleIcon} alt="gender" style={styles.iconSmall} />
              <span style={styles.metaText}>21</span>
            </div>

            <div style={styles.metaItem}>
              <img
                src="https://flagcdn.com/w40/ke.png"
                alt="flag"
                style={styles.flag}
              />
              <span style={styles.metaText}>Kenya</span>
            </div>

            <span style={styles.verified}>Verified</span>
          </div>
        </div>
      </div>

      {/* STATS CARD */}
      <div style={styles.card}>
        <div style={styles.stats}>
          <img src={videoIcon} alt="videos" style={styles.videoIcon} />
          <span style={styles.statNumber}>1 Minute</span>
        </div>

        {/* ✅ FIXED BUTTON */}
        <button style={styles.button} onClick={() => setOpen(true)}>
          Get Minutes
        </button>
      </div>

      {/* ✅ BOTTOM SHEET */}
      <MinutesBottomSheet
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}

const styles = {
  screen: {
    padding: "16px",
    backgroundColor: "#fff", // optional safety
    minHeight: "100vh",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "20px",
  },

  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    border: "4px solid #362459",
    objectFit: "cover",
  },

  info: {
    display: "flex",
    flexDirection: "column",
  },

  name: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "bold",
    color: "#000",
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
  },

  metaText: {
    fontSize: "13px",
    color: "#000",
  },

  iconSmall: {
    width: "14px",
    height: "14px",
  },

  flag: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
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
    fontSize: "16px",
    fontWeight: "bold",
    color: "#fff",
  },

  button: {
    backgroundColor: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    color: "#4E3480", // ✅ FIX (text now visible)
  },
};