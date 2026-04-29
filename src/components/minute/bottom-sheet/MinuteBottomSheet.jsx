import { useNavigate } from "react-router-dom";
import MinutesCard from "../card/MinutesCard";

export default function MinutesBottomSheet({ open, onClose }) {
  const navigate = useNavigate();

  if (!open) return null;

  const minutesData = [
    { id: 1, minutes: 10, price: 150 },
    { id: 2, minutes: 15, price: 200 },
    { id: 3, minutes: 20, price: 250 },
    { id: 4, minutes: 30, price: 300 },
    { id: 5, minutes: 45, price: 350 },
    { id: 6, minutes: 60, price: 450 },
  ];

  const handleSelect = (item) => {
    onClose(); // close bottom sheet first

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
        </div>

        {/* GRID */}
        <div style={styles.grid}>
          {minutesData.map((item) => (
            <div key={item.id} onClick={() => handleSelect(item)}>
              <MinutesCard
                minutes={`${item.minutes} Mins`} price={`Ksh ${item.price}`}
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
    padding: "8px",
  },

  title: {
    fontSize: "17px",
    fontWeight: "bold",
    margin: 0,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)", // 👈 span count = 3
    gap: "8px",
    marginTop: "8px",
  },
};