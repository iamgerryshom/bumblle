/**
 * CreateUserPage.jsx
 *
 * Mirrors the Android flow from UserHandler.java + MultiImageUploader.java:
 *   1. Collect profile details + photos from the admin.
 *   2. Create the Firestore user doc first (so we have a stable uid).
 *   3. Upload every photo to Storage using that uid in the custom metadata,
 *      reporting per-photo and overall progress the whole way.
 *
 * Visual design: a darkroom / contact-sheet theme — photos are treated like
 * negatives on a light table, numbered in upload order, with the first
 * frame marked as the primary shot. All data-fetching, Firestore field
 * mappings, and upload logic below are unchanged from the original.
 *
 * Requires (in your own project):
 *   npm install firebase
 *   Tailwind CSS configured (all styling below is Tailwind + a small
 *   <style> block for inputs, buttons, and the progress ring).
 *
 * Adjust the import path below to wherever you initialize Firebase.
 */

import React, { useCallback, useRef, useState } from "react";
import { doc, collection, setDoc } from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "../firebase"; // <-- adjust path to match your project structure

const COUNTRIES = [
  { code: "KE", label: "Kenya" },
  { code: "UG", label: "Uganda" },
  { code: "TZ", label: "Tanzania" },
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
  { code: "ZA", label: "South Africa" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
];

const MAX_PHOTOS = 6;

// ---------- Firestore: create the user, return the new uid ----------
function createUser({ name, age, gender, countryNameCode }) {
  return new Promise((resolve, reject) => {
    const docRef = doc(collection(db, "users"));
    const data = {
      name,
      gender,
      age,
      countryNameCode,
      uid: docRef.id,
    };
    setDoc(docRef, data)
      .then(() => resolve(docRef.id))
      .catch(reject);
  });
}

// ---------- Storage: upload one photo, report progress ----------
function uploadOnePhoto({ file, index, folder, userId, isPrimary, onProgress }) {
  return new Promise((resolve, reject) => {
    const fileName = `${Date.now()}_${index}.jpg`;
    const ref = storageRef(storage, `${folder}/${fileName}`);

    const task = uploadBytesResumable(ref, file, {
      customMetadata: {
        userId,
        blurHush: "",
        type: "image",
        isPrimary: isPrimary ? "true" : "false",
      },
    });

    task.on(
      "state_changed",
      (snapshot) => {
        const progress = (100 * snapshot.bytesTransferred) / snapshot.totalBytes;
        onProgress(progress);
      },
      (err) => reject(err),
      () => {
        getDownloadURL(task.snapshot.ref).then(resolve).catch(reject);
      }
    );
  });
}

// ---------- Tiny inline icons (no external icon package required) ----------

const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.3L6.3 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCross = () => (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
    <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconStar = () => (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1.3l1.87 4.02 4.43.5-3.32 3.02.9 4.36L8 11.03l-3.88 2.17.9-4.36L1.7 5.82l4.43-.5L8 1.3z" />
  </svg>
);

const IconWarning = () => (
  <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
    <path d="M8 5.2v4M8 11.6h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconCamera = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4.5 8.2h2.7l1.4-2h6.8l1.4 2h2.7a1 1 0 011 1v9a1 1 0 01-1 1H4.5a1 1 0 01-1-1v-9a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="12" cy="13.1" r="3.1" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const IconChevron = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------- Small presentational bits ----------

function Thumb({ src, frameNumber, isPrimary, progress, status, onRemove, onMakePrimary }) {
  const showRing = status === "uploading";
  const ringPct = Math.min(100, Math.max(0, progress));

  return (
    <div className="thumb-frame group">
      <div className="thumb-img-wrap">
        <img
          src={src}
          alt="Selected profile"
          className={`thumb-img ${status === "done" ? "is-done" : ""}`}
        />

        {showRing && (
          <svg className="thumb-ring" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${(ringPct / 100) * 97.4} 97.4`}
              transform="rotate(-90 18 18)"
            />
          </svg>
        )}

        {status === "idle" && (
          <div className="thumb-actions">
            {!isPrimary && (
              <button type="button" onClick={onMakePrimary} title="Make primary" className="thumb-action-btn">
                <IconStar />
              </button>
            )}
            <button type="button" onClick={onRemove} title="Remove photo" className="thumb-action-btn thumb-action-danger">
              <IconCross />
            </button>
          </div>
        )}
      </div>

      <span className="frame-number">{frameNumber}</span>

      {isPrimary && (
        <span className="badge-primary">
          <IconStar /> Primary
        </span>
      )}

      {status === "done" && (
        <span className="badge-status badge-success">
          <IconCheck />
        </span>
      )}

      {status === "error" && (
        <span className="badge-status badge-error">
          <IconWarning />
        </span>
      )}

      {status === "uploading" && (
        <span className="thumb-progress-label">{Math.round(progress)}%</span>
      )}
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

// ---------- Main page ----------

export default function CreateUserPage() {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "F",
    countryNameCode: "KE",
  });
  const [photos, setPhotos] = useState([]); // { id, file, previewUrl, progress, status }
  const [phase, setPhase] = useState("form"); // form | creating | uploading | done | error
  const [overallProgress, setOverallProgress] = useState(0);
  const [createdUserId, setCreatedUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  const updateField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );
    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      const toAdd = incoming.slice(0, Math.max(room, 0)).map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: "idle",
      }));
      return [...prev, ...toAdd];
    });
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const makePrimary = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      return [target, ...prev.filter((p) => p.id !== id)];
    });
  };

  const setPhotoProgress = (id, progress) => {
    setPhotos((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, progress } : p));
      const avg =
        next.reduce((sum, p) => sum + p.progress, 0) / (next.length || 1);
      setOverallProgress(avg);
      return next;
    });
  };

  const setPhotoStatus = (id, status) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const canSubmit =
    form.name.trim().length > 0 &&
    String(form.age).trim().length > 0 &&
    photos.length > 0 &&
    phase === "form";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setErrorMessage("");
    setPhase("creating");

    let userId;
    try {
      userId = await createUser({
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        countryNameCode: form.countryNameCode,
      });
      setCreatedUserId(userId);
    } catch (err) {
      setErrorMessage(err.message || "Could not create the user.");
      setPhase("error");
      return;
    }

    setPhase("uploading");
    setPhotos((prev) => prev.map((p) => ({ ...p, status: "uploading" })));

    const folder = `users/${userId}/photos`;

    const results = await Promise.allSettled(
      photos.map((photo, index) =>
        uploadOnePhoto({
          file: photo.file,
          index,
          folder,
          userId,
          isPrimary: index === 0,
          onProgress: (progress) => setPhotoProgress(photo.id, progress),
        }).then((url) => {
          setPhotoStatus(photo.id, "done");
          return url;
        })
      )
    );

    const anyFailed = results.some((r) => r.status === "rejected");
    results.forEach((r, i) => {
      if (r.status === "rejected") setPhotoStatus(photos[i].id, "error");
    });

    setOverallProgress(100);
    setPhase(anyFailed ? "error" : "done");
    if (anyFailed) setErrorMessage("Some photos failed to upload.");
  };

  const resetAll = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setForm({ name: "", age: "", gender: "F", countryNameCode: "KE" });
    setPhotos([]);
    setPhase("form");
    setOverallProgress(0);
    setCreatedUserId(null);
    setErrorMessage("");
  };

  const busy = phase === "creating" || phase === "uploading";

  return (
    <div className="min-h-screen bg-[--ink] text-[--paper] relative" style={rootVars}>
      <style>{css}</style>
      <div className="safelight" aria-hidden="true" />

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20 relative">
        {/* Hero */}
        <div className="mb-10 sm:mb-14 fade-up">
          <span className="eyebrow">Profile · New entry</span>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] text-[--paper] mt-3">
            Create a new profile
          </h1>
          <p className="subtitle mt-3 max-w-md">
            Add their details and a few photos — we'll create the profile,
            then upload each image to storage.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
            {/* Details */}
            <div className="card fade-up" style={{ animationDelay: "70ms" }}>
              <div className="card-label">Identity</div>

              <div className="space-y-5 mt-4">
                <Field label="Name" htmlFor="name">
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={updateField("name")}
                    disabled={busy || phase === "done"}
                    placeholder="e.g. Amara Wanjiru"
                    className="input"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Age" htmlFor="age">
                    <input
                      id="age"
                      type="number"
                      min="18"
                      max="99"
                      value={form.age}
                      onChange={updateField("age")}
                      disabled={busy || phase === "done"}
                      placeholder="24"
                      className="input input-number"
                    />
                  </Field>

                  <Field label="Gender" htmlFor="gender">
                    <div className="select-wrap">
                      <select
                        id="gender"
                        value={form.gender}
                        onChange={updateField("gender")}
                        disabled={busy || phase === "done"}
                        className="input"
                      >
                        <option value="F">Female</option>
                        <option value="M">Male</option>
                        <option value="O">Other</option>
                      </select>
                      <span className="select-chevron"><IconChevron /></span>
                    </div>
                  </Field>
                </div>

                <Field label="Country" htmlFor="country">
                  <div className="select-wrap">
                    <select
                      id="country"
                      value={form.countryNameCode}
                      onChange={updateField("countryNameCode")}
                      disabled={busy || phase === "done"}
                      className="input"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label} ({c.code})
                        </option>
                      ))}
                    </select>
                    <span className="select-chevron"><IconChevron /></span>
                  </div>
                </Field>
              </div>

              {createdUserId && (
                <div className="uid-chip">
                  <span className="uid-dot" />
                  uid <span className="uid-value">{createdUserId}</span>
                </div>
              )}
            </div>

            {/* Photos — contact sheet */}
            <div className="card contact-sheet fade-up" style={{ animationDelay: "130ms" }}>
              <div className="sprocket sprocket-top" aria-hidden="true" />

              <div className="flex items-baseline justify-between">
                <div className="card-label">Contact sheet</div>
                <span className="frame-count">{photos.length}/{MAX_PHOTOS}</span>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`dropzone mt-4 ${
                  photos.length >= MAX_PHOTOS || busy || phase === "done"
                    ? "opacity-50 pointer-events-none"
                    : "cursor-pointer"
                }`}
              >
                <span className="dropzone-icon"><IconCamera /></span>
                <p className="dropzone-title">Drop photos here, or click to browse</p>
                <p className="dropzone-hint">First photo becomes the primary shot</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {photos.length > 0 && (
                <div className="thumb-grid mt-4">
                  {photos.map((p, i) => (
                    <Thumb
                      key={p.id}
                      src={p.previewUrl}
                      frameNumber={String(i + 1).padStart(2, "0")}
                      isPrimary={i === 0}
                      progress={p.progress}
                      status={p.status}
                      onRemove={() => removePhoto(p.id)}
                      onMakePrimary={() => makePrimary(p.id)}
                    />
                  ))}
                </div>
              )}

              <div className="sprocket sprocket-bottom" aria-hidden="true" />
            </div>
          </div>

          {/* Submit bar */}
          <div className="submit-bar fade-up" style={{ animationDelay: "180ms" }}>
            {phase === "done" ? (
              <>
                <div className="done-message">
                  <span className="done-icon"><IconCheck /></span>
                  Profile created and photos uploaded
                </div>
                <button type="button" onClick={resetAll} className="btn-secondary sm:ml-auto">
                  Add another profile
                </button>
              </>
            ) : (
              <>
                <button type="submit" disabled={!canSubmit || busy} className="btn-primary">
                  {phase === "creating"
                    ? "Creating profile…"
                    : phase === "uploading"
                    ? `Uploading photos… ${Math.round(overallProgress)}%`
                    : "Create profile"}
                </button>

                {busy && (
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${phase === "creating" ? 15 : overallProgress}%` }}
                    />
                  </div>
                )}

                {errorMessage && <span className="error-text">{errorMessage}</span>}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const rootVars = {
  "--ink": "#0A0A0C",
  "--surface": "#17151A",
  "--surface-2": "#201D24",
  "--accent": "#E8A33D",
  "--accent-deep": "#C9852A",
  "--accent-glow": "rgba(232, 163, 61, 0.32)",
  "--paper": "#F3EEE4",
  "--muted": "#8D8880",
  "--success": "#7FD858",
  "--error": "#FF5C5C",
  "--line": "rgba(255,255,255,0.08)",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

.font-display { font-family: 'Manrope', sans-serif; font-weight: 700; letter-spacing: -0.02em; }
body, .input, button, select { font-family: 'Inter', sans-serif; }
.font-mono, .uid-chip, .frame-number, .frame-count, .eyebrow, .thumb-progress-label { font-family: 'JetBrains Mono', monospace; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .fade-up { animation: none; }
}

/* Ambient safelight glow behind the hero */
.safelight {
  position: fixed;
  top: -220px;
  left: -160px;
  width: 620px;
  height: 620px;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 68%);
  filter: blur(10px);
  pointer-events: none;
  z-index: 0;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--accent);
}
.eyebrow::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 1px;
  background: var(--accent);
  display: inline-block;
}

.subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 14.5px;
  color: var(--muted);
  line-height: 1.55;
}

