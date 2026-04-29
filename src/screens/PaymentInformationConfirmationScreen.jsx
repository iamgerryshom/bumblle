import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "spinkit/spinkit.min.css";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function PaymentConfirmationScreen() {

    const navigate = useNavigate();
    const location = useLocation();

    const functions = getFunctions();
    const stkPush = httpsCallable(functions, "stkPush");

    // 🔥 receive data from previous screen
    const phone = location.state?.phone;
    const amount = location.state?.amount;

    const [loading, setLoading] = useState(false);

    const handleSendPrompt = async () => {

        if (!phone || !amount) {
            alert("Missing payment details");
            navigate("/payment");
            return;
        }

        setLoading(true);

        try {
            const result = await stkPush({
                amount,
                phone,
                organization: "WIDE SCOPE DATA"
            });

            console.log("FULL RESPONSE:", result.data);

            // 🔥 extract CheckoutRequestID safely
            const checkoutRequestId =
                result?.data?.response?.CheckoutRequestID ||
                result?.data?.CheckoutRequestID ||
                null;

            if (!checkoutRequestId) {
                console.error("Missing CheckoutRequestID", result.data);
                return;
            }

            navigate("/payment-processing", {
                state: {
                    checkoutRequestId,
                    phone,
                    amount,
                    organization: "WIDE SCOPE DATA"
                }
            });

        } catch (error) {
            console.error("STK Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>

            {/* HEADER */}
            <div style={styles.header}>
                <div
                    style={styles.backWrap}
                    onClick={() => navigate("/payment")}
                >
                    <img
                        src="/src/assets/icons/back-vector.svg"
                        alt="back"
                        style={styles.backIcon}
                    />
                </div>

                <h2 style={styles.title}>Authorize Payment</h2>

                <div style={{ width: 40 }} />
            </div>

            {/* CARD */}
            <div style={styles.card}>

                {/* INSTRUCTIONS */}
                <div style={styles.item}>
                    <img src="/src/assets/icons/point-vector.svg" style={styles.dot} alt="dot" />
                    <div style={styles.itemContent}>
                        <div style={styles.text}>
                            You will receive an M-Pesa prompt from <b>WIDE SCOPE DATA</b> of <b>KES {amount}</b>
                        </div>
                        <div style={styles.divider} />
                    </div>
                </div>

                <div style={styles.item}>
                    <img src="/src/assets/icons/point-vector.svg" style={styles.dot} alt="dot" />
                    <div style={styles.itemContent}>
                        <div style={styles.text}>
                            Ensure your phone <b>{phone}</b> is active and reachable
                        </div>
                        <div style={styles.divider} />
                    </div>
                </div>

                <div style={styles.item}>
                    <img src="/src/assets/icons/point-vector.svg" style={styles.dot} alt="dot" />
                    <div style={styles.itemContent}>
                        <div style={styles.text}>
                            Enter your M-Pesa PIN to authorize payment
                        </div>
                        <div style={styles.divider} />
                    </div>
                </div>

                <div style={styles.item}>
                    <img src="/src/assets/icons/point-vector.svg" style={styles.dot} alt="dot" />
                    <div style={styles.itemContent}>
                        <div style={styles.text}>
                            Wait a few seconds while we confirm your transaction
                        </div>
                        <div style={styles.divider} />
                    </div>
                </div>

                <div style={styles.item}>
                    <img src="/src/assets/icons/point-vector.svg" style={styles.dot} alt="dot" />
                    <div style={styles.itemContent}>
                        <div style={styles.text}>
                            Do not close this screen until payment is complete
                        </div>
                    </div>
                </div>

                {/* BUTTON */}
                <button
                    style={styles.button}
                    onClick={handleSendPrompt}
                    disabled={loading}
                >
                    <div style={{ opacity: loading ? 0.2 : 1 }}>
                        Send Prompt
                    </div>

                    {loading && (
                        <div
                            className="sk-flow"
                            style={{
                                "--sk-color": "#fff",
                                "--sk-size": "18px",
                                position: "absolute",
                            }}
                        >
                            <div className="sk-flow-dot"></div>
                            <div className="sk-flow-dot"></div>
                            <div className="sk-flow-dot"></div>
                        </div>
                    )}
                </button>

            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        background: "#fff",
        padding: 16,
        fontFamily: "Arial",
        boxSizing: "border-box",
    },

    header: {
        display: "grid",
        gridTemplateColumns: "40px 1fr 40px",
        alignItems: "center",
        marginBottom: 16,
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

    title: {
        textAlign: "center",
        fontSize: 17,
        fontWeight: "bold",
        margin: 0,
        color: "#7d7d7dff",
    },

    card: {
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0px 2px 10px rgba(0,0,0,0.08)",
    },

    item: {
        display: "flex",
        gap: 10,
        marginBottom: 12,
    },

    dot: {
        width: 18,
        height: 18,
        marginTop: 3,
        transform: "rotate(90deg)",
    },

    itemContent: {
        flex: 1,
    },

    text: {
        fontSize: 14,
        color: "#000",
    },

    divider: {
        height: 1,
        background: "#E6E6E6",
        marginTop: 8,
    },

    button: {
        marginTop: 20,
        width: "100%",
        padding: 16,
        background: "#369E47",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        fontSize: 16,
        cursor: "pointer",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
};