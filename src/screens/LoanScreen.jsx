import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  User, Phone, CreditCard, ArrowRight, CheckCircle2, Upload,
  ShieldCheck, Clock, Banknote, Loader2, AlertCircle, RefreshCw,
  Eye, FileCheck, ChevronRight, Sparkles, Check, X, ZoomIn,
  BadgeCheck, Camera, ImageIcon
} from "lucide-react";

// ─── Firebase config – replace with your own ─────────────────────────────────
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// ─── tokens ──────────────────────────────────────────────────────────────────
const T = {
  white: "#ffffff",
  bg: "#f7f8fc",
  surface: "#ffffff",
  surfaceAlt: "#f3f4f8",
  border: "#e8eaf0",
  borderFocus: "#4f7cff",
  text: "#0d0f1a",
  textSub: "#5a5f7a",
  textMuted: "#9499b5",
  blue: "#4f7cff",
  blueSoft: "#eef2ff",
  blueDeep: "#1a45cc",
  green: "#22c55e",
  greenSoft: "#f0fdf4",
  amber: "#f59e0b",
  amberSoft: "#fffbeb",
  red: "#ef4444",
  redSoft: "#fef2f2",
};

const G = {
  primary: "linear-gradient(135deg, #4f7cff 0%, #7c5cfc 100%)",
  card: "linear-gradient(160deg, #ffffff 0%, #f7f8fc 100%)",
  success: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
};

