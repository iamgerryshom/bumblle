import { useNavigate } from "react-router-dom";
import MinutesCard from "../card/MinutesCard";
import cancelIcon from "../../../assets/icons/cancel-vector.svg"; // 👈 reuse or replace with close icon

export default function MinutesBottomSheet({ open, onClose }) {
  const navigate = useNavigate();

  if (!open) return null;

  const minutesData = [
    { id: 1, minutes: 35, price: 100 },
    { id: 2, minutes: 50, price: 150 },
    { id: 3, minutes: 70, price: 200 },
    { id: 4, minutes: 100, price: 250 },
    { id: 5, minutes: 130, price: 300 },
    { id: 6, minutes: 160, price: 350 },
  ];

  const handleSelect = (item) => {
    onClose();

    navigate("/checkout", {
      state: {
        minutes: item.minutes,
        amount: item.price,
      },
    });
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div style={styles.header}>
          <h3 style={styles.title}>Buy Minutes</h3>

          {/* ❌ CLOSE ICON */}
          <button style={styles.closeBtn} onClick={onClose}>
            <img src={cancelIcon} alt="close" style={styles.icon} />
          </button>
        </div>

        {/* GRID */}
        <div style={styles.grid}>
          {minutesData.map((item) => (
            <div key={item.id} onClick={() => handleSelect(item)}>
              <MinutesCard
                minutes={`${item.minutes} Mins`}
                price={`Ksh ${item.price}`}
                showHot={item.id == 1 ? true : false}
              />
            </div>
          ))}
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
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 999,
  },

  sheet: {
    width: "100%",
    maxHeight: "80vh",
    backgroundColor: "#fff",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    padding: "12px 8px 20px",
    overflowY: "auto",
  },

  header: {
    position: "relative",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: "17px",
    fontWeight: "bold",
    margin: 0,
  },

  closeBtn: {
  position: "absolute",
  right: "10px",
  top: "6px",
  width: "40px",        // ⬆️ bigger touch area
  height: "40px",
  border: "none",
  background: "#F2F2F2", // optional: subtle background
  borderRadius: "50%",   // makes it look like a real button
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
},

icon: {
  width: "22px",  // ⬆️ bigger icon
  height: "22px",
  opacity: 0.8,
},

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginTop: "8px",
  },
};