.card {
  position: relative;
  background: linear-gradient(180deg, var(--surface) 0%, #141217 100%);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 1px 0 rgba(255,255,255,0.03) inset, 0 24px 60px -34px rgba(0,0,0,0.85);
}
.contact-sheet { overflow: hidden; padding-top: 26px; padding-bottom: 26px; }

.card-label {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--muted);
}

.frame-count {
  font-size: 11px;
  color: var(--muted);
}

.sprocket {
  position: absolute;
  left: 0;
  right: 0;
  height: 12px;
  background-image: radial-gradient(circle at 11px 6px, var(--ink) 3px, transparent 3.4px);
  background-size: 22px 12px;
  background-repeat: repeat-x;
  opacity: 0.7;
}
.sprocket-top { top: 0; }
.sprocket-bottom { bottom: 0; }

.field-label {
  display: block;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin-bottom: 8px;
}

.input {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 10px 12px;
  color: var(--paper);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.input:focus-visible,
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.input:disabled { opacity: 0.5; }
.input::placeholder { color: #605C58; }
.input-number::-webkit-outer-spin-button,
.input-number::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.input-number { -moz-appearance: textfield; }

.select-wrap { position: relative; }
select.input { appearance: none; padding-right: 32px; }
.select-chevron {
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  pointer-events: none;
}

.uid-chip {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--muted);
}
.uid-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 6px 1px var(--accent-glow); }
.uid-value { color: var(--accent); }

