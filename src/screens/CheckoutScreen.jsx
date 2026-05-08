import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import backIcon from "../assets/icons/back-vector.svg";
import videoIcon from "../assets/icons/video-vector.svg";
import mpesaIcon from "../assets/icons/mpesa-vector.svg";

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const minutes = location.state?.minutes;
  const amount = location.state?.amount;

  const handleProceed = () => navigate("/payment", { state: { amount } });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .checkout-screen { height:100vh; background:#0a0a0f; display:flex; flex-direction:column; justify-content:space-between; padding:16px; box-sizing:border-box; font-family:'DM Sans',sans-serif; position:relative; overflow:hidden; }
        .checkout-screen::before { content:''; position:absolute; top:-100px; right:-60px; width:280px; height:280px; background:radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%); pointer-events:none; }
        .co-header { display:grid; grid-template-columns:40px 1fr 40px; align-items:center; height:48px; margin-bottom:8px; }
        .co-back-btn { width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:12px; cursor:pointer; }
        .co-back-btn img { width:20px; height:20px; filter:invert(1); transform:rotate(90deg); }
        .co-title { text-align:center; font-family:'Syne',sans-serif; font-size:18px; font-weight:700; color:#f1f1f5; margin:0; }
        .co-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:18px; display:flex; flex-direction:column; gap:12px; backdrop-filter:blur(8px); }
        .co-label { font-size:12px; color:rgba(255,255,255,0.35); letter-spacing:0.08em; text-transform:uppercase; }
        .co-minutes-row { display:flex; align-items:center; justify-content:center; gap:10px; padding:12px; background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.2); border-radius:14px; }
        .co-minutes-row img { width:22px; height:22px; filter:invert(1) brightness(2) sepia(1) hue-rotate(220deg) saturate(4); }
        .co-minutes-text { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:#f1f1f5; }
        .co-section-title { font-size:13px; font-weight:500; color:rgba(255,255,255,0.6); }
        .co-mpesa-row { display:flex; align-items:center; gap:12px; padding:14px; border-radius:14px; background:rgba(34,197,94,0.07); border:1.5px solid rgba(34,197,94,0.25); margin-top:4px; }
        .co-mpesa-row img { width:64px; height:26px; object-fit:contain; }
        .co-mpesa-label { font-size:14px; color:#22c55e; font-weight:500; }
        .co-bottom { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:18px; display:flex; flex-direction:column; gap:14px; backdrop-filter:blur(8px); }
        .co-total-row { display:flex; justify-content:space-between; align-items:center; }
        .co-total-label { font-size:13px; color:rgba(255,255,255,0.4); }
        .co-total-amount { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; color:#f1f1f5; }
        .co-proceed-btn { width:100%; padding:16px; background:linear-gradient(135deg, #22c55e, #16a34a); color:#fff; border:none; border-radius:14px; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:500; cursor:pointer; letter-spacing:0.02em; transition:opacity 0.2s; }
        .co-proceed-btn:active { opacity:0.85; }
        .co-wrapper { display:flex; flex-direction:column; gap:12px; position:relative; z-index:1; }
      `}</style>
      <div className="checkout-screen">
        <div className="co-wrapper">
          <div className="co-header">
            <div className="co-back-btn" onClick={() => navigate("/home")}>
              <img src={backIcon} alt="back" />
            </div>
            <h2 className="co-title">Checkout</h2>
            <div />
          </div>

          <div className="co-card">
            <p className="co-label">You will get</p>
            <div className="co-minutes-row">
              <img src={videoIcon} alt="video" />
              <span className="co-minutes-text">{minutes} Minutes</span>
            </div>
          </div>

          <div className="co-card">
            <p className="co-section-title">Payment method</p>
            <div className="co-mpesa-row">
              <img src={mpesaIcon} alt="mpesa" />
              <span className="co-mpesa-label">M-Pesa</span>
            </div>
          </div>
        </div>

        <div className="co-bottom" style={{ position: "relative", zIndex: 1 }}>
          <div className="co-total-row">
            <span className="co-total-label">Total price</span>
            <span className="co-total-amount">Ksh {amount}.00</span>
          </div>
          <button className="co-proceed-btn" onClick={handleProceed}>Proceed</button>
        </div>
      </div>
    </>
  );
}