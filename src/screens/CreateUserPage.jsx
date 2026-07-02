/**
 * CreateUserPage.jsx
 *
 * Mirrors the Android flow from UserHandler.java + MultiImageUploader.java:
 *   1. Collect profile details + photos from the admin.
 *   2. Create the Firestore user doc first (so we have a stable uid).
 *   3. Upload every photo to Storage using that uid in the custom metadata,
 *      reporting per-photo and overall progress the whole way.
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

// ---------- Small presentational bits ----------

function Thumb({ src, isPrimary, progress, status, onRemove, onMakePrimary }) {
  const showRing = status === "uploading";
  const ringDeg = Math.min(360, Math.round((progress / 100) * 360));

  return (
    <div className="relative w-16 h-16 shrink-0 group">
      <div
        className="w-full h-full rounded-lg overflow-hidden bg-[--surface-2] relative"
        style={
          showRing
            ? {
                boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.06)`,
              }
            : undefined
        }
      >
        <img
          src={src}
          alt="Selected profile"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            status === "done" ? "opacity-100" : "opacity-60"
          }`}
        />

        {showRing && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 36 36"
          >
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="2.5"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${(ringDeg / 360) * 100.5} 100.5`}
            />
          </svg>
        )}
      </div>

      {isPrimary && (
        <span className="absolute -top-1.5 -left-1.5 text-[8px] font-mono font-medium tracking-wide bg-[--accent] text-[--ink] px-1 py-0.5 rounded shadow-sm">
          1st
        </span>
      )}

      {status === "done" && (
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[--success] text-[--ink] text-[10px] flex items-center justify-center font-bold ring-2 ring-[--ink]">
          ✓
        </span>
      )}

      {status === "error" && (
        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[--error] text-[--cream] text-[10px] flex items-center justify-center font-bold ring-2 ring-[--ink]">
          !
        </span>
      )}

      {status === "idle" && (
        <div className="absolute inset-0 rounded-lg flex items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isPrimary && (
            <button
              type="button"
              onClick={onMakePrimary}
              title="Make primary"
              className="w-5 h-5 rounded-full bg-white/10 text-[--cream] text-[10px] flex items-center justify-center hover:bg-[--accent] hover:text-[--ink] transition-colors"
            >
              ★
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            title="Remove photo"
            className="w-5 h-5 rounded-full bg-white/10 text-[--cream] text-[10px] flex items-center justify-center hover:bg-[--error] transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {status === "uploading" && (
        <div className="absolute -bottom-4 left-0 right-0 text-center font-mono text-[9px] text-[--muted]">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-[11px] font-mono uppercase tracking-[0.14em] text-[--muted] mb-2">
        {label}
      </span>
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
    <div className="min-h-screen bg-[--ink] text-[--cream]" style={rootVars}>
      <style>{css}</style>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        {/* Hero */}
        <div className="mb-10 sm:mb-12">
          <h1 className="font-display text-3xl sm:text-4xl leading-tight text-[--cream]">
            Create a new profile
          </h1>
          <p className="mt-2 text-[--muted] text-sm">
            Enter their details, add a few photos, and we'll create the
            profile before sending images to storage.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Details */}
          <div className="card space-y-5">
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
                  className="input"
                />
              </Field>

              <Field label="Gender" htmlFor="gender">
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
              </Field>
            </div>

            <Field label="Country" htmlFor="country">
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
            </Field>

            {createdUserId && (
              <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-[--muted]">
                <span className="w-1.5 h-1.5 rounded-full bg-[--accent]" />
                uid <span className="text-[--accent]">{createdUserId}</span>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="card space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[--muted]">
                Photos
              </span>
              <span className="text-[11px] font-mono text-[--muted]">
                {photos.length}/{MAX_PHOTOS}
              </span>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`dropzone ${
                photos.length >= MAX_PHOTOS || busy || phase === "done"
                  ? "opacity-50 pointer-events-none"
                  : "cursor-pointer"
              }`}
            >
              <p className="text-sm text-[--cream]">
                Drop photos here, or click to browse
              </p>
              <p className="text-xs text-[--muted] mt-1">
                First photo becomes the primary shot
              </p>
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
              <div className="flex flex-wrap gap-3 pt-1">
                {photos.map((p, i) => (
                  <Thumb
                    key={p.id}
                    src={p.previewUrl}
                    isPrimary={i === 0}
                    progress={p.progress}
                    status={p.status}
                    onRemove={() => removePhoto(p.id)}
                    onMakePrimary={() => makePrimary(p.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit bar */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
            {phase === "done" ? (
              <>
                <div className="flex items-center gap-2.5 text-[--success] text-sm font-medium">
                  <span className="w-5 h-5 rounded-full bg-[--success] text-[--ink] flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  Profile created and photos uploaded
                </div>
                <button
                  type="button"
                  onClick={resetAll}
                  className="btn-secondary sm:ml-auto"
                >
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
                  <div className="flex-1 h-1.5 rounded-full bg-[--line] overflow-hidden max-w-xs">
                    <div
                      className="h-full progress-fill transition-[width] duration-200"
                      style={{
                        width: `${phase === "creating" ? 15 : overallProgress}%`,
                      }}
                    />
                  </div>
                )}

                {errorMessage && (
                  <span className="text-sm text-[--error]">{errorMessage}</span>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const rootVars = {
  "--ink": "#0B0B0D",
  "--surface": "#131317",
  "--surface-2": "#1B1B20",
  "--accent": "#5B8CFF",
  "--accent-deep": "#3E6FE0",
  "--cream": "#F1F1F0",
  "--muted": "#8A8A8F",
  "--success": "#3ECF8E",
  "--error": "#F2685C",
  "--line": "rgba(255,255,255,0.08)",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

.font-display { font-family: 'Fraunces', serif; font-weight: 600; letter-spacing: -0.01em; }
body, .input, button { font-family: 'Inter', sans-serif; }
.font-mono, [class*="font-mono"] { font-family: 'JetBrains Mono', monospace; }

.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 22px;
}

.input {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 10px 12px;
  color: var(--cream);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(91,140,255,0.15); }
.input:disabled { opacity: 0.55; }
.input::placeholder { color: #5A5A5F; }
select.input { appearance: none; }

.dropzone {
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.dropzone:hover {
  border-color: var(--accent-deep);
  background: rgba(91,140,255,0.05);
}

.btn-primary {
  background: var(--accent);
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  padding: 11px 22px;
  border-radius: 9px;
  transition: background 0.15s ease, transform 0.1s ease;
  white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { background: var(--accent-deep); }
.btn-primary:active:not(:disabled) { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }

.btn-secondary {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--cream);
  font-weight: 500;
  font-size: 14px;
  padding: 10px 18px;
  border-radius: 9px;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.btn-secondary:hover { border-color: var(--accent); background: rgba(91,140,255,0.06); }

.progress-fill {
  background: var(--accent);
}
`;