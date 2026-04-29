import UserItem from "../components/user/UserItem";
import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import MinutesBottomSheet from "../components/minute/bottom-sheet/MinuteBottomSheet";
import CallOverlay from "../screens/IncomingCall";
import VideoCallScreen from "../screens/VideoCallScreen";
import "spinkit/spinkit.min.css";
import settingIcon from "../assets/icons/setting_vector.svg";

export default function HomeScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [callUser, setCallUser] = useState(null);
  const [videoCallVisible, setVideoCallVisible] = useState(false);
  const [popup, setPopup] = useState(null);
  const [toast, setToast] = useState(null);

  const hasHadFirstCall = useRef(
    localStorage.getItem("has_had_first_call") === "true"
  );

  useEffect(() => {
    const fetchUsers = async () => {
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
          online: true,
          flag: `https://flagcdn.com/w40/${data.countryNameCode?.toLowerCase()}.png`,
        };
      });

      setUsers(usersData);

      if (usersData.length > 0) {
        const random =
          usersData[Math.floor(Math.random() * usersData.length)];
        setTimeout(() => setCallUser(random), 3000);
      }

      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleAnswer = () => {
    setCallUser(null);

    if (hasHadFirstCall.current) {
      setToast("Insufficient minutes");
      setTimeout(() => setToast(null), 2500);
      setOpen(true);
      return;
    }

    hasHadFirstCall.current = true;
    localStorage.setItem("has_had_first_call", "true");

    setVideoCallVisible(true);
  };

  const handleReject = () => {
    setCallUser(null);
  };

  useEffect(() => {
    if (!videoCallVisible) return;

    const timer = setTimeout(() => {
      setVideoCallVisible(false);
      setCallUser(null);
      setPopup("insufficient");

      setTimeout(() => {
        setPopup(null);
      }, 2000);

    }, 30000);

    return () => clearTimeout(timer);
  }, [videoCallVisible]);

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <h2 style={styles.title}>People</h2>
        <button style={styles.iconBtn}>
          <img src={settingIcon} style={{ width: 22 }} />
        </button>
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.loaderWrapper}>
            {/* ✅ FIXED LOADER */}
            <div
              className="sk-circle"
              style={{ width: 40, height: 40, color: "#4E3480" }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="sk-circle-dot"></div>
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
              onVideoClick={() => setOpen(true)}
            />
          ))
        )}
      </div>

      <MinutesBottomSheet open={open} onClose={() => setOpen(false)} />

      <CallOverlay
        visible={!!callUser}
        name={callUser?.name}
        profileUrl={callUser?.image}
        onAnswer={handleAnswer}
        onReject={handleReject}
      />

      <VideoCallScreen
        visible={videoCallVisible}
        onEnd={() => setVideoCallVisible(false)}
      />

      {toast && <div style={styles.toast}>{toast}</div>}

      {popup === "insufficient" && (
        <div style={styles.popupOverlay}>
          <div style={styles.popup}>
            Call Ended - Insufficient minutes
          </div>
        </div>
      )}
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    flexShrink: 0,
  },
  title: {
    fontSize: "20px",
    fontWeight: "bold",
    margin: 0,
    color: "#111",
  },
  iconBtn: {
    width: "36px",
    height: "36px",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
    paddingBottom: "80px",
  },
  loaderWrapper: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    minHeight: "200px",
  },
  toast: {
    position: "fixed",
    bottom: "100px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#222",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "20px",
    fontSize: "13px",
    zIndex: 999999,
    whiteSpace: "nowrap",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  popupOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100000,
  },
  popup: {
    backgroundColor: "#fff",
    padding: "20px 24px",
    borderRadius: "12px",
    textAlign: "center",
    minWidth: "220px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
};