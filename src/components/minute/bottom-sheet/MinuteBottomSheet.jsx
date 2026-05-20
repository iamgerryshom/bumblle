import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MinutesCard from "../card/MinutesCard";
import cancelIcon from "../../../assets/icons/cancel-vector.svg";

export default function MinutesBottomSheet({ open, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const minutesData = [
    { id: 1, minutes: 35,  price: 100, usd: 0.78 },
    { id: 2, minutes: 50,  price: 150, usd: 1.16 },
    { id: 3, minutes: 70,  price: 200, usd: 1.55 },
    { id: 4, minutes: 100, price: 250, usd: 1.94 },
    { id: 5, minutes: 130, price: 300, usd: 2.32 },
    { id: 6, minutes: 160, price: 350, usd: 2.71 },
  ];

  const handleSelect = (item) => {
    onClose();
    navigate("/checkout", {
      state: { minutes: item.minutes, amount: item.price },
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        .bs-overlay {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .bs-overlay.open {
          opacity: 1;
          pointer-events: all;
        }
        .bs-sheet {
          transform: translateY(100%);
          transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
        }
        .bs-overlay.open .bs-sheet {
          transform: translateY(0);
        }
        .bs-close-btn {
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .bs-close-btn:active {
          transform: scale(0.9);
          background: #e5e5e5 !important;
        }
      `}</style>

      <div
        className={`bs-overlay ${open ? "open" : ""}`}
        style={styles.overlay}
        onClick={onClose}
      >
        <div
          className="bs-sheet"
          style={styles.sheet}
          onClick={(e) => e.stopPropagation()}
        >
          {/* DRAG HANDLE */}
          <div style={styles.dragHandle} />

          {/* HEADER */}
          <div style={styles.header}>
            <div>
              <h3 style={styles.title}>Buy Minutes</h3>
              <p style={styles.subtitle}>Choose a plan that works for you</p>
            </div>
            <button className="bs-close-btn" style={styles.closeBtn} onClick={onClose}>
              <img src={cancelIcon} alt="close" style={styles.icon} />
            </button>
          </div>

          {/* DIVIDER */}
          <div style={styles.divider} />

          {/* GRID */}
          <div style={styles.grid}>
            {minutesData.map((item) => (
              <div key={item.id} onClick={() => handleSelect(item)}>
                <MinutesCard
                  minutes={`${item.minutes} Mins`}
                  price={`Ksh ${item.price}`}
                  usd={`≈ $${item.usd.toFixed(2)}`}
                  showHot={item.id === 1}
                />
              </div>
            ))}
          </div>

          {/* FOOTER NOTE */}
          <p style={styles.footerNote}>Minutes never expire · Secure checkout</p>
        </div>
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(3px)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 999,
  },
  sheet: {
    width: "100%",
    maxWidth: "480px",
    maxHeight: "82vh",
    backgroundColor: "#FAFAFA",
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    padding: "0 16px 28px",
    overflowY: "auto",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
  },
  dragHandle: {
    width: "40px",
    height: "4px",
    backgroundColor: "#D1D1D1",
    borderRadius: "100px",
    margin: "12px auto 0",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "20px 4px 0",
  },
  title: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#111",
    margin: 0,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#888",
    margin: "3px 0 0",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: "500",
  },
  closeBtn: {
    width: "36px",
    height: "36px",
    flexShrink: 0,
    marginTop: "2px",
    border: "none",
    background: "#EBEBEB",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: "16px",
    height: "16px",
    opacity: 0.65,
  },
  divider: {
    height: "1px",
    backgroundColor: "#EBEBEB",
    margin: "16px 0 4px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "8px",
  },
  footerNote: {
    textAlign: "center",
    fontSize: "11px",
    color: "#ABABAB",
    marginTop: "16px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: "500",
    letterSpacing: "0.1px",
  },
};