.dropzone {
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.dropzone:hover, .dropzone:focus-visible {
  border-color: var(--accent-deep);
  background: rgba(232,163,61,0.05);
}
.dropzone-icon { color: var(--muted); margin-bottom: 10px; }
.dropzone-title { font-size: 14px; color: var(--paper); }
.dropzone-hint { font-size: 12px; color: var(--muted); margin-top: 4px; }

.thumb-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 14px;
}

.thumb-frame { position: relative; width: 76px; }
.thumb-img-wrap {
  position: relative;
  width: 76px;
  height: 76px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-2);
  border: 1px solid var(--line);
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.65;
  filter: saturate(0.7);
  transition: opacity 0.35s ease, filter 0.35s ease;
}
.thumb-img.is-done { opacity: 1; filter: saturate(1); }

.thumb-ring { position: absolute; inset: 0; width: 100%; height: 100%; }

.thumb-actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(10,10,12,0.55);
  opacity: 0;
  transition: opacity 0.15s ease;
}
.group:hover .thumb-actions, .thumb-actions:focus-within { opacity: 1; }
.thumb-action-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  color: var(--paper);
  transition: background 0.15s ease, color 0.15s ease;
}
.thumb-action-btn:hover { background: var(--accent); color: var(--ink); }
.thumb-action-danger:hover { background: var(--error); color: var(--paper); }

