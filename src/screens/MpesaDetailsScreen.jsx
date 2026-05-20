import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import backIcon from "../assets/icons/back-vector.svg";

export default function PaymentScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const amount = location.state?.amount;
  const [phone, setPhone] = useState("");
  const [focused, setFocused] = useState(false);

  const normalizePhone = (input) => {
    if (!input) return null;
    let p = input.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
    if (p.startsWith("+")) p = p.substring(1);
    if (p.startsWith("0")) p = "254" + p.substring(1);
    if (p.length === 9) p = "254" + p;
    if (!/^\d+$/.test(p)) return null;
    if (p.length !== 12) return null;
    if (!p.startsWith("2547") && !p.startsWith("2541")) return null;
    return p;
  };

  const handlePay = () => {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      alert("Enter a valid phone number (07XXXXXXXX, 01XXXXXXXX or 254XXXXXXXXX)");
      return;
    }
    navigate("/mpesa-processing", { state: { phone: normalizedPhone, amount } });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .pay-screen { height:100vh; background:#0a0a0f; display:flex; flex-direction:column; padding:16px; box-sizing:border-box; font-family:'DM Sans',sans-serif; position:relative; overflow:hidden; }
        .pay-screen::before { content:''; position:absolute; top:-80px; left:-80px; width:300px; height:300px; background:radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%); pointer-events:none; }
        .pay-header { display:grid; grid-template-columns:40px 1fr 40px; align-items:center; height:48px; position:relative; z-index:1; }
        .pay-back-btn { width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:12px; cursor:pointer; }
        .pay-back-btn img { width:20px; height:20px; filter:invert(1); transform:rotate(90deg); }
        .pay-nav-title { text-align:center; font-family:'Syne',sans-serif; font-size:18px; font-weight:700; color:#f1f1f5; margin:0; }
        .pay-amount-block { margin-top:28px; margin-bottom:4px; position:relative; z-index:1; }
        .pay-amount-eyebrow { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,255,255,0.3); margin-bottom:6px; }
        .pay-amount-value { font-family:'Syne',sans-serif; font-size:36px; font-weight:800; color:#f1f1f5; letter-spacing:-0.02em; }
        .pay-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:18px; margin-top:20px; position:relative; z-index:1; display:flex; flex-direction:column; gap:14px; }
        .pay-input-row { display:flex; align-items:center; background:rgba(255,255,255,0.05); border:1.5px solid ${focused ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"}; border-radius:14px; padding:14px; transition:border-color 0.2s; }
        .pay-country { display:flex; align-items:center; gap:6px; padding-right:12px; }
        .pay-flag { font-size:18px; }
        .pay-code { font-size:14px; font-weight:500; color:rgba(255,255,255,0.7); }
        .pay-vdivider { width:1px; height:20px; background:rgba(255,255,255,0.1); margin-right:12px; }
        .pay-input { flex:1; border:none; outline:none; background:transparent; font-size:15px; color:#f1f1f5; font-family:'DM Sans',sans-serif; }
        .pay-input::placeholder { color:rgba(255,255,255,0.25); }
        .pay-help { font-size:12px; color:rgba(255,255,255,0.25); }
        .pay-btn { width:100%; padding:16px; background:linear-gradient(135deg, #22c55e, #16a34a); color:#fff; border:none; border-radius:14px; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:500; cursor:pointer; transition:opacity 0.2s; }
        .pay-btn:active { opacity:0.85; }
      `}</style>
      <div className="pay-screen">
        <div className="pay-header">
          <div className="pay-back-btn" onClick={() => navigate("/home")}>
            <img src={backIcon} alt="back" />
          </div>
          <h2 className="pay-nav-title">Payment</h2>
          <div />
        </div>

        <div className="pay-amount-block">
          <p className="pay-amount-eyebrow">Amount due</p>
          <div className="pay-amount-value">Kes {amount}.00</div>
        </div>

        <div className="pay-card">
          <div className="pay-input-row">
            <div className="pay-country">
              <span className="pay-flag">🇰🇪</span>
              <span className="pay-code">+254</span>
            </div>
            <div className="pay-vdivider" />
            <input
              className="pay-input"
              type="tel"
              placeholder="M-Pesa number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
          </div>
          <p className="pay-help">Format: 7XXXXXXXX or 1XXXXXXXX</p>
          <button className="pay-btn" onClick={handlePay}>Pay Now</button>
        </div>
      </div>
    </>
  );
}