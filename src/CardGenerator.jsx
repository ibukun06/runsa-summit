import React, { useState, useEffect, useRef } from "react";

// ─── CONFIGURATION & ASSETS ───────────────────────────────────────────────────
const REG_SITE = "https://legislative-summit-registration.vercel.app";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3SqUXGR0kqPCpG88BFRB9qUMAk08x_6Q",
  authDomain: "runsa-summit.firebaseapp.com",
  projectId: "runsa-summit",
};
const COLLECTION = "delegates";

// Canvas Export Dimensions
const ATT_W = 1080;
const ATT_H = 1350;

// Event Details
const EVENT_DATE = "APRIL 29, 2026 | 10:00 AM";
const EVENT_VENUE = "BOO AUDITORIUM, REDEEMER'S UNIVERSITY";

// ⚠️ PASTE YOUR LOGO URLS HERE ⚠️
// You can use standard URLs (e.g., "https://yoursite.com/runsa-logo.png") 
// or base64 strings. I've provided crisp SVG shields as default placeholders.
const LOGO_1_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAgMTBMMTAgMzB2MzBjMCAyNSAzMCAzNSA0MCA0MCAxMC01IDQwLTE1IDQwLTQwdjMwbC00MC0yMHoiIGZpbGw9IiMxZTNhOGEiLz48cGF0aCBkPSJNNTAgMTB2OTBjMTAtNSA0MC0xNSA0MC00MHYtMzBsLTQwLTIweiIgZmlsbD0iIzI1NjNlYiIvPjwvc3ZnPg=="; 
const LOGO_2_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAgMTBMMTAgMzB2MzBjMCAyNSAzMCAzNSA0MCA0MCAxMC01IDQwLTE1IDQwLTQwdjMwbC00MC0yMHoiIGZpbGw9IiMwNjVmNDYiLz48cGF0aCBkPSJNNTAgMTB2OTBjMTAtNSA0MC0xNSA0MC00MHYtMzBsLTQwLTIweiIgZmlsbD0iIzEwYjk4MSIvPjwvc3ZnPg==";

// ─── THEMATIC PALETTES ────────────────────────────────────────────────────────
const PALETTES = {
  dark: {
    bgTop: "#121b36",
    bgBottom: "#0a1128",
    textMain: "#ffffff",
    textSub: "#94a3b8",
    accentGreen: "#10b981", // Bright Neon Green
    accentGold: "#d4af37",
    grid: "rgba(16, 185, 129, 0.08)",
    badgeExternal: "#065f46",
    badgeExternalText: "#ffffff",
    qrBg: "#ffffff",
    qrDark: "#0a1128",
  },
  light: {
    bgTop: "#ffffff",
    bgBottom: "#f1f5f9",
    textMain: "#0f172a",
    textSub: "#475569",
    accentGreen: "#059669", // Deeper Green for contrast
    accentGold: "#b48811",
    grid: "rgba(15, 23, 42, 0.05)",
    badgeExternal: "#d1fae5",
    badgeExternalText: "#064e3b",
    qrBg: "#ffffff",
    qrDark: "#0f172a",
  }
};

// ─── EXTERNAL SCRIPT LOADER ───────────────────────────────────────────────────
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement("script");
    script.src = src; script.onload = resolve; script.onerror = reject;
    document.head.appendChild(script);
  });
};

// ─── HELPER: INFER DELEGATE TYPE ─────────────────────────────────────────────
const inferDelegateType = (position, institution, mode) => {
  const pos = (position || "").toLowerCase();
  const inst = (institution || "").toLowerCase();
  const isInternal = inst.includes("redeemer") || inst.includes("run");
  const colors = PALETTES[mode];

  if (pos.includes("speaker") || pos.includes("president") || pos.includes("chief whip") || pos.includes("clerk") || (pos.includes("senator") && isInternal)) {
    return { type: "RUNSA OFFICIAL", bg: colors.accentGold, text: "#000000" };
  }
  if (pos.includes("panelist") || pos.includes("honourable") || pos.includes("assembly")) {
    return { type: "DISTINGUISHED GUEST", bg: colors.accentGold, text: "#000000" };
  }
  if (pos.includes("usher") || pos.includes("protocol") || pos.includes("media") || pos.includes("logistics")) {
    return { type: "SUMMIT VOLUNTEER", bg: colors.accentGreen, text: "#ffffff" };
  }
  
  return { 
    type: isInternal ? "DELEGATE" : "EXTERNAL DELEGATE", 
    bg: colors.badgeExternal, 
    text: colors.badgeExternalText 
  };
};