.frame-number {
  display: block;
  margin-top: 6px;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--muted);
  text-align: center;
}

.badge-primary {
  position: absolute;
  top: -7px;
  left: -7px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 8.5px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  letter-spacing: 0.04em;
  background: var(--accent);
  color: var(--ink);
  padding: 2.5px 6px;
  border-radius: 5px;
  box-shadow: 0 2px 8px -1px var(--accent-glow);
}

.badge-status {
  position: absolute;
  bottom: 8px;
  right: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px var(--ink);
}
.badge-success { background: var(--success); color: var(--ink); }
.badge-error { background: var(--error); color: var(--paper); }

.thumb-progress-label {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 9px;
  color: var(--muted);
}

.submit-bar {
  padding-top: 18px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
@media (min-width: 640px) {
  .submit-bar { flex-direction: row; align-items: center; }
}

.btn-primary {
  background: linear-gradient(180deg, var(--accent) 0%, var(--accent-deep) 100%);
  color: #1A1206;
  font-weight: 600;
  font-size: 14px;
  padding: 11px 22px;
  border-radius: 9px;
  transition: transform 0.1s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
  box-shadow: 0 8px 20px -8px var(--accent-glow);
}
.btn-primary:hover:not(:disabled) { box-shadow: 0 10px 26px -8px var(--accent-glow); }
.btn-primary:active:not(:disabled) { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; }
.btn-primary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.btn-secondary {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--paper);
  font-weight: 500;
  font-size: 14px;
  padding: 10px 18px;
  border-radius: 9px;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.btn-secondary:hover { border-color: var(--accent); background: rgba(232,163,61,0.06); }
.btn-secondary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.progress-track {
  flex: 1;
  max-width: 260px;
  height: 6px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-deep), var(--accent));
  box-shadow: 0 0 10px 0 var(--accent-glow);
  transition: width 0.2s ease;
}

.error-text { font-size: 13px; color: var(--error); }

.done-message {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--success);
}
.done-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--success);
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
}
`;