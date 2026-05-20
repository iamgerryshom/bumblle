import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { getFunctions, httpsCallable } from "firebase/functions";
import backIcon from "../assets/icons/back-vector.svg";

export default function PaypalPaymentScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const amount = location.state?.amount;
  const minutes = location.state?.minutes;
  const [error, setError] = useState(null);

  const functions = getFunctions();
  const createOrderFn = httpsCallable(functions, "createOrder");

  return (
    <PayPalScriptProvider
      options={{
        clientId: "AW3GsIHrJHn8sqSmRsfgFkBS6Yp-r2pvtVSRIn5er5Lj_wMxYkKjLEGDteUQ71KsV9Zw5U2wue6o_64u",
        currency: "USD",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .pp-screen { min-height:100vh; background:#0a0a0f; display:flex; flex-direction:column; padding:16px; box-sizing:border-box; font-family:'DM Sans',sans-serif; position:relative; overflow:hidden; }
        .pp-screen::before { content:''; position:absolute; top:-80px; right:-60px; width:280px; height:280px; background:radial-gradient(circle, rgba(255,196,57,0.07) 0%, transparent 70%); pointer-events:none; }
        .pp-header { display:grid; grid-template-columns:40px 1fr 40px; align-items:center; height:48px; margin-bottom:24px; position:relative; z-index:1; }
        .pp-back-btn { width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:12px; cursor:pointer; }
        .pp-back-btn img { width:20px; height:20px; filter:invert(1); transform:rotate(90deg); }
        .pp-nav-title { text-align:center; font-family:'Syne',sans-serif; font-size:18px; font-weight:700; color:#f1f1f5; margin:0; }
        .pp-summary { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:18px; margin-bottom:14px; position:relative; z-index:1; display:flex; justify-content:space-between; align-items:center; }
        .pp-summary-left { display:flex; flex-direction:column; gap:4px; }
        .pp-summary-label { font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.3); }
        .pp-summary-minutes { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; color:#f1f1f5; }
        .pp-summary-right { text-align:right; }
        .pp-summary-price { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; color:#f1f1f5; }
        .pp-summary-currency { font-size:12px; color:rgba(255,255,255,0.3); margin-top:2px; }
        .pp-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:18px; position:relative; z-index:1; display:flex; flex-direction:column; gap:14px; }
        .pp-card-title { font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.3); }
        .pp-btn-wrap { border-radius:12px; overflow:hidden; }
        .pp-error { background:rgba(255,77,109,0.1); border:1px solid rgba(255,77,109,0.25); border-radius:10px; padding:10px 14px; font-size:12px; color:#ff4d6d; }
        .pp-secure { display:flex; align-items:center; justify-content:center; gap:6px; font-size:11px; color:rgba(255,255,255,0.2); }
        .pp-secure-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; box-shadow:0 0 6px #22c55e; }
      `}</style>

      <div className="pp-screen">
        <div className="pp-header">
          <div className="pp-back-btn" onClick={() => navigate(-1)}>
            <img src={backIcon} alt="back" />
          </div>
          <h2 className="pp-nav-title">PayPal Checkout</h2>
          <div />
        </div>

        <div className="pp-summary">
          <div className="pp-summary-left">
            <span className="pp-summary-label">You will get</span>
            <span className="pp-summary-minutes">{minutes} Minutes</span>
          </div>
          <div className="pp-summary-right">
            <div className="pp-summary-price">Ksh {amount}</div>
            <div className="pp-summary-currency">Billed in USD via PayPal</div>
          </div>
        </div>

        <div className="pp-card">
          <span className="pp-card-title">Complete payment</span>

          {error && <div className="pp-error">⚠ {error}</div>}

          <div className="pp-btn-wrap">
            <PayPalButtons
              style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 48 }}
              createOrder={async () => {
                setError(null);
                try {
                  const refCode = localStorage.getItem("refCode");
                  const result = await createOrderFn({
                    amount: amount.toString(),
                    currency: "USD",
                    description: `${minutes} Minutes`,
                    refCode,
                  });

                  const orderID = result.data?.orderID;
                  if (!orderID) throw new Error("No order ID returned");
                  return orderID;
                } catch (err) {
                  setError("Could not initiate payment. Please try again.");
                  throw err;
                }
              }}
              onApprove={async (data) => {
                navigate("/payment-success", {
                  state: { orderID: data.orderID, amount, minutes },
                });
              }}
              onError={() => {
                navigate("/payment-failed", {
                  state: { amount, minutes },
                });
              }}
              onCancel={() => {
                setError("Payment was cancelled.");
              }}
            />
          </div>

          <div className="pp-secure">
            <div className="pp-secure-dot" />
            Secured by PayPal — we never see your card details
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}