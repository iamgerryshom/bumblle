import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import backIcon from "../assets/icons/back-vector.svg";

export default function PaymentScreen() {
    const navigate = useNavigate();
    const location = useLocation();

    // 💡 amount passed from previous screen
    const amount = location.state?.amount;

    const [phone, setPhone] = useState("");

    /*
    =========================================================
    📌 PHONE INPUT RULES (UPDATED INSTRUCTIONS)
    =========================================================
    ✔ Accepts:
        - 07XXXXXXXX
        - 01XXXXXXXX
        - 7XXXXXXXX
        - 1XXXXXXXX
        - +2547XXXXXXXX
        - +2541XXXXXXXX
        - 2547XXXXXXXX
        - 2541XXXXXXXX

    ✔ Auto-normalization:
        - removes spaces
        - removes "+"
        - converts local formats (07 / 01 / 7 / 1) → 254XXXXXXXXX

    ✔ Final format:
        - MUST be 12 digits
        - MUST start with 2547 OR 2541

    ❌ Rejects:
        - letters
        - invalid length
        - non-Kenya-like formats
    =========================================================
    */

    const normalizePhone = (input) => {
        if (!input) return null;

        let p = input.replace(/\s+/g, "").replace(/[^0-9+]/g, "");

        // remove "+"
        if (p.startsWith("+")) {
            p = p.substring(1);
        }

        // convert local format 07XXXXXXXX / 01XXXXXXXX → 254XXXXXXXXX
        if (p.startsWith("0")) {
            p = "254" + p.substring(1);
        }

        // convert short format 7XXXXXXXX / 1XXXXXXXX → 254XXXXXXXXX
        if (p.length === 9) {
            p = "254" + p;
        }

        // must be digits only
        if (!/^\d+$/.test(p)) return null;

        // must be full international format
        if (p.length !== 12) return null;

        // allow Safaricom (2547...) and Airtel (2541...)
        if (!p.startsWith("2547") && !p.startsWith("2541")) {
            return null;
        }

        return p;
    };

    const handlePay = () => {
        const normalizedPhone = normalizePhone(phone);

        if (!normalizedPhone) {
            alert("Enter a valid phone number (07XXXXXXXX, 01XXXXXXXX or 254XXXXXXXXX)");
            return;
        }

        navigate("/payment-information-confirmation", {
            state: {
                phone: normalizedPhone,
                amount,
            },
        });
    };

    return (
        <div style={styles.container}>

            {/* TOP SECTION */}
            <div style={styles.top}>

                <div style={styles.header}>
                    <div
                        style={styles.iconWrap}
                        onClick={() => navigate("/home")}
                    >
                        <img
                            src={backIcon}
                            alt="back"
                            style={styles.backIcon}
                        />
                    </div>

                    <h2 style={styles.title}>Payment</h2>

                    <div style={{ width: 40 }} />
                </div>

                <div style={styles.amount}>
                    Kes {amount}.00
                </div>

            </div>

            {/* INPUT CARD */}
            <div style={styles.card}>

                <div style={styles.inputRow}>

                    <div style={styles.countrySection}>
                        <span style={styles.flag}>🇰🇪</span>
                        <span style={styles.code}>+254</span>
                    </div>

                    <div style={styles.divider} />

                    <input
                        type="tel"
                        placeholder="Mpesa  number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={styles.input}
                    />
                </div>

                <p style={styles.helpText}>
                    7XXXXXXXX, 1XXXXXXXX
                </p>

                <button style={styles.payBtn} onClick={handlePay}>
                    Pay Now
                </button>

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
        padding: "16px",
        boxSizing: "border-box",
        fontFamily: "Arial",
    },

    top: {
        marginBottom: 10,
    },

    header: {
        display: "grid",
        gridTemplateColumns: "40px 1fr 40px",
        alignItems: "center",
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

    backIcon: {
        width: 24,
        height: 24,
    },

    title: {
        textAlign: "center",
        fontSize: 17,
        fontWeight: "bold",
        margin: 0,
        color: "#7d7d7d",
    },

    amount: {
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 16,
        color: "#000",
    },

    card: {
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        boxShadow: "0px 2px 10px rgba(0,0,0,0.08)",
    },

    inputRow: {
        display: "flex",
        alignItems: "center",
        background: "#F2F2F2",
        borderRadius: 12,
        padding: "12px 14px",
    },

    countrySection: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        paddingRight: 10,
    },

    flag: {
        fontSize: 18,
    },

    code: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#000",
    },

    divider: {
        width: 1,
        height: 22,
        background: "#ccc",
        marginRight: 10,
    },

    input: {
        flex: 1,
        border: "none",
        outline: "none",
        background: "transparent",
        fontSize: 15,
        color: "#000",
    },

    helpText: {
        fontSize: 12,
        color: "#9E9E9E",
        marginTop: 12,
    },

    payBtn: {
        width: "100%",
        marginTop: 16,
        padding: 16,
        background: "#369E47",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        fontSize: 16,
        cursor: "pointer",
    },
};