// ─── IMAGE LOADER PROMISE ─────────────────────────────────────────────────────
const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

// ─── CANVAS RENDERING ENGINE ──────────────────────────────────────────────────
const generateCardCanvas = async (delegate, photoDataUrl, mode) => {
  const canvas = document.createElement("canvas");
  canvas.width = ATT_W; canvas.height = ATT_H;
  const ctx = canvas.getContext("2d");
  const colors = PALETTES[mode];

  // 1. Base Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, ATT_H);
  bgGrad.addColorStop(0, colors.bgTop);
  bgGrad.addColorStop(1, colors.bgBottom);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, ATT_W, ATT_H);

  // 2. Subtle Grid Overlay
  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.grid;
  for(let i=0; i<ATT_W; i+=80) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,ATT_H); ctx.stroke(); }
  for(let i=0; i<ATT_H; i+=80) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(ATT_W,i); ctx.stroke(); }

  // 3. Process Subject Photo
  const img = await loadImage(photoDataUrl);
  const photoAreaH = ATT_H * 0.65; // Photo takes top 65%
  let crop = { x: 0, y: 0, width: img.width, height: img.width * (photoAreaH / ATT_W) };

  try {
    if (window.smartcrop) {
      const result = await window.smartcrop.crop(img, { width: ATT_W, height: photoAreaH, minScale: 0.8 });
      crop = result.topCrop;
    }
  } catch (e) { console.warn("Smartcrop fallback."); }

  // 4. Off-screen Canvas for PERFECT Alpha Mask Blending
  // This ensures the image fades out smoothly without darkening the background
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = ATT_W; tempCanvas.height = photoAreaH;
  const tCtx = tempCanvas.getContext("2d");
  
  tCtx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, ATT_W, photoAreaH);
  tCtx.globalCompositeOperation = "destination-in";
  
  const mask = tCtx.createLinearGradient(0, photoAreaH * 0.5, 0, photoAreaH);
  mask.addColorStop(0, "rgba(0,0,0,1)"); 
  mask.addColorStop(1, "rgba(0,0,0,0)"); 
  tCtx.fillStyle = mask;
  tCtx.fillRect(0, 0, ATT_W, photoAreaH);
  
  ctx.drawImage(tempCanvas, 0, 0);

  // 5. Draw Logos
  try {
    const logo1 = await loadImage(LOGO_1_URL);
    const logo2 = await loadImage(LOGO_2_URL);
    const logoSize = 110;
    ctx.drawImage(logo1, 50, 50, logoSize, logoSize);
    ctx.drawImage(logo2, 170, 50, logoSize, logoSize);
  } catch(e) { console.warn("Could not load logos.", e); }

  // 6. Top Right Badge
  const badgeInfo = inferDelegateType(delegate.position, delegate.institution, mode);
  ctx.font = "bold 28px 'Bebas Neue', sans-serif";
  const badgeTextW = ctx.measureText(badgeInfo.type).width;
  const badgeW = badgeTextW + 40;
  const badgeH = 50;
  const badgeX = ATT_W - badgeW - 50;
  const badgeY = 50;

  ctx.fillStyle = badgeInfo.bg;
  ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6); ctx.fill();

  ctx.fillStyle = badgeInfo.text;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(badgeInfo.type, badgeX + badgeW / 2, badgeY + badgeH / 2 + 2);

  // 7. Event Title
  const titleY = 200;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  
  ctx.font = "bold 52px 'Bebas Neue', sans-serif";
  ctx.fillStyle = colors.textMain;
  ctx.shadowColor = mode === "dark" ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)";
  ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
  ctx.fillText("RUNSA LEGISLATIVE SUMMIT", 50, titleY);
  
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.font = "600 24px 'Inter', sans-serif";
  ctx.fillStyle = colors.accentGreen;
  ctx.letterSpacing = "2px";
  ctx.fillText("THE CATALYST OF TRANSFORMATION", 50, titleY + 35);

  // 8. Typography Layout (Bottom 35%)
  let nameSize = 100;
  ctx.font = `bold ${nameSize}px 'Bebas Neue', sans-serif`;
  let nameLines = [];
  let words = delegate.name.toUpperCase().split(" ");
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    let testLine = currentLine + " " + words[i];
    if (ctx.measureText(testLine).width > ATT_W * 0.70 && i > 0) {
      nameLines.push(currentLine); currentLine = words[i];
    } else { currentLine = testLine; }
  }
  nameLines.push(currentLine);

  let textStartY = photoAreaH - 40;
  if (nameLines.length > 2) {
    nameSize = 80;
    ctx.font = `bold ${nameSize}px 'Bebas Neue', sans-serif`;
  }

  ctx.fillStyle = colors.textMain;
  nameLines.forEach((line, i) => { ctx.fillText(line, 50, textStartY + i * (nameSize * 0.95)); });

  // Role & Institution
  const roleY = textStartY + (nameLines.length - 1) * (nameSize * 0.95) + 50;
  ctx.font = "bold 32px 'Inter', sans-serif";
  ctx.fillStyle = colors.accentGreen;
  ctx.fillText((delegate.position || "Delegate").toUpperCase(), 50, roleY);

  const instY = roleY + 35;
  ctx.font = "500 24px 'Inter', sans-serif";
  ctx.fillStyle = colors.textSub;
  ctx.fillText(delegate.institution || "", 50, instY);

  // 9. Event Details (Date & Venue)
  const detailsY = instY + 80;
  ctx.font = "bold 18px 'Inter', sans-serif";
  ctx.fillStyle = colors.accentGreen;
  ctx.fillText("DATE & TIME", 50, detailsY);
  
  ctx.font = "600 22px 'Inter', sans-serif";
  ctx.fillStyle = colors.textMain;
  ctx.fillText(EVENT_DATE, 50, detailsY + 28);

  ctx.font = "bold 18px 'Inter', sans-serif";
  ctx.fillStyle = colors.accentGreen;
  ctx.fillText("VENUE", 50, detailsY + 80);
  
  ctx.font = "600 22px 'Inter', sans-serif";
  ctx.fillStyle = colors.textMain;
  ctx.fillText(EVENT_VENUE, 50, detailsY + 108);

  // 10. Bottom Right QR Code
  const qrSize = 200;
  const qrX = ATT_W - qrSize - 50;
  const qrY = ATT_H - qrSize - 60;

  ctx.fillStyle = colors.qrBg;
  ctx.beginPath(); ctx.roundRect(qrX, qrY, qrSize, qrSize, 12); ctx.fill();

  if (window.QRCode) {
    const qrCanvas = document.createElement("canvas");
    await new Promise((resolve) => {
      new window.QRCode(qrCanvas, {
        text: `${REG_SITE}?checkin=${delegate.id}`,
        width: qrSize - 20, height: qrSize - 20,
        colorDark: colors.qrDark, colorLight: colors.qrBg,
        correctLevel: window.QRCode.CorrectLevel.H,
      });
      setTimeout(resolve, 100);
    });
    ctx.drawImage(qrCanvas, qrX + 10, qrY + 10);
  }

  // ID Text Below QR
  ctx.font = "600 18px 'Inter', sans-serif";
  ctx.fillStyle = colors.textSub;
  ctx.textAlign = "center";
  ctx.fillText(`ID: ${delegate.id.toUpperCase()}`, qrX + qrSize/2, qrY + qrSize + 25);

  return canvas.toDataURL("image/jpeg", 0.95);
};

