import { useState, useRef, useEffect } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const REG_SITE = "https://legislative-summit-registration.vercel.app";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3SqUXGR0kqPCpG88BFRB9qUMAk08x_6Q",
  authDomain: "runsa-summit.firebaseapp.com",
  projectId: "runsa-summit",
};
const COLLECTION = "delegates";
const CW = 1080, CH = 1920; // 9:16 portrait — universal story format

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
    const d = await initFirebase();
    const snap = await d.collection(COLLECTION).doc(id.toUpperCase()).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) { console.error(e); return null; }
}

// ─── QR GENERATOR ─────────────────────────────────────────────────────────────
async function generateQRImage(text, size) {
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
    }, 600);
  });
}

// ─── CANVAS HELPERS ───────────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxW) {
  const words = text.split(" ");
  const lines = []; let cur = "";
  for (const word of words) {
    const test = cur ? cur + " " + word : word;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = word; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function loadImg(src) {
  return new Promise((res, rej) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => res(img); img.onerror = rej; img.src = src;
  });
}

// Smart cover: fill zone, centre horizontally, bias top for faces
function drawSmartCover(ctx, img, x, y, w, h) {
  const imgAr = img.width / img.height;
  const zoneAr = w / h;
  let sw, sh, sx, sy;
  if (imgAr > zoneAr) {
    sh = img.height; sw = img.height * zoneAr;
    sx = (img.width - sw) / 2; sy = 0;
  } else {
    sw = img.width; sh = img.width / zoneAr;
    sx = 0; sy = Math.max(0, Math.min(img.height * 0.04, img.height - sh));
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// ─── CARD RENDERER ────────────────────────────────────────────────────────────
async function renderCard(delegate, photoDataUrl, mode) {
  const dark = mode === "dark";
  const BG     = dark ? "#050d1e" : "#f0ece3";
  const GOLD   = "#c9920a";
  const GOLD2  = "#e8b84b";
  const GOLD3  = "#f5d57a";
  const NAVY   = "#050d1e";
  const TEXT   = dark ? "#f5f0e8" : "#050d1e";
  const MUTED  = dark ? "rgba(245,240,232,0.52)" : "rgba(5,13,30,0.42)";
  const EVTCOL = dark ? GOLD3 : NAVY;

  const canvas = document.createElement("canvas");
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext("2d");

  // ── BASE ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CW, CH);

  const PHOTO_H = Math.round(CH * 0.60); // top 60%
  const PAD = 72;  // content padding — sits comfortably inside CM2=48 corners

  // ── PHOTO ZONE ────────────────────────────────────────────────────────────
  if (photoDataUrl) {
    const photo = await loadImg(photoDataUrl);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CW, PHOTO_H);
    ctx.clip();
    drawSmartCover(ctx, photo, 0, 0, CW, PHOTO_H);
    ctx.restore();

    // Gradient: top vignette (for logo readability)
    const topV = ctx.createLinearGradient(0, 0, 0, 260);
    topV.addColorStop(0, "rgba(0,0,0,0.52)");
    topV.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topV;
    ctx.fillRect(0, 0, CW, 260);

    // Gradient: bottom fade into card background
    const botV = ctx.createLinearGradient(0, PHOTO_H * 0.48, 0, PHOTO_H);
    botV.addColorStop(0, "rgba(0,0,0,0)");
    botV.addColorStop(0.55, dark ? "rgba(5,13,30,0.62)" : "rgba(240,236,227,0.55)");
    botV.addColorStop(1,   dark ? "rgba(5,13,30,0.98)" : "rgba(240,236,227,0.98)");
    ctx.fillStyle = botV;
    ctx.fillRect(0, PHOTO_H * 0.48, CW, PHOTO_H * 0.52);
  } else {
    // No photo — rich gradient bg
    const grad = ctx.createLinearGradient(0, 0, CW * 0.7, PHOTO_H);
    grad.addColorStop(0, dark ? "#1a3a6b" : "#ddd5c2");
    grad.addColorStop(0.5, dark ? "#0d1f3c" : "#e8e0d0");
    grad.addColorStop(1, dark ? "#080f1e" : "#cfc5af");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, PHOTO_H);
    // Big monogram art
    const initials = delegate.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    ctx.font = "900 500px Georgia, serif";
    ctx.fillStyle = dark ? "rgba(201,146,10,0.07)" : "rgba(5,13,30,0.05)";
    ctx.textAlign = "center";
    ctx.fillText(initials, CW / 2, PHOTO_H * 0.72);
    // Bottom fade
    const fade = ctx.createLinearGradient(0, PHOTO_H * 0.55, 0, PHOTO_H);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(1, dark ? "rgba(5,13,30,0.92)" : "rgba(240,236,227,0.92)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, PHOTO_H * 0.55, CW, PHOTO_H * 0.45);
    // Top vignette
    const topV = ctx.createLinearGradient(0, 0, 0, 250);
    topV.addColorStop(0, "rgba(0,0,0,0.38)");
    topV.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topV;
    ctx.fillRect(0, 0, CW, 250);
  }

  // ── CORNER ACCENTS (drawn early so all content renders on top) ──────────────
  ctx.strokeStyle = dark ? "rgba(201,146,10,0.52)" : "rgba(5,13,30,0.18)";
  ctx.lineWidth = 6;
  const CS2 = 120, CM2 = 48; // CM2=48 is the safe inner boundary
  ctx.beginPath(); ctx.moveTo(CM2, CM2+CS2); ctx.lineTo(CM2,CM2); ctx.lineTo(CM2+CS2,CM2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW-CM2-CS2,CM2); ctx.lineTo(CW-CM2,CM2); ctx.lineTo(CW-CM2,CM2+CS2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CM2,CH-CM2-CS2); ctx.lineTo(CM2,CH-CM2); ctx.lineTo(CM2+CS2,CH-CM2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW-CM2-CS2,CH-CM2); ctx.lineTo(CW-CM2,CH-CM2); ctx.lineTo(CW-CM2,CH-CM2-CS2); ctx.stroke();

  // ── TOP BAR — logo + org text, all inside CM2=48 boundary ────────────────
  // Logo: center at (CM2+22+44, CM2+22+44) = left edge at CM2+22, top at CM2+22
  const LOGO_R = 44;           // radius
  const LOGO_X = CM2 + 22 + LOGO_R;  // center x = 114
  const LOGO_Y = CM2 + 22 + LOGO_R;  // center y = 114
  try {
    const logo = await loadImg("/legislative-council-logo.jpg");
    ctx.save();
    ctx.beginPath(); ctx.arc(LOGO_X, LOGO_Y, LOGO_R, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(logo, LOGO_X - LOGO_R, LOGO_Y - LOGO_R, LOGO_R * 2, LOGO_R * 2);
    ctx.restore();
    ctx.strokeStyle = "rgba(232,184,75,0.78)";
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(LOGO_X, LOGO_Y, LOGO_R, 0, Math.PI * 2); ctx.stroke();
  } catch {}

  // Org text — right-aligned to CM2+20 from right edge (inside corner)
  const TEXT_RIGHT = CW - CM2 - 20;
  ctx.textAlign = "right";
  ctx.font = "700 26px Arial, sans-serif";
  ctx.fillStyle = "rgba(232,184,75,0.92)";
  ctx.fillText("RUNSA LEGISLATIVE COUNCIL", TEXT_RIGHT, LOGO_Y - 10);
  ctx.font = "400 19px Arial, sans-serif";
  ctx.fillStyle = "rgba(245,240,232,0.48)";
  ctx.fillText("REDEEMER'S UNIVERSITY STUDENTS' ASSOCIATION", TEXT_RIGHT, LOGO_Y + 20);

  // ── ATTENDING BADGE ───────────────────────────────────────────────────────
  const BADGE_Y = PHOTO_H - 130;
  const bW = 330, bH = 64;
  ctx.fillStyle = "rgba(201,146,10,0.18)";
  ctx.strokeStyle = "rgba(201,146,10,0.6)";
  ctx.lineWidth = 2.5;
  rrect(ctx, PAD, BADGE_Y, bW, bH, 32);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = GOLD2;
  ctx.beginPath(); ctx.arc(PAD + 26, BADGE_Y + bH / 2, 8, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = "left";
  ctx.font = "700 24px Arial, sans-serif";
  ctx.fillStyle = GOLD2;
  ctx.fillText("I'M ATTENDING", PAD + 46, BADGE_Y + bH / 2 + 9);

  // ── INFO SECTION ──────────────────────────────────────────────────────────
  const INFO_START = PHOTO_H + 56;

  // NAME — adaptive size so long names never overflow
  const nameMaxW = CW - PAD * 2;
  let nameFontSize = 110;
  ctx.font = `900 ${nameFontSize}px Georgia, serif`;
  // Shrink font until name fits in 2 lines max
  while (nameFontSize > 56) {
    ctx.font = `900 ${nameFontSize}px Georgia, serif`;
    const testLines = wrapText(ctx, delegate.name, nameMaxW);
    if (testLines.length <= 2) break;
    nameFontSize -= 6;
  }
  ctx.fillStyle = TEXT;
  ctx.textAlign = "left";
  ctx.shadowColor = dark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.08)";
  ctx.shadowBlur = 16;
  const nameLines = wrapText(ctx, delegate.name, nameMaxW);
  const NLH = nameFontSize + 8;
  nameLines.forEach((line, i) => ctx.fillText(line, PAD, INFO_START + i * NLH));
  ctx.shadowBlur = 0;
  const NAME_BOT = INFO_START + nameLines.length * NLH + 8;

  // POSITION
  ctx.font = "700 40px Arial, sans-serif";
  ctx.fillStyle = dark ? GOLD2 : GOLD;
  ctx.fillText(delegate.position.toUpperCase(), PAD, NAME_BOT + 52);

  // INSTITUTION
  ctx.font = "400 36px Arial, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText(delegate.institution, PAD, NAME_BOT + 104);

  // ── DIVIDER ───────────────────────────────────────────────────────────────
  const DIV_Y = NAME_BOT + 148;
  const dg = ctx.createLinearGradient(PAD, DIV_Y, CW - PAD, DIV_Y);
  dg.addColorStop(0, dark ? "rgba(201,146,10,0.55)" : "rgba(5,13,30,0.18)");
  dg.addColorStop(0.7, dark ? "rgba(201,146,10,0.12)" : "rgba(5,13,30,0.04)");
  dg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = dg; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, DIV_Y); ctx.lineTo(CW - PAD, DIV_Y); ctx.stroke();

  // ── EVENT + QR ROW ────────────────────────────────────────────────────────
  const EV_Y = DIV_Y + 50;
  const QR_SIZE = 240;
  const QR_X = CW - PAD - QR_SIZE - 20;
  const TEXT_MAX = QR_X - PAD - 36;

  // Event title
  ctx.font = "700 62px Arial, sans-serif";
  ctx.fillStyle = EVTCOL;
  ctx.textAlign = "left";
  const evLines = wrapText(ctx, "LEGISLATIVE SUMMIT 2026", TEXT_MAX);
  evLines.forEach((l, i) => ctx.fillText(l, PAD, EV_Y + 62 + i * 74));
  const EV_BOT = EV_Y + evLines.length * 74 + 62;

  // Location
  ctx.font = "400 30px Arial, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText("@ Redeemer's University, Ede", PAD, EV_BOT + 18);
  ctx.fillText("29th April, 2026", PAD, EV_BOT + 58);

  // ── QR CODE ───────────────────────────────────────────────────────────────
  const qrURL = delegate.qrURL || `${REG_SITE}?checkin=${delegate.id}`;
  const qrImg = await generateQRImage(qrURL, 320);
  if (qrImg) {
    const QR_Y = EV_Y - 8;
    const CARD_W = QR_SIZE + 44;
    const CARD_H = QR_SIZE + 64;
    // White card
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = dark ? "rgba(201,146,10,0.38)" : "rgba(5,13,30,0.12)";
    ctx.lineWidth = 2;
    rrect(ctx, QR_X - 4, QR_Y, CARD_W, CARD_H, 18);
    ctx.fill(); ctx.stroke();
    // QR image
    ctx.drawImage(qrImg, QR_X + 18, QR_Y + 12, QR_SIZE, QR_SIZE);
    // Label
    ctx.textAlign = "center";
    ctx.font = "600 19px Arial, sans-serif";
    ctx.fillStyle = "rgba(201,146,10,0.85)";
    ctx.fillText("SCAN TO ENTER", QR_X + CARD_W / 2, QR_Y + CARD_H - 14);
  }

  // ── TICKET ID (bottom-left) ────────────────────────────────────────────────
  ctx.textAlign = "left";
  ctx.font = "400 24px monospace";
  ctx.fillStyle = dark ? "rgba(201,146,10,0.38)" : "rgba(5,13,30,0.22)";
  ctx.fillText(delegate.id, CM2 + 20, CH - CM2 - 14);

  return canvas;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Space+Grotesk:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --navy:#050d1e; --navy2:#0d1f3c; --navy3:#1a3a6b;
    --gold:#c9920a; --gold2:#e8b84b; --cream:#f5f0e8;
    --glass:rgba(255,255,255,0.04); --border:rgba(201,146,10,0.2);
  }
  html, body { min-height: 100vh; }
  body { background: var(--navy); color: var(--cream); font-family: 'Space Grotesk', sans-serif; overflow-x: hidden; }
  body::before {
    content:''; position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.5;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  }
  .page { position:relative; z-index:1; min-height:100vh; display:flex; flex-direction:column; }

  .hdr { padding:18px 24px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); background:rgba(5,13,30,.88); backdrop-filter:blur(16px); position:sticky; top:0; z-index:100; }
  .hdr-brand { display:flex; align-items:center; gap:10px; }
  .hdr-logo { width:34px; height:34px; border-radius:50%; border:1.5px solid var(--gold); object-fit:cover; }
  .hdr-title { font-family:'Cinzel',serif; font-size:13px; font-weight:700; color:var(--gold2); line-height:1.1; }
  .hdr-sub { font-size:10px; color:rgba(245,240,232,.4); letter-spacing:.06em; text-transform:uppercase; }
  .hdr-reg { font-size:12px; color:var(--gold); text-decoration:none; border:1px solid var(--border); padding:7px 14px; border-radius:6px; font-weight:500; transition:all .2s; }
  .hdr-reg:hover { background:rgba(201,146,10,.08); border-color:var(--gold); }

  .hero { padding:52px 24px 36px; text-align:center; max-width:680px; margin:0 auto; }
  .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 16px; border:1px solid rgba(201,146,10,.4); border-radius:100px; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--gold2); background:rgba(201,146,10,.06); margin-bottom:22px; }
  .badge::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--gold2); animation:blink 2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.4} }
  .hero h1 { font-family:'Playfair Display',serif; font-size:clamp(30px,7vw,60px); font-weight:900; line-height:1.05; background:linear-gradient(135deg,#f5d57a 0%,#e8b84b 45%,#fff 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:14px; }
  .hero p { font-size:clamp(13px,2vw,16px); color:rgba(245,240,232,.5); line-height:1.7; max-width:480px; margin:0 auto 36px; }

  .steps { display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:44px; flex-wrap:wrap; }
  .step { display:flex; align-items:center; gap:8px; }
  .step-n { width:26px; height:26px; border-radius:50%; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:var(--gold); flex-shrink:0; }
  .step.active .step-n { background:var(--gold); color:var(--navy); border-color:var(--gold); }
  .step.done .step-n { background:#27ae60; color:#fff; border-color:#27ae60; font-size:13px; }
  .step-lbl { font-size:12px; color:rgba(245,240,232,.4); }
  .step.active .step-lbl, .step.done .step-lbl { color:rgba(245,240,232,.8); }
  .step-line { width:28px; height:1px; background:var(--border); }

  .main { flex:1; max-width:960px; margin:0 auto; padding:0 24px 80px; width:100%; }

  .panel { background:var(--glass); border:1px solid var(--border); border-radius:20px; overflow:hidden; margin-bottom:24px; }
  .phead { background:linear-gradient(135deg,rgba(13,31,60,.85),rgba(26,58,107,.35)); border-bottom:1px solid var(--border); padding:18px 26px; display:flex; align-items:center; gap:12px; }
  .picon { width:36px; height:36px; border-radius:10px; background:rgba(201,146,10,.14); border:1px solid rgba(201,146,10,.3); display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
  .ptitle { font-family:'Cinzel',serif; font-size:14px; font-weight:700; color:var(--gold2); letter-spacing:.04em; }
  .pdesc { font-size:12px; color:rgba(245,240,232,.4); margin-top:2px; }
  .pbody { padding:26px; }

  .tick-row { display:flex; gap:10px; }
  .tick-in { flex:1; padding:14px 18px; background:rgba(255,255,255,.05); border:1.5px solid var(--border); border-radius:10px; color:var(--cream); font-family:'Space Grotesk',sans-serif; font-size:15px; letter-spacing:.05em; outline:none; transition:border-color .2s; text-transform:uppercase; }
  .tick-in:focus { border-color:var(--gold); }
  .tick-in::placeholder { text-transform:none; color:rgba(245,240,232,.25); letter-spacing:0; }
  .btn-fetch { padding:14px 22px; background:linear-gradient(135deg,var(--gold),var(--navy3)); border:none; border-radius:10px; color:#fff; font-family:'Cinzel',serif; font-size:13px; font-weight:700; letter-spacing:.04em; cursor:pointer; white-space:nowrap; transition:opacity .2s; }
  .btn-fetch:disabled { opacity:.45; cursor:not-allowed; }

  .del-card { display:flex; align-items:center; gap:14px; padding:16px; background:rgba(39,174,96,.07); border:1px solid rgba(39,174,96,.25); border-radius:12px; margin-top:14px; animation:fadeUp .3s ease both; }
  .del-av { width:44px; height:44px; border-radius:50%; background:rgba(201,146,10,.15); border:2px solid var(--gold); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
  .del-name { font-family:'Cinzel',serif; font-size:14px; font-weight:700; color:var(--cream); margin-bottom:3px; }
  .del-meta { font-size:12px; color:rgba(245,240,232,.5); }
  .del-id { margin-left:auto; font-family:monospace; font-size:12px; color:var(--gold); letter-spacing:.08em; flex-shrink:0; }
  .err { margin-top:12px; padding:12px 16px; background:rgba(192,57,43,.08); border:1px solid rgba(192,57,43,.3); border-radius:8px; color:#e74c3c; font-size:13px; }

  .mode-toggle { display:flex; border:1px solid var(--border); border-radius:10px; overflow:hidden; margin-bottom:20px; }
  .mode-btn { flex:1; padding:12px; border:none; cursor:pointer; font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:600; transition:all .2s; background:transparent; color:rgba(245,240,232,.4); }
  .mode-btn.dk { background:var(--navy2); color:var(--gold2); }
  .mode-btn.lt { background:#f5f0e8; color:#050d1e; }

  .upload-zone { border:2px dashed var(--border); border-radius:14px; padding:36px 20px; text-align:center; cursor:pointer; transition:all .2s; position:relative; overflow:hidden; }
  .upload-zone:hover, .upload-zone.drag { border-color:var(--gold); background:rgba(201,146,10,.04); }
  .upload-zone input { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
  .up-icon { font-size:36px; margin-bottom:10px; }
  .up-title { font-family:'Cinzel',serif; font-size:14px; font-weight:700; color:var(--gold2); margin-bottom:5px; }
  .up-sub { font-size:12px; color:rgba(245,240,232,.4); }
  .photo-row { display:flex; align-items:center; gap:16px; }
  .photo-row img { width:110px; height:110px; object-fit:cover; border-radius:12px; border:2px solid var(--gold); display:block; flex-shrink:0; }
  .photo-rm { padding:6px 14px; background:#c0392b; border:none; color:#fff; border-radius:6px; font-size:12px; cursor:pointer; font-family:'Space Grotesk',sans-serif; }
  .photo-info { font-size:13px; color:rgba(245,240,232,.5); line-height:1.7; }

  .btn-gen { width:100%; padding:17px; margin-top:20px; background:linear-gradient(135deg,var(--gold) 0%,var(--navy3) 120%); border:none; border-radius:14px; color:#fff; font-family:'Cinzel',serif; font-size:15px; font-weight:700; letter-spacing:.06em; cursor:pointer; box-shadow:0 8px 28px rgba(201,146,10,.28); transition:all .2s; }
  .btn-gen:hover { transform:translateY(-2px); box-shadow:0 12px 36px rgba(201,146,10,.38); }
  .btn-gen:disabled { opacity:.4; cursor:not-allowed; transform:none; }

  .preview { text-align:center; animation:fadeUp .5s ease both; }
  .preview-lbl { font-family:'Cinzel',serif; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); margin-bottom:18px; }
  .card-wrap { display:inline-block; max-width:340px; width:100%; border-radius:20px; overflow:hidden; box-shadow:0 28px 72px rgba(0,0,0,.65),0 0 0 1px rgba(201,146,10,.18); }
  .card-wrap img { width:100%; display:block; }

  .act-row { display:flex; gap:12px; margin-top:22px; justify-content:center; flex-wrap:wrap; }
  .btn-dl { padding:14px 28px; background:linear-gradient(135deg,var(--gold),var(--navy3)); border:none; border-radius:10px; color:#fff; font-family:'Cinzel',serif; font-size:13px; font-weight:700; letter-spacing:.04em; cursor:pointer; box-shadow:0 4px 18px rgba(201,146,10,.3); transition:all .2s; }
  .btn-dl:hover { transform:translateY(-2px); }
  .btn-sec { padding:14px 28px; background:transparent; border:1.5px solid var(--border); border-radius:10px; color:rgba(245,240,232,.6); font-family:'Space Grotesk',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:all .2s; }
  .btn-sec:hover { border-color:var(--gold); color:var(--gold); }

  .cap-box { margin:22px auto 0; padding:18px 22px; background:var(--glass); border:1px solid var(--border); border-radius:14px; max-width:420px; text-align:left; }
  .cap-lbl { font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); font-weight:600; margin-bottom:10px; }
  .cap-txt { font-size:13px; color:rgba(245,240,232,.7); line-height:1.65; user-select:all; white-space:pre-line; }
  .btn-copy { margin-top:12px; padding:8px 18px; background:rgba(255,255,255,.05); border:1px solid var(--border); border-radius:6px; color:var(--gold2); font-size:12px; cursor:pointer; transition:all .2s; font-family:'Space Grotesk',sans-serif; }
  .btn-copy:hover { background:rgba(201,146,10,.1); }

  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @media(max-width:480px) { .tick-row{flex-direction:column} .del-id{display:none} }
`;

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function CardGenerator() {
  const [ticketId, setTicketId]     = useState("");
  const [delegate, setDelegate]     = useState(null);
  const [fetching, setFetching]     = useState(false);
  const [fetchErr, setFetchErr]     = useState("");
  const [photo, setPhoto]           = useState(null);
  const [drag, setDrag]             = useState(false);
  const [cardMode, setCardMode]     = useState("dark");
  const [generating, setGenerating] = useState(false);
  const [cardUrl, setCardUrl]       = useState(null);
  const [copied, setCopied]         = useState(false);
  const fileRef = useRef(null);

  // Auto-fill ticket ID if coming from registration page via ?prefill=RLS-XXXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pre = params.get("prefill");
    if (pre) setTicketId(pre.toUpperCase());
  }, []);

  const step = !delegate ? 1 : !cardUrl ? 2 : 3;

  const handleFetch = async () => {
    if (!ticketId.trim()) return;
    setFetching(true); setFetchErr(""); setDelegate(null); setCardUrl(null);
    const d = await fetchDelegate(ticketId.trim());
    setFetching(false);
    if (!d) setFetchErr("Ticket not found. Double-check your RLS code.");
    else setDelegate(d);
  };

  const handlePhoto = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => setPhoto(e.target.result);
    reader.readAsDataURL(file);
  };

  // Robust file picker — creates a fresh input each time to avoid
  // browser caching/double-fire issues on iOS, Android, Mac and Windows
  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
    const cleanup = () => { try { document.body.removeChild(input); } catch {} };
    input.onchange = e => {
      const file = e.target.files?.[0];
      if (file) handlePhoto(file);
      cleanup();
    };
    input.addEventListener("cancel", cleanup);
    // Fallback cleanup after 5 minutes
    setTimeout(cleanup, 300000);
    document.body.appendChild(input);
    input.click();
  };

  const handleGenerate = async () => {
    if (!delegate) return;
    setGenerating(true);
    try {
      const canvas = await renderCard(delegate, photo, cardMode);
      setCardUrl(canvas.toDataURL("image/jpeg", 0.94));
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = cardUrl;
    a.download = `RUNSA-Summit-${delegate.name.split(" ")[0]}-${cardMode}.jpg`;
    a.click();
  };

  const caption = delegate
    ? `🏛️ I'm attending the RUNSA Legislative Summit 2026!\n\n"The Catalyst of Transformation: Legislating the Future for Democratic Leadership"\n\n📍 @ Redeemer's University, Ede\n📅 29th April, 2026\n\n🎫 Register here: ${REG_SITE}\n\n#RUNSASummit2026 #LegislativeCouncil #RUNSA #RUN`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(caption).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const steps = [
    { n: 1, label: "Verify Ticket" },
    { n: 2, label: "Customise" },
    { n: 3, label: "Download & Share" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="page">

        <header className="hdr">
          <div className="hdr-brand">
            <img src="/legislative-council-logo.jpg" alt="" className="hdr-logo"
              onError={e => e.target.style.display = "none"} />
            <div>
              <div className="hdr-title">RUNSA · Legislative Council</div>
              <div className="hdr-sub">Summit Card Generator</div>
            </div>
          </div>
          <a href={REG_SITE} className="hdr-reg">Register →</a>
        </header>

        <div className="hero">
          <div className="badge">Summit 2026 · Card Generator</div>
          <h1>Show the World<br />You're In.</h1>
          <p>Generate your personal attendee card for the RUNSA Legislative Summit 2026. Share it. Let the hype build. 🔥</p>
          <div className="steps">
            {steps.map((s, i) => (
              <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i > 0 && <div className="step-line" />}
                <div className={`step ${step === s.n ? "active" : step > s.n ? "done" : ""}`}>
                  <div className="step-n">{step > s.n ? "✓" : s.n}</div>
                  <span className="step-lbl">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="main">

          {/* Step 1 — Verify Ticket */}
          {!cardUrl && (
            <div className="panel">
              <div className="phead">
                <div className="picon">🎫</div>
                <div>
                  <div className="ptitle">Step 1 — Verify Your Ticket</div>
                  <div className="pdesc">Enter your RLS code from your registration ticket</div>
                </div>
              </div>
              <div className="pbody">
                <div className="tick-row">
                  <input className="tick-in" placeholder="e.g. RLS-AHSXKJ"
                    value={ticketId}
                    onChange={e => { setTicketId(e.target.value); setFetchErr(""); }}
                    onKeyDown={e => e.key === "Enter" && handleFetch()} />
                  <button className="btn-fetch" onClick={handleFetch}
                    disabled={fetching || !ticketId.trim()}>
                    {fetching ? "Checking…" : "Verify →"}
                  </button>
                </div>
                {fetchErr && <div className="err">❌ {fetchErr}</div>}
                {delegate && (
                  <div className="del-card">
                    <div className="del-av">🎓</div>
                    <div>
                      <div className="del-name">{delegate.name}</div>
                      <div className="del-meta">{delegate.position} · {delegate.institution}</div>
                    </div>
                    <div className="del-id">{delegate.id}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — Customise */}
          {delegate && !cardUrl && (
            <div className="panel" style={{ animation: "fadeUp .4s ease both" }}>
              <div className="phead">
                <div className="picon">🎨</div>
                <div>
                  <div className="ptitle">Step 2 — Customise Your Card</div>
                  <div className="pdesc">Pick your style and upload your photo</div>
                </div>
              </div>
              <div className="pbody">
                <p style={{ fontSize: 12, color: "rgba(245,240,232,.5)", marginBottom: 10 }}>Card Style</p>
                <div className="mode-toggle">
                  <button className={`mode-btn ${cardMode === "dark" ? "dk" : ""}`}
                    onClick={() => setCardMode("dark")}>🌙 Dark Mode</button>
                  <button className={`mode-btn ${cardMode === "light" ? "lt" : ""}`}
                    onClick={() => setCardMode("light")}>☀️ Light Mode</button>
                </div>

                <p style={{ fontSize: 12, color: "rgba(245,240,232,.5)", marginBottom: 10, marginTop: 20 }}>
                  Your Photo <span style={{ color: "rgba(245,240,232,.3)" }}>(Recommended)</span>
                </p>

                {!photo ? (
                  <div className={`upload-zone ${drag ? "drag" : ""}`}
                    onDragOver={e => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={e => { e.preventDefault(); setDrag(false); handlePhoto(e.dataTransfer.files[0]); }}
                    onClick={openFilePicker}>
                    <div className="up-icon">📷</div>
                    <div className="up-title">Tap to upload your photo</div>
                    <div className="up-sub">JPG or PNG · Front-facing photo works best</div>
                  </div>
                ) : (
                  <div className="photo-row">
                    <img src={photo} alt="Preview" />
                    <div>
                      <div className="photo-info" style={{ marginBottom: 10 }}>
                        ✅ Photo uploaded!<br />
                        <span style={{ fontSize: 11, color: "rgba(245,240,232,.3)" }}>
                          Remove and re-upload to change it.
                        </span>
                      </div>
                      <button className="photo-rm" onClick={() => setPhoto(null)}>✕ Remove</button>
                    </div>
                  </div>
                )}

                <button className="btn-gen" onClick={handleGenerate} disabled={generating}>
                  {generating ? "✨ Generating your card…" : "✨ Generate My Card →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Preview & Download */}
          {cardUrl && (
            <div className="preview">
              <div className="preview-lbl">✦ Your Attendee Card ✦</div>
              <div className="card-wrap">
                <img src={cardUrl} alt="Your summit card" />
              </div>

              <div className="act-row">
                <button className="btn-dl" onClick={handleDownload}>⬇ Download Card</button>
                <button className="btn-sec" onClick={() => {
                  setCardMode(m => m === "dark" ? "light" : "dark");
                  setCardUrl(null);
                }}>
                  {cardMode === "dark" ? "☀️ Try Light Mode" : "🌙 Try Dark Mode"}
                </button>
                <button className="btn-sec" onClick={() => {
                  setCardUrl(null); setPhoto(null); setDelegate(null); setTicketId("");
                }}>↺ Start Over</button>
              </div>

              <div className="cap-box">
                <div className="cap-lbl">📋 Copy This Caption</div>
                <div className="cap-txt">{caption}</div>
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
