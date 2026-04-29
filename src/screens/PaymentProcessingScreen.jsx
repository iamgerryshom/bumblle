import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "spinkit/spinkit.min.css";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

export default function PaymentProcessingScreen() {

    const navigate = useNavigate();
    const location = useLocation();

    const checkoutId = location.state?.checkoutRequestId;

    const [status, setStatus] = useState("processing");

    useEffect(() => {

        if (!checkoutId) return;

        const db = getFirestore();
        const ref = doc(db, "transactions", checkoutId);

        const unsubscribe = onSnapshot(ref, (snapshot) => {

            if (!snapshot.exists()) return;

            const transactionStatus = snapshot.data()?.transactionStatus;

            if (transactionStatus?.toUpperCase() === "SUCCESS") {
                setStatus("success");
            }

            if (transactionStatus?.toUpperCase() === "FAILED") {
                setStatus("failed");
            }

        });

        return () => unsubscribe();

    }, [checkoutId]);

    return (
        <div style={styles.container}>

            {/* HEADER */}
            <div style={styles.header}>
                <div
                    style={styles.backWrap}
                    onClick={() => navigate("/payment-information-confirmation")}
                >
                    <img
                        src="/src/assets/icons/back-vector.svg"
                        alt="back"
                        style={styles.backIcon}
                    />
                </div>
            </div>

            {/* CENTER */}
            <div style={styles.center}>

                {/* PROCESSING */}
                {status === "processing" && (
                    <>
                        <div className="sk-grid">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="sk-grid-cube"></div>
                            ))}
                        </div>

                        <div style={styles.title}>Processing Payment</div>

                        <div style={styles.desc}>
                            Please wait while we confirm payment status. Do not leave this screen.
                        </div>
                    </>
                )}

                {/* SUCCESS */}
                {status === "success" && (
                    <>
                        <img
                            src="/src/assets/icons/tick-vector.svg"
                            alt="success"
                            style={{ ...styles.icon, ...styles.successTint }}
                        />

                        <div style={styles.title}>Payment Successful</div>

                        <div style={styles.desc}>
                            Your checkout request has been processed successfully.
                        </div>
                    </>
                )}

                {/* FAILED */}
                {status === "failed" && (
                    <>
                        <img
                            src="/src/assets/icons/cancel-vector.svg"
                            alt="failed"
                            style={{ ...styles.icon, ...styles.failTint }}
                        />

                        <div style={styles.title}>Payment Failed</div>

                        <div style={styles.desc}>
                            Your checkout request has failed. Go back to create a new one.
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

const styles = {

    container: {
        height: "100vh",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        boxSizing: "border-box",
        fontFamily: "Arial",
    },

    header: {
        display: "flex",
        alignItems: "center",
    },

    backWrap: {
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },

    backIcon: {
        width: 22,
        height: 22,
        transform: "rotate(90deg)",
    },

    center: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        gap: 10,
    },

    icon: {
        width: 100,
        height: 100,
        marginBottom: 10,
    },

    successTint: {
        filter:
            "invert(52%) sepia(93%) saturate(420%) hue-rotate(85deg) brightness(95%) contrast(90%)"
    },

    failTint: {
        filter:
            "invert(24%) sepia(94%) saturate(7483%) hue-rotate(357deg) brightness(95%) contrast(110%)"
    },

    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
    },

    desc: {
        fontSize: 14,
        color: "#555",
        maxWidth: 260,
        lineHeight: "20px",
    }
};