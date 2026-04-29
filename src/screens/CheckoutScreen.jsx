import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function CheckoutScreen() {

    const navigate = useNavigate();
    const location = useLocation();

    // 🔥 receive data from previous screen
    const minutes = location.state?.minutes;
    const amount = location.state?.amount;

    const handleProceed = () => {
        navigate("/payment", {
            state: {
                amount
            }
        });
    };

    return (
        <div style={styles.container}>

            <div style={styles.wrapper}>

                {/* HEADER */}
                <div style={styles.header}>

                    <div
                        style={styles.iconWrap}
                        onClick={() => navigate("/home")}
                    >
                        <img
                            src="/src/assets/icons/back-vector.svg"
                            alt="back"
                            style={styles.iconSmall}
                        />
                    </div>

                    <h2 style={styles.title}>Checkout</h2>

                    <div style={styles.iconWrap} />
                </div>

                {/* CARD 1 */}
                <div style={styles.card}>
                    <p style={styles.smallText}>You will get</p>

                    <div style={styles.rowCenter}>
                        <img
                            src="/src/assets/icons/video-vector.svg"
                            alt="video"
                            style={styles.icon}
                        />
                        <span style={styles.boldText}>{minutes} Minutes</span>
                    </div>
                </div>

                {/* PAYMENT */}
                <div style={styles.card}>
                    <p style={styles.boldText}>Payment methods</p>

                    <div style={styles.paymentOption}>
                        <img
                            src="/src/assets/icons/mpesa-vector.svg"
                            alt="mpesa"
                            style={styles.mpesaIcon}
                        />
                        <span>M-Pesa</span>
                    </div>
                </div>

            </div>

            {/* BOTTOM */}
            <div style={styles.bottomCard}>

                <div style={styles.totalRow}>
                    <span>Total price:</span>
                    <span style={styles.amount}>Ksh{amount}.00</span>
                </div>

                <button
                    style={styles.checkoutBtn}
                    onClick={handleProceed}
                >
                    Proceed
                </button>

            </div>

        </div>
    );
}

const styles = {

    container: {
        height: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "12px",
        boxSizing: "border-box",
        fontFamily: "Arial",
    },

    wrapper: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },

    header: {
        display: "grid",
        gridTemplateColumns: "40px 1fr 40px",
        alignItems: "center",
        height: 44,
    },

    iconWrap: {
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: "rotate(90deg)",
        cursor: "pointer",
    },

    iconSmall: {
        width: 24,
        height: 24,
        display: "block",
    },

    title: {
        textAlign: "center",
        fontSize: 18,
        fontWeight: "bold",
        margin: 0,
        color: "#7d7d7dff",
    },

    card: {
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
    },

    smallText: {
        fontSize: 14,
        color: "#555",
    },

    boldText: {
        fontSize: 14,
        fontWeight: "bold",
    },

    rowCenter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },

    icon: {
        width: 20,
        height: 20,
    },

    paymentOption: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 10,
        background: "#F3FBF5",
        border: "1.5px solid #1DB954",
        marginTop: 8,
    },

    mpesaIcon: {
        width: 60,
        height: 25,
        objectFit: "contain",
    },

    bottomCard: {
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0px 2px 10px rgba(0,0,0,0.10)",
    },

    totalRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    amount: {
        fontSize: 20,
        fontWeight: "bold",
    },

    checkoutBtn: {
        width: "100%",
        padding: 16,
        background: "#369E47",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        fontSize: 16,
        cursor: "pointer",
    },
};