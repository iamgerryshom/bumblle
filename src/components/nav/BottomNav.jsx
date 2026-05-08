import homeOutline from "../../assets/icons/play-circle-outline.svg";
import homeFilled from "../../assets/icons/play-circle-filled.svg";
import callOutline from "../../assets/icons/call-outline.svg";
import callFilled from "../../assets/icons/call-filled.svg";
import profileOutline from "../../assets/icons/user-outline.svg";
import profileFilled from "../../assets/icons/user-filled.svg";

const tabs = [
  { key: "home", outline: homeOutline, filled: homeFilled, label: "home" },
  { key: "call", outline: callOutline, filled: callFilled, label: "call" },
  { key: "profile", outline: profileOutline, filled: profileFilled, label: "profile" },
];

function BottomNav({ active, setActive }) {
  return (
    <>
      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 70px;
          display: flex;
          justify-content: space-around;
          align-items: center;
          background: rgba(10, 10, 15, 0.85);
          border-top: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 1000;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .nav-item {
          background: transparent;
          border: none;
          outline: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 8px 20px;
          border-radius: 16px;
          position: relative;
          transition: background 0.2s;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          touch-action: manipulation;
        }

        .nav-item:active {
          background: rgba(139, 92, 246, 0.08);
        }

        .nav-icon-wrap {
          position: relative;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-pill {
          position: absolute;
          inset: -6px -14px;
          border-radius: 100px;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.25);
          opacity: 0;
          transform: scale(0.85);
          transition: opacity 0.2s, transform 0.2s;
        }

        .nav-item.active .nav-pill {
          opacity: 1;
          transform: scale(1);
        }

        .nav-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #8b5cf6;
          box-shadow: 0 0 6px #8b5cf6;
          opacity: 0;
          transform: scale(0);
          transition: opacity 0.2s, transform 0.2s;
        }

        .nav-item.active .nav-dot {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>

      <nav className="bottom-nav">
        {tabs.map(({ key, outline, filled, label }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              className={`nav-item${isActive ? " active" : ""}`}
              onClick={() => setActive(key)}
              onFocus={(e) => e.target.blur()}
            >
              <div className="nav-icon-wrap">
                <div className="nav-pill" />
                <img
                  src={isActive ? filled : outline}
                  width={22}
                  height={22}
                  alt={label}
                  style={{
                    filter: isActive
                      ? "invert(1) brightness(2) sepia(1) hue-rotate(220deg) saturate(4)"
                      : "invert(1) brightness(0.35)",
                    transition: "filter 0.2s",
                    position: "relative",
                    zIndex: 1,
                  }}
                />
              </div>
              <div className="nav-dot" />
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default BottomNav;