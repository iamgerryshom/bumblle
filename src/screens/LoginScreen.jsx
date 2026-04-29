import { useState, useEffect } from "react";
import "spinkit/spinkit.min.css";
import { auth, googleProvider } from "../firebase";
import {
signInWithRedirect,
getRedirectResult,
onAuthStateChanged
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function LoginScreen() {
const [googleLoading, setGoogleLoading] = useState(false);
const [fastLoading, setFastLoading] = useState(false);

const navigate = useNavigate();

useEffect(() => {
    // Handle redirect result (safe fallback)
    getRedirectResult(auth).catch((error) => {
        console.error("Redirect login error:", error);
    });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User is logged in:", user);

            // ✅ Navigate without reloading app
            navigate("/home", { replace: true });
        }
    });

    return () => unsubscribe();
}, [navigate]);

const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
        await signInWithRedirect(auth, googleProvider);
    } catch (error) {
        console.error("Google login error:", error);
        setGoogleLoading(false);
    }
};

return (
    <div style={styles.container}>
        <div style={styles.inner}>

            <h1 style={styles.title}>Bumble</h1>

            <div style={styles.bottomSection}>

                <div style={styles.buttonWrapper}>

                    {/* Google Button */}
                    <div
                        style={{ ...styles.button, backgroundColor: "#DB3B3B" }}
                        onClick={handleGoogleLogin}
                    >
                        <div style={{ ...styles.buttonContent, opacity: googleLoading ? 0.3 : 1 }}>
                            <img
                                src="/src/assets/icons/google-vector.svg"
                                alt="google"
                                style={styles.icon}
                            />
                            <span style={styles.buttonText}>Google</span>
                        </div>

                        {googleLoading && (
                            <div className="sk-flow" style={{
                                "--sk-color": "#fff",
                                "--sk-size": "20px",
                                margin: 0,
                                position: "absolute"
                            }}>
                                <div className="sk-flow-dot"></div>
                                <div className="sk-flow-dot"></div>
                                <div className="sk-flow-dot"></div>
                            </div>
                        )}

                    </div>

                    {/* Fast Login Button */}
                    <div
                        style={{ ...styles.button, backgroundColor: "#2C9BCC" }}
                        onClick={() => {
                            setFastLoading(true);
                            setTimeout(() => setFastLoading(false), 2000);
                        }}
                    >
                        <div style={{ ...styles.buttonContent, opacity: fastLoading ? 0.3 : 1 }}>
                            <img
                                src="/src/assets/icons/flash-vector.svg"
                                alt="fast"
                                style={styles.icon}
                            />
                            <span style={styles.buttonText}>Fast Login</span>
                        </div>

                        {fastLoading && (
                            <div className="sk-flow" style={{
                                "--sk-color": "#fff",
                                "--sk-size": "20px",
                                margin: 0,
                                position: "absolute"
                            }}>
                                <div className="sk-flow-dot"></div>
                                <div className="sk-flow-dot"></div>
                                <div className="sk-flow-dot"></div>
                            </div>
                        )}
                        
                    </div>

                </div>

                {/* Terms */}
                <div style={styles.terms}>
                    <img
                        src="/icons/tick.svg"
                        alt="tick"
                        style={{ width: 14, height: 14 }}
                    />
                    <span style={styles.termsText}>
                        Have read and agreed to the Terms and Policy
                    </span>
                </div>

            </div>
        </div>
    </div>
);

}

const styles = {
container: {
height: "100vh",
backgroundColor: "#1B1B1B",
display: "flex",
justifyContent: "center",
alignItems: "center",
},

inner: {
    width: "100%",
    maxWidth: 400,
    height: "100%",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
},

title: {
    textAlign: "center",
    color: "#fff",
    fontSize: 42,
    fontWeight: "bold",
    marginTop: 50,
},

bottomSection: {
    marginTop: "auto",
    marginBottom: 32,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
},

buttonWrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
},

button: {
    width: "100%",
    height: "56px",
    padding: "0 24px",
    borderRadius: 50,
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
    position: "relative",
},

buttonContent: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "opacity 0.2s",
},

icon: {
    width: 30,
    height: 30,
    position: "absolute",
    left: 0,
    filter: "brightness(0) invert(1)",
},

buttonText: {
    color: "#fff",
    fontSize: 17,
},

terms: {
    marginTop: 32,
    display: "flex",
    alignItems: "center",
    gap: 4,
},

termsText: {
    color: "#fff",
    fontSize: 12,
},

};



