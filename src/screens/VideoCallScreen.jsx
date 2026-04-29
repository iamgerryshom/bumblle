import React, { useRef, useState, useEffect } from "react";
import endIcon from "../assets/icons/reject-vector.svg";
import micIcon from "../assets/icons/mic-vector.svg";
import videoIcon from "../assets/icons/video-vector.svg";

export default function VideoCallScreen({ visible, onEnd }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // 🎥 LOCAL CAMERA
  useEffect(() => {
    if (!visible) return;
    let media;
    const startCamera = async () => {
      try {
        media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(media);
        if (localVideoRef.current) localVideoRef.current.srcObject = media;
      } catch (err) {
        console.error("Camera error:", err);
      }
    };
    startCamera();
    return () => {
      media?.getTracks().forEach((t) => t.stop());
    };
  }, [visible]);

  // ⏱️ TIMER
  useEffect(() => {
    if (!visible) { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [visible]);

  // 🎬 REMOTE VIDEO
  useEffect(() => {
  if (!visible) return;
  const video = remoteVideoRef.current;
  if (!video) return;

  video.src = "https://firebasestorage.googleapis.com/v0/b/bumble-af496.firebasestorage.app/o/videos%2FWhatsApp%20Video%202026-04-28%20at%2010.24.41%20AM.mp4?alt=media&token=4e720993-bf7e-4e20-a7b3-3529137eb7c5";
  video.loop = true;
  video.playsInline = true;
  video.muted = true;   // start muted to allow autoplay
  video.load();
  video.play().then(() => {
    video.muted = false; // ✅ unmute after play succeeds
    video.volume = 1.0;
  }).catch((e) => console.log("Autoplay blocked:", e));
}, [visible]);

  const toggleMute = () => {
    stream?.getAudioTracks().forEach((t) => { t.enabled = muted; });
    setMuted(!muted);
  };

  const toggleVideo = () => {
    stream?.getVideoTracks().forEach((t) => { t.enabled = videoOff; });
    setVideoOff(!videoOff);
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (!visible) return null;

  return (
    <div style={styles.overlay}>

      {/* 🎬 REMOTE VIDEO — no muted */}
      <video
        ref={remoteVideoRef}
        playsInline
        style={styles.remoteVideo}
      />

      {/* 🤳 SELF VIEW — stays muted (your own mic, no echo) */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        style={styles.selfView}
      />

      {/* 🎮 CONTROLS */}
      <div style={styles.controls}>
        <div style={styles.timerContainer}>
          <span style={styles.timerText}>{formatTime(elapsed)}</span>
        </div>

        <div style={styles.buttons}>
          <button style={styles.sideButton} onClick={toggleMute}>
            <img src={micIcon} alt="mic" style={{ ...styles.icon, opacity: muted ? 0.4 : 1 }} />
          </button>

          <button style={styles.endButton} onClick={onEnd}>
            <img src={endIcon} alt="end" style={{ ...styles.icon, transform: "rotate(136deg)" }} />
          </button>

          <button style={styles.sideButton} onClick={toggleVideo}>
            <img src={videoIcon} alt="video" style={{ ...styles.icon, opacity: videoOff ? 0.4 : 1 }} />
          </button>
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
    backgroundColor: "#000",
    zIndex: 9999,
    overflow: "hidden",
  },
  remoteVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  selfView: {
    position: "absolute",
    top: "20px",
    right: "20px",
    width: "110px",
    height: "160px",
    borderRadius: "16px",
    objectFit: "cover",
    border: "2px solid #fff",
    backgroundColor: "#111",
    transform: "scaleX(-1)",
  },
  controls: {
    position: "absolute",
    bottom: "40px",
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  timerContainer: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: "6px 18px",
    borderRadius: "20px",
  },
  timerText: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    letterSpacing: "1px",
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: "30px",
  },
  sideButton: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  endButton: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#E53935",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  icon: {
    width: "26px",
    height: "26px",
    filter: "brightness(0) invert(1)",
  },
};