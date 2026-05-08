import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "spinkit/spinkit.min.css";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import backIcon from "../assets/icons/back-vector.svg";
import tickIcon from "../assets/icons/tick-vector.svg";
import cancelIcon from "../assets/icons/cancel-vector.svg";

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
      const s = snapshot.data()?.transactionStatus?.toUpperCase();
      if (s === "SUCCESS") setStatus("success");
      if (s === "FAILED") setStatus("failed");
    });
    return () => unsubscribe();
  }, [checkoutId]);

  const isSuccess = status === "success";
  const isFailed = status === "failed";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .proc-screen { height:100vh; background:#0a0a0f; display:flex; flex-direction:column; padding:16px; box-sizing:border-box; font-family:'DM Sans',sans-serif; position:relative; overflow:hidden; }
        .proc-glow { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:360px; height:360px; border-radius:50%; pointer-events:none; transition:background 0.6s; }
        .proc-glow.processing { background:radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%); }
        .proc-glow.success { background:radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%); }
        .proc-glow.failed { background:radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%); }
        .proc-back { width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:12px; cursor:pointer; position:relative; z-index:1; }
        .proc-back img { width:20px; height:20px; filter:invert(1); transform:rotate(90deg); }
        .proc-center { flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; gap:14px; position:relative; z-index:1; }
        .proc-icon { width:90px; height:90px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
        .proc-icon.success { background:rgba(34,197,94,0.12); border:1px solid rgba(34,197,94,0.25); }
        .proc-icon.failed { background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.25); }
        .proc-icon img { width:44px; height:44px; }
        .proc-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#f1f1f5; }
        .proc-desc { font-size:14px; color:rgba(255,255,255,0.4); max-width:240px; line-height:1.7; }
        .proc-spinner-wrap { width:72px; height:72px; display:flex; align-items:center; justify-content:center; }
      `}</style>
      <div className="proc-screen">
        <div className={`proc-glow ${status}`} />

        <div className="proc-back" onClick={() => navigate("/home")}>
          <img src={backIcon} alt="back" />
        </div>

        <div className="proc-center">
          {status === "processing" && (
            <>
              <div className="proc-spinner-wrap">
                <div className="sk-grid" style={{ "--sk-color": "#8b5cf6", "--sk-size": "52px" }}>
                  {Array.from({ length: 9 }).map((_, i) => <div key={i} className="sk-grid-cube" />)}
                </div>
              </div>
              <div className="proc-title">Processing Payment</div>
              <div className="proc-desc">Please wait while we confirm payment status. Do not leave this screen.</div>
            </>
          )}

          {isSuccess && (
            <>
              <div className="proc-icon success">
                <img src={tickIcon} alt="success" style={{ filter: "invert(52%) sepia(93%) saturate(420%) hue-rotate(85deg) brightness(95%) contrast(90%)" }} />
              </div>
              <div className="proc-title">Payment Successful</div>
              <div className="proc-desc">Your checkout request has been processed successfully.</div>
            </>
          )}

          {isFailed && (
            <>
              <div className="proc-icon failed">
                <img src={cancelIcon} alt="failed" style={{ filter: "invert(24%) sepia(94%) saturate(7483%) hue-rotate(357deg) brightness(95%) contrast(110%)" }} />
              </div>
              <div className="proc-title">Payment Failed</div>
              <div className="proc-desc">Your checkout request has failed. Go back to create a new one.</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}