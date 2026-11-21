/**
 * CreateUserPage.jsx
 *
 * Mirrors the Android flow from UserHandler.java + MultiImageUploader.java:
 *   1. Collect profile details + photos from the admin.
 *   2. Create the Firestore user doc first (so we have a stable uid).
 *   3. Upload every photo to Cloudflare R2 (users/{uid}/photos/) through the
 *      media Worker, reporting per-photo and overall progress the whole way,
 *      then write user_profiles/{uid}/images and users/{uid}.photoUrl
 *      (what the Image.js Cloud Function did for Firebase Storage uploads).
 *
 * Also includes an Archive view for managing existing profiles:
 *   - Lists every user doc from Firestore.
 *   - Lists each user's photos from user_profiles/{uid}/images, falling back
 *     to their Firebase Storage folder for older profiles without records.
 *   - Lets the admin remove a profile entirely: this deletes the Firestore
 *     doc, every photo (R2 and/or Firebase Storage) and the photo records
 *     together, as one action. There is no way to remove a single photo on
 *     its own — removal always applies to the whole profile.
 *   - The Archive only ever loads gender = "F" profiles, filtered
 *     server-side in the Firestore query itself.
 *
 * Visual design: matches the Videos page — near-black background, Bebas Neue
 * headings, DM Sans text, lime (#c8ff00) accent, square 2px corners. All
 * styling is plain CSS in the `css` string at the bottom (no Tailwind).
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  doc,
  collection,
  setDoc,
  addDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref as storageRef,
  getDownloadURL,
  listAll,
  deleteObject,
  getMetadata,
} from "firebase/storage";
import { db, storage } from "../firebase"; // <-- adjust path to match your project structure
import { callMediaApi, putToR2 } from "../lib/mediaApi";

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

// ---------- R2: upload one photo, report progress, then record it ----------
// Uploads to users/{uid}/photos/ in R2, then writes the same Firestore data the
// Image.js Cloud Function wrote for Firebase Storage uploads (it doesn't run for R2).
async function uploadOnePhoto({ file, index, userId, isPrimary, onProgress }) {
  const contentType = file.type || "image/jpeg";
  const { uploadUrl, key, publicUrl } = await callMediaApi("/upload-url", {
    kind: "photo",
    userId,
    index,
    fileName: file.name,
    contentType,
    size: file.size,
  });

  await putToR2(uploadUrl, file, contentType, onProgress);

  await addDoc(collection(db, "user_profiles", userId, "images"), {
    url: publicUrl,
    blurHash: null,
    isPrimary,
    uploadedAt: serverTimestamp(),
    r2Key: key,
  });
  if (isPrimary) {
    await updateDoc(doc(db, "users", userId), { photoUrl: publicUrl });
  }
  return publicUrl;
}

// ---------- Firestore: list every user with gender = "F" ----------
// Filtered server-side so we never pull down non-matching profiles. Sorted by
// name here rather than with orderBy, which would need a composite index.
function fetchAllUsers() {
  return getDocs(query(collection(db, "users"), where("gender", "==", "F"))).then((snap) =>
    snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  );
}

// ---------- List every photo for one user, primary first ----------
// Reads the user_profiles/{uid}/images records (written for both R2 uploads
// and, by the Image.js function, for older Firebase Storage uploads).
async function fetchUserPhotos(userId) {
  const snap = await getDocs(collection(db, "user_profiles", userId, "images"));
  let items = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        path: d.id,
        name: d.id,
        url: data.url,
        isPrimary: data.isPrimary === true,
        time: data.uploadedAt?.toMillis?.() ?? 0,
      };
    })
    .filter((p) => p.url);

  // Older profiles with no photo records: fall back to their Storage folder.
  if (items.length === 0) items = await fetchStoragePhotos(userId);

  return items.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.time - b.time || a.name.localeCompare(b.name);
  });
}

async function fetchStoragePhotos(userId) {
  const listing = await listAll(storageRef(storage, `users/${userId}/photos`));
  return Promise.all(
    listing.items.map(async (itemRef) => {
      const [url, meta] = await Promise.all([getDownloadURL(itemRef), getMetadata(itemRef)]);
      return {
        path: itemRef.fullPath,
        name: itemRef.name,
        url,
        isPrimary: meta.customMetadata?.isPrimary === "true",
        time: 0,
      };
    })
  );
}

// ---------- Remove a user and every photo they have ----------
// This is the ONLY deletion path in the app: it removes the Firestore user doc,
// their photos (R2 for new profiles, Firebase Storage for older ones) and the
// user_profiles/{uid}/images records, as one action.
async function deleteUserCompletely(userId) {
  const imagesSnap = await getDocs(collection(db, "user_profiles", userId, "images"));

  // 1. Profile first: the Worker only deletes R2 photos once this doc is gone.
  await deleteDoc(doc(db, "users", userId));

  // 2. Photos in R2
  await callMediaApi("/delete-user-photos", { userId });

  // 3. Photos in Firebase Storage (older profiles)
  const listing = await listAll(storageRef(storage, `users/${userId}/photos`));
  await Promise.all(listing.items.map((itemRef) => deleteObject(itemRef)));

  // 4. Photo records
  await Promise.all(imagesSnap.docs.map((d) => deleteDoc(d.ref)));
}

function genderLabel(code) {
  if (code === "F") return "Female";
  if (code === "M") return "Male";
  if (code === "O") return "Other";
  return code || "—";
}

// ---------- Icons (inline, no icon package needed) ----------

const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.3L6.3 11.5L13 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCross = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
    <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconStar = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1.3l1.87 4.02 4.43.5-3.32 3.02.9 4.36L8 11.03l-3.88 2.17.9-4.36L1.7 5.82l4.43-.5L8 1.3z" />
  </svg>
);

const IconWarning = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
    <path d="M8 4.5v4.5M8 11.6h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconUpload = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconChevron = () => (
  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const IconPlus = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconGrid = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="2" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="9" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const IconUserGhost = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8.3" r="3.3" stroke="currentColor" strokeWidth="1.2" />
    <path d="M5 19c1-3.2 3.9-5 7-5s6 1.8 7 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const IconImages = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
    <path d="M4.5 3V2a.5.5 0 01.5-.5h9a.5.5 0 01.5.5v9a.5.5 0 01-.5.5h-2.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M1.5 11l3-3 3 3 2-2 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const IconRefresh = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path d="M13.5 8a5.5 5.5 0 10-1.6 3.9M13.5 8V4.6M13.5 8H10.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------- Photo tile on the create form ----------

function Thumb({ src, frameNumber, isPrimary, progress, status, onRemove, onMakePrimary }) {
  const pct = Math.round(Math.min(100, Math.max(0, progress)));
  return (
    <div className={`ph${status === "done" ? " is-done" : ""}${status === "error" ? " is-error" : ""}${status === "uploading" ? " is-uploading" : ""}`}>
      <img src={src} alt="" className="ph-img" />
      <span className="ph-num">{frameNumber}</span>
      {isPrimary && <span className="ph-primary"><IconStar /> Primary</span>}

      {status === "idle" && (
        <div className="ph-actions">
          {!isPrimary && (
            <button type="button" className="ph-btn" onClick={onMakePrimary} title="Make primary">
              <IconStar />
            </button>
          )}
          <button type="button" className="ph-btn danger" onClick={onRemove} title="Remove photo">
            <IconCross />
          </button>
        </div>
      )}

      {status === "uploading" && (
        <div className="ph-progress">
          <span className="ph-pct">{pct}%</span>
          <div className="ph-track"><div className="ph-fill" style={{ width: `${pct}%` }} /></div>
        </div>
      )}
      {status === "done" && <span className="ph-badge ok"><IconCheck /></span>}
      {status === "error" && <span className="ph-badge err"><IconWarning /></span>}
    </div>
  );
}

// ---------- Archive: one profile card ----------

function ProfileCard({ user, onRemoved }) {
  const [photos, setPhotos] = useState([]);
  const [photoStatus, setPhotoStatus] = useState("loading"); // loading | ready | error
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [cardError, setCardError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPhotoStatus("loading");
    fetchUserPhotos(user.id)
      .then((items) => {
        if (!cancelled) {
          setPhotos(items);
          setPhotoStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setPhotoStatus("error");
      });
    return () => { cancelled = true; };
  }, [user.id]);

  const primary = photos.find((p) => p.isPrimary) || photos[0];

  // Removing a profile deletes the Firestore doc, every photo and the photo
  // records together — there's no per-photo delete.
  const handleRemove = () => {
    setConfirmDelete(false);
    setDeletingUser(true);
    setCardError("");
    deleteUserCompletely(user.id)
      .then(() => {
        setRemoved(true);
        setTimeout(() => onRemoved(user.id), 450);
      })
      .catch((err) => {
        setDeletingUser(false);
        setCardError(err.message || "Could not remove this profile.");
      });
  };

  return (
    <div className={`pc${deletingUser ? " is-deleting" : ""}${removed ? " is-removed" : ""}`}>
      <div className="pc-cover">
        {photoStatus === "loading" ? (
          <div className="shimmer" />
        ) : primary ? (
          <img src={primary.url} alt="" loading="lazy" />
        ) : (
          <div className="pc-empty"><IconUserGhost /></div>
        )}

        {photoStatus === "ready" && photos.length > 0 && (
          <span className="pc-count"><IconImages /> {photos.length}</span>
        )}

        {deletingUser && (
          <div className="pc-overlay">
            <div className="spinner danger" />
            <span>Removing…</span>
          </div>
        )}
      </div>

      <div className="pc-body">
        <div className="pc-name" title={user.name}>{user.name || "Untitled"}</div>

        <div className="meta">
          <div className="meta-item">
            <span className="meta-label">Age</span>
            <span className="meta-value hi">{user.age || "—"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Gender</span>
            <span className="meta-value">{genderLabel(user.gender)}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Country</span>
            <span className="meta-value">{user.countryNameCode || "—"}</span>
          </div>
        </div>

        <div className="pc-uid" title={user.id}>{user.id}</div>

        {cardError && <div className="pc-error"><IconWarning /> {cardError}</div>}

        {confirmDelete ? (
          <div className="confirm-row">
            <span className="confirm-label">Remove profile?</span>
            <div className="confirm-btns">
              <button type="button" className="btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button type="button" className="btn-sm solid-danger" onClick={handleRemove}>Remove</button>
            </div>
          </div>
        ) : (
          <div className="pc-actions">
            <button
              type="button"
              className={`btn-outline${expanded ? " is-on" : ""}`}
              onClick={() => setExpanded((e) => !e)}
              disabled={photoStatus !== "ready" || photos.length === 0 || deletingUser}
            >
              <span className={`chev${expanded ? " open" : ""}`}><IconChevron /></span>
              Photos
            </button>
            <button
              type="button"
              className="btn-icon danger"
              onClick={() => setConfirmDelete(true)}
              disabled={deletingUser}
              title="Remove profile"
            >
              <IconTrash />
            </button>
          </div>
        )}

        {expanded && photoStatus === "ready" && photos.length > 0 && (
          <div className="pc-strip">
            {photos.map((photo) => (
              <a key={photo.path} className={`pc-mini${photo.isPrimary ? " is-primary" : ""}`}
                href={photo.url} target="_blank" rel="noreferrer" title={photo.isPrimary ? "Primary photo" : "Open photo"}>
                <img src={photo.url} alt="" loading="lazy" />
                {photo.isPrimary && <span className="pc-mini-star"><IconStar /></span>}
              </a>
            ))}
          </div>
        )}
        {expanded && photoStatus === "error" && <p className="hint">Couldn't load photos.</p>}
      </div>
    </div>
  );
}

// ---------- Archive: the full list ----------

function ArchivePanel({ onSwitchToCreate }) {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setStatus("loading");
    setErrorMessage("");
    fetchAllUsers()
      .then((list) => {
        setUsers(list);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMessage(err.message || "Could not load profiles.");
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUserRemoved = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const q = search.trim().toLowerCase();
  const filteredUsers = q
    ? users.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.countryNameCode || "").toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      )
    : users;

  return (
    <>
      <div className="toolbar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, country or uid…"
          className="input search"
          disabled={status !== "ready"}
        />
        <div className="toolbar-right">
          <span className="count">
            {status === "ready"
              ? q
                ? `${filteredUsers.length} of ${users.length}`
                : `${users.length} ${users.length === 1 ? "profile" : "profiles"}`
              : ""}
          </span>
          <button type="button" onClick={load} className="btn-outline" disabled={status === "loading"}>
            <IconRefresh /> Refresh
          </button>
        </div>
      </div>

      {status === "loading" && (
        <div className="loading-screen">
          <div className="spinner" />
          <p className="loading-text">Loading profiles</p>
        </div>
      )}

      {status === "error" && (
        <div className="empty">
          <p>{errorMessage}</p>
          <button type="button" onClick={load} className="btn-outline">Try again</button>
        </div>
      )}

      {status === "ready" && users.length === 0 && (
        <div className="empty">
          <p>No profiles yet.</p>
          <button type="button" onClick={onSwitchToCreate} className="btn-outline">
            <IconPlus /> New profile
          </button>
        </div>
      )}

      {status === "ready" && users.length > 0 && filteredUsers.length === 0 && (
        <div className="empty">
          <p>No matches for "{search}"</p>
          <button type="button" onClick={() => setSearch("")} className="btn-outline">Clear search</button>
        </div>
      )}

      {status === "ready" && filteredUsers.length > 0 && (
        <div className="grid">
          {filteredUsers.map((user) => (
            <ProfileCard key={user.id} user={user} onRemoved={handleUserRemoved} />
          ))}
        </div>
      )}
    </>
  );
}

// ---------- Main page ----------

export default function CreateUserPage() {
  const [tab, setTab] = useState("create"); // create | archive
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
  const [dragging, setDragging] = useState(false);
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
    setDragging(false);
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

    const results = await Promise.allSettled(
      photos.map((photo, index) =>
        uploadOnePhoto({
          file: photo.file,
          index,
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
      if (r.status === "rejected") {
        console.error(`Photo ${i + 1} failed:`, r.reason);
        setPhotoStatus(photos[i].id, "error");
      }
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
  const locked = busy || phase === "done";
  const dropDisabled = photos.length >= MAX_PHOTOS || locked;

  return (
    <>
      <style>{css}</style>

      <div className="cu-page">
        <div className="header">
          <div className="header-left">
            {tab === "create" ? <h1>NEW <span>PROFILE</span></h1> : <h1>PRO<span>FILES</span></h1>}
            <p className="header-sub">
              {tab === "create"
                ? "Add details and up to six photos. The first photo is the primary."
                : "Every female profile. Removing one deletes its record and all its photos."}
            </p>
          </div>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "create"}
              className={`tab${tab === "create" ? " active" : ""}`} onClick={() => setTab("create")}>
              <IconPlus /> New
            </button>
            <button type="button" role="tab" aria-selected={tab === "archive"}
              className={`tab${tab === "archive" ? " active" : ""}`} onClick={() => setTab("archive")}>
              <IconGrid /> Profiles
            </button>
          </div>
        </div>

        {tab === "create" ? (
          <form onSubmit={handleSubmit} className="create">
            {/* Details */}
            <section className="panel">
              <div className="panel-head">
                <span className="panel-label"><b>01</b> Details</span>
              </div>

              <label className="field">
                <span className="field-label">Name</span>
                <input type="text" value={form.name} onChange={updateField("name")}
                  disabled={locked} placeholder="e.g. Amara Wanjiru" className="input" />
              </label>

              <div className="field-row">
                <label className="field">
                  <span className="field-label">Age</span>
                  <input type="number" min="18" max="99" value={form.age} onChange={updateField("age")}
                    disabled={locked} placeholder="24" className="input no-spin" />
                </label>
                <label className="field">
                  <span className="field-label">Gender</span>
                  <div className="select-wrap">
                    <select value={form.gender} onChange={updateField("gender")} disabled={locked} className="input">
                      <option value="F">Female</option>
                      <option value="M">Male</option>
                      <option value="O">Other</option>
                    </select>
                    <span className="select-chev"><IconChevron /></span>
                  </div>
                </label>
              </div>

              <label className="field">
                <span className="field-label">Country</span>
                <div className="select-wrap">
                  <select value={form.countryNameCode} onChange={updateField("countryNameCode")} disabled={locked} className="input">
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label} ({c.code})</option>
                    ))}
                  </select>
                  <span className="select-chev"><IconChevron /></span>
                </div>
              </label>

              {createdUserId && (
                <div className="uid-chip">
                  <span className="uid-dot" />
                  <span className="field-label">UID</span>
                  <span className="uid-value">{createdUserId}</span>
                </div>
              )}
            </section>

            {/* Photos */}
            <section className="panel">
              <div className="panel-head">
                <span className="panel-label"><b>02</b> Photos</span>
                <span className="panel-count">{photos.length}/{MAX_PHOTOS}</span>
              </div>

              {!dropDisabled && (
                <div
                  className={`drop-zone${dragging ? " dragging" : ""}${photos.length ? " compact" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="drop-icon"><IconUpload size={photos.length ? 20 : 34} /></div>
                  <div className="drop-label">Drop photos here or <span>browse</span></div>
                  {!photos.length && <div className="drop-hint">JPG, PNG, WEBP · up to {MAX_PHOTOS} photos</div>}
                  <input ref={fileInputRef} type="file" accept="image/*" multiple hidden
                    onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
                </div>
              )}

              {photos.length > 0 && (
                <div className="ph-grid">
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
            </section>

            {/* Submit */}
            <section className="panel submit">
              {phase === "done" ? (
                <>
                  <div className="done-msg">
                    <span className="done-dot"><IconCheck /></span>
                    Profile created and {photos.length} {photos.length === 1 ? "photo" : "photos"} uploaded
                  </div>
                  <button type="button" onClick={resetAll} className="btn-outline">
                    <IconPlus /> Add another
                  </button>
                </>
              ) : (
                <>
                  <div className="submit-status">
                    {busy ? (
                      <>
                        <div className="progress-label-row">
                          <span className="progress-label">
                            {phase === "creating" ? "Creating profile…" : "Uploading photos…"}
                          </span>
                          <span className="progress-pct">{phase === "creating" ? 0 : Math.round(overallProgress)}%</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${phase === "creating" ? 4 : overallProgress}%` }} />
                        </div>
                      </>
                    ) : errorMessage ? (
                      <div className="error-msg"><IconWarning /> {errorMessage}</div>
                    ) : (
                      <span className="submit-hint">
                        {!form.name.trim() || !String(form.age).trim()
                          ? "Fill in name and age"
                          : photos.length === 0
                          ? "Add at least one photo"
                          : "Ready to create"}
                      </span>
                    )}
                  </div>

                  {phase === "error" ? (
                    <button type="button" onClick={resetAll} className="btn-outline">Start over</button>
                  ) : (
                    <button type="submit" disabled={!canSubmit || busy} className="btn-primary">
                      <IconUpload /> {busy ? "Working…" : "Create profile"}
                    </button>
                  )}
                </>
              )}
            </section>
          </form>
        ) : (
          <ArchivePanel onSwitchToCreate={() => setTab("create")} />
        )}
      </div>
    </>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0a0a0a; color: #e8e4de; font-family: 'DM Sans', sans-serif; min-height: 100vh; }