// ─── MAIN REACT COMPONENT ─────────────────────────────────────────────────────
export default function App() {
  const [db, setDb] = useState(null);
  const [ticketId, setTicketId] = useState("");
  const [delegate, setDelegate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [photoUrl, setPhotoUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalCardUrl, setFinalCardUrl] = useState(null);
  const [cardMode, setCardMode] = useState("dark"); // 'dark' | 'light'
  
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize Resources & Animations
  useEffect(() => {
    const styleId = "ls-2026-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', sans-serif; background: #060c1c; color: #ffffff; min-height: 100vh; overflow-x: hidden; }
        
        .page-wrap { background: radial-gradient(circle at 50% 0%, #112240 0%, #060c1c 70%); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 2rem 1.5rem; position: relative; }

        /* Fluid Animations */
        .fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* Top Navigation */
        .nav-bar { width: 100%; max-width: 900px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; z-index: 10; }
        .back-btn { display: flex; align-items: center; gap: 8px; color: #10b981; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 8px 16px; border-radius: 20px; background: rgba(16, 185, 129, 0.1); transition: all 0.3s ease; }
        .back-btn:hover { background: rgba(16, 185, 129, 0.2); transform: translateX(-4px); }
        .nav-logos { display: flex; gap: 12px; }
        .nav-logos img { height: 45px; width: auto; object-fit: contain; }

        /* Typography */
        .header-text { text-align: center; margin-bottom: 2.5rem; max-width: 800px; }
        .header-text h1 { font-family: 'Bebas Neue', sans-serif; font-size: 3.5rem; letter-spacing: 2px; margin: 0 0 0.5rem 0; background: linear-gradient(to right, #10b981, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header-text p { color: #94a3b8; font-size: 1.1rem; line-height: 1.6; margin: 0; }

        /* Container */
        .card-container { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 16px; padding: 2rem; width: 100%; max-width: 550px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); position: relative; z-index: 5; }

        /* Inputs & Buttons */
        .input-box { width: 100%; background: rgba(2, 6, 23, 0.5); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 1rem; color: #fff; font-size: 1.1rem; transition: border-color 0.2s; margin-bottom: 1rem; }
        .input-box:focus { outline: none; border-color: #10b981; }
        .btn-primary { width: 100%; background: #10b981; color: #022c22; font-weight: 700; font-size: 1.1rem; padding: 1rem; border: none; border-radius: 8px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; justify-content: center; align-items: center; gap: 8px; }
        .btn-primary:hover:not(:disabled) { background: #34d399; transform: translateY(-2px); box-shadow: 0 10px 20px -10px rgba(16, 185, 129, 0.6); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Upload Zone */
        .upload-zone { border: 2px dashed rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.3s; background: rgba(16, 185, 129, 0.02); }
        .upload-zone:hover, .upload-zone.drag-active { border-color: #10b981; background: rgba(16, 185, 129, 0.08); transform: scale(1.02); }

        /* 3D Result Card */
        .card-perspective { perspective: 1000px; margin-bottom: 2rem; }
        .card-tilt { transform-style: preserve-3d; animation: floatCard 6s ease-in-out infinite; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); }
        .card-tilt img { width: 100%; height: auto; display: block; }
        @keyframes floatCard { 0% { transform: translateY(0px) rotateX(2deg) rotateY(-2deg); } 50% { transform: translateY(-12px) rotateX(-2deg) rotateY(2deg); } 100% { transform: translateY(0px) rotateX(2deg) rotateY(-2deg); } }

        /* Mode Toggle */
        .mode-toggle { display: flex; background: rgba(2, 6, 23, 0.8); border-radius: 30px; padding: 4px; margin-bottom: 1.5rem; border: 1px solid rgba(148, 163, 184, 0.2); width: fit-content; margin-left: auto; margin-right: auto; }
        .mode-btn { flex: 1; padding: 8px 20px; border-radius: 26px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: none; background: transparent; color: #94a3b8; transition: all 0.3s; }
        .mode-btn.active { background: #10b981; color: #022c22; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3); }

        /* Actions & UI */
        .spinner { width: 40px; height: 40px; border: 4px solid rgba(16, 185, 129, 0.2); border-left-color: #10b981; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem auto; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        .btn-secondary { background: transparent; color: #10b981; border: 1px solid #10b981; padding: 0.8rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center;}
        .btn-secondary:hover { background: rgba(16, 185, 129, 0.1); }
        .caption-box { background: rgba(2, 6, 23, 0.6); border-radius: 8px; padding: 1rem; border: 1px solid rgba(148, 163, 184, 0.1); transition: all 0.3s; }
        .caption-box:hover { border-color: rgba(16, 185, 129, 0.3); }
      `;
      document.head.appendChild(style);
    }

    const init = async () => {
      try {
        await Promise.all([
          loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"),
          loadScript("https://unpkg.com/smartcrop@2.0.5/smartcrop.js"),
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js")
        ]);
        await loadScript("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js");
        
        if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
        setDb(window.firebase.firestore());
      } catch (err) { console.error(err); setError("Network error loading core engines."); }
    };
    init();

    const params = new URLSearchParams(window.location.search);
    const prefillId = params.get("prefill");
    if (prefillId) setTicketId(prefillId.toUpperCase());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("prefill") && db && !delegate) handleFetchDelegate(params.get("prefill").toUpperCase());
  }, [db]);

  // If mode changes and photo exists, regenerate card seamlessly
  useEffect(() => {
    if (photoUrl && delegate) handleGenerate();
  }, [cardMode]);

  const handleFetchDelegate = async (idToFetch = ticketId) => {
    if (!db || !idToFetch.trim()) return;
    setIsLoading(true); setError("");
    try {
      let formattedId = idToFetch.trim().toUpperCase();
      if (!formattedId.startsWith("RLS-")) formattedId = `RLS-${formattedId}`;

      const snapshot = await db.collection(COLLECTION).where("id", "==", formattedId).get();
      if (snapshot.empty) {
        setError("Ticket not found. Please ensure you have registered correctly.");
        setDelegate(null);
      } else {
        setDelegate(snapshot.docs[0].data());
      }
    } catch (err) { setError("Database connectivity error. Try again."); }
    finally { setIsLoading(false); }
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const processFile = (file) => {
    if (!file.type.match("image.*")) { setError("Please upload a valid image file."); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPhotoUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!delegate || !photoUrl) return;
    setIsGenerating(true); setError("");
    
    setTimeout(async () => {
      try {
        const dataUrl = await generateCardCanvas(delegate, photoUrl, cardMode)
        setFinalCardUrl(dataUrl);
      } catch (err) {
        console.error(err); setError("Error generating visual output. Try a smaller photo.");
      } finally { setIsGenerating(false); }
    }, 150); // slight delay for UI spinner
  };

  const handleDownload = () => {
    if (!finalCardUrl) return;
    const a = document.createElement("a");
    a.href = finalCardUrl;
    a.download = `RUNSA-Summit-${delegate.name.replace(/\s+/g, "-")}-${cardMode}.jpg`;
    a.click();
  };

  const handleShare = async () => {
    if (!finalCardUrl || !navigator.share) {
      alert("Direct sharing not supported. Please use the Download button."); return;
    }
    try {
      const res = await fetch(finalCardUrl);
      const blob = await res.blob();
      const file = new File([blob], "summit-card.jpg", { type: "image/jpeg" });
      await navigator.share({
        title: "Legislative Summit Credential",
        text: `I'm stepping into the halls of legislation at the RUNSA Legislative Summit 2026! 🏛️✨\n\nJoin me: ${REG_SITE}`,
        files: [file]
      });
    } catch (err) { console.log("Share failed", err); }
  };

  const captionText = `I am officially registered for the RUNSA Legislative Summit: The Catalyst of Transformation! 🏛️✨\n\nI look forward to an epoch-making event of leadership and dialogue. Join me by securing your spot here: ${REG_SITE}`;

  return (
    <div className="page-wrap">
      
      {/* Top Navigation Row */}
      <div className="nav-bar fade-in">
        <a href={REG_SITE} className="back-btn">
          <span>←</span> Back to Registration
        </a>
        <div className="nav-logos">
          <img src={LOGO_1_URL} alt="RUNSA" />
          <img src={LOGO_2_URL} alt="Legislative Council" />
        </div>
      </div>

      {/* Upbeat & Dignified Landing Text */}
      <div className="header-text fade-in" style={{ animationDelay: '0.1s' }}>
        <h1>Welcome, Honorable Delegate</h1>
        <p>
          Step into the halls of legislation with prestige. Generate your personalized attendee card 
          and show the world you are a vital part of this epoch-making summit.
        </p>
      </div>

      <div className="card-container slide-up" style={{ animationDelay: '0.2s' }}>
        {error && (
          <div className="fade-in" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#fca5a5", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
            ⚠ {error}
          </div>
        )}

        {/* STEP 1: Ticket ID */}
        {!delegate && !isLoading && (
          <div className="fade-in">
            <label style={{ display: "block", marginBottom: "8px", color: "#cbd5e1", fontWeight: 500 }}>Enter Your Ticket ID</label>
            <input 
              type="text" 
              className="input-box"
              placeholder="e.g. RLS-A1B2C3"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchDelegate()}
            />
            <button onClick={() => handleFetchDelegate()} disabled={!ticketId || !db} className="btn-primary">
              Verify Ticket →
            </button>
          </div>
        )}

        {isLoading && (
          <div className="fade-in" style={{ textAlign: "center", padding: "2rem 0" }}>
            <div className="spinner"></div>
            <p style={{ color: "#10b981", fontWeight: 600 }}>Locating Delegate Record...</p>
          </div>
        )}

        {/* STEP 2: Photo Upload */}
        {delegate && !finalCardUrl && !isLoading && !isGenerating && (
          <div className="fade-in">
            <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase" }}>Verified Delegate</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fff" }}>{delegate.name}</div>
              <div style={{ color: "#10b981", fontSize: "14px" }}>{delegate.position}</div>
            </div>

            {/* Dark/Light Mode Selection (Before generating) */}
            <div className="mode-toggle">
              <button className={`mode-btn ${cardMode === 'dark' ? 'active' : ''}`} onClick={() => setCardMode('dark')}>🌙 Dark Mode</button>
              <button className={`mode-btn ${cardMode === 'light' ? 'active' : ''}`} onClick={() => setCardMode('light')}>☀️ Light Mode</button>
            </div>

            {!photoUrl ? (
              <div className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={(e) => { if(e.target.files[0]) processFile(e.target.files[0]) }} accept="image/jpeg, image/png" style={{ display: "none" }} />
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>📸</div>
                <h3 style={{ margin: "0 0 8px 0" }}>Upload Your Portrait</h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>A clear, well-lit photo works best. We will intelligently frame it.</p>
              </div>
            ) : (
              <div className="fade-in">
                <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", marginBottom: "1rem", height: "250px", background: "#000", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                   <img src={photoUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                   <button onClick={() => setPhotoUrl(null)} style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(239, 68, 68, 0.9)", color: "#fff", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={e=>e.target.style.transform='scale(1.1)'} onMouseOut={e=>e.target.style.transform='scale(1)'}>✕</button>
                </div>
                <button onClick={handleGenerate} className="btn-primary">
                  Generate Delegate Tag ✨
                </button>
              </div>
            )}
          </div>
        )}

        {isGenerating && (
          <div className="fade-in" style={{ textAlign: "center", padding: "2rem 0" }}>
            <div className="spinner"></div>
            <p style={{ color: "#10b981", fontWeight: 600 }}>Crafting Your {cardMode === 'dark' ? 'Navy' : 'Ivory'} Tag...</p>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>Applying intelligent crop and legislative aesthetics.</p>
          </div>
        )}

        {/* STEP 3: Final Output */}
        {finalCardUrl && !isGenerating && (
          <div className="fade-in">
            
            {/* The Toggle is still here so they can instantly switch themes */}
            <div className="mode-toggle">
              <button className={`mode-btn ${cardMode === 'dark' ? 'active' : ''}`} onClick={() => setCardMode('dark')}>🌙 Dark Mode</button>
              <button className={`mode-btn ${cardMode === 'light' ? 'active' : ''}`} onClick={() => setCardMode('light')}>☀️ Light Mode</button>
            </div>

            <div className="card-perspective">
              <div className="card-tilt">
                <img src={finalCardUrl} alt="Your Official Tag" />
              </div>
            </div>

            <div className="action-row">
              <button onClick={handleDownload} className="btn-primary">⬇ Download</button>
              <button onClick={handleShare} className="btn-primary" style={{ background: "#2563eb", color: "#fff" }}>📤 Share Tag</button>
            </div>

            <div className="caption-box">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>📋 Suggested Caption</span>
                <button onClick={() => { navigator.clipboard.writeText(captionText); alert("Caption Copied Successfully!"); }} className="btn-secondary" style={{ padding: "4px 10px", fontSize: "11px", border: "none", background: "rgba(16, 185, 129, 0.15)" }}>
                  Copy Text
                </button>
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1", lineHeight: 1.5, fontStyle: "italic" }}>
                "{captionText}"
              </p>
            </div>

            <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
              <button onClick={() => { setFinalCardUrl(null); setPhotoUrl(null); }} className="btn-secondary" style={{ border: "none", fontSize: "14px" }}>
                ↺ Start Over with New Photo
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fade-in" style={{ marginTop: "2rem", color: "#475569", fontSize: "12px", letterSpacing: "1px", animationDelay: "0.4s" }}>
        RUNSA LEGISLATIVE SUMMIT 2026 • REGISTRATION ENGINE
      </div>
    </div>
  );
}
