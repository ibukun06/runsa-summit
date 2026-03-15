import { useState, useRef, useEffect } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const REG_SITE = "https://legislative-summit-registration.vercel.app";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3SqUXGR0kqPCpG88BFRB9qUMAk08x_6Q",
  authDomain: "runsa-summit.firebaseapp.com",
  projectId: "runsa-summit",
};
const COLLECTION = "delegates";
const CW = 1080, CH = 1350; // 4:5 — best for WhatsApp, IG feed+stories, LinkedIn, Snapchat

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

  const GOLD   = "#c9920a";
  const GOLD2  = "#e8b84b";
  const GOLD3  = "#f5d57a";
  const GREEN  = "#39e07a";

  // Dark mode colours
  const BG_D    = "#060d1a";
  const TEXT_D  = "#f5f0e8";
  const MUTED_D = "rgba(245,240,232,0.58)";
  const LOC_D   = "#f5f0e8";
  const LOC2_D  = "rgba(245,240,232,0.7)";
  const CORNER_D = "rgba(201,146,10,0.58)";
  const DIV_D   = "rgba(201,146,10,0.5)";

  // Light mode colours — warm cream, navy text
  const BG_L    = "#f0ece3";
  const TEXT_L  = "#0a1628";
  const MUTED_L = "rgba(10,22,40,0.55)";
  const LOC_L   = "#0a1628";
  const LOC2_L  = "rgba(10,22,40,0.65)";
  const CORNER_L = "rgba(201,146,10,0.65)";
  const DIV_L   = "rgba(201,146,10,0.45)";

  const BG     = dark ? BG_D    : BG_L;
  const TEXT   = dark ? TEXT_D  : TEXT_L;
  const MUTED  = dark ? MUTED_D : MUTED_L;
  const LOC    = dark ? LOC_D   : LOC_L;
  const LOC2   = dark ? LOC2_D  : LOC2_L;
  const CORNER = dark ? CORNER_D : CORNER_L;
  const DIV    = dark ? DIV_D   : DIV_L;

  const canvas = document.createElement("canvas");
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext("2d");

  const PAD        = 64;
  const CM         = 44;   // corner margin — inner corner at (CM, CM)
  const CS         = 100;  // corner arm length
  const INNER_GAP  = 18;   // content gap from corner bracket line

  // Logo dimensions — top-left
  const LR = 40;
  const LX = CM + INNER_GAP + LR;  // logo centre x ≈ 102
  const LY = CM + INNER_GAP + LR;  // logo centre y ≈ 102
  // Logo top edge = LY - LR = 62 = CM + INNER_GAP
  // QR bottom edge must = CH - CM - INNER_GAP (same gap from bottom corner)
  const QR_BOTTOM_MAX = CH - CM - INNER_GAP;

  const PHOTO_H = Math.round(CH * 0.58);

  // ── BACKGROUND ────────────────────────────────────────────────────────────
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CW, CH);

  // ── PHOTO ─────────────────────────────────────────────────────────────────
  if (photoDataUrl) {
    const photo = await loadImg(photoDataUrl);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, CW, PHOTO_H); ctx.clip();
    drawSmartCover(ctx, photo, 0, 0, CW, PHOTO_H);
    ctx.restore();
    // Top vignette
    const tv = ctx.createLinearGradient(0, 0, 0, 240);
    tv.addColorStop(0, "rgba(0,0,0,0.55)"); tv.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = tv; ctx.fillRect(0, 0, CW, 240);
    // Bottom fade to BG colour
    const bv = ctx.createLinearGradient(0, PHOTO_H * 0.42, 0, PHOTO_H);
    bv.addColorStop(0, "rgba(0,0,0,0)");
    if (dark) {
      bv.addColorStop(0.5, "rgba(6,13,26,0.72)");
      bv.addColorStop(1,   "rgba(6,13,26,1)");
    } else {
      bv.addColorStop(0.5, "rgba(240,236,227,0.72)");
      bv.addColorStop(1,   "rgba(240,236,227,1)");
    }
    ctx.fillStyle = bv; ctx.fillRect(0, PHOTO_H * 0.42, CW, PHOTO_H * 0.58);
  } else {
    const g = ctx.createLinearGradient(0, 0, CW * 0.8, PHOTO_H);
    if (dark) {
      g.addColorStop(0, "#1a3a6b"); g.addColorStop(0.6, "#0d1f3c"); g.addColorStop(1, BG_D);
    } else {
      g.addColorStop(0, "#e8dcc8"); g.addColorStop(0.6, "#d4c8b0"); g.addColorStop(1, BG_L);
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, PHOTO_H);
    const initials = delegate.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    ctx.font = "900 380px Georgia, serif";
    ctx.fillStyle = dark ? "rgba(201,146,10,0.08)" : "rgba(10,22,40,0.07)";
    ctx.textAlign = "center"; ctx.fillText(initials, CW/2, PHOTO_H * 0.74);
    const fv = ctx.createLinearGradient(0, PHOTO_H*0.52, 0, PHOTO_H);
    fv.addColorStop(0, "rgba(0,0,0,0)");
    fv.addColorStop(1, dark ? "rgba(6,13,26,1)" : "rgba(240,236,227,1)");
    ctx.fillStyle = fv; ctx.fillRect(0, PHOTO_H*0.52, CW, PHOTO_H*0.48);
    const tv2 = ctx.createLinearGradient(0,0,0,240);
    tv2.addColorStop(0,"rgba(0,0,0,0.45)"); tv2.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle = tv2; ctx.fillRect(0,0,CW,240);
  }

  // ── CORNER ACCENTS ────────────────────────────────────────────────────────
  ctx.strokeStyle = CORNER;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(CM,CM+CS); ctx.lineTo(CM,CM); ctx.lineTo(CM+CS,CM); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW-CM-CS,CM); ctx.lineTo(CW-CM,CM); ctx.lineTo(CW-CM,CM+CS); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CM,CH-CM-CS); ctx.lineTo(CM,CH-CM); ctx.lineTo(CM+CS,CH-CM); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW-CM-CS,CH-CM); ctx.lineTo(CW-CM,CH-CM); ctx.lineTo(CW-CM,CH-CM-CS); ctx.stroke();

  // ── LOGO (top-left) ───────────────────────────────────────────────────────
  try {
    const logo = await loadImg("/legislative-council-logo.jpg");
    ctx.save();
    ctx.beginPath(); ctx.arc(LX, LY, LR, 0, Math.PI*2); ctx.closePath(); ctx.clip();
    ctx.drawImage(logo, LX-LR, LY-LR, LR*2, LR*2);
    ctx.restore();
    ctx.strokeStyle = "rgba(232,184,75,0.88)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(LX, LY, LR, 0, Math.PI*2); ctx.stroke();
  } catch {}

  // ── LEGISLATIVE SUMMIT 2026 (top-right, same Y as logo) ───────────────────
  const TR_X = CW - CM - INNER_GAP;
  ctx.textAlign = "right";
  ctx.shadowColor = "rgba(201,146,10,0.45)"; ctx.shadowBlur = 8;
  ctx.font = "900 50px Arial Black, Arial, sans-serif";
  const lgGrad = ctx.createLinearGradient(TR_X-400, LY, TR_X, LY);
  lgGrad.addColorStop(0, GOLD3); lgGrad.addColorStop(0.5, GOLD2); lgGrad.addColorStop(1, GOLD);
  ctx.fillStyle = lgGrad;
  ctx.fillText("LEGISLATIVE", TR_X, LY - 2);
  ctx.font = "700 36px Arial Black, Arial, sans-serif";
  ctx.fillStyle = GOLD2;
  ctx.fillText("SUMMIT 2026", TR_X, LY + 34);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = GREEN; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(TR_X-268, LY+46); ctx.lineTo(TR_X, LY+46); ctx.stroke();

  // ── I'M ATTENDING BADGE ───────────────────────────────────────────────────
  const BADGE_Y = PHOTO_H - 110;
  const bW = 300, bH = 56;
  ctx.fillStyle = "rgba(201,146,10,0.15)";
  ctx.strokeStyle = "rgba(201,146,10,0.62)"; ctx.lineWidth = 2;
  rrect(ctx, PAD, BADGE_Y, bW, bH, 28);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.beginPath(); ctx.arc(PAD+22, BADGE_Y+bH/2, 7, 0, Math.PI*2); ctx.fill();
  ctx.textAlign = "left";
  ctx.font = "700 22px Arial, sans-serif";
  ctx.fillStyle = GOLD2;
  ctx.fillText("I'M ATTENDING", PAD+42, BADGE_Y+bH/2+8);

  // ── NAME ──────────────────────────────────────────────────────────────────
  const INFO_Y = PHOTO_H + 44;
  const nameMaxW = CW - PAD * 2;
  let nfs = 88;
  ctx.font = `900 ${nfs}px Georgia, serif`;
  while (nfs > 48) {
    ctx.font = `900 ${nfs}px Georgia, serif`;
    if (wrapText(ctx, delegate.name, nameMaxW).length <= 2) break;
    nfs -= 5;
  }
  ctx.fillStyle = TEXT; ctx.textAlign = "left";
  ctx.shadowColor = dark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.1)"; ctx.shadowBlur = 12;
  const nameLines = wrapText(ctx, delegate.name, nameMaxW);
  const NLH = nfs + 6;
  nameLines.forEach((l, i) => ctx.fillText(l, PAD, INFO_Y + i * NLH));
  ctx.shadowBlur = 0;
  const NAME_BOT = INFO_Y + nameLines.length * NLH + 4;

  // ── POSITION + INSTITUTION ────────────────────────────────────────────────
  ctx.font = "700 34px Arial, sans-serif";
  ctx.fillStyle = GOLD2;
  ctx.fillText(delegate.position.toUpperCase(), PAD, NAME_BOT + 42);
  ctx.font = "400 28px Arial, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText(delegate.institution, PAD, NAME_BOT + 84);

  // ── DIVIDER ───────────────────────────────────────────────────────────────
  const DIV_Y = NAME_BOT + 118;
  const dg = ctx.createLinearGradient(PAD, DIV_Y, CW-PAD, DIV_Y);
  dg.addColorStop(0, DIV);
  dg.addColorStop(0.6, dark ? "rgba(201,146,10,0.12)" : "rgba(201,146,10,0.1)");
  dg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = dg; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, DIV_Y); ctx.lineTo(CW-PAD, DIV_Y); ctx.stroke();

  // ── QR position — respects corner gap exactly ─────────────────────────────
  const QR_SIZE    = 160;
  const QR_PAD     = 12;
  const QR_CARD_W  = QR_SIZE + QR_PAD * 2;
  const QR_CARD_H  = QR_SIZE + QR_PAD * 2;
  // Right edge of QR card = TR_X (same as text right boundary)
  const QR_X       = CW - CM - INNER_GAP - QR_CARD_W;
  const TEXT_MAX   = QR_X - PAD - 28;
  // QR bottom = QR_BOTTOM_MAX (same gap from bottom corner as logo from top corner)
  const QR_Y       = QR_BOTTOM_MAX - QR_CARD_H;

  // ── EVENT TITLE ───────────────────────────────────────────────────────────
  const EV_Y = DIV_Y + 36;
  ctx.font = "700 50px Arial Black, Arial, sans-serif";
  const etg = ctx.createLinearGradient(PAD, EV_Y, PAD + TEXT_MAX, EV_Y);
  etg.addColorStop(0, GOLD3); etg.addColorStop(1, dark ? GOLD2 : GOLD);
  ctx.fillStyle = etg; ctx.textAlign = "left";
  const evLines = wrapText(ctx, "LEGISLATIVE SUMMIT 2026", TEXT_MAX);
  evLines.forEach((l, i) => ctx.fillText(l, PAD, EV_Y + 50 + i * 58));
  const EV_BOT = EV_Y + evLines.length * 58 + 50;

  // ── LOCATION + DATE — LOUD AND SHARP ─────────────────────────────────────
  // University name — bold, full colour, not muted
  ctx.font = "700 34px Arial, sans-serif";
  ctx.fillStyle = LOC;
  ctx.fillText("REDEEMER'S UNIVERSITY, EDE", PAD, EV_BOT + 22);

  // Date — semi-bold, slightly smaller
  ctx.font = "600 28px Arial, sans-serif";
  ctx.fillStyle = LOC2;
  ctx.fillText("29th April, 2026", PAD, EV_BOT + 62);

  // ── QR CODE ───────────────────────────────────────────────────────────────
  const qrURL = delegate.qrURL || `${REG_SITE}?checkin=${delegate.id}`;
  const qrImg = await generateQRImage(qrURL, 220);
  if (qrImg) {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = dark ? "rgba(201,146,10,0.4)" : "rgba(10,22,40,0.14)";
    ctx.lineWidth = 2;
    rrect(ctx, QR_X, QR_Y, QR_CARD_W, QR_CARD_H, 12);
    ctx.fill(); ctx.stroke();
    ctx.drawImage(qrImg, QR_X + QR_PAD, QR_Y + QR_PAD, QR_SIZE, QR_SIZE);
  }

  return canvas;
}


// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;1,400&family=Inter:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #060d1a;
    --navy2: #0d1e38;
    --navy3: #1a3a6b;
    --gold: #c9920a;
    --gold2: #e8b84b;
    --gold3: #f5d57a;
    --green: #39e07a;
    --green2: rgba(57,224,122,0.12);
    --green3: rgba(57,224,122,0.22);
    --cream: #f5f0e8;
    --border: rgba(26,58,107,0.4);
    --border-gold: rgba(201,146,10,0.25);
    --border-accent: rgba(57,224,122,0.18);
    --glass: rgba(26,58,107,0.12);
    --glass2: rgba(26,58,107,0.2);
  }

  html, body { min-height: 100vh; }

  body {
    background:
      radial-gradient(ellipse 80% 50% at 50% -5%, rgba(26,58,107,0.35) 0%, transparent 55%),
      radial-gradient(ellipse 50% 35% at 85% 70%, rgba(201,146,10,0.05) 0%, transparent 50%),
      #060d1a;
    color: var(--cream);
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
  }

  /* Subtle noise grain like flyer */
  body::after {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.3;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  }

  .page { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; }

  /* ── Header ── */
  .hdr {
    padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: rgba(6,13,26,0.95);
    backdrop-filter: blur(20px);
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 1px 0 rgba(26,58,107,0.3);
  }
  .hdr-brand { display: flex; align-items: center; gap: 10px; }
  .hdr-logo {
    width: 32px; height: 32px; border-radius: 50%;
    border: 1.5px solid var(--gold2); object-fit: cover;
    box-shadow: 0 0 10px rgba(201,146,10,0.2);
  }
  .hdr-title {
    font-family: 'Bebas Neue', sans-serif; font-size: 16px;
    color: var(--gold2); line-height: 1; letter-spacing: 0.1em;
  }
  .hdr-sub { font-size: 9px; color: rgba(245,240,232,0.38); letter-spacing: 0.1em; text-transform: uppercase; }
  .hdr-reg {
    font-size: 11px; font-weight: 600; color: #fff;
    text-decoration: none;
    background: linear-gradient(135deg, var(--gold), var(--navy3));
    padding: 7px 16px; border-radius: 6px;
    letter-spacing: 0.06em; font-family: 'Inter', sans-serif;
    box-shadow: 0 2px 12px rgba(201,146,10,0.2);
    transition: all .2s;
  }
  .hdr-reg:hover { box-shadow: 0 4px 18px rgba(201,146,10,0.35); transform: translateY(-1px); }

  /* ── Hero ── */
  .hero { padding: 56px 24px 40px; text-align: center; max-width: 700px; margin: 0 auto; }

  .badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 16px; border: 1px solid var(--border); border-radius: 100px;
    font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--gold2); background: rgba(201,146,10,0.07); margin-bottom: 24px;
  }
  .badge::before {
    content: ''; width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold2); animation: blink 2s infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }

  .hero h1 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(42px, 9vw, 84px);
    line-height: 0.95; letter-spacing: 0.04em; margin-bottom: 16px;
    background: linear-gradient(135deg, #f5d57a 0%, #e8b84b 50%, #ffffff 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero p { font-size: clamp(13px,2vw,16px); color: rgba(245,240,232,0.48); line-height: 1.7; max-width: 460px; margin: 0 auto 36px; }

  /* Steps */
  .steps { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 44px; flex-wrap: wrap; }
  .step { display: flex; align-items: center; gap: 7px; }
  .step-n {
    width: 24px; height: 24px; border-radius: 50%;
    border: 1px solid var(--border-gold);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: var(--gold2); flex-shrink: 0;
  }
  .step.active .step-n { background: var(--gold); color: #fff; border-color: var(--gold); box-shadow: 0 0 10px rgba(201,146,10,0.35); }
  .step.done .step-n { background: var(--green); color: #060d1a; border-color: var(--green); font-size: 12px; }
  .step-lbl { font-size: 11px; color: rgba(245,240,232,0.35); font-weight: 500; }
  .step.active .step-lbl, .step.done .step-lbl { color: rgba(245,240,232,0.8); }
  .step-line { width: 24px; height: 1px; background: rgba(26,58,107,0.4); }

  /* ── Main ── */
  .main { flex: 1; max-width: 960px; margin: 0 auto; padding: 0 24px 80px; width: 100%; }

  /* Panel */
  .panel {
    background: rgba(6,13,26,0.75);
    border: 1px solid var(--border);
    border-radius: 16px; overflow: hidden; margin-bottom: 20px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(26,58,107,0.15);
  }
  .phead {
    background: linear-gradient(135deg, rgba(6,13,26,0.98), rgba(13,30,56,0.9));
    border-bottom: 1px solid var(--border);
    padding: 16px 24px; display: flex; align-items: center; gap: 12px;
  }
  .picon {
    width: 34px; height: 34px; border-radius: 8px;
    background: var(--glass2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
  }
  .ptitle {
    font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700;
    color: var(--gold2); letter-spacing: 0.05em;
  }
  .pdesc { font-size: 11px; color: rgba(245,240,232,0.38); margin-top: 2px; }
  .pbody { padding: 24px; }

  /* Inputs */
  .tick-row { display: flex; gap: 10px; }
  .tick-in {
    flex: 1; padding: 13px 16px;
    background: rgba(26,58,107,0.08); border: 1.5px solid var(--border);
    border-radius: 9px; color: var(--cream);
    font-family: 'Inter', sans-serif; font-size: 14px;
    letter-spacing: 0.06em; outline: none; transition: border-color .2s;
    text-transform: uppercase;
  }
  .tick-in:focus { border-color: var(--gold2); box-shadow: 0 0 0 3px rgba(201,146,10,0.1); }
  .tick-in::placeholder { text-transform: none; color: rgba(245,240,232,0.22); letter-spacing: 0; }

  .btn-fetch {
    padding: 13px 20px;
    background: linear-gradient(135deg, var(--gold), var(--navy3));
    border: none; border-radius: 9px; color: #fff;
    font-family: 'Cinzel', serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.06em; cursor: pointer; white-space: nowrap;
    box-shadow: 0 2px 14px rgba(201,146,10,0.22); transition: all .2s;
  }
  .btn-fetch:hover { box-shadow: 0 4px 20px rgba(201,146,10,0.35); transform: translateY(-1px); }
  .btn-fetch:disabled { opacity: .4; cursor: not-allowed; transform: none; }

  /* Delegate card */
  .del-card {
    display: flex; align-items: center; gap: 14px; padding: 14px;
    background: rgba(26,58,107,0.1); border: 1px solid rgba(26,58,107,0.4);
    border-radius: 10px; margin-top: 14px; animation: fadeUp .3s ease both;
  }
  .del-av {
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(26,58,107,0.15); border: 1.5px solid var(--gold2);
    display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;
  }
  .del-name { font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; color: var(--cream); margin-bottom: 3px; }
  .del-meta { font-size: 11px; color: rgba(245,240,232,0.45); }
  .del-id { margin-left: auto; font-family: monospace; font-size: 11px; color: var(--gold2); letter-spacing: .08em; flex-shrink: 0; }
  .err { margin-top: 12px; padding: 11px 15px; background: rgba(192,57,43,.08); border: 1px solid rgba(192,57,43,.3); border-radius: 8px; color: #e74c3c; font-size: 12px; }

  /* Mode toggle */
  .mode-toggle { display: flex; border: 1px solid var(--border); border-radius: 9px; overflow: hidden; margin-bottom: 18px; }
  .mode-btn {
    flex: 1; padding: 11px; border: none; cursor: pointer;
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
    transition: all .2s; background: transparent; color: rgba(245,240,232,0.35);
    letter-spacing: 0.04em;
  }
  .mode-btn.dk { background: var(--navy2); color: var(--gold2); border-bottom: 2px solid var(--gold2); }
  .mode-btn.lt { background: #f5f0e8; color: #060f0a; border-bottom: 2px solid #060f0a; }

  /* Upload */
  .upload-zone {
    border: 1.5px dashed rgba(26,58,107,0.45); border-radius: 12px;
    padding: 32px 20px; text-align: center; cursor: pointer;
    transition: all .2s; background: var(--glass);
  }
  .upload-zone:hover, .upload-zone.drag {
    border-color: var(--gold2); background: rgba(201,146,10,0.05);
    box-shadow: 0 0 18px rgba(201,146,10,0.08);
  }
  .up-icon { font-size: 32px; margin-bottom: 10px; }
  .up-title { font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; color: var(--gold2); margin-bottom: 4px; }
  .up-sub { font-size: 11px; color: rgba(245,240,232,0.35); }
  .photo-row { display: flex; align-items: center; gap: 16px; }
  .photo-row img { width: 100px; height: 100px; object-fit: cover; border-radius: 10px; border: 1.5px solid var(--gold2); display: block; flex-shrink: 0; box-shadow: 0 0 10px rgba(201,146,10,0.15); }
  .photo-rm { padding: 6px 12px; background: rgba(192,57,43,0.85); border: none; color: #fff; border-radius: 6px; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; }
  .photo-info { font-size: 12px; color: rgba(245,240,232,0.45); line-height: 1.7; }

  /* Generate button */
  .btn-gen {
    width: 100%; padding: 15px; margin-top: 18px;
    background: linear-gradient(135deg, var(--gold) 0%, #1a3a6b 120%);
    border: none; border-radius: 12px; color: #fff;
    font-family: 'Bebas Neue', sans-serif; font-size: 18px;
    letter-spacing: 0.12em; cursor: pointer;
    box-shadow: 0 6px 24px rgba(201,146,10,0.25); transition: all .2s;
  }
  .btn-gen:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(201,146,10,0.35); }
  .btn-gen:disabled { opacity: .38; cursor: not-allowed; transform: none; }

  /* Preview */
  .preview { text-align: center; animation: fadeUp .5s ease both; }
  .preview-lbl {
    font-family: 'Bebas Neue', sans-serif; font-size: 14px;
    letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--gold2); margin-bottom: 20px;
  }
  .card-wrap {
    display: inline-block; max-width: 320px; width: 100%;
    border-radius: 18px; overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,146,10,0.2), 0 0 40px rgba(26,58,107,0.15);
  }
  .card-wrap img { width: 100%; display: block; }

  /* Action buttons */
  .act-row { display: flex; gap: 10px; margin-top: 20px; justify-content: center; flex-wrap: wrap; }
  .btn-share {
    padding: 12px 22px;
    background: linear-gradient(135deg, var(--green), #1a7a40);
    border: none; border-radius: 9px; color: #060f0a;
    font-family: 'Bebas Neue', sans-serif; font-size: 15px;
    letter-spacing: 0.1em; cursor: pointer;
    box-shadow: 0 3px 16px rgba(57,224,122,0.22); transition: all .2s;
  }
  .btn-share:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(57,224,122,0.32); }
  .btn-dl {
    padding: 12px 22px;
    background: linear-gradient(135deg, var(--gold), #1a3a6b);
    border: none; border-radius: 9px; color: #fff;
    font-family: 'Bebas Neue', sans-serif; font-size: 15px;
    letter-spacing: 0.1em; cursor: pointer;
    box-shadow: 0 3px 16px rgba(201,146,10,0.22); transition: all .2s;
  }
  .btn-dl:hover { transform: translateY(-1px); }
  .btn-sec {
    padding: 12px 18px; background: transparent;
    border: 1px solid var(--border); border-radius: 9px;
    color: rgba(245,240,232,0.5); font-family: 'Inter', sans-serif;
    font-size: 12px; font-weight: 500; cursor: pointer; transition: all .2s;
  }
  .btn-sec:hover { border-color: var(--green); color: var(--green); }

  /* Caption box */
  .cap-box {
    margin: 20px auto 0; padding: 16px 20px;
    background: rgba(6,13,26,0.7); border: 1px solid var(--border);
    border-radius: 12px; max-width: 380px; text-align: left;
  }
  .cap-lbl { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold2); font-weight: 600; margin-bottom: 8px; font-family: 'Inter', sans-serif; }
  .cap-txt { font-size: 12px; color: rgba(245,240,232,0.62); line-height: 1.65; user-select: all; white-space: pre-line; }
  .btn-copy {
    margin-top: 10px; padding: 7px 16px;
    background: rgba(26,58,107,0.15); border: 1px solid var(--border);
    border-radius: 6px; color: var(--gold2); font-size: 11px;
    cursor: pointer; transition: all .2s; font-family: 'Inter', sans-serif; font-weight: 600;
  }
  .btn-copy:hover { background: rgba(201,146,10,0.1); }

  /* Footer dot strip */
  .footer-dots { display: flex; justify-content: center; gap: 5px; padding: 20px 0 0; }
  .footer-dots span { width: 4px; height: 4px; border-radius: 50%; background: rgba(57,224,122,0.3); display: block; }
  .footer-dots span { background: rgba(26,58,107,0.4); }
  .footer-dots span:nth-child(3n) { background: rgba(201,146,10,0.5); }

  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
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

  const handleShare = async () => {
    if (!cardUrl) return;
    try {
      // Convert dataURL to blob for sharing
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], `RUNSA-Summit-${delegate.name.split(" ")[0]}.jpg`, { type: "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "RUNSA Legislative Summit 2026",
          text: caption,
        });
      } else if (navigator.share) {
        // Fallback — share without file (some browsers)
        await navigator.share({ title: "RUNSA Legislative Summit 2026", text: caption, url: REG_SITE });
      } else {
        // Desktop fallback — copy caption + download
        await navigator.clipboard.writeText(caption);
        handleDownload();
        alert("Caption copied! Image downloaded — paste caption when sharing.");
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        // User cancelled — that's fine
        console.error("Share failed:", e);
      }
    }
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
              <div className="hdr-title">Redeemer's University Students' Association · Legislative Council</div>
              <div className="hdr-sub">Summit Card Generator</div>
            </div>
          </div>
          <a href={REG_SITE} className="hdr-reg">Register →</a>
        </header>

        <div className="hero">
          <div className="badge">Summit 2026 · Card Generator</div>
          <h1>Show the World<br />You're In.</h1>
          <p>Generate your personal attendee card for the RUNSA Legislative Summit 2026. Share it. Drive the hype.</p>
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
                <button className="btn-share" onClick={handleShare}>📤 Share Card</button>
                <button className="btn-dl" onClick={handleDownload}>⬇ Download</button>
                <button className="btn-sec" onClick={() => {
                  setCardMode(m => m === "dark" ? "light" : "dark");
                  setCardUrl(null);
                }}>
                  {cardMode === "dark" ? "☀️ Light" : "🌙 Dark"}
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

        {/* Footer dot strip — flyer inspired */}
        <div className="footer-dots">
          {Array.from({length: 20}).map((_,i) => <span key={i} />)}
        </div>
      </div>
    </>
  );
}