.cu-page { max-width: 1100px; margin: 0 auto; padding: 60px 24px 80px; font-family: 'DM Sans', sans-serif; color: #e8e4de; text-align: left; }
.cu-page button, .cu-page input, .cu-page select { font-family: 'DM Sans', sans-serif; }

/* Header */
.header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 40px; border-bottom: 1px solid #222; padding-bottom: 28px; }
.header-left h1 { font-family: 'Bebas Neue', sans-serif; font-weight: 400; font-size: clamp(52px, 8vw, 88px); line-height: 0.9; letter-spacing: 2px; color: #fff; }
.header-left h1 span { color: #c8ff00; }
.header-sub { margin-top: 12px; font-size: 13px; font-weight: 300; color: #666; max-width: 440px; line-height: 1.5; }

.tabs { display: flex; border: 1px solid #222; border-radius: 2px; }
.tab { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: transparent; border: none; color: #666; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; font-weight: 500; transition: background 0.15s, color 0.15s; }
.tab + .tab { border-left: 1px solid #222; }
.tab:hover { color: #ccc; background: #111; }
.tab.active { background: #c8ff00; color: #000; }

/* Create layout */
.create { display: grid; grid-template-columns: 340px 1fr; gap: 2px; }
.panel { background: #111; border: 1px solid #1a1a1a; padding: 22px 22px 24px; }
.panel.submit { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 18px 22px; }
.panel-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
.panel-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.6px; color: #555; font-weight: 500; }
.panel-label b { color: #c8ff00; font-weight: 500; margin-right: 8px; }
.panel-count { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #444; letter-spacing: 1px; line-height: 1; }

.field { display: block; margin-bottom: 16px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #555; font-weight: 500; margin-bottom: 7px; }
.input { width: 100%; background: #0d0d0d; border: 1px solid #222; border-radius: 2px; padding: 11px 12px; color: #e8e4de; font-size: 14px; outline: none; transition: border-color 0.15s, background 0.15s; }
.input:hover:not(:disabled) { border-color: #333; }
.input:focus { border-color: #c8ff00; background: #0a0a0a; }
.input:disabled { opacity: 0.45; cursor: not-allowed; }
.input::placeholder { color: #3a3a3a; }
.no-spin::-webkit-outer-spin-button, .no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spin { -moz-appearance: textfield; }
.select-wrap { position: relative; }
.select-wrap select { appearance: none; padding-right: 32px; cursor: pointer; }
.select-wrap select option { background: #111; color: #e8e4de; }
.select-chev { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #555; pointer-events: none; display: flex; }

.uid-chip { display: flex; align-items: center; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #1a1a1a; }
.uid-chip .field-label { margin: 0; }
.uid-dot { width: 6px; height: 6px; border-radius: 50%; background: #c8ff00; box-shadow: 0 0 8px #c8ff0088; flex-shrink: 0; }
.uid-value { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: #c8ff00; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Drop zone */
.drop-zone { border: 1.5px dashed #2a2a2a; border-radius: 2px; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; transition: border-color 0.2s, background 0.2s; text-align: center; margin-bottom: 14px; }
.drop-zone.compact { padding: 16px; flex-direction: row; justify-content: center; gap: 12px; }
.drop-zone:hover, .drop-zone.dragging { border-color: #c8ff00; background: rgba(200,255,0,0.03); }
.drop-icon { color: #333; transition: color 0.2s; display: flex; }
.drop-zone:hover .drop-icon, .drop-zone.dragging .drop-icon { color: #c8ff00; }
.drop-label { font-size: 14px; color: #888; }
.drop-label span { color: #c8ff00; }
.drop-hint { font-size: 11px; color: #3a3a3a; letter-spacing: 0.5px; text-transform: uppercase; }

/* Photo tiles */
.ph-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 2px; }
.ph { position: relative; aspect-ratio: 3/4; background: #0d0d0d; border: 1px solid #1a1a1a; overflow: hidden; }
.ph-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity 0.3s, filter 0.3s; }
.ph.is-uploading .ph-img { opacity: 0.45; filter: grayscale(0.6); }
.ph.is-error { border-color: #ff4444; }
.ph-num { position: absolute; top: 8px; right: 8px; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 1px; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.8); line-height: 1; }
.ph-primary { position: absolute; top: 8px; left: 8px; display: inline-flex; align-items: center; gap: 4px; padding: 3px 7px; background: #c8ff00; color: #000; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600; border-radius: 2px; }
.ph-actions { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; background: rgba(0,0,0,0.55); opacity: 0; transition: opacity 0.15s; }
.ph:hover .ph-actions, .ph-actions:focus-within { opacity: 1; }
.ph-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.3); color: #fff; cursor: pointer; backdrop-filter: blur(6px); transition: all 0.15s; }
.ph-btn:hover { background: #c8ff00; border-color: #c8ff00; color: #000; transform: scale(1.08); }
.ph-btn.danger:hover { background: #ff4444; border-color: #ff4444; color: #fff; }
.ph-progress { position: absolute; left: 0; right: 0; bottom: 0; padding: 10px; background: linear-gradient(transparent, rgba(0,0,0,0.85)); }
.ph-pct { display: block; font-family: 'Bebas Neue', sans-serif; font-size: 18px; color: #c8ff00; line-height: 1; margin-bottom: 6px; }
.ph-track { height: 3px; background: rgba(255,255,255,0.15); border-radius: 2px; overflow: hidden; }
.ph-fill { height: 100%; background: #c8ff00; transition: width 0.3s ease; }
.ph-badge { position: absolute; bottom: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.ph-badge.ok { background: #c8ff00; color: #000; }
.ph-badge.err { background: #ff4444; color: #fff; }

/* Submit bar */
.submit-status { flex: 1; min-width: 0; max-width: 520px; }
.submit-hint { font-size: 12px; color: #555; letter-spacing: 0.5px; text-transform: uppercase; }
.progress-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.progress-label { font-size: 12px; color: #888; letter-spacing: 0.5px; }
.progress-pct { font-family: 'Bebas Neue', sans-serif; font-size: 20px; color: #c8ff00; line-height: 1; }
.progress-track { height: 3px; background: #1e1e1e; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: #c8ff00; border-radius: 2px; transition: width 0.3s ease; }
.error-msg { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #ff6666; }
.done-msg { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #c8ff00; letter-spacing: 0.3px; }
.done-dot { width: 20px; height: 20px; border-radius: 50%; background: #c8ff00; color: #000; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* Buttons */
.btn-primary { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 26px; background: #c8ff00; border: none; color: #000; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; font-weight: 600; border-radius: 2px; transition: background 0.15s, transform 0.1s, opacity 0.15s; white-space: nowrap; }
.btn-primary:hover:not(:disabled) { background: #d8ff33; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.25; cursor: not-allowed; }
.btn-outline { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; background: transparent; border: 1px solid #2a2a2a; color: #888; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; border-radius: 2px; white-space: nowrap; }
.btn-outline:hover:not(:disabled) { background: #161616; border-color: #444; color: #e8e4de; }
.btn-outline.is-on { border-color: #c8ff00; color: #c8ff00; }
.btn-outline:disabled { opacity: 0.35; cursor: not-allowed; }
.btn-icon { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: transparent; border: 1px solid #2a2a2a; color: #555; cursor: pointer; transition: all 0.15s; border-radius: 2px; flex-shrink: 0; }
.btn-icon.danger:hover:not(:disabled) { background: rgba(255,68,68,0.1); border-color: #ff4444; color: #ff4444; }
.btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-sm { padding: 5px 10px; background: transparent; border: 1px solid #2a2a2a; color: #777; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; border-radius: 2px; }
.btn-sm:hover { background: #1a1a1a; border-color: #444; color: #ccc; }
.btn-sm.solid-danger { background: #ff4444; border-color: #ff4444; color: #fff; font-weight: 500; }
.btn-sm.solid-danger:hover { background: #ff2222; border-color: #ff2222; }
.chev { display: inline-flex; transition: transform 0.2s; }
.chev.open { transform: rotate(180deg); }

/* Archive */
.toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.toolbar .search { flex: 1; min-width: 220px; max-width: 420px; padding: 10px 12px; font-size: 13px; }
.toolbar-right { display: flex; align-items: center; gap: 14px; margin-left: auto; }
.count { font-size: 13px; font-weight: 300; color: #555; letter-spacing: 1px; text-transform: uppercase; }

.loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; gap: 16px; }
.spinner { width: 36px; height: 36px; border: 2px solid #222; border-top-color: #c8ff00; border-radius: 50%; animation: cu-spin 0.8s linear infinite; }
.spinner.danger { width: 30px; height: 30px; border-color: rgba(255,255,255,0.15); border-top-color: #ff4444; }
@keyframes cu-spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 13px; color: #444; letter-spacing: 2px; text-transform: uppercase; }
.empty { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0; color: #444; font-size: 15px; text-align: center; }
.empty p { max-width: 560px; overflow-wrap: anywhere; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 2px; }
.pc { background: #111; border: 1px solid #1a1a1a; overflow: hidden; transition: border-color 0.2s, opacity 0.4s, transform 0.4s; }
.pc:hover { border-color: #333; }
.pc.is-deleting { pointer-events: none; }
.pc.is-removed { opacity: 0; transform: scale(0.95); }
.pc-cover { position: relative; aspect-ratio: 4/5; background: #0d0d0d; }
.pc-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pc-empty { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #2a2a2a; }
.pc-count { position: absolute; bottom: 10px; right: 10px; display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); color: #e8e4de; font-size: 11px; border-radius: 2px; }
.pc-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #ff4444; font-weight: 500; }
.shimmer { width: 100%; height: 100%; background: linear-gradient(100deg, #0d0d0d 40%, #161616 50%, #0d0d0d 60%); background-size: 200% 100%; animation: cu-shimmer 1.6s ease-in-out infinite; }
@keyframes cu-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.pc-body { padding: 16px 18px 18px; }
.pc-name { font-size: 15px; font-weight: 500; color: #e8e4de; margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta { display: flex; gap: 18px; flex-wrap: wrap; margin-bottom: 10px; }
.meta-item { display: flex; flex-direction: column; gap: 2px; }
.meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #444; font-weight: 500; }
.meta-value { font-size: 13px; color: #999; font-weight: 300; }
.meta-value.hi { color: #c8ff00; font-weight: 500; }
.pc-uid { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; color: #3a3a3a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 14px; }
.pc-error { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #ff6666; margin-bottom: 10px; }
.pc-actions { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #1a1a1a; gap: 10px; }
.confirm-row { display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #ff444422; gap: 8px; animation: cu-slide 0.15s ease; }
@keyframes cu-slide { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.confirm-label { font-size: 11px; color: #ff6666; letter-spacing: 0.5px; white-space: nowrap; }
.confirm-btns { display: flex; gap: 6px; }
.pc-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; margin-top: 12px; animation: cu-slide 0.15s ease; }
.pc-mini { position: relative; aspect-ratio: 3/4; overflow: hidden; background: #0d0d0d; border: 1px solid #1a1a1a; display: block; }
.pc-mini.is-primary { border-color: #c8ff00; }
.pc-mini img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.2s; }
.pc-mini:hover img { transform: scale(1.05); }
.pc-mini-star { position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background: #c8ff00; color: #000; display: flex; align-items: center; justify-content: center; }
.hint { font-size: 12px; color: #555; margin-top: 10px; }

@media (max-width: 820px) {
  .create { grid-template-columns: 1fr; }
  .panel.submit { flex-direction: column; align-items: stretch; }
  .panel.submit .btn-primary, .panel.submit .btn-outline { justify-content: center; }
  .submit-status { max-width: none; }
}
@media (prefers-reduced-motion: reduce) {
  .shimmer, .spinner { animation-duration: 3s; }
}
`;
