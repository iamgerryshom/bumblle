import UserItem from "../components/user/UserItem";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import MinutesBottomSheet from "../components/minute/bottom-sheet/MinuteBottomSheet";
import IncomingCallScreen from "./IncomingCallScreen";
import OngoingCallScreen from "./OngoingCallScreen";
import OutgoingCallScreen from "../screens/OutgoingCallScreen";
import "spinkit/spinkit.min.css";
import settingIcon from "../assets/icons/setting_vector.svg";

export default function HomeScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [callUser, setCallUser] = useState(null);
  const [videoCallVisible, setVideoCallVisible] = useState(false);
  const [outgoingCallUser, setOutgoingCallUser] = useState(null);
  const [activeCallUser, setActiveCallUser] = useState(null);
  const [popup, setPopup] = useState(null);
  const [toast, setToast] = useState(null);

  const outgoingCallRef = useRef(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      const q = query(collection(db, "users"), where("gender", "==", "F"));
      const snapshot = await getDocs(q);

      const usersData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          region: data.countryNameCode,
          image: data.photoUrl,
          age: data.age,
          online: Math.random() > 0.3,
          remoteVideoId: data.remoteVideoId,
          flag: `https://flagcdn.com/w40/${data.countryNameCode?.toLowerCase()}.png`,
          remoteVideoUrl: data.remoteVideoUrl ?? null,
        };
      });

      const shuffled = usersData.sort(() => Math.random() - 0.5);
      setUsers(shuffled);

      if (shuffled.length > 0) {
        const storedValue = localStorage.getItem("hasSeenIncomingCallv3");
        const isFirstTime = storedValue !== "true";
        const blockedIds = JSON.parse(localStorage.getItem("blockedUserIds") || "[]");
        const availableUsers = shuffled.filter((u) => !blockedIds.includes(u.id));

        let callerUser;

        if (isFirstTime) {
          const specificUser = usersData.find((u) => u.id === "pvX4B8sGWoprOChWVQgQ");
          callerUser = specificUser ?? availableUsers[Math.floor(Math.random() * availableUsers.length)];
          localStorage.setItem("hasSeenIncomingCallv3", "true");
        } else {
          if (availableUsers.length === 0) {
            setLoading(false);
            return;
          }
          callerUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
        }

        setTimeout(() => {
          if (!outgoingCallRef.current) {
            setCallUser(callerUser);
          }
        }, 3000);
      }

      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleVideoClick = async (user) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const blockedIds = JSON.parse(localStorage.getItem("blockedUserIds") || "[]");
      if (blockedIds.includes(user.id)) {
        setToast("This user appears to be busy. Try again another time");
        setTimeout(() => setToast(null), 2500);
        return;
      }

      const userSnap = await getDoc(doc(db, "users", userId));
      if (!userSnap.exists()) return;

      const seconds = Number(userSnap.data().seconds ?? 0);

      if (seconds < 10) {
        setOpen(true);
        return;
      }

      setCallUser(null);
      outgoingCallRef.current = user;
      setOutgoingCallUser(user);
    } catch (err) {
      console.error("Error checking seconds:", err);
    }
  };

  const handleAnswer = () => {
    setActiveCallUser(callUser);
    setCallUser(null);
    setVideoCallVisible(true);
  };

  const handleReject = () => {
    setCallUser(null);
  };

  const handleEndOutgoingCall = () => {
    outgoingCallRef.current = null;
    setActiveCallUser(outgoingCallUser);
    setOutgoingCallUser(null);
    setVideoCallVisible(true);
  };

  const handleEndVideoCall = () => {
    setVideoCallVisible(false);
    setActiveCallUser(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .home-screen {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0a0a0f;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          position: relative;
        }

        .home-screen::before {
          content: '';
          position: absolute;
          top: -120px;
          right: -80px;
          width: 340px;
          height: 340px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .home-screen::after {
          content: '';
          position: absolute;
          bottom: 60px;
          left: -100px;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .home-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 20px 12px;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .home-header-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .home-eyebrow {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8b5cf6;
        }

        .home-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #f1f1f5;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          backdrop-filter: blur(8px);
        }

        .icon-btn:hover {
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.4);
        }

        .icon-btn img {
          width: 18px;
          opacity: 0.7;
          filter: invert(1);
        }

        .online-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 20px 14px;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .online-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .online-text {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
          font-weight: 400;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent);
          margin: 0 20px 16px;
          flex-shrink: 0;
        }

        .user-list {
          flex: 1;
          overflow-y: auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 0 16px 100px;
          position: relative;
          z-index: 1;
          scrollbar-width: none;
        }

        .user-list::-webkit-scrollbar { display: none; }

        .loader-wrapper {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 60px;
          min-height: 200px;
        }

        .toast {
          position: fixed;
          bottom: 110px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(20, 20, 30, 0.95);
          color: #f1f1f5;
          padding: 10px 22px;
          border-radius: 100px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          z-index: 999999;
          white-space: nowrap;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          backdrop-filter: blur(12px);
          animation: toastIn 0.25s ease;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
          backdrop-filter: blur(4px);
        }

        .popup {
          background: #14141e;
          border: 1px solid rgba(255,255,255,0.08);
          padding: 24px 28px;
          border-radius: 20px;
          text-align: center;
          min-width: 240px;
          color: #f1f1f5;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        }
      `}</style>

      <div className="home-screen">
        <div className="home-header">
          <div className="home-header-left">
            <span className="home-eyebrow">Discover</span>
            <h2 className="home-title">People</h2>
          </div>
          <button className="icon-btn">
            <img src={settingIcon} alt="Settings" />
          </button>
        </div>

        <div className="online-bar">
          <div className="online-dot" />
          <span className="online-text">
            {users.filter(u => u.online).length} online now
          </span>
        </div>

        <div className="divider" />

        <div className="user-list">
          {loading ? (
            <div className="loader-wrapper">
              <div className="sk-circle" style={{ width: 36, height: 36, color: "#8b5cf6" }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="sk-circle-dot" />
                ))}
              </div>
            </div>
          ) : (
            users.map((user) => (
              <UserItem
                key={user.id}
                image={user.image}
                name={user.name}
                region={`${user.region} • ${user.age}`}
                flag={user.flag}
                isOnline={user.online}
                onVideoClick={() => handleVideoClick(user)}
              />
            ))
          )}
        </div>

        <MinutesBottomSheet open={open} onClose={() => setOpen(false)} />

        <IncomingCallScreen
          visible={!!callUser && !outgoingCallUser}
          name={callUser?.name}
          profileUrl={callUser?.image}
          onAnswer={handleAnswer}
          onReject={handleReject}
        />

        <OngoingCallScreen
          visible={videoCallVisible}
          onEnd={handleEndVideoCall}
          remoteVideoUrl={activeCallUser?.remoteVideoUrl ?? null}
          remoteUser={activeCallUser ?? null}
        />

        {outgoingCallUser && (
          <OutgoingCallScreen
            user={outgoingCallUser}
            onEnd={handleEndOutgoingCall}
          />
        )}

        {toast && <div className="toast">{toast}</div>}

        {popup === "insufficient" && (
          <div className="popup-overlay">
            <div className="popup">Call Ended — Insufficient minutes</div>
          </div>
        )}
      </div>
    </>
  );
}