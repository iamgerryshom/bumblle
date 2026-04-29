import React from "react";

import answerIcon from "../assets/icons/accept-vector.svg";
import rejectIcon from "../assets/icons/reject-vector.svg";
import "spinkit/spinkit.min.css";

export default function CallOverlay({
    visible,
    name,
    profileUrl,
    onAnswer,
    onReject,
}) {
    if (!visible) return null;

    return (
        <div style={styles.overlay}>

            {/* CENTER */}
            <div style={styles.center}>

                <div style={styles.avatarWrapper}>

                    {/* 🔥 SPINNER BEHIND IMAGE */}
                    <div className="sk-pulse" style={styles.pulseSpinner} />

                    <img
                        src={profileUrl}
                        alt="profile"
                        style={styles.avatar}
                    />
                </div>

                <div style={styles.name}>{name}</div>
            </div>

            {/* ACTIONS */}
            <div style={styles.actions}>

                {/* REJECT */}
                <div style={styles.actionItem} onClick={onReject}>
                    <div style={styles.buttonWrapper}>
                        <div className="sk-bounce" style={styles.spinner}>
                            <div className="sk-bounce-dot" style={{ backgroundColor: "#E53935" }} />
                            <div className="sk-bounce-dot" style={{ backgroundColor: "#E53935" }} />
                        </div>

                        <div style={{ ...styles.circle, backgroundColor: "#E53935" }}>
                            <img
                                src={rejectIcon}
                                alt="reject"
                                style={{
                                    ...styles.icon,
                                    transform: "rotate(136deg)",
                                }}
                            />
                        </div>
                    </div>

                    <span style={styles.label}>Reject</span>
                </div>

                {/* ANSWER */}
                <div style={styles.actionItem} onClick={onAnswer}>
                    <div style={styles.buttonWrapper}>
                        <div className="sk-bounce" style={styles.spinner}>
                            <div className="sk-bounce-dot" style={{ backgroundColor: "#43A047" }} />
                            <div className="sk-bounce-dot" style={{ backgroundColor: "#43A047" }} />
                        </div>

                        <div style={{ ...styles.circle, backgroundColor: "#43A047" }}>
                            <img
                                src={answerIcon}
                                alt="answer"
                                style={styles.icon}
                            />
                        </div>
                    </div>

                    <span style={styles.label}>Answer</span>
                </div>

            </div>

        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#6A4FB3",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
    },

    center: {
        marginTop: "80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
    },

    avatarWrapper: {
        width: 220,
        height: 220,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    pulseSpinner: {
        position: "absolute",
        width: "320px",     // ⬆️ increased size
        height: "320px",
        transform: "scale(1.3)", // smoother expansion
        opacity: 0.5,
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    avatar: {
        width: "170px",
        height: "170px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid #7D5CD1",
        zIndex: 2,
        position: "relative",
    },

    name: {
        color: "#fff",
        fontSize: "20px",
        fontWeight: "bold",
    },

    actions: {
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        padding: "0 40px 50px",
        boxSizing: "border-box",
    },

    actionItem: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },

    buttonWrapper: {
        position: "relative",
        width: "80px",
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    spinner: {
        position: "absolute",
        width: "110px",
        height: "110px",
        opacity: 0.6,
        zIndex: 1,
    },

    circle: {
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
    },

    icon: {
        width: "30px",
        height: "30px",
        objectFit: "contain",
        filter: "brightness(0) invert(1)",
    },

    label: {
        marginTop: "8px",
        color: "#fff",
        fontSize: "14px",
    },
};