import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "spinkit/spinkit.min.css";
import { getFunctions, httpsCallable } from "firebase/functions";
import backIcon from "../assets/icons/back-vector.svg";
import axios from "axios";
import { getAuth } from "firebase/auth";



export default function PaymentConfirmationScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const functions = getFunctions();
  const stkPush = httpsCallable(functions, "stkPush");
  const phone = location.state?.phone;
  const amount = location.state?.amount;
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  const handleSendPrompt = async () => {
    if (!phone || !amount) { alert("Missing payment details"); navigate("/payment"); return; }
    setLoading(true);

    const refCode = localStorage.getItem("refCode") || null;

    try {
      const result = await axios.post(
        "https://us-central1-employee-a64ce.cloudfunctions.net/stkPush",
        { amount, phone, refCode, initiatorId: user?.uid || null },
      );

      const checkoutRequestId = result?.data?.response?.CheckoutRequestID || result?.data?.CheckoutRequestID || null;
      if (!checkoutRequestId) { console.error("Missing CheckoutRequestID", result.data); return; }
      navigate("/mpesa-processing", { state: { checkoutRequestId, phone, amount, organization: "WIDE SCOPE DATA" } });
    } catch (error) {
      console.error("STK Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    <>You will receive an M-Pesa prompt from <b style={{ color: "#f1f1f5" }}>WIDE SCOPE DATA</b> of <b style={{ color: "#f1f1f5" }}>KES {amount}</b></>,
    <>Ensure your phone <b style={{ color: "#f1f1f5" }}>{phone}</b> is active and reachable</>,
    <>Enter your M-Pesa PIN to authorize payment</>,
    <>Wait a few seconds while we confirm your transaction</>,
    <>Do not close this screen until payment is complete</>,
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .confirm-screen { min-height:100vh; background:#0a0a0f; padding:16px; box-sizing:border-box; font-family:'DM Sans',sans-serif; position:relative; overflow:hidden; }
        .confirm-screen::before { content:''; position:absolute; top:-60px; right:-60px; width:260px; height:260px; background:radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%); pointer-events:none; }
        .confirm-header { display:grid; grid-template-columns:40px 1fr 40px; align-items:center; height:48px; margin-bottom:20px; position:relative; z-index:1; }
        .confirm-back { width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:12px; cursor:pointer; }
        .confirm-back img { width:20px; height:20px; filter:invert(1); transform:rotate(90deg); }
        .confirm-nav-title { text-align:center; font-family:'Syne',sans-serif; font-size:18px; font-weight:700; color:#f1f1f5; margin:0; }
        .confirm-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:20px; position:relative; z-index:1; }
        .confirm-step { display:flex; gap:12px; margin-bottom:16px; }
        .confirm-dot-wrap { padding-top:2px; }
        .confirm-dot { width:8px; height:8px; border-radius:50%; background:#8b5cf6; box-shadow:0 0 6px rgba(139,92,246,0.6); margin-top:4px; flex-shrink:0; }
        .confirm-step-text { font-size:14px; color:rgba(255,255,255,0.55); line-height:1.6; flex:1; }
        .confirm-hdivider { height:1px; background:rgba(255,255,255,0.05); margin:4px 0 16px; }
        .confirm-btn { margin-top:8px; width:100%; padding:16px; background:linear-gradient(135deg, #22c55e, #16a34a); color:#fff; border:none; border-radius:14px; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:500; cursor:pointer; position:relative; display:flex; justify-content:center; align-items:center; transition:opacity 0.2s; }
        .confirm-btn:disabled { opacity:0.7; cursor:not-allowed; }
      `}</style>
      <div className="confirm-screen">
        <div className="confirm-header">
          <div className="confirm-back" onClick={() => navigate("/home")}>
            <img src={backIcon} alt="back" />
          </div>
          <h2 className="confirm-nav-title">Authorize Payment</h2>
          <div />
        </div>

        <div className="confirm-card">
          {steps.map((step, i) => (
            <div key={i}>
              <div className="confirm-step">
                <div className="confirm-dot-wrap">
                  <div className="confirm-dot" />
                </div>
                <div className="confirm-step-text">{step}</div>
              </div>
              {i < steps.length - 1 && <div className="confirm-hdivider" />}
            </div>
          ))}

          <button className="confirm-btn" onClick={handleSendPrompt} disabled={loading}>
            <span style={{ opacity: loading ? 0 : 1 }}>Send Prompt</span>
            {loading && (
              <div className="sk-flow" style={{ "--sk-color": "#fff", "--sk-size": "18px", position: "absolute" }}>
                <div className="sk-flow-dot" /><div className="sk-flow-dot" /><div className="sk-flow-dot" />
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}