// ─── styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: ${T.bg}; }
  .loan-root { min-height: 100vh; background: ${T.bg}; padding: 20px 16px 40px; display: flex; flex-direction: column; align-items: center; }
  .card { background: ${T.surface}; border-radius: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 8px 32px rgba(79,124,255,.08); width: 100%; max-width: 440px; overflow: hidden; }
  .card-header { background: ${G.primary}; padding: 32px 28px 28px; color: #fff; position: relative; overflow: hidden; }
  .card-header::after { content: ''; position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; background: rgba(255,255,255,.06); border-radius: 50%; }
  .card-header::before { content: ''; position: absolute; bottom: -20px; left: 60px; width: 100px; height: 100px; background: rgba(255,255,255,.04); border-radius: 50%; }
  .card-body { padding: 28px; }
  .field { margin-bottom: 20px; }
  .field label { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: ${T.textSub}; margin-bottom: 8px; letter-spacing: .3px; text-transform: uppercase; }
  .input-wrap { position: relative; }
  .input-wrap input { width: 100%; border: 1.5px solid ${T.border}; border-radius: 12px; padding: 13px 14px 13px 44px; font-size: 15px; font-family: inherit; color: ${T.text}; background: ${T.surfaceAlt}; outline: none; transition: border .2s, background .2s; }
  .input-wrap input:focus { border-color: ${T.borderFocus}; background: #fff; box-shadow: 0 0 0 4px rgba(79,124,255,.1); }
  .input-wrap .icon-left { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: ${T.textMuted}; pointer-events: none; }
  .field-error { font-size: 12px; color: ${T.red}; margin-top: 5px; display: flex; align-items: center; gap: 4px; }
  .input-wrap input.err { border-color: ${T.red}; background: ${T.redSoft}; }
  .btn-primary { width: 100%; padding: 15px; background: ${G.primary}; color: #fff; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity .2s, transform .1s; letter-spacing: .2px; }
  .btn-primary:hover:not(:disabled) { opacity: .92; transform: translateY(-1px); }
  .btn-primary:active:not(:disabled) { transform: scale(.98); }
  .btn-primary:disabled { opacity: .45; cursor: not-allowed; }
  .btn-ghost { background: transparent; border: 1.5px solid ${T.border}; border-radius: 12px; padding: 10px 16px; font-size: 13px; font-weight: 600; font-family: inherit; color: ${T.textSub}; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all .2s; }
  .btn-ghost:hover { border-color: ${T.blue}; color: ${T.blue}; background: ${T.blueSoft}; }
  .stage-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid ${T.border}; }
  .stage-row:last-child { border-bottom: none; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: .3px; }
  .pill-info { background: ${T.blueSoft}; color: ${T.blue}; }
  .pill-success { background: ${T.greenSoft}; color: #15803d; }
  .pill-warn { background: ${T.amberSoft}; color: #92400e; }
  .pill-err { background: ${T.redSoft}; color: ${T.red}; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
  .meta-cell { background: ${T.surfaceAlt}; border-radius: 12px; padding: 12px 14px; }
  .meta-cell .mlabel { font-size: 10px; font-weight: 700; color: ${T.textMuted}; letter-spacing: .5px; text-transform: uppercase; margin-bottom: 4px; }
  .meta-cell .mval { font-size: 15px; font-weight: 700; color: ${T.text}; }
  .upload-zone { border: 2px dashed ${T.border}; border-radius: 16px; padding: 22px 16px; text-align: center; cursor: pointer; transition: all .2s; background: ${T.bg}; position: relative; overflow: hidden; }
  .upload-zone:hover, .upload-zone.drag { border-color: ${T.blue}; background: ${T.blueSoft}; }
  .upload-zone.done { border-color: ${T.green}; border-style: solid; background: ${T.greenSoft}; }
  .upload-zone.bad { border-color: ${T.red}; border-style: solid; background: ${T.redSoft}; }
  .preview-img { width: 100%; height: 140px; object-fit: cover; border-radius: 10px; margin-bottom: 10px; }
  .progress-bar { height: 4px; background: rgba(255,255,255,.25); border-radius: 99px; overflow: hidden; margin-top: 10px; }
  .progress-fill { height: 100%; background: rgba(255,255,255,.9); border-radius: 99px; transition: width .35s cubic-bezier(.4,0,.2,1); }
  .amount-hero { background: ${G.primary}; border-radius: 18px; padding: 28px 20px; text-align: center; margin: 16px 0 20px; }
  .confirmed-field { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid ${T.border}; }
  .confirmed-field:last-child { border-bottom: none; }
  .spin { animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp .35s ease both; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
  .pulse { animation: pulse 1s ease-in-out infinite; }
  .divider { height: 1px; background: ${T.border}; margin: 20px 0; }
  .step-dots { display: flex; gap: 6px; justify-content: center; padding: 16px 0 0; }
  .step-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.35); transition: all .2s; }
  .step-dot.active { background: #fff; width: 18px; }
  .step-dot.done { background: rgba(255,255,255,.7); }
  .upload-status { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; padding: 14px; background: ${T.surfaceAlt}; border-radius: 12px; }
  .upload-status-row { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; }
`;

const STEPS = ["form", "processing", "approved", "upload", "selfie", "confirm", "done"];

const PROC_STAGES = [
  { label: "Verifying identity", icon: ShieldCheck, ms: 1400 },
  { label: "Checking credit history", icon: CreditCard, ms: 1500 },
  { label: "Assessing repayment capacity", icon: Banknote, ms: 1200 },
  { label: "Calculating loan offer", icon: Sparkles, ms: 900 },
];

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/** Generate a unique application ID */
function generateUserId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LN-${ts}-${rand}`;
}

/**
 * 1. Create Firestore doc with the userId as document ID (initial skeleton)
 * 2. Upload front, back, selfie to Storage with metadata
 * 3. Merge user fields into the same Firestore doc (setDoc merge:true)
 */
async function submitToFirebase({ userId, formData, frontFile, backFile, selfieFile }) {
  // ── Step 1: create/init the Firestore doc ──────────────────────────────────
  const docRef = doc(db, "loan_applications", userId);
  await setDoc(docRef, {
    userId,
    status: "pending_review",
    createdAt: serverTimestamp(),
  }, { merge: true });

  // ── Step 2: upload images to Firebase Storage ─────────────────────────────
  const uploadImage = async (file, type) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `loan_applications/${userId}/${type}.${ext}`;
    const fileRef = storageRef(storage, path);
    const metadata = {
      customMetadata: {
        userId,
        type,           // "id_front" | "id_back" | "selfie"
        uploadedAt: new Date().toISOString(),
      },
    };
    const snap = await uploadBytes(fileRef, file, metadata);
    return await getDownloadURL(snap.ref);
  };

  const [frontUrl, backUrl, selfieUrl] = await Promise.all([
    uploadImage(frontFile, "id_front"),
    uploadImage(backFile, "id_back"),
    uploadImage(selfieFile, "selfie"),
  ]);

  // ── Step 3: merge user-collected fields into the same doc ─────────────────
  await setDoc(docRef, {
    fullName: formData.fullName,
    phone: formData.phone,
    idNumber: formData.idNumber,
    loanAmount: 560,
    currency: "KES",
    documents: {
      id_front: frontUrl,
      id_back: backUrl,
      selfie: selfieUrl,
    },
    submittedAt: serverTimestamp(),
  }, { merge: true });  // merge keeps any fields already on the doc

  return userId;
}

// ─── sub-components ───────────────────────────────────────────────────────────
function StepDots({ current }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="step-dots">
      {STEPS.map((s, i) => (
        <div key={s} className={`step-dot ${i < idx ? "done" : i === idx ? "active" : ""}`} />
      ))}
    </div>
  );
}

function SimpleUploadCard({ label, side, file, preview, onFile, onRetake, icon: Icon = Upload, hint }) {
  const ref = useRef();
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(side, f);
  };

  const zoneClass = `upload-zone${drag ? " drag" : ""}${file ? " done" : ""}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{label}</span>
        {file && (
          <button className="btn-ghost" onClick={onRetake} style={{ padding: "6px 10px", fontSize: 11 }}>
            <RefreshCw size={11} /> Retake
          </button>
        )}
      </div>
      <div
        className={zoneClass}
        onClick={() => ref.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
      >
        <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => e.target.files[0] && onFile(side, e.target.files[0])} />

        {!file ? (
          <>
            <Icon size={24} color={T.textMuted} style={{ margin: "0 auto 8px", display: "block" }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: T.textSub }}>Tap to upload</p>
            {hint && <p style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{hint}</p>}
          </>
        ) : (
          <>
            {preview && <img src={preview} alt={label} className="preview-img" />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Check size={14} color={T.green} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>Photo added</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function LoanApp() {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ phone: "", idNumber: "", fullName: "" });
  const [errors, setErrors] = useState({});
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState([]);

  // ID uploads
  const [uploads, setUploads] = useState({ front: null, back: null });
  const [previews, setPreviews] = useState({ front: null, back: null });

  // Selfie
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [userId, setUserId] = useState(null);

  const validate = () => {
    const e = {};
    if (!form.phone.match(/^[0-9]{9,12}$/)) e.phone = "Enter a valid phone number";
    if (!form.idNumber.match(/^[A-Za-z0-9]{5,15}$/)) e.idNumber = "Enter a valid ID number";
    if (form.fullName.trim().split(" ").length < 2) e.fullName = "Enter full name (first & last)";
    return e;
  };

  const handleInput = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleSubmitForm = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep("processing");
  };

  // processing animation
  useEffect(() => {
    if (step !== "processing") return;
    const total = PROC_STAGES.reduce((a, s) => a + s.ms, 0);
    let elapsed = 0;
    const run = (idx) => {
      if (idx >= PROC_STAGES.length) { setTimeout(() => setStep("approved"), 400); return; }
      const d = PROC_STAGES[idx].ms;
      let t = 0;
      const iv = setInterval(() => {
        t += 60; elapsed += 60;
        setProgress(Math.round((elapsed / total) * 100));
        if (t >= d) {
          clearInterval(iv);
          setCompleted(p => [...p, idx]);
          setStageIdx(idx + 1);
          run(idx + 1);
        }
      }, 60);
    };
    run(0);
  }, [step]);

  const handleIdFile = useCallback((side, file) => {
    const url = URL.createObjectURL(file);
    setUploads(u => ({ ...u, [side]: file }));
    setPreviews(p => ({ ...p, [side]: url }));
  }, []);

  const handleRetakeId = (side) => {
    setUploads(u => ({ ...u, [side]: null }));
    setPreviews(p => ({ ...p, [side]: null }));
  };

  const handleSelfieFile = (_, file) => {
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
  };

  const handleRetakeSelfie = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
  };

  const idBothReady = uploads.front && uploads.back;
  const selfieReady = !!selfieFile;

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const uid = generateUserId();
      await submitToFirebase({
        userId: uid,
        formData: form,
        frontFile: uploads.front,
        backFile: uploads.back,
        selfieFile,
      });
      setUserId(uid);
      setStep("done");
    } catch (err) {
      console.error(err);
      setSubmitError("Upload failed. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="loan-root">
        <div style={{ width: "100%", maxWidth: 440, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ background: G.primary, borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Banknote size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: T.text }}>SwiftLoan</span>
          </div>
        </div>

        {/* ── FORM ── */}
        {step === "form" && (
          <div className="card fade-up">
            <div className="card-header">
              <div style={{ fontSize: 12, letterSpacing: 1.5, opacity: .75, marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Quick Apply</div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -.5, lineHeight: 1.1 }}>Get your loan offer<br />in 60 seconds</div>
              <div style={{ marginTop: 12, opacity: .8, fontSize: 13 }}>No paperwork. Instant decision.</div>
              <StepDots current="form" />
            </div>
            <div className="card-body">
              {[
                { field: "fullName", label: "Full Name", icon: User, placeholder: "John Kamau Mwangi" },
                { field: "phone", label: "Phone Number", icon: Phone, placeholder: "0712 345 678" },
                { field: "idNumber", label: "ID Card Number", icon: CreditCard, placeholder: "30000000" },
              ].map(({ field, label, icon: Icon, placeholder }) => (
                <div className="field" key={field}>
                  <label><Icon size={12} /> {label}</label>
                  <div className="input-wrap">
                    <Icon size={16} className="icon-left" />
                    <input
                      className={errors[field] ? "err" : ""}
                      type={field === "phone" ? "tel" : "text"}
                      placeholder={placeholder}
                      value={form[field]}
                      onChange={e => handleInput(field, e.target.value)}
                    />
                  </div>
                  {errors[field] && <div className="field-error"><AlertCircle size={12} />{errors[field]}</div>}
                </div>
              ))}
              <button className="btn-primary" onClick={handleSubmitForm}>
                Check My Offer <ArrowRight size={16} />
              </button>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
                <ShieldCheck size={13} color={T.textMuted} />
                <span style={{ fontSize: 11, color: T.textMuted }}>256-bit encryption · Your data stays private</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === "processing" && (
          <div className="card fade-up">
            <div className="card-header">
              <div style={{ fontSize: 12, letterSpacing: 1.5, opacity: .75, marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Analysing</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5 }}>Evaluating your profile</div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
              <div style={{ marginTop: 8, fontSize: 13, opacity: .8 }}>{progress}% complete</div>
              <StepDots current="processing" />
            </div>
            <div className="card-body">
              {PROC_STAGES.map((s, i) => {
                const done = completed.includes(i);
                const active = i === stageIdx;
                const Icon = s.icon;
                return (
                  <div className="stage-row" key={i} style={{ opacity: i > stageIdx ? .35 : 1, transition: "opacity .4s" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? T.greenSoft : active ? T.blueSoft : T.surfaceAlt,
                      border: active ? `1.5px solid ${T.blue}` : "none", transition: "all .3s"
                    }}>
                      {done ? <CheckCircle2 size={18} color={T.green} /> :
                        active ? <Loader2 size={16} color={T.blue} className="spin" /> :
                          <Icon size={16} color={T.textMuted} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: done || active ? 600 : 400, color: done ? T.text : active ? T.text : T.textMuted }}>
                        {s.label}
                      </div>
                    </div>
                    {done && <span className="badge pill-success"><Check size={9} /> Done</span>}
                    {active && <span className="badge pill-info"><Loader2 size={9} className="spin" /> Running</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── APPROVED ── */}
        {step === "approved" && (
          <div className="card fade-up">
            <div className="card-header" style={{ textAlign: "center", padding: "36px 28px 28px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <BadgeCheck size={28} color="#fff" />
              </div>
              <div style={{ fontSize: 13, letterSpacing: 1.5, opacity: .75, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Pre-approved</div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -.5 }}>You qualify!</div>
              <StepDots current="approved" />
            </div>
            <div className="card-body">
              <p style={{ textAlign: "center", color: T.textSub, fontSize: 14 }}>Based on your profile, here is your offer:</p>
              <div className="amount-hero">
                <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Approved Amount</div>
                <div style={{ color: "#fff", fontSize: 56, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>KES 560</div>
                <div style={{ color: "rgba(255,255,255,.65)", fontSize: 12, marginTop: 8 }}>Disbursed directly to M-Pesa</div>
              </div>
              <div className="meta-grid">
                {[
                  { label: "Repayment", val: "30 days" },
                  { label: "Interest", val: "2.5%" },
                  { label: "Processing fee", val: "KES 0" },
                  { label: "Via", val: "M-Pesa" },
                ].map(({ label, val }) => (
                  <div className="meta-cell" key={label}>
                    <div className="mlabel">{label}</div>
                    <div className="mval">{val}</div>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={() => setStep("upload")}>
                Upload ID to Proceed <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── UPLOAD (ID front + back) ── */}
        {step === "upload" && (
          <div className="card fade-up">
            <div className="card-header">
              <div style={{ fontSize: 12, letterSpacing: 1.5, opacity: .75, marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Step 1 of 3</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5 }}>Upload your ID</div>
              <div style={{ marginTop: 8, opacity: .8, fontSize: 13 }}>Both sides of your national ID card</div>
              <StepDots current="upload" />
            </div>
            <div className="card-body">
              <div style={{ background: T.amberSoft, border: `1px solid #fde68a`, borderRadius: 12, padding: "12px 14px", marginBottom: 20, display: "flex", gap: 10 }}>
                <Eye size={15} color={T.amber} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>
                  Ensure your ID is <strong>well-lit</strong>, <strong>flat</strong>, and all text is clearly visible.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <SimpleUploadCard
                  label="Front of ID"
                  side="front"
                  file={uploads.front}
                  preview={previews.front}
                  onFile={handleIdFile}
                  onRetake={() => handleRetakeId("front")}
                  icon={ImageIcon}
                  hint="Photo of the front side"
                />
                <SimpleUploadCard
                  label="Back of ID"
                  side="back"
                  file={uploads.back}
                  preview={previews.back}
                  onFile={handleIdFile}
                  onRetake={() => handleRetakeId("back")}
                  icon={ImageIcon}
                  hint="Photo of the back side"
                />
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: idBothReady ? T.green : T.border, transition: "background .3s" }} />
                  <span style={{ fontSize: 12, color: T.textSub, fontWeight: 500 }}>
                    {idBothReady ? "Both sides added — ready to continue" : "Upload both sides to continue"}
                  </span>
                </div>
                <button className="btn-primary" disabled={!idBothReady} onClick={() => setStep("selfie")}>
                  Next: Take a Selfie <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SELFIE ── */}
        {step === "selfie" && (
          <div className="card fade-up">
            <div className="card-header">
              <div style={{ fontSize: 12, letterSpacing: 1.5, opacity: .75, marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Step 2 of 3</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5 }}>Take a selfie</div>
              <div style={{ marginTop: 8, opacity: .8, fontSize: 13 }}>A clear photo of your face to verify your identity</div>
              <StepDots current="selfie" />
            </div>
            <div className="card-body">
              <div style={{ background: T.blueSoft, border: `1px solid #c7d7ff`, borderRadius: 12, padding: "12px 14px", marginBottom: 20, display: "flex", gap: 10 }}>
                <Camera size={15} color={T.blue} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#1e3a8a", lineHeight: 1.5 }}>
                  Look directly at the camera. Make sure your face is <strong>fully visible</strong> with good lighting. Remove sunglasses or hats.
                </p>
              </div>

              <SimpleUploadCard
                label="Selfie Photo"
                side="selfie"
                file={selfieFile}
                preview={selfiePreview}
                onFile={handleSelfieFile}
                onRetake={handleRetakeSelfie}
                icon={Camera}
                hint="Front-facing camera works best"
              />

              {/* Tips */}
              {!selfieFile && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
                  {[
                    { tip: "Face the camera directly" },
                    { tip: "Use natural lighting" },
                    { tip: "No filters or overlays" },
                    { tip: "Plain background" },
                  ].map(({ tip }) => (
                    <div key={tip} style={{ display: "flex", gap: 6, alignItems: "flex-start", background: T.surfaceAlt, borderRadius: 10, padding: "8px 10px" }}>
                      <Check size={11} color={T.green} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 11, color: T.textSub, lineHeight: 1.4 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={() => setStep("upload")} style={{ flex: "0 0 auto" }}>
                  <RefreshCw size={13} /> Back
                </button>
                <button className="btn-primary" style={{ flex: 1 }} disabled={!selfieReady} onClick={() => setStep("confirm")}>
                  Review & Submit <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CONFIRM ── */}
        {step === "confirm" && (
          <div className="card fade-up">
            <div className="card-header">
              <div style={{ fontSize: 12, letterSpacing: 1.5, opacity: .75, marginBottom: 6, textTransform: "uppercase", fontWeight: 600 }}>Step 3 of 3</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5 }}>Review & submit</div>
              <div style={{ marginTop: 8, opacity: .8, fontSize: 13 }}>Confirm everything looks correct</div>
              <StepDots current="confirm" />
            </div>
            <div className="card-body">
              {/* Photo previews */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {[
                  { preview: previews.front, label: "ID Front" },
                  { preview: previews.back,  label: "ID Back" },
                  { preview: selfiePreview,   label: "Selfie" },
                ].map(({ preview, label }) => (
                  <div key={label} style={{ flex: 1, textAlign: "center" }}>
                    <img src={preview} alt={label} style={{ width: "100%", height: 72, objectFit: "cover", borderRadius: 10, border: `1px solid ${T.border}` }} />
                    <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: .3, textTransform: "uppercase", marginTop: 4, display: "block" }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Application details */}
              <div style={{ background: T.surfaceAlt, borderRadius: 16, padding: "4px 16px", marginBottom: 16 }}>
                {[
                  { label: "Full name", val: form.fullName },
                  { label: "Phone", val: form.phone },
                  { label: "ID Number", val: form.idNumber },
                  { label: "Loan amount", val: "KES 560", highlight: true },
                ].map(({ label, val, highlight }) => (
                  <div className="confirmed-field" key={label}>
                    <span style={{ fontSize: 13, color: T.textSub }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: highlight ? T.blue : T.text }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* What gets uploaded note */}
              <div style={{ background: T.greenSoft, border: `1px solid #bbf7d0`, borderRadius: 12, padding: "11px 14px", marginBottom: 20, display: "flex", gap: 10 }}>
                <ShieldCheck size={14} color="#15803d" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#166534", lineHeight: 1.5 }}>
                  Your 3 photos and application details will be securely uploaded and linked to a unique loan ID.
                </p>
              </div>

              {submitError && (
                <div style={{ background: T.redSoft, border: `1px solid #fca5a5`, borderRadius: 12, padding: "11px 14px", marginBottom: 16, display: "flex", gap: 8 }}>
                  <AlertCircle size={14} color={T.red} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: T.red, lineHeight: 1.5 }}>{submitError}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={() => setStep("selfie")} style={{ flex: "0 0 auto" }} disabled={submitting}>
                  <RefreshCw size={13} /> Back
                </button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleFinalSubmit} disabled={submitting}>
                  {submitting
                    ? <><Loader2 size={16} className="spin" /> Uploading…</>
                    : <><CheckCircle2 size={16} /> Submit Application</>}
                </button>
              </div>

              <p style={{ textAlign: "center", fontSize: 11, color: T.textMuted, marginTop: 14 }}>
                By submitting you agree to our Terms & Privacy Policy
              </p>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div className="card fade-up">
            <div className="card-header" style={{ textAlign: "center", padding: "40px 28px 32px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CheckCircle2 size={32} color="#fff" />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -.5 }}>You're all set!</div>
              <div style={{ opacity: .8, fontSize: 14, marginTop: 8 }}>Application submitted successfully</div>
              <StepDots current="done" />
            </div>
            <div className="card-body">
              <div style={{ background: T.greenSoft, border: `1px solid #bbf7d0`, borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#15803d", fontWeight: 700, marginBottom: 2, textTransform: "uppercase", letterSpacing: .5 }}>Loan Amount Approved</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#166534" }}>KES 560</div>
              </div>
              {[
                { icon: Phone, text: "You'll receive an M-Pesa prompt once approved" },
                { icon: Clock, text: "Processing takes less than 5 minutes" },
                { icon: ShieldCheck, text: "Your ID documents are securely stored and encrypted" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: T.blueSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} color={T.blue} />
                  </div>
                  <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5, paddingTop: 6 }}>{text}</p>
                </div>
              ))}
              <div style={{ marginTop: 20, background: T.surfaceAlt, borderRadius: 14, padding: "16px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: .5, fontWeight: 600 }}>Reference Number</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.text, letterSpacing: 2, wordBreak: "break-all" }}>
                  {userId || "—"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}