import { useState, useRef, useEffect } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const REG_SITE = "https://legislative-summit-registration.vercel.app";
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3SqUXGR0kqPCpG88BFRB9qUMAk08x_6Q",
  authDomain: "runsa-summit.firebaseapp.com",
  projectId: "runsa-summit",
};
const COLLECTION = "delegates";
const ATT_W = 1080, ATT_H = 1350;
const VOL_W = 630,  VOL_H = 1008;

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
async function generateQRImage(text, size, darkColor = "#050d1e") {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js");
  return new Promise((resolve) => {
    const div = document.createElement("div");
    div.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
    document.body.appendChild(div);
    new window.QRCode(div, { text, width: size, height: size, colorDark: darkColor, colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.H });
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
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
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

// ─── IMPROVED FACE CENTERING ──────────────────────────────────────────────────
// Smart face-aware cropping that centers the subject better
function drawSmartCover(ctx, img, x, y, w, h) {
  const imgAr = img.width / img.height;
  const zoneAr = w / h;
  let sw, sh, sx, sy;
  
  if (imgAr > zoneAr) {
    // Image is wider than zone - crop sides, keep full height
    sh = img.height;
    sw = img.height * zoneAr;
    sx = (img.width - sw) / 2; // Center horizontally
    sy = 0;
  } else {
    // Image is taller than zone - crop top/bottom, keep full width
    sw = img.width;
    sh = img.width / zoneAr;
    sx = 0;
    // Center vertically with slight bias toward upper body (face area)
    // Use 45% from top instead of 50% to favor upper body
    sy = Math.max(0, Math.min(img.height * 0.42 - sh * 0.42, img.height - sh));
  }
  
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// ─── BADGE INFO ───────────────────────────────────────────────────────────────
function getBadgeInfo(badge) {
  const map = {
    "EXTERNAL DELEGATE":   { label:"EXTERNAL DELEGATE",  textColor:"#fff",    bg:"#1a5c35",     accent:"#39e07a",  glow:"rgba(57,224,122,0.5)"  },
    "DISTINGUISHED GUEST": { label:"DISTINGUISHED GUEST", textColor:"#fff",    bg:"#7a4a00",     accent:"#e8b84b",  glow:"rgba(232,184,75,0.5)"  },
    "RUNSA OFFICIAL":      { label:"RUNSA OFFICIAL",      textColor:"#fff",    bg:"#0a1e4a",     accent:"#6a9fe0",  glow:"rgba(106,159,224,0.5)" },
    "PAST HONOURABLE":     { label:"PAST HONOURABLE",     textColor:"#fff",    bg:"#2a1a5c",     accent:"#c4a8f5",  glow:"rgba(196,168,245,0.5)" },
    "DELEGATE":            { label:"DELEGATE",            textColor:"#fff",    bg:"#0d2a55",     accent:"#7ab8f5",  glow:"rgba(122,184,245,0.4)" },
    "VOLUNTEER":           { label:"VOLUNTEER",           textColor:"#060d1a", bg:"#1a5c35",     accent:"#39e07a",  glow:"rgba(57,224,122,0.5)"  },
  };
  return map[badge] || null;
}

// ─── ATTENDEE CARD — REDESIGNED WITH CLEAN GRADIENTS ──────────────────────────
async function renderAttendeeCard(delegate, photoDataUrl, mode) {
  const dark = mode === "dark";
  const CW = ATT_W, CH = ATT_H;

  // Palette
  const GOLD    = "#c9920a";
  const GOLD2   = "#e8b84b";
  const GOLD3   = "#f5d57a";
  const GREEN   = "#39e07a";
  const NAVY    = "#0a1628";
  const NAVY2   = "#1a3a6b";

  const BG      = dark ? "#07111e" : "#f4f6fb";
  const SURFACE = dark ? "#0d1e38" : "#ffffff";
  const TEXT     = dark ? "#f5f0e8" : "#0a1628";
  const MUTED    = dark ? "rgba(245,240,232,0.55)" : "rgba(10,22,40,0.52)";

  const canvas = document.createElement("canvas");
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext("2d");

  // ── BACKGROUND ──────────────────────────────────────────────────────────────
  ctx.fillStyle = BG; ctx.fillRect(0, 0, CW, CH);

  // Photo height - increased to 52% for better face visibility
  const PHOTO_H = Math.round(CH * 0.52);

  // ── PHOTO ZONE ──────────────────────────────────────────────────────────────
  if (photoDataUrl) {
    const photo = await loadImg(photoDataUrl);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, CW, PHOTO_H); ctx.clip();
    drawSmartCover(ctx, photo, 0, 0, CW, PHOTO_H); ctx.restore();
    
    // Top vignette - very subtle, only at very top
    const tv = ctx.createLinearGradient(0, 0, 0, 120);
    tv.addColorStop(0, "rgba(0,0,0,0.35)"); 
    tv.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = tv; ctx.fillRect(0, 0, CW, 120);
    
    // Bottom fade - CLEAN GRADIENT like Mercy Oni card
    // Starts at 92% of photo height (much lower, keeps face fully visible)
    const FADE_START = 0.92;
    const fadeHeight = PHOTO_H * (1 - FADE_START);
    const bv = ctx.createLinearGradient(0, PHOTO_H * FADE_START, 0, PHOTO_H);
    bv.addColorStop(0, "rgba(0,0,0,0)");
    // Very subtle mid transition
    bv.addColorStop(0.6, dark ? "rgba(7,17,30,0.15)" : "rgba(244,246,251,0.12)");
    // Full fade only at the very bottom edge
    bv.addColorStop(1, dark ? "rgba(7,17,30,0.95)" : "rgba(244,246,251,0.95)");
    ctx.fillStyle = bv; 
    ctx.fillRect(0, PHOTO_H * FADE_START, CW, fadeHeight);
  } else {
    // Geometric placeholder with initials
    const bgMesh = ctx.createLinearGradient(0, 0, CW, PHOTO_H);
    if (dark) {
      bgMesh.addColorStop(0, "#1a3a6b"); bgMesh.addColorStop(0.5, "#0d1e38"); bgMesh.addColorStop(1, "#07111e");
    } else {
      bgMesh.addColorStop(0, "#c8d8f0"); bgMesh.addColorStop(0.5, "#b0c4e8"); bgMesh.addColorStop(1, "#f4f6fb");
    }
    ctx.fillStyle = bgMesh; ctx.fillRect(0, 0, CW, PHOTO_H);
    // Geometric circles
    ctx.strokeStyle = dark ? "rgba(201,146,10,0.12)" : "rgba(26,58,107,0.1)";
    ctx.lineWidth = 60;
    ctx.beginPath(); ctx.arc(CW * 0.75, PHOTO_H * 0.35, 260, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(CW * 0.1, PHOTO_H * 0.7, 180, 0, Math.PI * 2); ctx.stroke();
    // Initials
    const initials = delegate.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
    ctx.font = "900 300px Georgia, serif";
    ctx.fillStyle = dark ? "rgba(201,146,10,0.1)" : "rgba(26,58,107,0.07)";
    ctx.textAlign = "center"; ctx.fillText(initials, CW/2, PHOTO_H * 0.72);
    // Fade out to bg
    const fv = ctx.createLinearGradient(0, PHOTO_H * 0.5, 0, PHOTO_H);
    fv.addColorStop(0, "rgba(0,0,0,0)");
    fv.addColorStop(1, dark ? "rgba(7,17,30,1)" : "rgba(244,246,251,1)");
    ctx.fillStyle = fv; ctx.fillRect(0, PHOTO_H * 0.5, CW, PHOTO_H * 0.5);
  }

  // ── DIAGONAL ACCENT STRIPE ───────────────────────────────────────────────────
  // Positioned at photo bottom edge, very subtle
  const STRIPE_Y = PHOTO_H - 14;
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(0, STRIPE_Y + 45);
  ctx.lineTo(CW * 0.65, STRIPE_Y);
  ctx.lineTo(CW, STRIPE_Y + 18);
  ctx.lineTo(CW, STRIPE_Y + 52);
  ctx.lineTo(CW * 0.65, STRIPE_Y + 34);
  ctx.lineTo(0, STRIPE_Y + 80);
  ctx.closePath();
  const stripeG = ctx.createLinearGradient(0, STRIPE_Y, CW, STRIPE_Y + 52);
  stripeG.addColorStop(0, "rgba(201,146,10,0.6)");
  stripeG.addColorStop(0.5, "rgba(232,184,75,0.75)");
  stripeG.addColorStop(1, "rgba(57,224,122,0.45)");
  ctx.fillStyle = stripeG;
  ctx.fill();
  ctx.restore();

  // ── CORNER BRACKETS (gold, precise) ─────────────────────────────────────────
  const CM = 36, CS = 90;
  ctx.strokeStyle = "rgba(201,146,10,0.65)"; ctx.lineWidth = 4.5;
  [[CM,CM,CS,0],[CW-CM,CM,CS,1],[CM,CH-CM,CS,2],[CW-CM,CH-CM,CS,3]].forEach(([x,y,s,q]) => {
    ctx.beginPath();
    if (q === 0) { ctx.moveTo(x,y+s); ctx.lineTo(x,y); ctx.lineTo(x+s,y); }
    if (q === 1) { ctx.moveTo(x-s,y); ctx.lineTo(x,y); ctx.lineTo(x,y+s); }
    if (q === 2) { ctx.moveTo(x,y-s); ctx.lineTo(x,y); ctx.lineTo(x+s,y); }
    if (q === 3) { ctx.moveTo(x-s,y); ctx.lineTo(x,y); ctx.lineTo(x,y-s); }
    ctx.stroke();
  });

  // ── LOGO + SUMMIT LABEL (top, on photo) ─────────────────────────────────────
  const LR = 38, LX = CM + 18 + LR, LY = CM + 18 + LR;
  try {
    const logo = await loadImg("/legislative-council-logo.jpg");
    ctx.save();
    ctx.beginPath(); ctx.arc(LX, LY, LR, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(logo, LX-LR, LY-LR, LR*2, LR*2);
    ctx.restore();
    // Ring with glow
    ctx.shadowColor = "rgba(232,184,75,0.7)"; ctx.shadowBlur = 12;
    ctx.strokeStyle = "rgba(232,184,75,0.9)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(LX, LY, LR, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
  } catch {}

  // Summit label top-right
  const TR_X = CW - CM - 18;
  ctx.textAlign = "right";
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 14;
  // "LEGISLATIVE" in gradient
  const lgG = ctx.createLinearGradient(TR_X - 380, LY, TR_X, LY);
  lgG.addColorStop(0, GOLD3); lgG.addColorStop(0.55, GOLD2); lgG.addColorStop(1, GOLD);
  ctx.fillStyle = lgG;
  ctx.font = "900 48px Arial Black, Arial, sans-serif";
  ctx.fillText("LEGISLATIVE", TR_X, LY - 4);
  ctx.font = "700 34px Arial Black, Arial, sans-serif";
  ctx.fillStyle = GOLD2;
  ctx.fillText("SUMMIT 2026", TR_X, LY + 34);
  ctx.shadowBlur = 0;
  // Green underline
  ctx.strokeStyle = GREEN; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(TR_X - 262, LY + 46); ctx.lineTo(TR_X, LY + 46); ctx.stroke();

  // ── I'M ATTENDING badge ──────────────────────────────────────────────────────
  // Positioned at bottom of photo strip, inside vignette zone
  const ATT_Y = PHOTO_H - 72;
  const attG = ctx.createLinearGradient(48, ATT_Y, 48 + 320, ATT_Y);
  attG.addColorStop(0, "rgba(201,146,10,0.28)");
  attG.addColorStop(1, "rgba(57,224,122,0.14)");
  ctx.fillStyle = attG;
  ctx.strokeStyle = "rgba(201,146,10,0.72)"; ctx.lineWidth = 1.5;
  rrect(ctx, 48, ATT_Y, 320, 52, 26); ctx.fill(); ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.beginPath(); ctx.arc(48+21, ATT_Y+26, 6.5, 0, Math.PI*2); ctx.fill();
  ctx.textAlign = "left";
  ctx.font = "700 21px Arial, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 8;
  ctx.fillStyle = GOLD2;
  ctx.fillText("I'M ATTENDING", 48 + 40, ATT_Y + 26 + 7);
  ctx.shadowBlur = 0;

  // ── INFO PANEL ───────────────────────────────────────────────────────────────
  const PAD = 60;
  const INFO_Y = PHOTO_H + 36;

  // QR anchored from bottom
  const QR_SIZE = 168, QR_PAD = 12;
  const QR_CARD_W = QR_SIZE + QR_PAD*2, QR_CARD_H = QR_SIZE + QR_PAD*2;
  const QR_X = CW - CM - 18 - QR_CARD_W;
  const QR_Y_BOT = CH - CM - 18;
  const QR_Y = QR_Y_BOT - QR_CARD_H;

  // Anchored from bottom: date → location → event → divider
  const D_BOT   = CH - CM - 18;
  const DATE_Y  = D_BOT - 4;
  const LOC_Y   = DATE_Y - 28 - 12;
  const EV_Y    = LOC_Y - 34 - 26;
  const DIV_Y   = EV_Y - 50 - 18;

  const nameMaxW = QR_X - PAD - 24;

  // Name font sizing
  let nfs = 84;
  const NAME_BUDGET = DIV_Y - INFO_Y - 30 - 50 - 28 - 44 - 20 - 34;
  while (nfs > 38) {
    ctx.font = `900 ${nfs}px Georgia, serif`;
    const nl = wrapText(ctx, delegate.name, nameMaxW);
    if (nl.length <= 2 && nl.length * (nfs + 10) <= NAME_BUDGET) break;
    nfs -= 4;
  }
  const NLH = nfs + 10;
  const nameLines = wrapText(ctx, delegate.name, nameMaxW);
  ctx.fillStyle = TEXT; ctx.textAlign = "left";
  ctx.shadowColor = dark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)"; ctx.shadowBlur = 10;
  nameLines.forEach((l, i) => ctx.fillText(l, PAD, INFO_Y + (i + 1) * NLH));
  ctx.shadowBlur = 0;
  const NAME_BOT = INFO_Y + nameLines.length * NLH;

  // Badge chip
  let cur = NAME_BOT + 28;
  const badgeInfo = getBadgeInfo(delegate.badge);
  if (badgeInfo) {
    ctx.font = "800 17px Arial Black, Arial, sans-serif";
    const bChipW = ctx.measureText(badgeInfo.label).width + 40;
    const bChipH = 44;
    // Solid filled chip
    const chipBgG = ctx.createLinearGradient(PAD, cur, PAD + bChipW, cur);
    chipBgG.addColorStop(0, badgeInfo.bg);
    chipBgG.addColorStop(1, dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)");
    ctx.fillStyle = chipBgG;
    ctx.shadowColor = badgeInfo.glow; ctx.shadowBlur = 16;
    rrect(ctx, PAD, cur, bChipW, bChipH, 9); ctx.fill();
    ctx.shadowBlur = 0;
    // Accent left bar
    ctx.fillStyle = badgeInfo.accent;
    rrect(ctx, PAD, cur, 6, bChipH, 3); ctx.fill();
    // Label
    ctx.fillStyle = badgeInfo.textColor;
    ctx.fillText(badgeInfo.label, PAD + 20, cur + bChipH/2 + 7);
    cur += bChipH + 22;
  }

  // Position
  ctx.font = "800 34px Arial, sans-serif";
  const posG = ctx.createLinearGradient(PAD, cur, PAD + 400, cur + 34);
  posG.addColorStop(0, GOLD2); posG.addColorStop(1, GOLD);
  ctx.fillStyle = posG;
  ctx.fillText(delegate.position ? delegate.position.toUpperCase() : "", PAD, cur + 34);
  cur += 34 + 18;

  // Institution
  if (delegate.institution) {
    ctx.font = "400 26px Arial, sans-serif"; ctx.fillStyle = MUTED;
    ctx.fillText(delegate.institution, PAD, cur + 26);
  }

  // Divider — gold to transparent
  const dg = ctx.createLinearGradient(PAD, DIV_Y, CW - PAD, DIV_Y);
  dg.addColorStop(0, dark ? "rgba(201,146,10,0.55)" : "rgba(201,146,10,0.45)");
  dg.addColorStop(0.65, dark ? "rgba(201,146,10,0.12)" : "rgba(201,146,10,0.08)");
  dg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = dg; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, DIV_Y); ctx.lineTo(CW - PAD, DIV_Y); ctx.stroke();

  // Event title (bottom anchored, gradient gold)
  ctx.font = "700 46px Arial Black, Arial, sans-serif";
  const etG = ctx.createLinearGradient(PAD, EV_Y - 46, PAD + 580, EV_Y);
  etG.addColorStop(0, GOLD3); etG.addColorStop(1, dark ? GOLD2 : GOLD);
  ctx.fillStyle = etG; ctx.textAlign = "left";
  ctx.fillText("LEGISLATIVE SUMMIT 2026", PAD, EV_Y);

  // Location
  ctx.font = "700 30px Arial, sans-serif";
  ctx.fillStyle = dark ? "#f5f0e8" : "#0a1628";
  ctx.fillText("REDEEMER'S UNIVERSITY, EDE", PAD, LOC_Y);

  // Date
  ctx.font = "500 24px Arial, sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText("29th April, 2026", PAD, DATE_Y);

  // QR code (bottom-right, floating white card)
  const qrURL = delegate.qrURL || `${REG_SITE}?checkin=${delegate.id}`;
  const qrImg = await generateQRImage(qrURL, 220, NAVY);
  if (qrImg) {
    // Shadow for QR card
    ctx.shadowColor = dark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 20; ctx.shadowOffsetY = 4;
    ctx.fillStyle = "#ffffff";
    rrect(ctx, QR_X, QR_Y, QR_CARD_W, QR_CARD_H, 14); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    // Gold border on QR card
    ctx.strokeStyle = "rgba(201,146,10,0.35)"; ctx.lineWidth = 1.5;
    rrect(ctx, QR_X, QR_Y, QR_CARD_W, QR_CARD_H, 14); ctx.stroke();
    ctx.drawImage(qrImg, QR_X + QR_PAD, QR_Y + QR_PAD, QR_SIZE, QR_SIZE);
  }

  return canvas;
}

// ─── VOLUNTEER TAG — REDESIGNED ───────────────────────────────────────────────
async function renderVolunteerTag(delegate) {
  const CW = VOL_W, CH = VOL_H;

  // Colours
  const NAVY    = "#060d1a";
  const NAVY2   = "#0d1e38";
  const NAVY3   = "#1a3a6b";
  const GOLD    = "#c9920a";
  const GOLD2   = "#e8b84b";
  const GOLD3   = "#f5d57a";
  const GREEN   = "#39e07a";
  const CREAM   = "#f5f0e8";

  // Unit colour map — each volunteer unit gets its own accent
  const unitColors = {
    "ushering & protocol": { bg:"#0a1e3a", accent:"#5ba4f5", glow:"rgba(91,164,245,0.5)" },
    "logistics":           { bg:"#0e2010", accent:"#39e07a", glow:"rgba(57,224,122,0.5)" },
    "registration":        { bg:"#1e0a0a", accent:"#f56b5b", glow:"rgba(245,107,91,0.5)" },
    "team tech":           { bg:"#1a0a2e", accent:"#c4a8f5", glow:"rgba(196,168,245,0.5)" },
    "anchors":             { bg:"#1a150a", accent:"#f5c842", glow:"rgba(245,200,66,0.5)"  },
    "welfare unit":        { bg:"#0a1e10", accent:"#4ae0a0", glow:"rgba(74,224,160,0.5)"  },
    "general volunteer":   { bg:"#0d1628", accent:"#e8b84b", glow:"rgba(232,184,75,0.5)"  },
  };
  const posLower = (delegate.position || "").toLowerCase();
  const unitKey = Object.keys(unitColors).find(k => posLower.includes(k)) || "general volunteer";
  const unit = unitColors[unitKey];

  const canvas = document.createElement("canvas");
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext("2d");

  // ── BACKGROUND — deep navy with unit tint ────────────────────────────────────
  const bgG = ctx.createLinearGradient(0, 0, CW * 0.7, CH);
  bgG.addColorStop(0, unit.bg);
  bgG.addColorStop(0.7, "#060d1a");
  bgG.addColorStop(1, "#030810");
  ctx.fillStyle = bgG; ctx.fillRect(0, 0, CW, CH);

  // Radial shimmer — unit accent colour, top-right
  const shimmer = ctx.createRadialGradient(CW * 0.88, CH * 0.08, 0, CW * 0.88, CH * 0.08, CW * 0.85);
  shimmer.addColorStop(0, unit.glow.replace("0.5", "0.22"));
  shimmer.addColorStop(0.5, unit.glow.replace("0.5", "0.06"));
  shimmer.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shimmer; ctx.fillRect(0, 0, CW, CH);

  // Subtle diagonal lines texture
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.025)"; ctx.lineWidth = 1;
  for (let i = -CH; i < CW + CH; i += 28) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + CH, CH); ctx.stroke();
  }
  ctx.restore();

  // ── HEADER ZONE (punch hole + branding) ─────────────────────────────────────
  const HEADER_H = 88;
  // Header bg — slightly different shade
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, CW, HEADER_H);
  // Horizontal separator line
  const sepG = ctx.createLinearGradient(0, HEADER_H, CW, HEADER_H);
  sepG.addColorStop(0, "rgba(255,255,255,0)");
  sepG.addColorStop(0.15, unit.glow.replace("0.5","0.7"));
  sepG.addColorStop(0.5, unit.glow.replace("0.5","1").replace("rgba","rgba").replace(")", ", 1)").replace(", 1)", ")"));
  sepG.addColorStop(0.85, unit.glow.replace("0.5","0.7"));
  sepG.addColorStop(1, "rgba(255,255,255,0)");
  ctx.strokeStyle = sepG; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, HEADER_H); ctx.lineTo(CW, HEADER_H); ctx.stroke();

  // Punch hole
  ctx.fillStyle = "#020509";
  ctx.beginPath(); ctx.arc(CW/2, HEADER_H/2, 20, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(CW/2, HEADER_H/2, 20, 0, Math.PI*2); ctx.stroke();
  // Metal ring effect
  ctx.strokeStyle = unit.glow.replace("0.5","0.5");
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(CW/2, HEADER_H/2, 14, 0, Math.PI*2); ctx.stroke();

  // Flanking dots
  ctx.fillStyle = unit.accent;
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.arc(CW/2 - 52, HEADER_H/2, 4.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(CW/2 + 52, HEADER_H/2, 4.5, 0, Math.PI*2); ctx.fill();
  ctx.globalAlpha = 1;

  // ── CORNER BRACKETS ──────────────────────────────────────────────────────────
  const CM = 22, CS = 52;
  ctx.strokeStyle = unit.glow.replace("0.5","0.55");
  ctx.lineWidth = 3;
  // Bottom corners
  ctx.beginPath(); ctx.moveTo(CM, CH-CM-CS); ctx.lineTo(CM, CH-CM); ctx.lineTo(CM+CS, CH-CM); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW-CM-CS,CH-CM); ctx.lineTo(CW-CM,CH-CM); ctx.lineTo(CW-CM,CH-CM-CS); ctx.stroke();
  // Top corners (below header)
  ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(CM,HEADER_H+6); ctx.lineTo(CM,HEADER_H+6+CS); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW-CM,HEADER_H+6); ctx.lineTo(CW-CM,HEADER_H+6+CS); ctx.stroke();

  // ── LOGO ─────────────────────────────────────────────────────────────────────
  const LOGO_Y = HEADER_H + 52;
  const LOGO_R = 36;
  try {
    const lcLogo = await loadImg("/legislative-council-logo.jpg");
    ctx.save(); ctx.beginPath(); ctx.arc(CW/2, LOGO_Y, LOGO_R, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(lcLogo, CW/2-LOGO_R, LOGO_Y-LOGO_R, LOGO_R*2, LOGO_R*2); ctx.restore();
    // Ring glow
    ctx.shadowColor = unit.glow.replace("0.5","0.8"); ctx.shadowBlur = 16;
    ctx.strokeStyle = GOLD2; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(CW/2, LOGO_Y, LOGO_R, 0, Math.PI*2); ctx.stroke();
    ctx.shadowBlur = 0;
  } catch {}

  // Summit title
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 12;
  ctx.font = "700 21px Arial Black, Arial, sans-serif";
  const titleG = ctx.createLinearGradient(40, 0, CW-40, 0);
  titleG.addColorStop(0, GOLD3); titleG.addColorStop(0.5, GOLD2); titleG.addColorStop(1, GOLD);
  ctx.fillStyle = titleG;
  ctx.fillText("LEGISLATIVE SUMMIT 2026", CW/2, LOGO_Y + LOGO_R + 32);
  ctx.shadowBlur = 0;
  ctx.font = "400 14px Arial, sans-serif";
  ctx.fillStyle = "rgba(245,240,232,0.45)";
  ctx.fillText("Redeemer's University · 29th April, 2026", CW/2, LOGO_Y + LOGO_R + 54);

  // ── SEPARATOR ────────────────────────────────────────────────────────────────
  const SEP_Y = LOGO_Y + LOGO_R + 74;
  const sepLG = ctx.createLinearGradient(32, SEP_Y, CW-32, SEP_Y);
  sepLG.addColorStop(0, "rgba(255,255,255,0)");
  sepLG.addColorStop(0.5, unit.glow.replace("0.5","0.6"));
  sepLG.addColorStop(1, "rgba(255,255,255,0)");
  ctx.strokeStyle = sepLG; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(32, SEP_Y); ctx.lineTo(CW-32, SEP_Y); ctx.stroke();

  // ── QR anchored at bottom ─────────────────────────────────────────────────────
  const QR_SIZE = 158, QR_PAD = 11;
  const QR_CARD_W = QR_SIZE + QR_PAD*2, QR_CARD_H = QR_SIZE + QR_PAD*2;
  const QR_X = (CW - QR_CARD_W)/2;
  const QR_Y = CH - 32 - QR_CARD_H;
  const ID_Y = QR_Y - 14;

  // Content zone
  const CONTENT_TOP = SEP_Y + 28;
  const CONTENT_BOT = ID_Y - 8;
  const CONTENT_H   = CONTENT_BOT - CONTENT_TOP;

  // ── UNIT BADGE (large, vibrant) ───────────────────────────────────────────────
  const chipText = (delegate.position || "VOLUNTEER").toUpperCase();
  ctx.font = "900 24px Arial Black, Arial, sans-serif";
  const chipW = Math.min(CW - 56, ctx.measureText(chipText).width + 56);
  const chipH = 58, chipX = (CW - chipW)/2;
  const CHIP_Y = CONTENT_TOP;

  // Glowing chip background
  ctx.shadowColor = unit.glow.replace("0.5","0.55");
  ctx.shadowBlur = 20;
  const chipBgG = ctx.createLinearGradient(chipX, CHIP_Y, chipX + chipW, CHIP_Y + chipH);
  chipBgG.addColorStop(0, unit.bg);
  chipBgG.addColorStop(1, "rgba(255,255,255,0.04)");
  ctx.fillStyle = chipBgG;
  rrect(ctx, chipX, CHIP_Y, chipW, chipH, 29); ctx.fill();
  ctx.shadowBlur = 0;
  // Border
  ctx.strokeStyle = unit.glow.replace("0.5","0.65");
  ctx.lineWidth = 1.5;
  rrect(ctx, chipX, CHIP_Y, chipW, chipH, 29); ctx.stroke();
  // Dot indicator
  ctx.fillStyle = unit.accent;
  ctx.shadowColor = unit.glow; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(chipX + 26, CHIP_Y + chipH/2, 7, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  // Unit text
  ctx.fillStyle = unit.accent;
  ctx.textAlign = "center";
  ctx.fillText(chipText, CW/2 + 8, CHIP_Y + chipH/2 + 9);

  // ── NAME ──────────────────────────────────────────────────────────────────────
  const CHIP_BOT = CHIP_Y + chipH;
  const GAP_CHIP_NAME = 44;
  const GAP_NAME_POS  = 38;
  const NAME_BUDGET_H = CONTENT_H - chipH - GAP_CHIP_NAME - GAP_NAME_POS - 32;

  const nameMaxW = CW - 72;
  let nfs = 76;
  while (nfs > 28) {
    ctx.font = `900 ${nfs}px Georgia, serif`;
    const nl = wrapText(ctx, delegate.name, nameMaxW);
    if (nl.length <= 2 && nl.length * (nfs + 12) <= NAME_BUDGET_H) break;
    nfs -= 4;
  }
  const NLH = nfs + 12;
  const nameLines = wrapText(ctx, delegate.name, nameMaxW);
  const NAME_START = CHIP_BOT + GAP_CHIP_NAME;

  ctx.fillStyle = CREAM; ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.65)"; ctx.shadowBlur = 16;
  nameLines.forEach((l, i) => ctx.fillText(l, CW/2, NAME_START + (i+1) * NLH));
  ctx.shadowBlur = 0;
  const NAME_BOT = NAME_START + nameLines.length * NLH;

  // Decorative line under name
  const lineG = ctx.createLinearGradient(80, NAME_BOT + 14, CW - 80, NAME_BOT + 14);
  lineG.addColorStop(0, "rgba(255,255,255,0)");
  lineG.addColorStop(0.5, unit.glow.replace("0.5","0.4"));
  lineG.addColorStop(1, "rgba(255,255,255,0)");
  ctx.strokeStyle = lineG; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, NAME_BOT + 14); ctx.lineTo(CW-80, NAME_BOT + 14); ctx.stroke();

  // ── TICKET ID ────────────────────────────────────────────────────────────────
  ctx.font = "600 16px monospace, Arial, sans-serif";
  ctx.fillStyle = "rgba(232,184,75,0.55)";
  ctx.textAlign = "center";
  ctx.fillText(delegate.id, CW/2, ID_Y);

  // ── QR CODE ───────────────────────────────────────────────────────────────────
  const qrURL = delegate.qrURL || `${REG_SITE}?checkin=${delegate.id}`;
  const qrImg = await generateQRImage(qrURL, 220, NAVY);
  if (qrImg) {
    // QR card with unit-tinted border
    ctx.shadowColor = unit.glow.replace("0.5","0.35"); ctx.shadowBlur = 16;
    ctx.fillStyle = "#ffffff";
    rrect(ctx, QR_X, QR_Y, QR_CARD_W, QR_CARD_H, 12); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = unit.glow.replace("0.5","0.45"); ctx.lineWidth = 2;
    rrect(ctx, QR_X, QR_Y, QR_CARD_W, QR_CARD_H, 12); ctx.stroke();
    ctx.drawImage(qrImg, QR_X + QR_PAD, QR_Y + QR_PAD, QR_SIZE, QR_SIZE);
  }

  return canvas;
}

