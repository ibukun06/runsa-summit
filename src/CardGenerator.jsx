import { useState, useRef, useEffect, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const REG_SITE = "https://legislative-summit-registration.vercel.app";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3SqUXGR0kqPCpG88BFRB9qUMAk08x_6Q",
  authDomain: "runsa-summit.firebaseapp.com",
  projectId: "runsa-summit",
};
const COLLECTION = "delegates";

// ─── FIREBASE ─────────────────────────────────────────────────────────────────
let db = null;
async function initFirebase() {
  if (db) return db;
  await loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
  await loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js");
  if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
  db = window.firebase.firestore();
  return db;
}
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}
async function fetchDelegate(id) {
  try {
    const db = await initFirebase();
    const snap = await db.collection(COLLECTION).doc(id.toUpperCase()).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Space+Grotesk:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700&family=Bebas+Neue&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #050d1e;
    --navy2: #0d1f3c;
    --navy3: #1a3a6b;
    --gold: #c9920a;
    --gold2: #e8b84b;
    --gold3: #f5d57a;
    --cream: #f5f0e8;
    --red: #c0392b;
    --green: #27ae60;
    --glass: rgba(255,255,255,0.04);
    --glass2: rgba(255,255,255,0.08);
    --border: rgba(201,146,10,0.2);
  }

  html, body { min-height: 100vh; }

  body {
    background: var(--navy);
    color: var(--cream);
    font-family: 'Space Grotesk', sans-serif;
    overflow-x: hidden;
  }

  /* Grain texture overlay */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.6;
  }

  .page {
    position: relative;
    z-index: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .site-header {
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: rgba(5,13,30,0.8);
    backdrop-filter: blur(16px);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-logo {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px solid var(--gold);
    object-fit: cover;
  }

  .header-title {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    color: var(--gold2);
    line-height: 1.1;
  }

  .header-sub {
    font-size: 10px;
    color: rgba(245,240,232,0.45);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .header-link {
    font-size: 12px;
    color: var(--gold);
    text-decoration: none;
    border: 1px solid var(--border);
    padding: 7px 14px;
    border-radius: 6px;
    transition: all 0.2s;
    font-weight: 500;
  }

  .header-link:hover {
    background: var(--glass2);
    border-color: var(--gold);
  }

  /* Hero */
  .hero {
    padding: 60px 24px 40px;
    text-align: center;
    max-width: 700px;
    margin: 0 auto;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border: 1px solid rgba(201,146,10,0.4);
    border-radius: 100px;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold2);
    background: rgba(201,146,10,0.06);
    margin-bottom: 24px;
  }

  .hero-badge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold2);
    animation: pulse-dot 2s infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.7); }
  }

  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(32px, 7vw, 64px);
    font-weight: 900;
    line-height: 1.05;
    margin-bottom: 16px;
    background: linear-gradient(135deg, var(--gold3) 0%, var(--gold2) 40%, #fff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    font-size: clamp(14px, 2vw, 17px);
    color: rgba(245,240,232,0.55);
    line-height: 1.7;
    max-width: 500px;
    margin: 0 auto 40px;
  }

  /* Steps */
  .steps {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 48px;
    flex-wrap: wrap;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: rgba(245,240,232,0.45);
  }

  .step-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: var(--gold);
    flex-shrink: 0;
  }

  .step-active .step-num {
    background: var(--gold);
    color: var(--navy);
    border-color: var(--gold);
  }

  .step-done .step-num {
    background: var(--green);
    color: #fff;
    border-color: var(--green);
  }

  .step-sep {
    width: 24px;
    height: 1px;
    background: var(--border);
  }

  /* Main content */
  .main {
    flex: 1;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px 80px;
    width: 100%;
  }

  /* Input panel */
  .panel {
    background: var(--glass);
    border: 1px solid var(--border);
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 32px;
  }

  .panel-head {
    background: linear-gradient(135deg, rgba(13,31,60,0.8), rgba(26,58,107,0.4));
    border-bottom: 1px solid var(--border);
    padding: 20px 28px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .panel-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(201,146,10,0.15);
    border: 1px solid rgba(201,146,10,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .panel-title {
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--gold2);
    letter-spacing: 0.04em;
  }

  .panel-desc {
    font-size: 12px;
    color: rgba(245,240,232,0.45);
    margin-top: 2px;
  }

  .panel-body {
    padding: 28px;
  }

  /* Ticket input */
  .ticket-row {
    display: flex;
    gap: 10px;
  }

  .ticket-input {
    flex: 1;
    padding: 14px 18px;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    color: var(--cream);
    font-family: 'Space Grotesk', sans-serif;
    font-size: 15px;
    letter-spacing: 0.05em;
    outline: none;
    transition: border-color 0.2s;
    text-transform: uppercase;
  }

  .ticket-input:focus {
    border-color: var(--gold);
  }

  .ticket-input::placeholder {
    text-transform: none;
    color: rgba(245,240,232,0.25);
    letter-spacing: 0;
  }

  .btn-fetch {
    padding: 14px 24px;
    background: linear-gradient(135deg, var(--gold), var(--navy3));
    border: none;
    border-radius: 10px;
    color: #fff;
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.2s;
  }

  .btn-fetch:disabled { opacity: 0.5; cursor: not-allowed; }

  .delegate-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(39,174,96,0.06);
    border: 1px solid rgba(39,174,96,0.25);
    border-radius: 12px;
    margin-top: 16px;
    animation: fadeUp 0.3s ease both;
  }

  .delegate-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(201,146,10,0.15);
    border: 2px solid var(--gold);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .delegate-name {
    font-family: 'Cinzel', serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 3px;
  }

  .delegate-meta {
    font-size: 12px;
    color: rgba(245,240,232,0.5);
  }

  .delegate-id {
    margin-left: auto;
    font-family: monospace;
    font-size: 12px;
    color: var(--gold);
    letter-spacing: 0.08em;
    flex-shrink: 0;
  }

  .err-msg {
    margin-top: 12px;
    padding: 12px 16px;
    background: rgba(192,57,43,0.08);
    border: 1px solid rgba(192,57,43,0.3);
    border-radius: 8px;
    color: #e74c3c;
    font-size: 13px;
  }

  /* Photo upload */
  .upload-zone {
    border: 2px dashed var(--border);
    border-radius: 14px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }

  .upload-zone:hover, .upload-zone.drag-over {
    border-color: var(--gold);
    background: rgba(201,146,10,0.04);
  }

  .upload-zone input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .upload-icon { font-size: 40px; margin-bottom: 12px; }

  .upload-title {
    font-family: 'Cinzel', serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--gold2);
    margin-bottom: 6px;
  }

  .upload-sub {
    font-size: 12px;
    color: rgba(245,240,232,0.4);
  }

  .photo-preview {
    position: relative;
    display: inline-block;
    margin-top: 16px;
  }

  .photo-preview img {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 12px;
    border: 2px solid var(--gold);
    display: block;
  }

  .photo-remove {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--red);
    border: none;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Generate button */
  .btn-generate {
    width: 100%;
    padding: 18px;
    background: linear-gradient(135deg, var(--gold) 0%, var(--navy3) 120%);
    border: none;
    border-radius: 14px;
    color: #fff;
    font-family: 'Cinzel', serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    box-shadow: 0 8px 32px rgba(201,146,10,0.3);
    transition: all 0.2s;
    margin-top: 8px;
  }

  .btn-generate:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(201,146,10,0.4);
  }

  .btn-generate:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  /* Card preview area */
  .preview-wrap {
    text-align: center;
    animation: fadeUp 0.5s ease both;
  }

  .preview-label {
    font-family: 'Cinzel', serif;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 20px;
  }

  .card-outer {
    display: inline-block;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,146,10,0.2);
    max-width: 420px;
    width: 100%;
  }

  /* THE ACTUAL CARD — fixed aspect ratio for sharing */
  .summit-card {
    width: 420px;
    height: 560px;
    position: relative;
    background: var(--navy);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: 'Space Grotesk', sans-serif;
  }

  .card-bg-photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 65%;
    object-fit: cover;
    object-position: center top;
  }

  .card-photo-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(5,13,30,0.1) 0%,
      rgba(5,13,30,0.2) 30%,
      rgba(5,13,30,0.7) 55%,
      rgba(5,13,30,1) 72%
    );
  }

  /* Gold corner accents */
  .card-corner {
    position: absolute;
    width: 32px;
    height: 32px;
    border-color: var(--gold);
    border-style: solid;
    opacity: 0.7;
  }

  .card-corner-tl { top: 16px; left: 16px; border-width: 2px 0 0 2px; }
  .card-corner-tr { top: 16px; right: 16px; border-width: 2px 2px 0 0; }
  .card-corner-bl { bottom: 16px; left: 16px; border-width: 0 0 2px 2px; }
  .card-corner-br { bottom: 16px; right: 16px; border-width: 0 2px 2px 0; }

  .card-top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
  }

  .card-logo {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 1.5px solid rgba(232,184,75,0.6);
  }

  .card-top-text {
    font-family: 'Cinzel', serif;
    font-size: 8.5px;
    font-weight: 700;
    color: rgba(232,184,75,0.9);
    letter-spacing: 0.12em;
    text-align: right;
    line-height: 1.4;
    text-transform: uppercase;
  }

  .card-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 22px 18px;
    z-index: 10;
  }

  .card-attending-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(201,146,10,0.15);
    border: 1px solid rgba(201,146,10,0.5);
    border-radius: 100px;
    padding: 4px 12px;
    font-size: 9px;
    letter-spacing: 0.12em;
    color: var(--gold2);
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .card-attending-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--gold2);
  }

  .card-name {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 900;
    color: #fff;
    line-height: 1.1;
    margin-bottom: 6px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.5);
  }

  .card-position {
    font-size: 11px;
    font-weight: 600;
    color: var(--gold2);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 3px;
  }

  .card-institution {
    font-size: 12px;
    color: rgba(245,240,232,0.6);
    margin-bottom: 14px;
  }

  .card-divider {
    height: 1px;
    background: linear-gradient(90deg, var(--gold), transparent);
    margin-bottom: 12px;
    opacity: 0.4;
  }

  .card-event-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  .card-event-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 18px;
    color: var(--gold3);
    letter-spacing: 0.04em;
    line-height: 1;
  }

  .card-event-detail {
    font-size: 9px;
    color: rgba(245,240,232,0.45);
    letter-spacing: 0.05em;
    line-height: 1.5;
    margin-top: 2px;
  }

  .card-ticket-id {
    font-family: monospace;
    font-size: 10px;
    color: rgba(201,146,10,0.6);
    letter-spacing: 0.1em;
    text-align: right;
  }

  .card-url {
    font-size: 8px;
    color: rgba(245,240,232,0.3);
    letter-spacing: 0.05em;
    text-align: right;
    margin-top: 2px;
  }

  /* No-photo fallback gradient */
  .card-bg-gradient {
    position: absolute;
    inset: 0;
    height: 65%;
    background: linear-gradient(135deg, #1a3a6b 0%, #0d1f3c 50%, #c9920a22 100%);
  }

  .card-initials {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Playfair Display', serif;
    font-size: 80px;
    font-weight: 900;
    color: rgba(201,146,10,0.2);
    line-height: 1;
    letter-spacing: -4px;
    white-space: nowrap;
    max-width: 100%;
  }

  /* Action buttons */
  .action-row {
    display: flex;
    gap: 12px;
    margin-top: 24px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-download {
    padding: 14px 28px;
    background: linear-gradient(135deg, var(--gold), var(--navy3));
    border: none;
    border-radius: 10px;
    color: #fff;
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(201,146,10,0.3);
    transition: all 0.2s;
  }

  .btn-download:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(201,146,10,0.4);
  }

  .btn-reset {
    padding: 14px 28px;
    background: transparent;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    color: rgba(245,240,232,0.6);
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-reset:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  /* Share caption */
  .share-caption {
    margin-top: 20px;
    padding: 16px 20px;
    background: var(--glass);
    border: 1px solid var(--border);
    border-radius: 12px;
    max-width: 420px;
    margin-left: auto;
    margin-right: auto;
    text-align: left;
  }

  .share-caption-label {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold);
    font-weight: 600;
    margin-bottom: 8px;
  }

  .share-caption-text {
    font-size: 13px;
    color: rgba(245,240,232,0.7);
    line-height: 1.6;
    user-select: all;
  }

  .btn-copy {
    margin-top: 10px;
    padding: 8px 16px;
    background: var(--glass2);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--gold2);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Space Grotesk', sans-serif;
  }

  .btn-copy:hover { background: rgba(201,146,10,0.1); }

  /* Animations */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes shimmer {
    from { background-position: -200% center; }
    to { background-position: 200% center; }
  }

  .loading-shimmer {
    background: linear-gradient(90deg, var(--navy2) 25%, var(--navy3) 50%, var(--navy2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
    height: 16px;
  }

  /* Responsive */
  @media (max-width: 480px) {
    .summit-card { width: 340px; height: 453px; }
    .card-name { font-size: 22px; }
    .card-event-name { font-size: 15px; }
    .ticket-row { flex-direction: column; }
  }
`;

// ─── CARD CANVAS RENDERER ─────────────────────────────────────────────────────
// ─── QR CODE GENERATOR ────────────────────────────────────────────────────────
async function generateQRCanvas(text, size) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js");
  return new Promise((resolve) => {
    const div = document.createElement("div");
    div.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
    document.body.appendChild(div);
    new window.QRCode(div, {
      text, width: size, height: size,
      colorDark: "#050d1e", colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.H,
    });
    setTimeout(() => {
      const el = div.querySelector("canvas") || div.querySelector("img");
      const src = el instanceof HTMLCanvasElement ? el.toDataURL() : el?.src;
      document.body.removeChild(div);
      if (!src) { resolve(null); return; }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    }, 500);
  });
}

async function renderCardToCanvas(delegate, photoUrl) {
  const W = 840, H = 1120;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  const loadImg = (src) => new Promise((res, rej) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => res(img); img.onerror = rej; img.src = src;
  });

  // Pre-generate QR code
  const checkinURL = delegate.qrURL || `${REG_SITE}?checkin=${delegate.id}`;
  const qrImg = await generateQRCanvas(checkinURL, 220);

  // Background
  ctx.fillStyle = "#050d1e";
  ctx.fillRect(0, 0, W, H);

  // Photo or gradient
  if (photoUrl) {
    try {
      const photo = await loadImg(photoUrl);
      const photoH = H * 0.65;
      ctx.drawImage(photo, 0, 0, W, photoH);
      // Overlay gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "rgba(5,13,30,0.1)");
      grad.addColorStop(0.35, "rgba(5,13,30,0.25)");
      grad.addColorStop(0.58, "rgba(5,13,30,0.75)");
      grad.addColorStop(0.72, "rgba(5,13,30,1)");
      grad.addColorStop(1, "rgba(5,13,30,1)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    } catch {}
  } else {
    // Gradient bg
    const grad = ctx.createLinearGradient(0, 0, W, H * 0.65);
    grad.addColorStop(0, "#1a3a6b");
    grad.addColorStop(0.5, "#0d1f3c");
    grad.addColorStop(1, "#15304a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H * 0.65);
    // Initials
    const initials = delegate.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    ctx.font = "bold 180px 'Playfair Display', serif";
    ctx.fillStyle = "rgba(201,146,10,0.12)";
    ctx.textAlign = "center";
    ctx.fillText(initials, W / 2, H * 0.38);
    // Fade to dark
    const grad2 = ctx.createLinearGradient(0, H * 0.4, 0, H * 0.72);
    grad2.addColorStop(0, "rgba(5,13,30,0)");
    grad2.addColorStop(1, "rgba(5,13,30,1)");
    ctx.fillStyle = grad2;
    ctx.fillRect(0, H * 0.4, W, H * 0.35);
  }

  // Solid bottom
  ctx.fillStyle = "#050d1e";
  ctx.fillRect(0, H * 0.72, W, H * 0.28);

  // Corner accents
  ctx.strokeStyle = "rgba(201,146,10,0.6)";
  ctx.lineWidth = 3;
  const cs = 64; // corner size
  const cm = 32; // margin
  // TL
  ctx.beginPath(); ctx.moveTo(cm, cm + cs); ctx.lineTo(cm, cm); ctx.lineTo(cm + cs, cm); ctx.stroke();
  // TR
  ctx.beginPath(); ctx.moveTo(W - cm - cs, cm); ctx.lineTo(W - cm, cm); ctx.lineTo(W - cm, cm + cs); ctx.stroke();
  // BL
  ctx.beginPath(); ctx.moveTo(cm, H - cm - cs); ctx.lineTo(cm, H - cm); ctx.lineTo(cm + cs, H - cm); ctx.stroke();
  // BR
  ctx.beginPath(); ctx.moveTo(W - cm - cs, H - cm); ctx.lineTo(W - cm, H - cm); ctx.lineTo(W - cm, H - cm - cs); ctx.stroke();

  // Top bar — logo + text
  try {
    const logo = await loadImg("/legislative-council-logo.jpg");
    ctx.save();
    ctx.beginPath();
    ctx.arc(64, 64, 32, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logo, 32, 32, 64, 64);
    ctx.restore();
    // Gold ring
    ctx.strokeStyle = "rgba(232,184,75,0.6)";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(64, 64, 32, 0, Math.PI * 2); ctx.stroke();
  } catch {}

  ctx.textAlign = "right";
  ctx.font = "700 17px 'Cinzel', serif";
  ctx.fillStyle = "rgba(232,184,75,0.9)";
  ctx.fillText("RUNSA LEGISLATIVE COUNCIL", W - 40, 54);
  ctx.font = "400 14px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "rgba(245,240,232,0.45)";
  ctx.fillText("REDEEMER'S UNIVERSITY STUDENTS' ASSOCIATION", W - 40, 76);

  // --- BOTTOM CONTENT ---
  const bY = H * 0.67; // start of bottom content

  // Attending badge
  ctx.textAlign = "left";
  const badgeX = 44, badgeY = bY;
  const badgeW = 200, badgeH = 32;
  ctx.fillStyle = "rgba(201,146,10,0.12)";
  ctx.strokeStyle = "rgba(201,146,10,0.45)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 16);
  ctx.fill(); ctx.stroke();
  // dot
  ctx.fillStyle = "#e8b84b";
  ctx.beginPath(); ctx.arc(badgeX + 16, badgeY + badgeH / 2, 5, 0, Math.PI * 2); ctx.fill();
  ctx.font = "600 13px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#e8b84b";
  ctx.fillText("I'M ATTENDING", badgeX + 28, badgeY + badgeH / 2 + 5);

  // Name
  ctx.font = "900 64px 'Playfair Display', serif";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 20;
  const name = delegate.name;
  // Wrap name if long
  const nameLines = wrapText(ctx, name, W - 88, 64);
  nameLines.forEach((line, i) => {
    ctx.fillText(line, 44, bY + 60 + i * 68);
  });
  ctx.shadowBlur = 0;

  const nameBottom = bY + 60 + nameLines.length * 68;

  // Position
  ctx.font = "600 20px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "#e8b84b";
  ctx.fillText(delegate.position.toUpperCase(), 44, nameBottom + 10);

  // Institution
  ctx.font = "400 18px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "rgba(245,240,232,0.55)";
  ctx.fillText(delegate.institution, 44, nameBottom + 38);

  // Divider line
  const divY = nameBottom + 60;
  const divGrad = ctx.createLinearGradient(44, divY, W - 44, divY);
  divGrad.addColorStop(0, "rgba(201,146,10,0.5)");
  divGrad.addColorStop(1, "rgba(201,146,10,0)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(44, divY); ctx.lineTo(W - 44, divY); ctx.stroke();

  // Event name
  ctx.font = "400 40px 'Bebas Neue', sans-serif";
  ctx.fillStyle = "#f5d57a";
  ctx.textAlign = "left";
  ctx.fillText("LEGISLATIVE SUMMIT 2026", 44, divY + 44);

  // Location + date
  ctx.font = "400 16px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "rgba(245,240,232,0.4)";
  ctx.fillText("@ Redeemer's University, Ede  ·  29th April, 2026", 44, divY + 68);

  // QR code block (bottom right)
  const qrSize = 160;
  const qrX = W - 44 - qrSize;
  const qrY = divY + 14;

  if (qrImg) {
    // White bg for QR
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 10);
    ctx.fill();
    // Gold border
    ctx.strokeStyle = "rgba(201,146,10,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Draw QR
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    // "Scan to enter" label
    ctx.textAlign = "center";
    ctx.font = "600 11px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "rgba(201,146,10,0.6)";
    ctx.fillText("SCAN TO ENTER", qrX + qrSize / 2, qrY + qrSize + 22);
  }

  // Ticket ID below event name (left side)
  ctx.textAlign = "left";
  ctx.font = "400 15px monospace";
  ctx.fillStyle = "rgba(201,146,10,0.5)";
  ctx.fillText(delegate.id, 44, divY + 68);

  // Registration URL (small, bottom left)
  ctx.font = "400 12px 'Space Grotesk', sans-serif";
  ctx.fillStyle = "rgba(245,240,232,0.2)";
  ctx.fillText(REG_SITE, 44, H - 36);

  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxW, fontSize) {
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const test = cur ? cur + " " + word : word;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = word;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function CardGenerator() {
  const [ticketId, setTicketId] = useState("");
  const [delegate, setDelegate] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [photo, setPhoto] = useState(null); // dataURL
  const [drag, setDrag] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);
  const cardRef = useRef(null);

  const step = !delegate ? 1 : !cardDataUrl ? 2 : 3;

  const handleFetch = async () => {
    if (!ticketId.trim()) return;
    setFetching(true); setFetchErr(""); setDelegate(null); setCardDataUrl(null);
    const d = await fetchDelegate(ticketId.trim());
    setFetching(false);
    if (!d) {
      setFetchErr("Ticket not found. Check the ID and try again.");
    } else {
      setDelegate(d);
    }
  };

  const handlePhoto = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => setPhoto(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!delegate) return;
    setGenerating(true);
    try {
      const canvas = await renderCardToCanvas(delegate, photo);
      setCardDataUrl(canvas.toDataURL("image/jpeg", 0.95));
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = cardDataUrl;
    a.download = `RUNSA-Summit-${delegate.name.split(" ")[0]}.jpg`;
    a.click();
  };

  const caption = delegate
    ? `🏛️ I'm attending the RUNSA Legislative Summit 2026!\n\n"The Catalyst of Transformation: Legislating the Future for Democratic Leadership"\n\n📍 Redeemer's University, Ede · 29th April, 2026\n\n🎫 Register now: ${REG_SITE}\n\n#RUNSASummit2026 #LegislativeCouncil #RUNSA`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(caption).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />
      <div className="page">

        {/* Header */}
        <header className="site-header">
          <div className="header-brand">
            <img src="/legislative-council-logo.jpg" alt="" className="header-logo"
              onError={e => e.target.style.display = "none"} />
            <div>
              <div className="header-title">RUNSA · Legislative Council</div>
              <div className="header-sub">Summit Card Generator</div>
            </div>
          </div>
          <a href={REG_SITE} className="header-link">Register →</a>
        </header>

        {/* Hero */}
        <div className="hero">
          <div className="hero-badge">Summit 2026 · Card Generator</div>
          <h1 className="hero-title">Show the World You're In.</h1>
          <p className="hero-sub">
            Generate your personal attendee card for the RUNSA Legislative Summit 2026.
            Share it. Let the hype build. 🔥
          </p>
          {/* Steps */}
          <div className="steps">
            {[
              { n: 1, label: "Enter Ticket ID" },
              { n: 2, label: "Add Your Photo" },
              { n: 3, label: "Download & Share" },
            ].map((s, i) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i > 0 && <div className="step-sep" />}
                <div className={`step ${step === s.n ? "step-active" : step > s.n ? "step-done" : ""}`}>
                  <div className="step-num">{step > s.n ? "✓" : s.n}</div>
                  <span style={{ fontSize: 12, color: step === s.n ? "rgba(245,240,232,0.8)" : "rgba(245,240,232,0.35)" }}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="main">

          {/* Step 1 — Ticket */}
          {!cardDataUrl && (
            <div className="panel">
              <div className="panel-head">
                <div className="panel-icon">🎫</div>
                <div>
                  <div className="panel-title">Step 1 — Verify Your Ticket</div>
                  <div className="panel-desc">Enter the RLS code from your registration ticket</div>
                </div>
              </div>
              <div className="panel-body">
                <div className="ticket-row">
                  <input
                    className="ticket-input"
                    placeholder="e.g. RLS-AHSXKJ"
                    value={ticketId}
                    onChange={e => { setTicketId(e.target.value); setFetchErr(""); }}
                    onKeyDown={e => e.key === "Enter" && handleFetch()}
                  />
                  <button className="btn-fetch" onClick={handleFetch} disabled={fetching || !ticketId.trim()}>
                    {fetching ? "Checking…" : "Verify →"}
                  </button>
                </div>
                {fetchErr && <div className="err-msg">❌ {fetchErr}</div>}
                {delegate && (
                  <div className="delegate-card">
                    <div className="delegate-avatar">🎓</div>
                    <div>
                      <div className="delegate-name">{delegate.name}</div>
                      <div className="delegate-meta">{delegate.position} · {delegate.institution}</div>
                    </div>
                    <div className="delegate-id">{delegate.id}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — Photo */}
          {delegate && !cardDataUrl && (
            <div className="panel" style={{ animation: "fadeUp 0.4s ease both" }}>
              <div className="panel-head">
                <div className="panel-icon">📸</div>
                <div>
                  <div className="panel-title">Step 2 — Add Your Photo</div>
                  <div className="panel-desc">Upload a clear photo of yourself (optional but recommended)</div>
                </div>
              </div>
              <div className="panel-body">
                {!photo ? (
                  <div
                    className={`upload-zone ${drag ? "drag-over" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); handlePhoto(e.dataTransfer.files[0]); }}
                    onClick={() => fileRef.current?.click()}
                  >
                    <input ref={fileRef} type="file" accept="image/*" onChange={e => handlePhoto(e.target.files[0])} />
                    <div className="upload-icon">📷</div>
                    <div className="upload-title">Tap to upload your photo</div>
                    <div className="upload-sub">JPG, PNG · Your face will appear on the card</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div className="photo-preview">
                      <img src={photo} alt="Your photo" />
                      <button className="photo-remove" onClick={() => setPhoto(null)}>✕</button>
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(245,240,232,0.5)", lineHeight: 1.6 }}>
                      ✅ Photo uploaded!<br />
                      <span style={{ color: "rgba(245,240,232,0.35)", fontSize: 11 }}>
                        Tap the × to remove and choose a different one.
                      </span>
                    </div>
                  </div>
                )}

                <button
                  className="btn-generate"
                  onClick={handleGenerate}
                  disabled={generating}
                  style={{ marginTop: 24 }}
                >
                  {generating ? "✨ Generating your card…" : "✨ Generate My Card →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Card preview + download */}
          {cardDataUrl && (
            <div className="preview-wrap">
              <div className="preview-label">✦ Your Attendee Card ✦</div>
              <div className="card-outer">
                <img src={cardDataUrl} alt="Your summit card" style={{ width: "100%", display: "block" }} />
              </div>

              <div className="action-row">
                <button className="btn-download" onClick={handleDownload}>
                  ⬇ Download Card
                </button>
                <button className="btn-reset" onClick={() => {
                  setCardDataUrl(null); setPhoto(null);
                  setDelegate(null); setTicketId("");
                }}>
                  ↺ Start Over
                </button>
              </div>

              <div className="share-caption" style={{ marginTop: 24 }}>
                <div className="share-caption-label">📋 Copy This Caption</div>
                <div className="share-caption-text">{caption}</div>
                <button className="btn-copy" onClick={handleCopy}>
                  {copied ? "✓ Copied!" : "Copy Caption"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
