import React, { useRef, useState, useEffect } from "react";
import endIcon from "../assets/icons/reject-vector.svg";
import micIcon from "../assets/icons/mic-vector.svg";
import videoIcon from "../assets/icons/video-vector.svg";
import { db, auth } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function VideoCallScreen({ visible, onEnd, remoteUser }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const preloadVideoRef = useRef(null);
  const callIdRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [scheduleReady, setScheduleReady] = useState(false); // sc call done
  const [videoReady, setVideoReady] = useState(false);       // video buffered
  const [timeLimit, setTimeLimit] = useState(null);
  const [toast, setToast] = useState(null);
  const [remoteVideoUrl, setRemoteVideoUrl] = useState(null);
  const [seemlessLoop, setSeemlessLoop] = useState(false);

  // Both schedule AND video must be ready before showing the call
  const ready = scheduleReady && videoReady;

  const handleEnd = async () => {
    const uid = auth.currentUser?.uid;
    const cid = callIdRef.current;
    if (uid && cid) {
      try {
        await fetch("https://us-central1-bumble-af496.cloudfunctions.net/oe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: uid, callId: cid }),
        });
      } catch (err) {
        console.error("onCallEnded error:", err);
      }
    }
    onEnd();
  };

  const showToastAndEnd = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
      handleEnd();
    }, 2500);
  };

  // Pull remoteVideoUrl from remoteUser directly
  useEffect(() => {
    console.log("[VideoCall] fetch effect fired — visible:", visible, "remoteVideoId:", remoteUser?.remoteVideoId);
    if (!visible || !remoteUser?.remoteVideoId) return;

    const fetchVideoDoc = async () => {
      try {
        console.log("[VideoCall] Fetching Firestore doc: videos/" + remoteUser.remoteVideoId);
        const videoSnap = await getDoc(doc(db, "videos", remoteUser.remoteVideoId));
        if (!videoSnap.exists()) {
          console.error("[VideoCall] Video doc not found:", remoteUser.remoteVideoId);
          showToastAndEnd("Something went wrong");
          return;
        }
        const data = videoSnap.data();
        console.log("[VideoCall] Video doc fetched — downloadURL:", data.downloadURL, "seemlessLoop:", data.seemlessLoop);
        setRemoteVideoUrl(data.downloadURL);
        setSeemlessLoop(data.seemlessLoop ?? false);
      } catch (err) {
        console.error("[VideoCall] Failed to fetch video doc:", err);
        showToastAndEnd("Something went wrong");
      }
    };

    fetchVideoDoc();
  }, [visible, remoteUser?.remoteVideoId]);

  // Preload video in background while "Connecting…" is shown
  useEffect(() => {
    if (!visible || !remoteVideoUrl) return;

    const video = document.createElement("video");
    preloadVideoRef.current = video;
    video.src = remoteVideoUrl;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const onCanPlay = () => {
      console.log("[VideoCall] Preload canplay — video buffered enough, setting videoReady");
      setVideoReady(true);
    };

    const onError = (e) => {
      console.error("[VideoCall] Preload error:", video.error?.code, video.error?.message);
      // Don't block the call on preload error — just proceed
      setVideoReady(true);
    };

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);
    video.load();

    console.log("[VideoCall] Started preloading:", remoteVideoUrl);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("error", onError);
      video.src = "";
      preloadVideoRef.current = null;
    };
  }, [visible, remoteVideoUrl]);

  // Reset all state on hide
  useEffect(() => {
    if (!visible) {
      setScheduleReady(false);
      setVideoReady(false);
      setTimeLimit(null);
      setElapsed(0);
      setToast(null);
      setRemoteVideoUrl(null);
      setSeemlessLoop(false);
      callIdRef.current = null;
      return;
    }

    const scheduleTask = async (userId) => {
      try {
        const userSnap = await getDoc(doc(db, "users", userId));
        if (!userSnap.exists()) { showToastAndEnd("Insufficient minutes"); return; }

        const seconds = Number(userSnap.data().seconds ?? 0);
        if (seconds <= 0) { showToastAndEnd("Insufficient minutes"); return; }

        const res = await fetch("https://us-central1-bumble-af496.cloudfunctions.net/sc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, seconds }),
        });

        const rawText = await res.text();
        console.log("sc raw response:", rawText);
        if (!res.ok) throw new Error("Server error " + res.status + ": " + rawText);

        let callId = null;
        try { const data = JSON.parse(rawText); callId = data.callId ?? null; }
        catch { console.warn("sc response is not JSON:", rawText); }

        callIdRef.current = callId;
        setTimeLimit(seconds);

        if (remoteUser?.id) {
          const existing = JSON.parse(localStorage.getItem("blockedUserIds") || "[]");
          if (!existing.includes(remoteUser.id)) {
            existing.push(remoteUser.id);
            localStorage.setItem("blockedUserIds", JSON.stringify(existing));
          }
        }

        console.log("[VideoCall] Schedule done — setScheduleReady(true)");
        setScheduleReady(true);
      } catch (err) {
        console.error("Task scheduling error:", err);
      }
    };

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) scheduleTask(user.uid);
      else onEnd();
    });

    return () => unsub();
  }, [visible]);

  // Timer — only runs when both are ready
  useEffect(() => {
    if (!visible || !ready) { setElapsed(0); return; }

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (timeLimit !== null && next >= timeLimit) {
          clearInterval(interval);
          showToastAndEnd("Insufficient minutes");
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, ready, timeLimit]);

  // Local camera
  useEffect(() => {
    if (!visible || !ready) return;
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
    return () => media?.getTracks().forEach((t) => t.stop());
  }, [visible, ready]);

  // Play remote video — reuse the preloaded element by transferring its src
  useEffect(() => {
    console.log("[VideoCall] video play effect — visible:", visible, "ready:", ready, "remoteVideoUrl:", remoteVideoUrl, "seemlessLoop:", seemlessLoop);
    if (!visible || !ready || !remoteVideoUrl) {
      console.log("[VideoCall] Skipping video play — conditions not met");
      return;
    }

    const video = remoteVideoRef.current;
    if (!video) { console.error("[VideoCall] remoteVideoRef.current is null"); return; }

    console.log("[VideoCall] Setting video.src =", remoteVideoUrl);
    video.src = remoteVideoUrl;
    video.loop = seemlessLoop;
    video.playsInline = true;
    video.muted = true;

    video.onloadedmetadata = () => {
      console.log("[VideoCall] onloadedmetadata — duration:", video.duration, "readyState:", video.readyState);
      if (!seemlessLoop) {
        video.onended = () => {
          console.log("[VideoCall] video ended (no loop) — ending call");
          showToastAndEnd("Something went wrong");
        };
      } else {
        video.onended = null;
      }
    };

    video.oncanplay = () => console.log("[VideoCall] oncanplay — readyState:", video.readyState);
    video.onerror = () => console.error("[VideoCall] video error:", video.error?.code, video.error?.message);
    video.onstalled = () => console.warn("[VideoCall] video stalled");
    video.onwaiting = () => console.warn("[VideoCall] video waiting for data");

    video.load();

    video.play()
      .then(() => {
        console.log("[VideoCall] play() resolved — unmuting");
        video.muted = false;
        video.volume = 1.0;
      })
      .catch((e) => console.error("[VideoCall] play() rejected:", e.name, e.message));

    return () => {
      video.onloadedmetadata = null;
      video.oncanplay = null;
      video.onended = null;
      video.onerror = null;
      video.onstalled = null;
      video.onwaiting = null;
    };
  }, [visible, ready, remoteVideoUrl, seemlessLoop]);

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
    if (h > 0)
      return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  };

  if (!visible) return null;

  if (toast) {
    return (
      <div style={styles.overlay}>
        <div style={styles.toastScreen}>
          <div style={styles.toastPill}>{toast}</div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={styles.overlay}>
        <div style={styles.connectingScreen}>
          <div style={styles.connectingSpinner} />
          <p style={styles.connectingText}>Connecting…</p>

        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .vc-ctrl-btn { transition: transform 0.15s ease, background 0.15s ease; }
        .vc-ctrl-btn:active { transform: scale(0.92); }
        .vc-end-btn:active { transform: scale(0.9); background: #c62828 !important; }
      `}</style>

      <video ref={remoteVideoRef} playsInline style={styles.remoteVideo} />

      <div style={styles.topGradient} />
      <div style={styles.bottomGradient} />

      <div style={styles.selfViewWrapper}>
        <video ref={localVideoRef} autoPlay muted playsInline style={styles.selfView} />
        {videoOff && (
          <div style={styles.selfViewOff}>
            <span style={{ fontSize: 22 }}>🎥</span>
          </div>
        )}
      </div>

      <div style={styles.topBar}>
        <div style={styles.liveChip}>
          <div style={styles.liveDot} />
          <span style={styles.liveText}>LIVE</span>
        </div>
        <div style={styles.timerPill}>
          <span style={styles.timerText}>{formatTime(elapsed)}</span>
        </div>
      </div>

      <div style={styles.controls}>
        <div style={styles.btnRow}>
          <button
            className="vc-ctrl-btn"
            style={{
              ...styles.ctrlBtn,
              background: muted ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
              border: muted ? "1.5px solid rgba(255,255,255,0.3)" : "1.5px solid rgba(255,255,255,0.1)",
            }}
            onClick={toggleMute}
          >
            <img src={micIcon} alt="mic" style={{ ...styles.ctrlIcon, opacity: muted ? 0.4 : 1 }} />
            <span style={styles.ctrlLabel}>{muted ? "Unmute" : "Mute"}</span>
          </button>

          <button className="vc-end-btn vc-ctrl-btn" style={styles.endBtn} onClick={handleEnd}>
            <img src={endIcon} alt="end" style={{ ...styles.ctrlIcon, width: 28, height: 28, transform: "rotate(136deg)" }} />
          </button>

          <button
            className="vc-ctrl-btn"
            style={{
              ...styles.ctrlBtn,
              background: videoOff ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
              border: videoOff ? "1.5px solid rgba(255,255,255,0.3)" : "1.5px solid rgba(255,255,255,0.1)",
            }}
            onClick={toggleVideo}
          >
            <img src={videoIcon} alt="video" style={{ ...styles.ctrlIcon, opacity: videoOff ? 0.4 : 1 }} />
            <span style={styles.ctrlLabel}>{videoOff ? "Show" : "Camera"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, backgroundColor: "#000",
    zIndex: 9999, overflow: "hidden", animation: "fadeIn 0.3s ease",
  },
  remoteVideo: {
    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
  },
  topGradient: {
    position: "absolute", top: 0, left: 0, right: 0, height: "160px",
    background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)",
    zIndex: 1, pointerEvents: "none",
  },
  bottomGradient: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: "220px",
    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
    zIndex: 1, pointerEvents: "none",
  },
  selfViewWrapper: {
    position: "absolute", top: 56, right: 16, width: 100, height: 148,
    borderRadius: 18, overflow: "hidden", zIndex: 10,
    border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    backgroundColor: "#111",
  },
  selfView: {
    width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block",
  },
  selfViewOff: {
    position: "absolute", inset: 0, backgroundColor: "#1a1a2e",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "52px 20px 0",
  },
  liveChip: {
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(229,57,53,0.25)", border: "1px solid rgba(229,57,53,0.4)",
    borderRadius: 20, padding: "5px 12px", backdropFilter: "blur(8px)",
  },
  liveDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#ff5252", boxShadow: "0 0 6px #ff5252",
  },
  liveText: {
    fontSize: 11, fontWeight: 700, color: "#ff5252",
    letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif",
  },
  timerPill: {
    background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20, padding: "5px 16px", backdropFilter: "blur(8px)",
  },
  timerText: {
    color: "#fff", fontSize: 14, fontWeight: 600,
    letterSpacing: "0.08em", fontFamily: "'DM Sans', sans-serif",
  },
  controls: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
    display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 48,
  },
  btnRow: { display: "flex", alignItems: "center", gap: 20 },
  ctrlBtn: {
    width: 64, height: 64, borderRadius: 20, display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 4, cursor: "pointer", backdropFilter: "blur(12px)",
  },
  ctrlIcon: { width: 24, height: 24, filter: "brightness(0) invert(1)" },
  ctrlLabel: {
    fontSize: 10, color: "rgba(255,255,255,0.55)",
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: "0.03em",
  },
  endBtn: {
    width: 72, height: 72, borderRadius: "50%", background: "#E53935",
    border: "none", cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 0 8px rgba(229,57,53,0.15)",
  },
  connectingScreen: {
    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", background: "#0d0d0d", gap: 16,
  },
  connectingSpinner: {
    width: 40, height: 40,
    border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #8b5cf6",
    borderRadius: "50%", animation: "spin 0.9s linear infinite",
  },
  connectingText: {
    color: "rgba(255,255,255,0.45)", fontSize: 14,
    fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em",
  },

  toastScreen: {
    position: "absolute", inset: 0, display: "flex",
    alignItems: "center", justifyContent: "center", background: "#0d0d0d",
  },
  toastPill: {
    background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", padding: "12px 28px", borderRadius: 100, fontSize: 15,
    fontWeight: 600, fontFamily: "'DM Sans', sans-serif", backdropFilter: "blur(12px)",
  },
};