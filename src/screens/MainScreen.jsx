import { useEffect, useState } from "react";

import BottomNav from "../components/nav/BottomNav";
import HomeScreen from "./HomeScreen";
import CallScreen from "./CallScreen";
import ProfileScreen from "./ProfileScreen";

// Firebase Auth
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";

// SpinKit
import "spinkit/spinkit.min.css";

export default function MainScreen() {
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

 


  // ✅ Read ref from query param and persist to localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      localStorage.setItem("refCode", refCode);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
      } else {
        try {
          const result = await signInAnonymously(auth);
          setUser(result.user);
        } catch (err) {
          console.error("Anonymous login failed:", err);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen user={user} />;
      case "call":
        return <CallScreen user={user} />;
      case "profile":
        return <ProfileScreen user={user} />;
      default:
        return <HomeScreen user={user} />;
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div className="sk-circle">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="sk-circle-dot"></div>
          ))}
        </div>
        <p style={styles.loadingText}>Starting session...</p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.screen}>
        {renderScreen()}
      </div>
      <BottomNav active={activeTab} setActive={setActiveTab} />
    </div>
  );
}

const styles = {
  app: {
    height: "100vh",
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
  },
  screen: {
    paddingBottom: "70px",
    height: "100%",
    overflowY: "auto",
  },
  loading: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#666",
  },
};