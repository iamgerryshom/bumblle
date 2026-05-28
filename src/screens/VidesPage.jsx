import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  collection, getDocs, orderBy, query, where,
  doc, updateDoc, deleteDoc
} from "firebase/firestore";
import { ref, deleteObject, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "../firebase";

// ── Formatters ────────────────────────────────────────────────────────────────
const formatDuration = (s) => {
  if (!s) return "—";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};
const formatSize = (b) => (b ? `${(b / 1048576).toFixed(1)} MB` : "—");
const formatDate = (ts) => {
  if (!ts) return "—";
  return (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
};
const extractFileName = (url, fallback) => {
  try {
    const m = decodeURIComponent(url).match(/videos\/(.+?)\?/);
    if (m) return m[1].replace(/\.[^.]+$/, "");
  } catch { }
  return fallback || "Untitled";
};

// ── Loop switch ───────────────────────────────────────────────────────────────
const LoopSwitch = memo(function LoopSwitch({ videoId, initialValue }) {
  const [on, setOn] = useState(!!initialValue);
  const [saving, setSaving] = useState(false);
  const toggle = useCallback(async () => {
    const next = !on;
    setOn(next);
    setSaving(true);
    try {
      await updateDoc(doc(db, "videos", videoId), { seemlessLoop: next });
    } catch {
      setOn(!next);
    } finally {
      setSaving(false);
    }
  }, [on, videoId]);
  return (
    <div className="loop-control">
      <span className="loop-label">Loop</span>
      <button
        className={`loop-switch${on ? " on" : ""}${saving ? " saving" : ""}`}
        onClick={toggle}
        aria-pressed={on}
      >
        <span className="loop-knob" />
      </button>
    </div>
  );
});

// ── Assign popup ──────────────────────────────────────────────────────────────
const AssignUserPopup = memo(function AssignUserPopup({ videoId, onClose, onAssigned }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDocs(query(collection(db, "users"), where("gender", "==", "F")))
      .then((snap) => { if (!cancelled) setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleAssign = useCallback(async (user) => {
    const key = user.uid || user.id;
    setAssigning(key);
    try {
      await updateDoc(doc(db, "users", user.id), { remoteVideoId: videoId });
      setToast(`Assigned to ${user.name || "user"}`);
      setTimeout(() => { onAssigned(user); onClose(); }, 900);
    } catch (err) {
      console.error(err);
      setAssigning(null);
    }
  }, [videoId, onAssigned, onClose]);

  return (
    <div className="popup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="popup" role="dialog" aria-modal="true">
        <div className="popup-header">
          <div className="popup-title">ASSIGN <span>USER</span></div>
          <button className="popup-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="popup-body">
          {loading ? (
            <div className="popup-loading"><div className="spinner sm" /> Loading users</div>
          ) : users.length === 0 ? (
            <div className="popup-empty">No female users found.</div>
          ) : (
            users.map((user) => {
              const key = user.uid || user.id;
              const isMe = assigning === key;
              return (
                <div className="user-row" key={user.id}>
                  <img className="user-avatar" src={user.photoUrl || ""} alt="" loading="lazy"
                    onError={(e) => { e.target.src = ""; }} />
                  <div className="user-info">
                    <div className="user-name">
                      {user.name || "Unknown"}
                      {user.remoteVideoId && (
                        <span className="assigned-tick" title="Already has a video assigned">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="6" fill="#c8ff00" />
                            <path d="M3 6l2 2 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="user-tags">
                      <span className="user-tag">{user.countryNameCode || "—"}</span>
                      <span className="user-tag">·</span>
                      <span className="user-tag">Age {user.age ?? "—"}</span>
                    </div>
                  </div>
                  <button
                    className={`assign-btn${isMe ? " loading" : ""}`}
                    disabled={!!assigning}
                    onClick={() => handleAssign(user)}
                  >
                    {isMe ? "Saving…" : "Assign"}
                  </button>
                </div>
              );
            })
          )}
        </div>
        {toast && <div className="popup-toast">{toast}</div>}
      </div>
    </div>
  );
});

// ── Upload popup ──────────────────────────────────────────────────────────────
const UploadPopup = memo(function UploadPopup({ onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fn = (e) => e.key === "Escape" && !uploading && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, uploading]);

  const handleFileSelect = useCallback((f) => {
    if (!f || !f.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }
    setError(null);
    setFile(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      // 1️⃣ Read duration from the video file
      const duration = await new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          resolve(video.duration);
        };
        video.onerror = () => resolve(null);
        video.src = URL.createObjectURL(file);
      });

      const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
      const storageRef = ref(storage, `videos/${filename}`);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          duration: duration ? String(duration) : "",  // 2️⃣ Pass as metadata
        },
      });

      uploadTask.on(
        "state_changed",
        (snap) => {
          setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        },
        (err) => {
          console.error(err);
          setError("Upload failed. Please try again.");
          setUploading(false);
        },
        () => {
          setUploadDone(true);
          setTimeout(() => { onUploaded(); onClose(); }, 1200);
        }
      );
    } catch (err) {
      console.error(err);
      setError("Upload failed.");
      setUploading(false);
    }
  }, [file, onUploaded, onClose]);
  return (
    <div className="popup-overlay" onClick={(e) => !uploading && e.target === e.currentTarget && onClose()}>
      <div className="popup upload-popup" role="dialog" aria-modal="true">
        <div className="popup-header">
          <div className="popup-title">UPLOAD <span>VIDEO</span></div>
          {!uploading && (
            <button className="popup-close" onClick={onClose} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="popup-body upload-body">
          {!file ? (
            <div
              className={`drop-zone${dragging ? " dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="drop-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" width="36" height="36">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="drop-label">Drop video here or <span>browse</span></div>
              <div className="drop-hint">MP4, MOV, WEBM, AVI supported</div>
              <input ref={fileInputRef} type="file" accept="video/*" hidden
                onChange={(e) => handleFileSelect(e.target.files[0])} />
            </div>
          ) : (
            <div className="upload-flow">
              {/* File info */}
              <div className="file-info-row">
                <div className="file-thumb">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <div className="file-details">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatSize(file.size)}</div>
                </div>
                {!uploading && (
                  <button className="file-remove" onClick={() => { setFile(null); setError(null); }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Upload progress */}
              {uploading && (
                <div className="upload-progress-section">
                  <div className="progress-label-row">
                    <span className="progress-label">
                      {uploadDone ? "Upload complete!" : "Uploading…"}
                    </span>
                    <span className="progress-pct">{uploadProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill${uploadDone ? " done" : ""}`}
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {uploadDone && (
                    <div className="upload-done-msg">
                      <svg viewBox="0 0 12 12" fill="none" width="13" height="13">
                        <circle cx="6" cy="6" r="6" fill="#c8ff00" />
                        <path d="M3 6l2 2 4-4" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Refreshing…
                    </div>
                  )}
                </div>
              )}

              {error && <div className="upload-error">{error}</div>}

              {!uploading && (
                <button className="upload-final-btn" onClick={handleUpload}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Upload Video
                  <span className="upload-size-hint">({formatSize(file.size)})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Lazy video card ───────────────────────────────────────────────────────────
const VideoCard = memo(function VideoCard({ video, isActive, onPlay, onAssign, onDelete }) {
  const [inView, setInView] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [deleteState, setDeleteState] = useState("idle");
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); io.disconnect(); } },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handlePlayClick = useCallback(() => {
    setHasPlayed(true);
    onPlay(video.id, videoRef);
    videoRef.current?.play();
  }, [video.id, onPlay]);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteState("deleting");
    try {
      if (video.downloadURL) {
        try {
          const decodedUrl = decodeURIComponent(video.downloadURL);
          const pathMatch = decodedUrl.match(/\/o\/(.+?)\?/);
          if (pathMatch) await deleteObject(ref(storage, pathMatch[1]));
        } catch (storageErr) {
          if (storageErr.code !== "storage/object-not-found") throw storageErr;
        }
      }
      await deleteDoc(doc(db, "videos", video.id));
      setDeleteState("done");
      setTimeout(() => onDelete(video.id), 500);
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteState("error");
      setTimeout(() => setDeleteState("idle"), 2500);
    }
  }, [video, onDelete]);

  const title = extractFileName(video.downloadURL, video.name);
  const isDeleting = deleteState === "deleting";
  const isDone = deleteState === "done";

  return (
    <div
      ref={containerRef}
      className={`card${isActive ? " active" : ""}${isDone ? " deleting-out" : ""}${isDeleting ? " is-deleting" : ""}`}
    >
      <div className="video-wrapper">
        {inView ? (
          <video
            ref={videoRef}
            src={video.downloadURL}
            controls={isActive}
            preload="none"
            loop={!!video.seemlessLoop}
            onPlay={() => onPlay(video.id, videoRef)}
            playsInline
          />
        ) : (
          <div className="video-placeholder" />
        )}
        {(!isActive || !hasPlayed) && (
          <div className="play-overlay" onClick={handlePlayClick}>
            <div className="play-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
        {isDeleting && (
          <div className="delete-progress-overlay">
            <div className="delete-spinner" />
            <span className="delete-progress-label">Deleting…</span>
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="card-title" title={title}>{title}</div>
        <div className="card-meta">
          <div className="meta-item">
            <span className="meta-label">Duration</span>
            <span className={`meta-value${video.duration ? " hi" : ""}`}>{formatDuration(video.duration)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Size</span>
            <span className="meta-value">{formatSize(video.size)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Uploaded</span>
            <span className="meta-value">{formatDate(video.timeCreated)}</span>
          </div>
        </div>

        {deleteState === "confirm" ? (
          <div className="delete-confirm-row">
            <span className="delete-confirm-label">Delete this video?</span>
            <div className="delete-confirm-btns">
              <button className="confirm-cancel-btn" onClick={() => setDeleteState("idle")}>Cancel</button>
              <button className="confirm-delete-btn" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        ) : deleteState === "error" ? (
          <div className="delete-error-row">
            <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
              <circle cx="8" cy="8" r="7" stroke="#ff4444" strokeWidth="1.5" />
              <path d="M8 4.5v4M8 10.5v1" stroke="#ff4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>Delete failed. Try again.</span>
            <button className="retry-btn" onClick={() => setDeleteState("confirm")}>Retry</button>
          </div>
        ) : (
          <div className="card-actions">
            <LoopSwitch videoId={video.id} initialValue={video.seemlessLoop} />
            <div className="card-action-group">
              <button className="assign-user-btn" onClick={() => onAssign(video)} disabled={isDeleting}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                  <path d="M16 11l2 2 4-4" />
                </svg>
                Assign
              </button>
              <button className="delete-btn" onClick={() => setDeleteState("confirm")} disabled={isDeleting} title="Delete video">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const activeVideoRef = useRef(null);

  const fetchVideos = useCallback(() => {
    setLoading(true);
    getDocs(query(collection(db, "videos"), orderBy("timeCreated", "desc")))
      .then((snap) => setVideos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handlePlay = useCallback((id, ref) => {
    if (activeVideoRef.current && activeVideoRef.current !== ref?.current) {
      activeVideoRef.current.pause();
    }
    activeVideoRef.current = ref?.current ?? null;
    setActiveId(id);
  }, []);

  const handleDelete = useCallback((videoId) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    if (activeId === videoId) { setActiveId(null); activeVideoRef.current = null; }
  }, [activeId]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; color: #e8e4de; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

        .page { max-width: 1100px; margin: 0 auto; padding: 60px 24px 80px; }
        .header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 56px; border-bottom: 1px solid #222; padding-bottom: 28px; }
        .header-left h1 { font-family: 'Bebas Neue', sans-serif; font-size: clamp(52px, 8vw, 88px); line-height: 0.9; letter-spacing: 2px; color: #fff; }
        .header-left h1 span { color: #c8ff00; }
        .header-right { display: flex; align-items: center; gap: 16px; }
        .header-count { font-size: 13px; font-weight: 300; color: #555; letter-spacing: 1px; text-transform: uppercase; }

        .upload-trigger-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: #c8ff00; border: none; color: #000; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 500; border-radius: 2px; transition: background 0.15s, transform 0.1s; }
        .upload-trigger-btn:hover { background: #d8ff33; transform: translateY(-1px); }
        .upload-trigger-btn:active { transform: translateY(0); }

        .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; gap: 16px; }
        .spinner { width: 36px; height: 36px; border: 2px solid #222; border-top-color: #c8ff00; border-radius: 50%; animation: spin 0.8s linear infinite; }
        .spinner.sm { width: 16px; height: 16px; border-width: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { font-size: 13px; color: #444; letter-spacing: 2px; text-transform: uppercase; }
        .empty { text-align: center; padding: 80px 0; color: #333; font-size: 15px; }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 2px; }

        .card { background: #111; border: 1px solid #1a1a1a; overflow: hidden; transition: border-color 0.2s, opacity 0.4s, transform 0.4s; contain: layout style; }
        .card:hover { border-color: #333; }
        .card.active { border-color: #c8ff00; }
        .card.is-deleting { pointer-events: none; opacity: 0.7; }
        .card.deleting-out { opacity: 0; transform: scale(0.95); pointer-events: none; }

        .video-wrapper { position: relative; aspect-ratio: 9/16; background: #000; }
        .video-wrapper video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .video-placeholder { width: 100%; height: 100%; background: #0d0d0d; }

        .play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); cursor: pointer; }
        .play-overlay:hover .play-btn { transform: scale(1.1); background: #c8ff00; color: #000; }
        .play-btn { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; transition: all 0.2s; backdrop-filter: blur(8px); color: #fff; }
        .play-btn svg { margin-left: 3px; }

        .delete-progress-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); z-index: 10; }
        .delete-spinner { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.15); border-top-color: #ff4444; border-radius: 50%; animation: spin 0.7s linear infinite; }
        .delete-progress-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #ff4444; font-weight: 500; }

        .card-body { padding: 16px 18px 18px; }
        .card-title { font-size: 14px; font-weight: 500; color: #e8e4de; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-meta { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 14px; }
        .meta-item { display: flex; flex-direction: column; gap: 2px; }
        .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #444; font-weight: 500; }
        .meta-value { font-size: 13px; color: #999; font-weight: 300; }
        .meta-value.hi { color: #c8ff00; font-weight: 500; }

        .card-actions { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #1a1a1a; gap: 10px; }
        .card-action-group { display: flex; align-items: center; gap: 6px; }

        .loop-control { display: flex; align-items: center; gap: 8px; }
        .loop-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #444; font-weight: 500; user-select: none; }
        .loop-switch { position: relative; width: 38px; height: 22px; background: #1e1e1e; border: 1px solid #2e2e2e; border-radius: 11px; cursor: pointer; transition: background 0.2s, border-color 0.2s; padding: 0; outline: none; }
        .loop-switch.on { background: #c8ff00; border-color: #c8ff00; }
        .loop-switch.saving { opacity: 0.6; cursor: wait; }
        .loop-knob { position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; background: #444; border-radius: 50%; transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s; }
        .loop-switch.on .loop-knob { transform: translateX(16px); background: #000; }

        .assign-user-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: transparent; border: 1px solid #2a2a2a; color: #666; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; border-radius: 2px; }
        .assign-user-btn:hover:not(:disabled) { background: #161616; border-color: #444; color: #ccc; }
        .assign-user-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .delete-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: transparent; border: 1px solid #2a2a2a; color: #555; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; border-radius: 2px; flex-shrink: 0; }
        .delete-btn:hover:not(:disabled) { background: rgba(255,68,68,0.1); border-color: #ff4444; color: #ff4444; }
        .delete-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .delete-confirm-row { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #ff444422; gap: 8px; animation: slideIn 0.15s ease; }
        @keyframes slideIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }
        .delete-confirm-label { font-size: 11px; color: #ff6666; letter-spacing: 0.5px; white-space: nowrap; flex-shrink: 0; }
        .delete-confirm-btns { display: flex; gap: 6px; flex-shrink: 0; }
        .confirm-cancel-btn { padding: 5px 10px; background: transparent; border: 1px solid #2a2a2a; color: #555; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; border-radius: 2px; }
        .confirm-cancel-btn:hover { background: #1a1a1a; border-color: #444; color: #ccc; }
        .confirm-delete-btn { padding: 5px 10px; background: #ff4444; border: 1px solid #ff4444; color: #fff; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; border-radius: 2px; font-weight: 500; }
        .confirm-delete-btn:hover { background: #ff2222; border-color: #ff2222; }

        .delete-error-row { display: flex; align-items: center; gap: 7px; padding-top: 12px; border-top: 1px solid #ff444422; animation: slideIn 0.15s ease; }
        .delete-error-row span { font-size: 11px; color: #ff6666; flex: 1; }
        .retry-btn { padding: 4px 9px; background: transparent; border: 1px solid #ff4444; color: #ff4444; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; border-radius: 2px; }
        .retry-btn:hover { background: rgba(255,68,68,0.1); }

        .now-playing-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 3px; background: #c8ff00; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

        .popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; animation: oIn 0.2s ease; }
        @keyframes oIn { from { opacity:0; } to { opacity:1; } }
        .popup { background: #111; border: 1px solid #2a2a2a; width: 100%; max-width: 480px; max-height: 80vh; display: flex; flex-direction: column; animation: pIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes pIn { from { opacity:0; transform:scale(0.92) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .popup-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 16px; border-bottom: 1px solid #1e1e1e; flex-shrink: 0; }
        .popup-title { font-family: 'Bebas Neue', sans-serif; font-size: 26px; letter-spacing: 1.5px; color: #fff; }
        .popup-title span { color: #c8ff00; }
        .popup-close { width: 32px; height: 32px; background: #1a1a1a; border: 1px solid #2a2a2a; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; transition: all 0.15s; border-radius: 2px; }
        .popup-close:hover { background: #222; color: #fff; border-color: #444; }
        .popup-body { overflow-y: auto; flex: 1; padding: 12px; scrollbar-width: thin; scrollbar-color: #222 transparent; }
        .popup-loading { display: flex; align-items: center; justify-content: center; height: 120px; gap: 12px; color: #444; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; }
        .popup-empty { text-align: center; padding: 40px; color: #333; font-size: 14px; }
        .popup-toast { padding: 10px 22px; background: #c8ff00; color: #000; font-size: 12px; font-weight: 500; letter-spacing: 1px; text-align: center; flex-shrink: 0; }
        .user-row { display: flex; align-items: center; gap: 14px; padding: 10px 12px; border: 1px solid transparent; border-radius: 2px; margin-bottom: 2px; }
        .user-row:hover { background: #161616; border-color: #2a2a2a; }
        .user-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1.5px solid #222; flex-shrink: 0; background: #1a1a1a; }
        .user-info { flex: 1; min-width: 0; }
        .user-name { font-size: 14px; font-weight: 500; color: #e8e4de; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; display: flex; align-items: center; gap: 5px; }
        .assigned-tick { flex-shrink: 0; display: inline-flex; align-items: center; }
        .user-tags { display: flex; gap: 8px; align-items: center; }
        .user-tag { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #444; }
        .assign-btn { flex-shrink: 0; padding: 6px 14px; background: transparent; border: 1px solid #333; color: #888; font-size: 11px; letter-spacing: 1.2px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; border-radius: 2px; }
        .assign-btn:hover:not(:disabled) { background: #c8ff00; border-color: #c8ff00; color: #000; }
        .assign-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .assign-btn.loading { background: #1a1a1a; border-color: #222; color: #555; }

        .upload-popup { max-width: 460px; }
        .upload-body { padding: 20px; }

        .drop-zone { border: 1.5px dashed #2a2a2a; border-radius: 4px; padding: 52px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; transition: border-color 0.2s, background 0.2s; text-align: center; }
        .drop-zone:hover, .drop-zone.dragging { border-color: #c8ff00; background: rgba(200,255,0,0.03); }
        .drop-icon { color: #333; transition: color 0.2s; }
        .drop-zone:hover .drop-icon, .drop-zone.dragging .drop-icon { color: #c8ff00; }
        .drop-label { font-size: 14px; color: #888; }
        .drop-label span { color: #c8ff00; }
        .drop-hint { font-size: 11px; color: #333; letter-spacing: 0.5px; text-transform: uppercase; }

        .upload-flow { display: flex; flex-direction: column; gap: 14px; }

        .file-info-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: #161616; border: 1px solid #1e1e1e; border-radius: 2px; }
        .file-thumb { width: 36px; height: 36px; background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: #555; flex-shrink: 0; }
        .file-details { flex: 1; min-width: 0; }
        .file-name { font-size: 13px; font-weight: 500; color: #e8e4de; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
        .file-size { font-size: 11px; color: #444; letter-spacing: 0.5px; }
        .file-remove { width: 24px; height: 24px; background: transparent; border: 1px solid #2a2a2a; color: #444; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 2px; flex-shrink: 0; transition: all 0.15s; }
        .file-remove:hover { border-color: #ff4444; color: #ff4444; }

        .upload-progress-section { display: flex; flex-direction: column; gap: 10px; padding: 16px; background: #0e0e0e; border: 1px solid #1a1a1a; border-radius: 2px; }
        .progress-label-row { display: flex; align-items: center; justify-content: space-between; }
        .progress-label { font-size: 12px; color: #888; letter-spacing: 0.5px; }
        .progress-pct { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #c8ff00; line-height: 1; }
        .progress-track { height: 3px; background: #1e1e1e; border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: #c8ff00; border-radius: 2px; transition: width 0.3s ease; }
        .upload-done-msg { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #c8ff00; letter-spacing: 0.5px; }

        .upload-error { padding: 10px 14px; background: rgba(255,68,68,0.08); border: 1px solid rgba(255,68,68,0.2); color: #ff6666; font-size: 12px; border-radius: 2px; }

        .upload-final-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; background: #c8ff00; border: none; color: #000; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 600; border-radius: 2px; transition: background 0.15s; width: 100%; }
        .upload-final-btn:hover { background: #d8ff33; }
        .upload-size-hint { font-weight: 400; opacity: 0.7; font-size: 11px; }
      `}</style>

      <div className="page">
        <div className="header">
          <div className="header-left"><h1>VID<span>EOS</span></h1></div>
          <div className="header-right">
            {!loading && <div className="header-count">{videos.length} {videos.length === 1 ? "file" : "files"}</div>}
            <button className="upload-trigger-btn" onClick={() => setShowUpload(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-screen">
            <div className="spinner" />
            <p className="loading-text">Loading videos</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="empty">No videos found.</div>
        ) : (
          <div className="grid">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isActive={activeId === video.id}
                onPlay={handlePlay}
                onAssign={setAssignTarget}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {activeId && <div className="now-playing-bar" />}

      {assignTarget && (
        <AssignUserPopup
          videoId={assignTarget.id}
          onClose={() => setAssignTarget(null)}
          onAssigned={() => { }}
        />
      )}

      {showUpload && (
        <UploadPopup
          onClose={() => setShowUpload(false)}
          onUploaded={fetchVideos}
        />
      )}
    </>
  );
}