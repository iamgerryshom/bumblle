import UserItem from "../components/user/UserItem";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import MinutesBottomSheet from "../components/minute/bottom-sheet/MinuteBottomSheet";
import CallOverlay from "../screens/IncomingCall";
import "spinkit/spinkit.min.css";
import settingIcon from "../assets/icons/setting_vector.svg";

export default function HomeScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // 📞 CALL STATE
  const [callUser, setCallUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("gender", "==", "F")
        );

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

        // 🔥 PICK RANDOM USER AFTER LOAD
        if (usersData.length > 0) {
          const random =
            usersData[Math.floor(Math.random() * usersData.length)];

          setTimeout(() => {
            setCallUser(random);
          }, 1500);
        }
      } catch (error) {
        console.log("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div style={styles.screen}>

      {/* HEADER */}
      <div style={styles.header}>
        <h2 style={styles.title}>People</h2>

        <MinutesBottomSheet
          open={open}
          onClose={() => setOpen(false)}
        />

        <button style={styles.iconBtn}>
          <img
            src={settingIcon}
            alt="settings"
            style={{
              width: 22,
              height: 22,
              filter: "brightness(0)",
            }}
          />
        </button>
      </div>

      {/* LIST */}
      <div style={styles.list}>
        {loading ? (
          <div style={styles.loaderWrapper}>
            <div className="sk-circle" style={{ width: 30, height: 30 }}>
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

      {/* BOTTOM SHEET */}
      {open && (
        <div onClick={() => setOpen(false)} style={styles.sheetOverlay}>
          <div style={styles.sheet}>
            <p>Minutes Bottom Sheet</p>
          </div>
        </div>
      )}

      {/* 📞 CALL OVERLAY */}
      <CallOverlay
        visible={!!callUser}
        name={callUser?.name}
        profileUrl={callUser?.image}
        onAnswer={() => {
          console.log("Call answered with:", callUser);
          setCallUser(null);
        }}
        onReject={() => {
          console.log("Call rejected");
          setCallUser(null);
        }}
      />

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
  },
};