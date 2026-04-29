import homeOutline from "../../assets/icons/play-circle-outline.svg";
import homeFilled from "../../assets/icons/play-circle-filled.svg";

import callOutline from "../../assets/icons/call-outline.svg";
import callFilled from "../../assets/icons/call-filled.svg";

import profileOutline from "../../assets/icons/user-outline.svg";
import profileFilled from "../../assets/icons/user-filled.svg";

function BottomNav({ active, setActive }) {
  return (
    <div style={styles.nav}>
      {/* HOME */}
      <button
        onClick={() => setActive("home")}
        style={styles.item}
        onFocus={(e) => e.target.blur()}
      >
        <img
          src={active === "home" ? homeFilled : homeOutline}
          width={24}
          height={24}
          alt="home"
          style={{
            filter:
              active === "home"
                ? "brightness(0)" // black
                : "brightness(0) opacity(0.4)", // grey
          }}
        />
      </button>

      {/* CALLS */}
      <button
        onClick={() => setActive("call")}
        style={styles.item}
        onFocus={(e) => e.target.blur()}
      >
        <img
          src={active === "call" ? callFilled : callOutline}
          width={24}
          height={24}
          alt="call"
          style={{
            filter:
              active === "call"
                ? "brightness(0)"
                : "brightness(0) opacity(0.4)",
          }}
        />
      </button>

      {/* PROFILE */}
      <button
        onClick={() => setActive("profile")}
        style={styles.item}
        onFocus={(e) => e.target.blur()}
      >
        <img
          src={active === "profile" ? profileFilled : profileOutline}
          width={24}
          height={24}
          alt="profile"
          style={{
            filter:
              active === "profile"
                ? "brightness(0)"
                : "brightness(0) opacity(0.4)",
          }}
        />
      </button>
    </div>
  );
}

const styles = {
  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70px",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTop: "1px solid #ddd",
  },

  item: {
    background: "transparent",
    border: "none",
    padding: 0,
    outline: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    // remove mobile tap + selection effects
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
    touchAction: "manipulation",
  },
};

export default BottomNav;