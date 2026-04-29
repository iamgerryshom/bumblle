import { useState } from "react";

import BottomNav from "../components/nav/BottomNav";
import HomeScreen from "./HomeScreen";
import CallScreen from "./CallScreen";
import ProfileScreen from "./ProfileScreen";

export default function MainScreen() {
const [activeTab, setActiveTab] = useState("home");

const renderScreen = () => {
switch (activeTab) {
case "home":
return <HomeScreen />;
case "call":
return <CallScreen />;
case "profile":
return <ProfileScreen />;
default:
return <HomeScreen />;
}
};

return ( <div style={styles.app}> <div style={styles.screen}>
{renderScreen()} </div>

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
};