// ─── DETERMINE IF VOLUNTEER ───────────────────────────────────────────────────
function isVolunteer(delegate) {
  return (
    delegate.badge === "VOLUNTEER" ||
    delegate.delegateType === "volunteer" ||
    (delegate.position || "").toLowerCase().includes("volunteer") ||
    (delegate.position || "").toLowerCase().includes("ushering") ||
    (delegate.position || "").toLowerCase().includes("logistics") ||
    (delegate.position || "").toLowerCase().includes("registration") ||
    (delegate.position || "").toLowerCase().includes("team tech") ||
    (delegate.position || "").toLowerCase().includes("anchors") ||
    (delegate.position || "").toLowerCase().includes("welfare unit") ||
    (delegate.level || "").toLowerCase() === "volunteer"
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #060d1a; --navy2: #0d1e38; --navy3: #1a3a6b;
    --gold: #c9920a; --gold2: #e8b84b; --gold3: #f5d57a;
    --green: #39e07a;
    --cream: #f5f0e8;
    --border: rgba(26,58,107,0.4);
    --border-gold: rgba(201,146,10,0.28);
    --glass: rgba(26,58,107,0.12);
  }

  html, body { min-height: 100vh; overflow-x: hidden; }

  body {
    background:
      radial-gradient(ellipse 90% 55% at 50% -8%, rgba(26,58,107,0.42) 0%, transparent 58%),
      radial-gradient(ellipse 55% 40% at 88% 72%, rgba(201,146,10,0.06) 0%, transparent 52%),
      radial-gradient(ellipse 45% 30% at 8% 80%, rgba(57,224,122,0.04) 0%, transparent 50%),
      #060d1a;
    color: var(--cream);
    font-family: 'Inter', sans-serif;
  }

  /* Noise grain overlay */
  body::after {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.22;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  }

  .page { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; }

  /* ── KEYFRAMES ── */
  @keyframes fadeUp    { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp   { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0.3} }
  @keyframes spinRing  { to { transform: rotate(360deg); } }
  @keyframes shimmerBg { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(201,146,10,0)} 50%{box-shadow:0 0 28px 4px rgba(201,146,10,0.28)} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes cardFloat { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(0.5deg)} }
  @keyframes glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }

  /* ── HEADER ── */
  .hdr {
    padding: 14px 24px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--border);
    background: rgba(6,13,26,0.92);
    backdrop-filter: blur(24px) saturate(180%);
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 1px 0 rgba(26,58,107,0.3), 0 4px 20px rgba(0,0,0,0.3);
    animation: fadeIn 0.5s ease both;
  }
  .hdr-brand { display: flex; align-items: center; gap: 12px; }
  .hdr-logo {
    width: 44px; height: 44px; border-radius: 50%;
    border: 2px solid var(--gold2); object-fit: cover;
    box-shadow: 0 0 14px rgba(201,146,10,0.3);
    transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s;
  }
  .hdr-logo:hover { transform: scale(1.1) rotate(-6deg); box-shadow: 0 0 26px rgba(201,146,10,0.55); }
  .hdr-title { font-family: 'Bebas Neue', sans-serif; font-size: 17px; color: var(--gold2); line-height: 1; letter-spacing: 0.1em; }
  .hdr-sub { font-size: 9px; color: rgba(245,240,232,0.35); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; }
  .hdr-nav { display: flex; gap: 8px; align-items: center; }

  .hdr-reg {
    font-size: 11px; font-weight: 600; color: #fff; text-decoration: none;
    background: linear-gradient(135deg, var(--gold), var(--navy3));
    padding: 7px 16px; border-radius: 7px; letter-spacing: 0.06em;
    box-shadow: 0 2px 12px rgba(201,146,10,0.22);
    transition: all 0.3s cubic-bezier(0.34,1.1,0.64,1);
    position: relative; overflow: hidden;
  }
  .hdr-reg::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s;
  }
  .hdr-reg:hover::before { transform: translateX(100%); }
  .hdr-reg:hover { box-shadow: 0 8px 28px rgba(201,146,10,0.45); transform: translateY(-2px) scale(1.02); }

  .hdr-reg-sec {
    font-size: 11px; font-weight: 600; text-decoration: none;
    border: 1px solid rgba(201,146,10,0.38); color: var(--gold2);
    padding: 6px 14px; border-radius: 7px;
    transition: all 0.3s; background: transparent;
    position: relative; overflow: hidden;
  }
  .hdr-reg-sec::before {
    content: ''; position: absolute; inset: 0; background: rgba(201,146,10,0.1);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.3s;
  }
  .hdr-reg-sec:hover::before { transform: scaleX(1); }
  .hdr-reg-sec:hover { border-color: var(--gold2); color: var(--gold2); transform: translateY(-1px); }

  /* ── HERO ── */
  .hero {
    padding: 64px 24px 44px;
    text-align: center; max-width: 720px; margin: 0 auto;
    animation: slideUp 0.6s cubic-bezier(0.34,1.1,0.64,1) both;
  }

  .badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 18px; border: 1px solid var(--border); border-radius: 100px;
    font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase;
    color: var(--gold2); background: rgba(201,146,10,0.07); margin-bottom: 28px;
    animation: pulseGlow 4s infinite;
    position: relative; overflow: hidden;
  }
  .badge::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(201,146,10,0.15), transparent);
    animation: shimmerBg 3s linear infinite;
  }
  .badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--gold2); animation: blink 2s infinite; flex-shrink:0; }

  .hero h1 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(44px, 9.5vw, 88px);
    line-height: 0.93; letter-spacing: 0.04em; margin-bottom: 18px;
    background: linear-gradient(135deg, #f5d57a 0%, #e8b84b 50%, #ffffff 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: fadeUp 0.7s 0.1s cubic-bezier(0.34,1.1,0.64,1) both;
  }
  .hero p { 
    font-size: clamp(13px,2vw,16px); 
    color: rgba(245,240,232,0.45); 
    line-height: 1.75; 
    max-width: 480px; 
    margin: 0 auto 40px;
    animation: fadeUp 0.7s 0.2s cubic-bezier(0.34,1.1,0.64,1) both;
  }

  /* ── STEPS ── */
  .steps { 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    gap: 8px; 
    margin-bottom: 48px; 
    flex-wrap: wrap;
    animation: fadeUp 0.7s 0.3s cubic-bezier(0.34,1.1,0.64,1) both;
  }
  .step { display: flex; align-items: center; gap: 8px; }
  .step-n {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1.5px solid var(--border-gold);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: var(--gold2); flex-shrink: 0;
    transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
  }
  .step.active .step-n { 
    background: var(--gold); 
    color: #fff; 
    border-color: var(--gold); 
    box-shadow: 0 0 14px rgba(201,146,10,0.5), 0 0 0 4px rgba(201,146,10,0.12); 
    transform: scale(1.15); 
  }
  .step.done .step-n { 
    background: var(--green); 
    color: #060d1a; 
    border-color: var(--green); 
    font-size: 13px;
    animation: pulseGlow 2s infinite;
  }
  .step-lbl { font-size: 11px; color: rgba(245,240,232,0.32); font-weight: 500; transition: color 0.3s; }
  .step.active .step-lbl, .step.done .step-lbl { color: rgba(245,240,232,0.82); }
  .step-line { width: 28px; height: 1px; background: rgba(26,58,107,0.4); }

  /* ── MAIN ── */
  .main { flex: 1; max-width: 980px; margin: 0 auto; padding: 0 24px 88px; width: 100%; }

  /* ── PANELS ── */
  .panel {
    background: rgba(7,13,26,0.8);
    border: 1px solid var(--border);
    border-radius: 18px; overflow: hidden; margin-bottom: 20px;
    box-shadow: 0 4px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(26,58,107,0.18);
    transition: all 0.4s cubic-bezier(0.34,1.1,0.64,1);
    animation: fadeUp 0.5s cubic-bezier(0.34,1.1,0.64,1) both;
  }
  .panel:hover { 
    transform: translateY(-2px); 
    box-shadow: 0 12px 42px rgba(0,0,0,0.55), inset 0 1px 0 rgba(26,58,107,0.25), 0 0 30px rgba(201,146,10,0.08); 
    border-color: rgba(201,146,10,0.25);
  }

  .phead {
    background: linear-gradient(135deg, rgba(7,13,26,0.99), rgba(15,32,60,0.92));
    border-bottom: 1px solid var(--border);
    padding: 18px 26px; display: flex; align-items: center; gap: 14px;
  }
  .picon {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(26,58,107,0.22); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
    transition: all 0.3s cubic-bezier(0.34,1.1,0.64,1);
  }
  .panel:hover .picon {
    background: rgba(201,146,10,0.15);
    border-color: rgba(201,146,10,0.4);
    transform: scale(1.05);
  }
  .ptitle { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: var(--gold2); letter-spacing: 0.05em; }
  .pdesc { font-size: 11px; color: rgba(245,240,232,0.35); margin-top: 3px; }
  .pbody { padding: 26px; }

  .vol-notice { 
    background: rgba(57,224,122,0.07); 
    border: 1px solid rgba(57,224,122,0.28); 
    border-radius: 11px; 
    padding: 13px 17px; 
    margin-bottom: 20px; 
    font-size: 12px; 
    color: #39e07a; 
    line-height: 1.65;
    animation: fadeUp 0.4s ease both;
  }

  /* ── TICKET INPUT ── */
  .tick-row { display: flex; gap: 10px; }
  .tick-in {
    flex: 1; padding: 14px 16px;
    background: rgba(26,58,107,0.09); border: 1.5px solid var(--border);
    border-radius: 10px; color: var(--cream);
    font-family: 'Inter', sans-serif; font-size: 14px;
    letter-spacing: 0.07em; outline: none;
    transition: all 0.3s cubic-bezier(0.34,1.1,0.64,1);
    text-transform: uppercase;
  }
  .tick-in:focus { 
    border-color: var(--gold2); 
    box-shadow: 0 0 0 3px rgba(201,146,10,0.15), 0 0 20px rgba(201,146,10,0.1); 
    background: rgba(26,58,107,0.12);
  }
  .tick-in::placeholder { text-transform: none; color: rgba(245,240,232,0.2); letter-spacing: 0; }

  .btn-fetch {
    padding: 14px 22px;
    background: linear-gradient(135deg, var(--gold), var(--navy3));
    border: none; border-radius: 10px; color: #fff;
    font-family: 'Cinzel', serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.07em; cursor: pointer; white-space: nowrap;
    box-shadow: 0 2px 16px rgba(201,146,10,0.26);
    transition: all 0.3s cubic-bezier(0.34,1.1,0.64,1);
    position: relative; overflow: hidden;
  }
  .btn-fetch::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s;
  }
  .btn-fetch:hover::before { transform: translateX(100%); }
  .btn-fetch:hover { box-shadow: 0 8px 28px rgba(201,146,10,0.42); transform: translateY(-2px) scale(1.02); }
  .btn-fetch:active { transform: scale(0.96); }
  .btn-fetch:disabled { opacity: .38; cursor: not-allowed; transform: none; }
  .btn-fetch:disabled::before { display: none; }

  /* ── DELEGATE CARD ── */
  .del-card {
    display: flex; align-items: center; gap: 14px; padding: 16px;
    background: rgba(26,58,107,0.12); border: 1px solid rgba(26,58,107,0.45);
    border-radius: 12px; margin-top: 16px;
    animation: fadeUp 0.4s cubic-bezier(0.34,1.1,0.64,1) both;
    transition: all 0.3s cubic-bezier(0.34,1.1,0.64,1);
  }
  .del-card:hover { 
    border-color: rgba(201,146,10,0.35); 
    background: rgba(26,58,107,0.18);
    transform: translateX(4px);
  }
  .del-av { 
    width: 42px; height: 42px; border-radius: 50%; 
    background: rgba(26,58,107,0.18); 
    border: 1.5px solid var(--gold2); 
    display: flex; align-items: center; justify-content: center; 
    font-size: 17px; flex-shrink: 0;
    transition: all 0.3s;
  }
  .del-card:hover .del-av {
    background: rgba(201,146,10,0.15);
    transform: scale(1.08);
  }
  .del-name { font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700; color: var(--cream); margin-bottom: 3px; }
  .del-meta { font-size: 11px; color: rgba(245,240,232,0.42); }
  .del-id { margin-left: auto; font-family: monospace; font-size: 11px; color: var(--gold2); letter-spacing: .09em; flex-shrink: 0; }
  .del-badge { 
    display: inline-block; 
    font-size: 9px; font-weight: 700; letter-spacing: 0.1em; 
    text-transform: uppercase; padding: 2px 8px; border-radius: 4px; margin-top: 5px;
    transition: all 0.3s;
  }

  .err { 
    margin-top: 13px; padding: 12px 16px; 
    background: rgba(192,57,43,.09); border: 1px solid rgba(192,57,43,.32); 
    border-radius: 9px; color: #e74c3c; font-size: 12px; 
    animation: fadeUp 0.3s ease both;
  }

  /* ── MODE TOGGLE ── */
  .mode-toggle { 
    display: flex; 
    border: 1px solid var(--border); 
    border-radius: 10px; 
    overflow: hidden; 
    margin-bottom: 20px;
    background: rgba(6,13,26,0.5);
  }
  .mode-btn { 
    flex: 1; padding: 12px; border: none; cursor: pointer; 
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; 
    transition: all 0.3s cubic-bezier(0.34,1.1,0.64,1); 
    background: transparent; color: rgba(245,240,232,0.32); 
    letter-spacing: 0.04em;
    position: relative; overflow: hidden;
  }
  .mode-btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    transform: translateX(-100%);
    transition: transform 0.4s;
  }
  .mode-btn:hover::before { transform: translateX(100%); }
  .mode-btn:hover { color: rgba(245,240,232,0.6); }
  .mode-btn.dk { 
    background: var(--navy2); 
    color: var(--gold2); 
    border-bottom: 2px solid var(--gold2);
    box-shadow: inset 0 -4px 12px rgba(201,146,10,0.1);
  }
  .mode-btn.lt { 
    background: #f5f0e8; 
    color: #06100f; 
    border-bottom: 2px solid #06100f;
    box-shadow: inset 0 -4px 12px rgba(0,0,0,0.08);
  }

  /* ── UPLOAD ── */
  .upload-zone {
    border: 1.5px dashed rgba(26,58,107,0.48); border-radius: 14px;
    padding: 36px 24px; text-align: center; cursor: pointer;
    transition: all 0.4s cubic-bezier(0.34,1.1,0.64,1);
    background: var(--glass);
    position: relative; overflow: hidden;
  }
  .upload-zone::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at center, rgba(201,146,10,0.08) 0%, transparent 70%);
    opacity: 0; transition: opacity 0.4s;
  }
  .upload-zone:hover::before, .upload-zone.drag::before { opacity: 1; }
  .upload-zone:hover, .upload-zone.drag {
    border-color: var(--gold2); 
    background: rgba(201,146,10,0.08);
    box-shadow: 0 0 30px rgba(201,146,10,0.15); 
    transform: scale(1.01);
  }
  .up-icon { 
    font-size: 36px; margin-bottom: 12px; 
    animation: float 3s ease-in-out infinite;
    display: inline-block;
  }
  .up-title { font-family: 'Cinzel', serif; font-size: 14px; font-weight: 700; color: var(--gold2); margin-bottom: 5px; }
  .up-sub { font-size: 11px; color: rgba(245,240,232,0.32); }
  .photo-row { display: flex; align-items: center; gap: 18px; }
  .photo-row img { 
    width: 106px; height: 106px; object-fit: cover; 
    border-radius: 12px; border: 2px solid var(--gold2); 
    display: block; flex-shrink: 0; 
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    transition: all 0.4s cubic-bezier(0.34,1.1,0.64,1);
  }
  .photo-row img:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 28px rgba(201,146,10,0.25);
  }
  .photo-rm { 
    padding: 7px 14px; background: rgba(192,57,43,0.88); 
    border: none; color: #fff; border-radius: 7px; 
    font-size: 11px; cursor: pointer; font-weight: 600; 
    transition: all 0.3s cubic-bezier(0.34,1.1,0.64,1);
  }
  .photo-rm:hover { background: #c0392b; transform: scale(1.05); box-shadow: 0 4px 16px rgba(192,57,43,0.35); }
  .photo-info { font-size: 12px; color: rgba(245,240,232,0.42); line-height: 1.7; }

  /* ── GENERATE BUTTON ── */
  .btn-gen {
    width: 100%; padding: 16px; margin-top: 20px;
    background: linear-gradient(135deg, var(--gold) 0%, #1a3a6b 120%);
    border: none; border-radius: 13px; color: #fff;
    font-family: 'Bebas Neue', sans-serif; font-size: 20px;
    letter-spacing: 0.14em; cursor: pointer;
    box-shadow: 0 6px 28px rgba(201,146,10,0.3);
    transition: all 0.4s cubic-bezier(0.34,1.1,0.64,1);
    position: relative; overflow: hidden;
  }
  .btn-gen::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmerBg 2.4s linear infinite;
  }
  .btn-gen::before {
    content: ''; position: absolute; inset: -2px;
    background: linear-gradient(135deg, var(--gold2), var(--green), var(--gold2));
    border-radius: 15px; z-index: -1;
    opacity: 0; transition: opacity 0.4s;
    filter: blur(8px);
  }
  .btn-gen:hover { 
    transform: translateY(-3px); 
    box-shadow: 0 16px 48px rgba(201,146,10,0.45); 
  }
  .btn-gen:hover::before { opacity: 0.6; }
  .btn-gen:active { transform: scale(0.97); }
  .btn-gen:disabled { opacity: .35; cursor: not-allowed; transform: none; }
  .btn-gen:disabled::after, .btn-gen:disabled::before { display: none; }

  /* ── PREVIEW ── */
  .preview { text-align: center; animation: slideUp 0.5s cubic-bezier(0.34,1.1,0.64,1) both; }
  .preview-lbl {
    font-family: 'Bebas Neue', sans-serif; font-size: 16px;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--gold2); margin-bottom: 24px;
    animation: glowPulse 3s ease-in-out infinite;
  }

  .card-wrap {
    display: inline-block; max-width: 340px; width: 100%;
    border-radius: 20px; overflow: hidden;
    box-shadow:
      0 28px 72px rgba(0,0,0,0.72),
      0 0 0 1px rgba(201,146,10,0.22),
      0 0 50px rgba(26,58,107,0.18);
    transition: all 0.5s cubic-bezier(0.34,1.1,0.64,1);
    animation: popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .card-wrap:hover { 
    transform: scale(1.03) translateY(-6px); 
    box-shadow: 0 42px 96px rgba(0,0,0,0.85), 0 0 0 1px rgba(201,146,10,0.4), 0 0 70px rgba(26,58,107,0.28); 
  }
  .card-wrap.vol { max-width: 210px; border-radius: 14px; }
  .card-wrap img { width: 100%; display: block; }

  /* ── ACTION BUTTONS ── */
  .act-row { display: flex; gap: 10px; margin-top: 22px; justify-content: center; flex-wrap: wrap; }

  .btn-share {
    padding: 13px 24px;
    background: linear-gradient(135deg, #1a5c35, var(--green));
    border: none; border-radius: 10px; color: #060d1a;
    font-family: 'Bebas Neue', sans-serif; font-size: 16px;
    letter-spacing: 0.11em; cursor: pointer;
    box-shadow: 0 3px 18px rgba(57,224,122,0.28);
    transition: all 0.4s cubic-bezier(0.34,1.1,0.64,1);
    position: relative; overflow: hidden;
  }
  .btn-share::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s;
  }
  .btn-share:hover::before { transform: translateX(100%); }
  .btn-share:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 10px 32px rgba(57,224,122,0.45); }

  .btn-dl {
    padding: 13px 24px;
    background: linear-gradient(135deg, var(--gold), #1a3a6b);
    border: none; border-radius: 10px; color: #fff;
    font-family: 'Bebas Neue', sans-serif; font-size: 16px;
    letter-spacing: 0.11em; cursor: pointer;
    box-shadow: 0 3px 18px rgba(201,146,10,0.28);
    transition: all 0.4s cubic-bezier(0.34,1.1,0.64,1);
    position: relative; overflow: hidden;
  }
  .btn-dl::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s;
  }
  .btn-dl:hover::before { transform: translateX(100%); }
  .btn-dl:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 10px 32px rgba(201,146,10,0.45); }

  .btn-sec {
    padding: 13px 20px; background: transparent;
    border: 1px solid var(--border); border-radius: 10px;
    color: rgba(245,240,232,0.45);
    font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34,1.1,0.64,1);
    position: relative; overflow: hidden;
  }
  .btn-sec::before {
    content: ''; position: absolute; inset: 0;
    background: rgba(201,146,10,0.08);
    transform: scaleX(0); transform-origin: left;
    transition: transform 0.3s;
  }
  .btn-sec:hover::before { transform: scaleX(1); }
  .btn-sec:hover { border-color: var(--gold2); color: var(--gold2); transform: translateY(-1px); }

  /* ── CAPTION BOX ── */
  .cap-box {
    margin: 22px auto 0; padding: 18px 22px;
    background: rgba(7,13,26,0.72); border: 1px solid var(--border);
    border-radius: 14px; max-width: 400px; text-align: left;
    animation: fadeUp 0.4s 0.1s ease both;
    transition: all 0.3s;
  }
  .cap-box:hover {
    border-color: rgba(201,146,10,0.25);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  .cap-lbl { font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold2); font-weight: 700; margin-bottom: 9px; font-family: 'Inter', sans-serif; }
  .cap-txt { font-size: 12px; color: rgba(245,240,232,0.58); line-height: 1.7; user-select: all; white-space: pre-line; }

  .btn-copy {
    margin-top: 12px; padding: 8px 18px;
    background: rgba(26,58,107,0.18); border: 1px solid var(--border);
    border-radius: 7px; color: var(--gold2); font-size: 11px; font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.34,1.1,0.64,1);
  }
  .btn-copy:hover { background: rgba(201,146,10,0.15); border-color: var(--gold2); transform: scale(1.03); }

  /* ── FOOTER DOTS ── */
  .footer-dots { display: flex; justify-content: center; gap: 5px; padding: 24px 0 0; }
  .footer-dots span { 
    width: 4px; height: 4px; border-radius: 50%; 
    background: rgba(26,58,107,0.4); 
    display: block; 
    transition: all 0.4s;
    animation: blink 3s ease-in-out infinite;
  }
  .footer-dots span:nth-child(3n) { background: rgba(201,146,10,0.48); animation-delay: 0.5s; }
  .footer-dots span:nth-child(5n) { background: rgba(57,224,122,0.28); animation-delay: 1s; }

  @keyframes popIn { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }

  /* ── RESPONSIVE ── */
  @media (max-width: 640px) {
    .hdr { padding: 12px 16px; }
    .hdr-title { font-size: 14px; }
    .hdr-sub { font-size: 8px; }
    .hdr-logo { width: 38px; height: 38px; }
    
    .hero { padding: 40px 16px 32px; }
    .hero h1 { font-size: clamp(36px, 12vw, 56px); }
    
    .steps { gap: 6px; }
    .step-lbl { display: none; }
    .step-line { width: 16px; }
    
    .main { padding: 0 16px 60px; }
    
    .phead { padding: 14px 18px; }
    .pbody { padding: 18px; }
    
    .tick-row { flex-direction: column; }
    .btn-fetch { width: 100%; }
    
    .del-id { display: none; }
    
    .card-wrap { max-width: 100%; }
    .card-wrap.vol { max-width: 180px; }
    
    .act-row { flex-direction: column; }
    .act-row button { width: 100%; }
  }

  @media (max-width: 480px) {
    .hdr-reg-sec { display: none; }
    .badge { font-size: 9px; padding: 5px 12px; }
    .up-title { font-size: 13px; }
    .btn-gen { font-size: 18px; }
  }

  @media (min-width: 1200px) {
    .main { max-width: 1100px; }
    .card-wrap { max-width: 400px; }
    .card-wrap.vol { max-width: 240px; }
  }
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pre = params.get("prefill");
    if (pre) setTicketId(pre.toUpperCase());
  }, []);

  const step = !delegate ? 1 : !cardUrl ? 2 : 3;
  const vol  = delegate && isVolunteer(delegate);

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

  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
    const cleanup = () => { try { document.body.removeChild(input); } catch {} };
    input.onchange = e => { const f = e.target.files?.[0]; if (f) handlePhoto(f); cleanup(); };
    input.addEventListener("cancel", cleanup);
    setTimeout(cleanup, 300000);
    document.body.appendChild(input); input.click();
  };

  const handleGenerate = async () => {
    if (!delegate) return;
    setGenerating(true);
    try {
      const canvas = vol
        ? await renderVolunteerTag(delegate)
        : await renderAttendeeCard(delegate, photo, cardMode);
      setCardUrl(canvas.toDataURL("image/jpeg", 0.93));
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = cardUrl;
    a.download = `RUNSA-Summit-${delegate.name.split(" ")[0]}-${vol ? "tag" : cardMode}.jpg`;
    a.click();
  };

  const caption = delegate
    ? `🏛️ I'm attending the RUNSA Legislative Summit 2026!\n\n"The Catalyst of Transformation: Legislating the Future for Democratic Leadership"\n\n📍 @ Redeemer's University, Ede\n🗓️ 29th April, 2026\n\n✅ Register. Save your ticket. Create your Attendee Card.\n🎫 ${REG_SITE}\n\n#RUNSASummit2026 #LegislativeCouncil #RUNSA #RUN`
    : "";

  const handleShare = async () => {
    if (!cardUrl) return;
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], `RUNSA-Summit-${delegate.name.split(" ")[0]}.jpg`, { type: "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "RUNSA Legislative Summit 2026", text: caption });
      } else if (navigator.share) {
        await navigator.share({ title: "RUNSA Legislative Summit 2026", text: caption, url: REG_SITE });
      } else {
        await navigator.clipboard.writeText(caption);
        handleDownload();
        alert("Caption copied! Image downloaded — paste caption when sharing.");
      }
    } catch (e) { if (e.name !== "AbortError") console.error("Share failed:", e); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(caption).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };

  const BadgeDisplay = ({ badge }) => {
    const b = badge ? getBadgeInfo(badge) : null;
    if (!b) return null;
    return (
      <span className="del-badge" style={{ background: b.bg, color: b.textColor, border: `1px solid ${b.glow.replace("0.5","0.4")}` }}>
        {b.label}
      </span>
    );
  };

  const steps = [{ n:1, label:"Verify Ticket" }, { n:2, label:"Customise" }, { n:3, label:"Download & Share" }];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="page">

        <header className="hdr">
          <div className="hdr-brand">
            <img src="/legislative-council-logo.jpg" alt="" className="hdr-logo" onError={e => e.target.style.display="none"} />
            <div>
              <div className="hdr-title">Redeemer's University Students' Association · Legislative Council</div>
              <div className="hdr-sub">Summit Card Generator</div>
            </div>
          </div>
          <div className="hdr-nav">
            <a href={REG_SITE} className="hdr-reg-sec">← Register</a>
            <a href={REG_SITE} className="hdr-reg">Register →</a>
          </div>
        </header>

        <div className="hero">
          <div className="badge">Summit 2026 · Card Generator</div>
          <h1>Your Card.<br />Your Moment.</h1>
          <p>Generate your personal attendee card for the RUNSA Legislative Summit 2026. Share it. Announce your presence. Drive the hype.</p>
          <div className="steps">
            {steps.map((s, i) => (
              <div key={s.n} style={{ display:"flex", alignItems:"center", gap:8 }}>
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

          {/* Step 1 */}
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
                  <button className="btn-fetch" onClick={handleFetch} disabled={fetching || !ticketId.trim()}>
                    {fetching ? "Checking…" : "Verify →"}
                  </button>
                </div>
                {fetchErr && <div className="err">❌ {fetchErr}</div>}
                {delegate && (
                  <div className="del-card">
                    <div className="del-av">🎓</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="del-name">{delegate.name}</div>
                      <div className="del-meta">{delegate.position}{delegate.institution ? ` · ${delegate.institution}` : ""}</div>
                      {delegate.badge && <BadgeDisplay badge={delegate.badge} />}
                      {vol && <div style={{ fontSize:10, color:"#39e07a", marginTop:4 }}>✅ Volunteer tag format — unit colour theme applied</div>}
                    </div>
                    <div className="del-id">{delegate.id}</div>
                  </div>
                )}
                <div style={{ marginTop:18, textAlign:"center" }}>
                  <span style={{ fontSize:11, color:"rgba(245,240,232,0.32)" }}>Haven't registered yet? </span>
                  <a href={REG_SITE} style={{ fontSize:11, color:"var(--gold2)", textDecoration:"none", fontWeight:600 }}>Register here →</a>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {delegate && !cardUrl && (
            <div className="panel" style={{ animation:"fadeUp 0.5s 0.05s cubic-bezier(0.34,1.1,0.64,1) both" }}>
              <div className="phead">
                <div className="picon">🎨</div>
                <div>
                  <div className="ptitle">Step 2 — Customise Your Card</div>
                  <div className="pdesc">{vol ? "Volunteer tag — unit colour theme auto-applied, just generate" : "Pick your style and upload your photo"}</div>
                </div>
              </div>
              <div className="pbody">
                {vol ? (
                  <div className="vol-notice">
                    🏷️ As a <strong>Volunteer</strong>, you get a <strong>lanyard tag</strong> with your unit's unique colour theme. Perfect for standard ID card holders. Just tap Generate!
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize:12, color:"rgba(245,240,232,.48)", marginBottom:12 }}>Card Style</p>
                    <div className="mode-toggle">
                      <button className={`mode-btn ${cardMode === "dark" ? "dk" : ""}`} onClick={() => setCardMode("dark")}>🌙 Dark Mode</button>
                      <button className={`mode-btn ${cardMode === "light" ? "lt" : ""}`} onClick={() => setCardMode("light")}>☀️ Light Mode</button>
                    </div>
                    <p style={{ fontSize:12, color:"rgba(245,240,232,.48)", marginBottom:12, marginTop:22 }}>
                      Your Photo <span style={{ color:"rgba(245,240,232,.28)" }}>(Recommended for best results)</span>
                    </p>
                    {!photo ? (
                      <div className={`upload-zone ${drag ? "drag" : ""}`}
                        onDragOver={e => { e.preventDefault(); setDrag(true); }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={e => { e.preventDefault(); setDrag(false); handlePhoto(e.dataTransfer.files[0]); }}
                        onClick={openFilePicker}>
                        <div className="up-icon">📷</div>
                        <div className="up-title">Tap or drop your photo</div>
                        <div className="up-sub">JPG or PNG · Front-facing photo works best</div>
                      </div>
                    ) : (
                      <div className="photo-row">
                        <img src={photo} alt="Preview" />
                        <div>
                          <div className="photo-info" style={{ marginBottom:12 }}>✅ Photo ready!<br /><span style={{ fontSize:11, color:"rgba(245,240,232,.28)" }}>Remove and re-upload to change it.</span></div>
                          <button className="photo-rm" onClick={() => setPhoto(null)}>✕ Remove</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <button className="btn-gen" onClick={handleGenerate} disabled={generating}>
                  {generating ? "✨ Generating your card…" : vol ? "🏷️ Generate My Volunteer Tag →" : "✨ Generate My Card →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {cardUrl && (
            <div className="preview">
              <div className="preview-lbl">{vol ? "✦ Your Volunteer Tag ✦" : "✦ Your Attendee Card ✦"}</div>
              <div className={`card-wrap${vol ? " vol" : ""}`}>
                <img src={cardUrl} alt={vol ? "Your volunteer tag" : "Your summit card"} />
              </div>
              {vol && (
                <p style={{ fontSize:11, color:"rgba(245,240,232,0.35)", marginTop:14, lineHeight:1.65 }}>
                  Print at ID card size (54×86mm) and slide into a standard neck lanyard holder.
                </p>
              )}
              <div className="act-row">
                <button className="btn-share" onClick={handleShare}>📤 Share</button>
                <button className="btn-dl" onClick={handleDownload}>⬇ Download</button>
                {!vol && (
                  <button className="btn-sec" onClick={() => { setCardMode(m => m === "dark" ? "light" : "dark"); setCardUrl(null); }}>
                    {cardMode === "dark" ? "☀️ Light" : "🌙 Dark"}
                  </button>
                )}
                <button className="btn-sec" onClick={() => { setCardUrl(null); setPhoto(null); setDelegate(null); setTicketId(""); }}>↺ Start Over</button>
              </div>
              {!vol && (
                <div className="cap-box">
                  <div className="cap-lbl">📋 Copy This Caption</div>
                  <div className="cap-txt">{caption}</div>
                  <button className="btn-copy" onClick={handleCopy}>{copied ? "✓ Copied!" : "Copy Caption"}</button>
                </div>
              )}
            </div>
          )}

        </div>

        <div className="footer-dots">{Array.from({length:22}).map((_,i) => <span key={i} />)}</div>
      </div>
    </>
  );
}
