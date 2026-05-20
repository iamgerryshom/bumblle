import React from "react";
import { useNavigate } from "react-router-dom";
import backIcon from "../assets/icons/back-vector.svg";
import cancelIcon from "../assets/icons/cancel-vector.svg";

export default function PaymentFailedScreen() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .proc-screen { height:100vh; background:#0a0a0f; display:flex; flex-direction:column; padding:16px; box-sizing:border-box; font-family:'DM Sans',sans-serif; position:relative; overflow:hidden; }
        .proc-glow { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:360px; height:360px; border-radius:50%; pointer-events:none; background:radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%); }
        .proc-back { width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:12px; cursor:pointer; position:relative; z-index:1; }
        .proc-back img { width:20px; height:20px; filter:invert(1); transform:rotate(90deg); }
        .proc-center { flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; gap:14px; position:relative; z-index:1; }
        .proc-icon { width:90px; height:90px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.25); }
        .proc-icon img { width:44px; height:44px; }
        .proc-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#f1f1f5; }
        .proc-desc { font-size:14px; color:rgba(255,255,255,0.4); max-width:240px; line-height:1.7; }
      `}</style>
      <div className="proc-screen">
        <div className="proc-glow" />

        <div className="proc-back" onClick={() => navigate("/home")}>
          <img src={backIcon} alt="back" />
        </div>

        <div className="proc-center">
          <div className="proc-icon">
            <img
              src={cancelIcon}
              alt="failed"
              style={{ filter: "invert(24%) sepia(94%) saturate(7483%) hue-rotate(357deg) brightness(95%) contrast(110%)" }}
            />
          </div>
          <div className="proc-title">Payment Failed</div>
          <div className="proc-desc">Your checkout request has failed. Go back to create a new one.</div>
        </div>
      </div>
    </>
  );
}