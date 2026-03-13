import { useState, useEffect, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// ⚠️  Change this to your actual Vercel URL before deploying
const BASE_URL = "https://legislative-summit-registration.vercel.app/";
const ADMIN_PIN = "RUNSA2026";
const STORAGE_KEY = "runsa-regs-v3";

// ─── BRAND COLOURS (extracted from both logos) ────────────────────────────────
// RUNSA Shield  → royal blue + gold
// Legislative Council Seal → navy + cream + parchment
const BRAND = {
  navyDark:   "#0d1f3c",   // deepest navy from seal
  navy:       "#1a3a6b",   // royal blue from shield
  navyMid:    "#1e4d8c",   // mid royal blue
  gold:       "#c9920a",   // torch gold from shield
  goldLight:  "#e8b84b",   // light gold / stars
  cream:      "#f5f0e8",   // parchment background of seal
  creamDark:  "#e8e0d0",   // slightly darker cream
  white:      "#ffffff",
  // dark mode variants
  darkBg:     "#080f1e",
  darkSurface:"#0f1e38",
  darkBorder: "rgba(200,146,10,0.25)",
  // light mode variants
  lightBg:    "#f0ece3",
  lightSurface:"#ffffff",
  lightBorder:"rgba(26,58,107,0.18)",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function genId() {
  return "RLS-" + Math.random().toString(36).substring(2,8).toUpperCase();
}
function checkinURL(id) {
  return `${BASE_URL}?checkin=${id}`;
}

// ─── QR CODE ─────────────────────────────────────────────────────────────────
function QRCode({ data, size = 160, darkColor = "#0d1f3c" }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!data || !ref.current) return;
    ref.current.innerHTML = "";
    setReady(false);
    const draw = () => {
      if (window.QRCode && ref.current) {
        ref.current.innerHTML = "";
        new window.QRCode(ref.current, {
          text: data, width: size, height: size,
          colorDark: darkColor, colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H,
        });
        setReady(true);
      }
    };
    const s = document.getElementById("qr-lib");
    if (s && window.QRCode) draw();
    else if (!s) {
      const el = document.createElement("script");
      el.id = "qr-lib";
      el.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      el.onload = draw;
      document.head.appendChild(el);
    } else s.addEventListener("load", draw);
  }, [data, size, darkColor]);

  return (
    <div style={{ position:"relative", width:size, height:size, margin:"0 auto" }}>
      {!ready && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
          background:"#f0f0f0", borderRadius:6, fontSize:11, color:"#888" }}>
          Generating…
        </div>
      )}
      <div ref={ref} />
    </div>
  );
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
async function loadRegs() {
  try { const r = await window.storage.get(STORAGE_KEY); return r ? JSON.parse(r.value) : []; }
  catch { return []; }
}
async function saveRegs(regs) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(regs)); } catch {}
}

// ─── FONTS + GLOBAL CSS ───────────────────────────────────────────────────────
function GlobalStyles({ dark }) {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', sans-serif;
      background: ${dark ? BRAND.darkBg : BRAND.lightBg};
      color: ${dark ? BRAND.creamDark : BRAND.navyDark};
      transition: background 0.3s, color 0.3s;
      min-height: 100vh;
    }

    input, select, textarea, button { font-family: 'Inter', sans-serif; }

    input::placeholder { color: ${dark ? "rgba(232,224,208,0.35)" : "rgba(13,31,60,0.35)"}; }

    select option { background: ${dark ? BRAND.darkSurface : BRAND.white}; color: ${dark ? BRAND.creamDark : BRAND.navyDark}; }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(201,146,10,0.4); } 50% { box-shadow: 0 0 0 10px rgba(201,146,10,0); } }
    @keyframes scanline { 0%,100% { top: 10%; } 50% { top: 85%; } }

    .fade-up { animation: fadeUp 0.45s ease both; }
    .fade-up-2 { animation: fadeUp 0.45s 0.1s ease both; }
    .fade-up-3 { animation: fadeUp 0.45s 0.2s ease both; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${dark ? "rgba(201,146,10,0.3)" : "rgba(26,58,107,0.2)"}; border-radius: 3px; }

    /* Print */
    @media print {
      body * { visibility: hidden !important; }
      #printable-ticket, #printable-ticket * { visibility: visible !important; }
      #printable-ticket { position: fixed; top: 0; left: 0; width: 100%; box-shadow: none !important; }
    }

    /* Responsive table */
    @media (max-width: 640px) {
      .hide-mobile { display: none !important; }
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(() =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true
  );
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("register");
  const [ticket, setTicket] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Detect ?checkin= URL param → auto check-in view
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("checkin")) setView("checkin-auto");
  }, []);

  // Sync dark mode with system
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => { loadRegs().then(r => { setRegs(r); setLoading(false); }); }, []);

  const persist = async updated => { setRegs(updated); await saveRegs(updated); };

  const handleRegister = async form => {
    const id = genId();
    const t = { id, qrURL: checkinURL(id), ...form,
      registeredAt: new Date().toISOString(), signedIn: false, signedInAt: null };
    await persist([...regs, t]);
    setTicket(t);
    setView("ticket");
  };

  const signIn = async id => {
    const reg = regs.find(r => r.id === id);
    if (!reg) return { ok: false, reason: "notfound" };
    if (reg.signedIn) return { ok: false, reason: "already", delegate: reg };
    const now = new Date().toISOString();
    const updated = regs.map(r => r.id === id ? { ...r, signedIn: true, signedInAt: now } : r);
    await persist(updated);
    return { ok: true, delegate: { ...reg, signedIn: true, signedInAt: now } };
  };

  const T = { dark, gold: BRAND.gold, goldLight: BRAND.goldLight, navy: BRAND.navy,
    navyDark: BRAND.navyDark, cream: BRAND.cream, creamDark: BRAND.creamDark,
    bg: dark ? BRAND.darkBg : BRAND.lightBg,
    surface: dark ? BRAND.darkSurface : BRAND.lightSurface,
    border: dark ? BRAND.darkBorder : BRAND.lightBorder,
    text: dark ? BRAND.creamDark : BRAND.navyDark,
    textMuted: dark ? "rgba(232,224,208,0.55)" : "rgba(13,31,60,0.5)",
  };

  if (loading) return (
    <>
      <GlobalStyles dark={dark} />
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:T.bg }}>
        <div style={{ width:44, height:44, border:`3px solid ${T.border}`, borderTop:`3px solid ${T.gold}`, borderRadius:"50%", animation:"spin 0.9s linear infinite" }} />
        <p style={{ marginTop:16, color:T.gold, fontFamily:"'Cinzel', serif", fontSize:14, letterSpacing:"0.08em" }}>RUNSA SUMMIT</p>
      </div>
    </>
  );

  // Auto check-in (phone scanned QR) — no nav, full screen
  if (view === "checkin-auto") {
    const id = new URLSearchParams(window.location.search).get("checkin");
    return (
      <>
        <GlobalStyles dark={dark} />
        <AutoCheckin id={id} regs={regs} onSignIn={signIn} T={T}
          onHome={() => { window.history.replaceState({}, "", "/"); setView("register"); }} />
      </>
    );
  }

  const navItems = [
    { key:"register", label:"Register" },
    { key:"checkin", label:"Check-In" },
    { key:"admin", label:"Admin" },
  ];

  return (
    <>
      <GlobalStyles dark={dark} />

      {/* ── NAV ── */}
      <header style={{
        position:"sticky", top:0, zIndex:200,
        background: dark ? "rgba(8,15,30,0.92)" : "rgba(240,236,227,0.94)",
        backdropFilter:"blur(16px)",
        borderBottom:`1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", height:64,
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>

          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src="/legislative-council-logo.jpg" alt="Legislative Council"
              style={{ width:38, height:38, borderRadius:"50%", objectFit:"cover",
                border:`2px solid ${T.gold}`,
                filter: dark ? "none" : "none",
              }}
              onError={e => e.target.style.display="none"} />
            <div>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:15, fontWeight:700,
                color: dark ? BRAND.goldLight : BRAND.navyDark, lineHeight:1.1 }}>
                RUNSA
              </div>
              <div style={{ fontSize:10, color:T.textMuted, letterSpacing:"0.06em",
                textTransform:"uppercase", lineHeight:1 }}>
                Legislative Council
              </div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav style={{ display:"flex", alignItems:"center", gap:6 }}
            className="hide-on-mobile"
            aria-label="Main navigation">
            {navItems.map(n => (
              <button key={n.key} onClick={() => setView(n.key)}
                style={{
                  padding:"8px 20px", borderRadius:6, border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:500, letterSpacing:"0.04em",
                  fontFamily:"'Inter', sans-serif",
                  transition:"all 0.2s",
                  background: view === n.key
                    ? `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`
                    : "transparent",
                  color: view === n.key ? "#fff"
                    : dark ? "rgba(232,224,208,0.7)" : BRAND.navy,
                  outline: view !== n.key ? `1px solid ${T.border}` : "none",
                }}>
                {n.label}
              </button>
            ))}

            {/* Dark mode toggle */}
            <button onClick={() => setDark(d => !d)}
              style={{ marginLeft:8, padding:"8px 12px", borderRadius:6, border:`1px solid ${T.border}`,
                background:"transparent", cursor:"pointer", fontSize:16,
                color: dark ? BRAND.goldLight : BRAND.navy }}>
              {dark ? "☀️" : "🌙"}
            </button>
          </nav>

          {/* Mobile hamburger */}
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <button onClick={() => setDark(d => !d)}
              style={{ padding:"7px 10px", borderRadius:6, border:`1px solid ${T.border}`,
                background:"transparent", cursor:"pointer", fontSize:15,
                color: dark ? BRAND.goldLight : BRAND.navy,
                display:"none" }}
              className="show-mobile">
              {dark ? "☀️" : "🌙"}
            </button>
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ padding:"8px 10px", borderRadius:6, border:`1px solid ${T.border}`,
                background:"transparent", cursor:"pointer", fontSize:18,
                color: dark ? BRAND.goldLight : BRAND.navy }}
              aria-label="Menu">
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{
            background: dark ? BRAND.darkSurface : BRAND.white,
            borderTop:`1px solid ${T.border}`,
            padding:"12px 20px 16px",
          }}>
            {navItems.map(n => (
              <button key={n.key} onClick={() => { setView(n.key); setMenuOpen(false); }}
                style={{
                  display:"block", width:"100%", textAlign:"left",
                  padding:"12px 16px", marginBottom:6, borderRadius:8,
                  border: view === n.key ? "none" : `1px solid ${T.border}`,
                  background: view === n.key
                    ? `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`
                    : "transparent",
                  color: view === n.key ? "#fff" : T.text,
                  fontSize:14, fontWeight:500, cursor:"pointer",
                }}>
                {n.label}
              </button>
            ))}
            <button onClick={() => setDark(d => !d)}
              style={{ display:"block", width:"100%", textAlign:"left",
                padding:"12px 16px", marginBottom:0, borderRadius:8,
                border:`1px solid ${T.border}`, background:"transparent",
                color:T.text, fontSize:14, cursor:"pointer" }}>
              {dark ? "☀️  Light Mode" : "🌙  Dark Mode"}
            </button>
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main style={{ minHeight:"calc(100vh - 64px)" }}>
        {view === "register" && <RegisterView onRegister={handleRegister} T={T} />}
        {view === "ticket" && (ticket
          ? <TicketView ticket={ticket} onBack={() => setView("register")} T={T} />
          : <RegisterView onRegister={handleRegister} T={T} />)}
        {view === "checkin" && <ManualCheckin regs={regs} onSignIn={signIn} T={T} />}
        {view === "admin" && <AdminView regs={regs} persist={persist} T={T} />}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop:`1px solid ${T.border}`,
        padding:"24px 20px",
        textAlign:"center",
        background: dark ? BRAND.darkSurface : BRAND.cream,
      }}>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:14, marginBottom:10 }}>
          <img src="/runsa-logo.jpg" alt="RUNSA" style={{ height:32, objectFit:"contain" }}
            onError={e => e.target.style.display="none"} />
          <img src="/legislative-council-logo.jpg" alt="Legislative Council"
            style={{ height:32, objectFit:"contain", borderRadius:"50%" }}
            onError={e => e.target.style.display="none"} />
        </div>
        <p style={{ fontSize:12, color:T.textMuted, lineHeight:1.6 }}>
          RUNSA Legislative Parliamentary Summit 2026 · 29th April · Sapetro Lecture Theatre, RUN
          <br />© Redeemers' University Students' Association — Legislative Council
        </p>
      </footer>

      {/* Responsive overrides injected as style tag */}
      <style>{`
        @media (min-width: 641px) { .show-mobile { display:none !important; } }
        @media (max-width: 640px) { .hide-on-mobile { display:none !important; } .hide-mobile { display:none !important; } .show-mobile { display:flex !important; flex-direction:column; } }
      `}</style>
    </>
  );
}

// ─── AUTO CHECK-IN (phone scanned QR) ─────────────────────────────────────────
function AutoCheckin({ id, regs, onSignIn, onHome, T }) {
  const [status, setStatus] = useState("loading");
  const [delegate, setDelegate] = useState(null);

  useEffect(() => {
    if (!id) { setStatus("notfound"); return; }
    const t = setTimeout(async () => {
      const r = await onSignIn(id);
      if (r.ok) { setDelegate(r.delegate); setStatus("success"); }
      else if (r.reason === "already") { setDelegate(r.delegate); setStatus("already"); }
      else setStatus("notfound");
    }, 700);
    return () => clearTimeout(t);
  }, [id, regs.length]);

  const statusMap = {
    loading: { icon:"⏳", label:"Verifying ticket…", accent:"#888" },
    success: { icon:"✅", label:"Delegate Signed In", accent:"#2e9e5b" },
    already: { icon:"⚠️", label:"Already Signed In", accent:"#c97a10" },
    notfound:{ icon:"❌", label:"Invalid Ticket", accent:"#c0392b" },
  };
  const s = statusMap[status];

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, background:T.bg }}>
      <div style={{ width:"100%", maxWidth:420, borderRadius:20,
        background:T.surface, border:`1px solid ${T.border}`,
        boxShadow: T.dark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 12px 48px rgba(13,31,60,0.12)",
        overflow:"hidden" }}>

        {/* Header strip */}
        <div style={{ background:`linear-gradient(135deg, ${BRAND.navyDark}, ${BRAND.navy})`,
          padding:"20px 24px", display:"flex", alignItems:"center", gap:14 }}>
          <img src="/legislative-council-logo.jpg" alt=""
            style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", border:`2px solid ${BRAND.goldLight}` }}
            onError={e => e.target.style.display="none"} />
          <div>
            <div style={{ fontFamily:"'Cinzel', serif", fontSize:13, color:BRAND.goldLight,
              fontWeight:700, letterSpacing:"0.06em" }}>RUNSA LEGISLATIVE COUNCIL</div>
            <div style={{ fontSize:11, color:"rgba(245,240,232,0.65)", marginTop:2 }}>
              Parliamentary Summit 2026 · Entry System
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:"32px 24px", textAlign:"center" }}>
          {status === "loading" && (
            <div>
              <div style={{ width:52, height:52, border:`4px solid ${T.border}`,
                borderTop:`4px solid ${BRAND.gold}`, borderRadius:"50%",
                animation:"spin 0.9s linear infinite", margin:"0 auto 16px" }} />
              <p style={{ color:T.textMuted, fontSize:14 }}>Verifying your ticket…</p>
            </div>
          )}

          {status !== "loading" && (
            <div className="fade-up">
              <div style={{ fontSize:64, marginBottom:12, lineHeight:1 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:20, fontWeight:700,
                color:s.accent, marginBottom:16, letterSpacing:"0.03em" }}>
                {s.label}
              </div>

              {delegate && (
                <div style={{ background: T.dark ? "rgba(255,255,255,0.04)" : "rgba(13,31,60,0.04)",
                  border:`1px solid ${T.border}`, borderRadius:12, padding:"18px 20px", marginBottom:20 }}>
                  <div style={{ fontFamily:"'EB Garamond', serif", fontSize:22, fontWeight:600,
                    color:T.text, marginBottom:6 }}>{delegate.name}</div>
                  <div style={{ fontSize:13, color:T.textMuted, marginBottom:3 }}>{delegate.position}</div>
                  <div style={{ fontSize:13, color:T.textMuted, marginBottom:3 }}>{delegate.institution}</div>
                  <div style={{ fontSize:13, color:T.textMuted }}>{delegate.level}</div>
                  <div style={{ fontFamily:"monospace", fontSize:12, color:BRAND.gold,
                    marginTop:10, letterSpacing:"0.08em" }}>{delegate.id}</div>
                  {status === "success" && (
                    <div style={{ fontSize:12, color:T.textMuted, marginTop:6 }}>
                      Signed in at {new Date(delegate.signedInAt).toLocaleTimeString("en-GB")}
                    </div>
                  )}
                </div>
              )}

              {status === "notfound" && (
                <p style={{ fontSize:13, color:T.textMuted, marginBottom:20, lineHeight:1.6 }}>
                  This QR code is not registered in the RUNSA Summit system. Please see the registration desk.
                </p>
              )}
              {status === "already" && (
                <p style={{ fontSize:13, color:T.textMuted, marginBottom:20, lineHeight:1.6 }}>
                  This ticket was already used for entry. Do not grant admission without verification from the organising team.
                </p>
              )}

              {/* Status badge */}
              <div style={{
                display:"inline-block", padding:"10px 28px", borderRadius:6,
                background: `${s.accent}18`,
                border:`1.5px solid ${s.accent}55`,
                color:s.accent, fontSize:14, fontWeight:700,
                letterSpacing:"0.08em", fontFamily:"'Cinzel', serif",
                marginBottom:20,
                animation: status === "success" ? "pulse 2s infinite" : "none",
              }}>
                {status === "success" && "✓ ENTRY GRANTED"}
                {status === "already" && "⚠ DUPLICATE SCAN"}
                {status === "notfound" && "✗ ENTRY DENIED"}
              </div>
            </div>
          )}

          <button onClick={onHome}
            style={{ display:"block", width:"100%", padding:"12px", borderRadius:8,
              border:`1px solid ${T.border}`, background:"transparent",
              color:T.textMuted, fontSize:13, cursor:"pointer" }}>
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER VIEW ────────────────────────────────────────────────────────────
function RegisterView({ onRegister, T }) {
  const [form, setForm] = useState({ name:"", institution:"", level:"", position:"" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));
  const clrErr = k => setErrors(e => ({ ...e, [k]:"" }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.institution.trim()) e.institution = "Institution is required";
    if (!form.level) e.level = "Please select your level";
    if (!form.position) e.position = "Please select your position";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setBusy(true);
    await onRegister(form);
    setBusy(false);
  };

  const levels = ["100 Level","200 Level","300 Level","400 Level","500 Level","600 Level","Postgraduate"];
  const positions = [
    "Speaker / President","Deputy Speaker / Vice President",
    "Chief Whip","Deputy Chief Whip",
    "Senate President","House Speaker","Committee Chair",
    "Honourable Member","Senator / Representative",
    "Secretary General","Financial Secretary","Other Legislative Officer",
  ];

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 20px" }}>

      {/* Hero */}
      <div style={{ textAlign:"center", marginBottom:48 }} className="fade-up">
        {/* Logos */}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center",
          gap:20, marginBottom:28, flexWrap:"wrap" }}>
          <img src="/runsa-logo.jpg" alt="RUNSA"
            style={{ height:80, objectFit:"contain",
              filter: T.dark ? "drop-shadow(0 0 12px rgba(201,146,10,0.4))" : "none" }}
            onError={e => e.target.style.display="none"} />
          <div style={{ width:1, height:64, background:T.border }} />
          <img src="/legislative-council-logo.jpg" alt="Legislative Council"
            style={{ height:80, objectFit:"contain", borderRadius:"50%",
              border:`3px solid ${BRAND.gold}`,
              boxShadow:`0 0 20px rgba(201,146,10,0.3)` }}
            onError={e => e.target.style.display="none"} />
        </div>

        <div style={{
          display:"inline-block",
          border:`1px solid ${BRAND.gold}55`,
          color:BRAND.gold, padding:"5px 18px", borderRadius:20,
          fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:18,
          background: T.dark ? "rgba(201,146,10,0.08)" : "rgba(201,146,10,0.06)",
        }}>
          29th April 2026 · Sapetro Lecture Theatre, RUN
        </div>

        <h1 style={{
          fontFamily:"'Cinzel', serif",
          fontSize:"clamp(26px, 5vw, 54px)",
          fontWeight:900, lineHeight:1.1,
          color: T.dark ? BRAND.goldLight : BRAND.navyDark,
          marginBottom:12,
        }}>
          The Catalyst of Transformation
        </h1>
        <p style={{
          fontFamily:"'EB Garamond', serif",
          fontSize:"clamp(15px, 2vw, 20px)",
          fontStyle:"italic",
          color:T.textMuted,
          maxWidth:520, margin:"0 auto",
        }}>
          Legislating the Future for Democratic Leadership
        </p>
      </div>

      {/* Form card */}
      <div style={{
        maxWidth:640, margin:"0 auto",
        background:T.surface,
        border:`1px solid ${T.border}`,
        borderRadius:16,
        boxShadow: T.dark
          ? "0 20px 60px rgba(0,0,0,0.5)"
          : "0 8px 40px rgba(13,31,60,0.1)",
        overflow:"hidden",
      }} className="fade-up-2">

        {/* Card header */}
        <div style={{
          background:`linear-gradient(135deg, ${BRAND.navyDark} 0%, ${BRAND.navy} 100%)`,
          padding:"24px 32px",
          display:"flex", alignItems:"center", gap:14,
        }}>
          <div style={{ fontSize:28, color:BRAND.goldLight }}>📋</div>
          <div>
            <h2 style={{ fontFamily:"'Cinzel', serif", fontSize:18, fontWeight:700,
              color:BRAND.goldLight, letterSpacing:"0.04em" }}>
              Delegate Registration
            </h2>
            <p style={{ fontSize:12, color:"rgba(245,240,232,0.6)", marginTop:3 }}>
              Register to receive your personal QR entry ticket
            </p>
          </div>
        </div>

        {/* Form body */}
        <div style={{ padding:"32px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:20, marginBottom:28 }}>

            <FormField label="Full Name" error={errors.name} T={T}>
              <input
                style={inputStyle(T, !!errors.name)}
                placeholder="e.g. Oluwafemi Ibukunoluwa"
                value={form.name}
                onChange={e => { set("name", e.target.value); clrErr("name"); }} />
            </FormField>

            <FormField label="Tertiary Institution" error={errors.institution} T={T}>
              <input
                style={inputStyle(T, !!errors.institution)}
                placeholder="e.g. Redeemers' University, Ede"
                value={form.institution}
                onChange={e => { set("institution", e.target.value); clrErr("institution"); }} />
            </FormField>

            {/* Level + Position side by side on wider screens */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:20 }}>
              <FormField label="Level" error={errors.level} T={T}>
                <select style={selectStyle(T, !!errors.level)}
                  value={form.level}
                  onChange={e => { set("level", e.target.value); clrErr("level"); }}>
                  <option value="">— Select Level —</option>
                  {levels.map(l => <option key={l}>{l}</option>)}
                </select>
              </FormField>

              <FormField label="Position in Legislative Arm" error={errors.position} T={T}>
                <select style={selectStyle(T, !!errors.position)}
                  value={form.position}
                  onChange={e => { set("position", e.target.value); clrErr("position"); }}>
                  <option value="">— Select Position —</option>
                  {positions.map(p => <option key={p}>{p}</option>)}
                </select>
              </FormField>
            </div>
          </div>

          <button onClick={submit} disabled={busy}
            style={{
              width:"100%", padding:"14px 20px",
              background: busy ? "#888" : `linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.navy} 120%)`,
              color:"#fff", border:"none", borderRadius:10,
              fontSize:15, fontWeight:600, cursor: busy ? "not-allowed" : "pointer",
              fontFamily:"'Cinzel', serif", letterSpacing:"0.05em",
              boxShadow: busy ? "none" : `0 4px 20px rgba(201,146,10,0.35)`,
              transition:"all 0.2s",
            }}>
            {busy ? "Generating your ticket…" : "Register & Get My Ticket →"}
          </button>
        </div>
      </div>

      {/* Info strip */}
      <div style={{ maxWidth:640, margin:"24px auto 0",
        display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12 }}>
        {[
          { icon:"🎓", text:"Open to all legislative officers" },
          { icon:"🎫", text:"Instant QR ticket on submission" },
          { icon:"🏛", text:"500+ delegates expected" },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
            background:T.surface, border:`1px solid ${T.border}`, borderRadius:10,
            fontSize:12, color:T.textMuted,
          }}>
            <span style={{ fontSize:20 }}>{icon}</span>{text}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormField({ label, error, children, T }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:600,
        color: T.dark ? BRAND.goldLight : BRAND.navy,
        textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:7 }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontSize:12, color:"#c0392b", marginTop:5, display:"block" }}>{error}</span>}
    </div>
  );
}

function inputStyle(T, hasErr) {
  return {
    width:"100%", padding:"12px 14px",
    background: T.dark ? "rgba(255,255,255,0.05)" : "rgba(13,31,60,0.04)",
    border:`1.5px solid ${hasErr ? "#c0392b" : T.border}`,
    borderRadius:8, color:T.text, fontSize:14, outline:"none",
    transition:"border-color 0.2s",
  };
}

function selectStyle(T, hasErr) {
  return {
    ...inputStyle(T, hasErr),
    cursor:"pointer", appearance:"none",
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='${encodeURIComponent(BRAND.gold)}' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
    backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center",
    paddingRight:36,
  };
}

// ─── TICKET VIEW ──────────────────────────────────────────────────────────────
function TicketView({ ticket, onBack, T }) {
  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 20px" }}>

      <div style={{ maxWidth:620, margin:"0 auto" }}>
        <div style={{ background:"rgba(46,158,91,0.12)", border:"1px solid rgba(46,158,91,0.3)",
          color:"#2e9e5b", padding:"12px 20px", borderRadius:10, marginBottom:24,
          fontSize:14, textAlign:"center", fontWeight:500 }} className="fade-up">
          ✓ Registration successful! Your entry ticket is ready.
        </div>

        {/* THE TICKET */}
        <div id="printable-ticket" style={{
          background: BRAND.cream,
          borderRadius:16,
          overflow:"hidden",
          boxShadow:"0 20px 64px rgba(0,0,0,0.25)",
          border:`1px solid ${BRAND.gold}44`,
        }} className="fade-up-2">

          {/* Ticket header */}
          <div style={{ background:`linear-gradient(135deg, ${BRAND.navyDark}, ${BRAND.navy})`,
            padding:"clamp(16px,3vw,24px) clamp(20px,4vw,32px)",
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <div>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:10,
                color:BRAND.goldLight, letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:4 }}>
                RUNSA · Legislative Council
              </div>
              <div style={{ fontFamily:"'EB Garamond', serif", fontSize:"clamp(16px,3vw,22px)",
                fontWeight:600, color:BRAND.cream, marginBottom:4 }}>
                Parliamentary Summit 2026
              </div>
              <div style={{ fontSize:11, color:"rgba(245,240,232,0.55)" }}>
                29 April 2026 · Sapetro Lecture Theatre, RUN
              </div>
            </div>
            <img src="/legislative-council-logo.jpg" alt=""
              style={{ width:"clamp(44px,8vw,60px)", height:"clamp(44px,8vw,60px)",
                borderRadius:"50%", objectFit:"cover", border:`2px solid ${BRAND.goldLight}55`,
                opacity:0.85 }}
              onError={e => e.target.style.display="none"} />
          </div>

          {/* Perforated edge */}
          <div style={{ display:"flex", justifyContent:"space-between",
            background:BRAND.cream, padding:"0 -4px", overflow:"hidden" }}>
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} style={{ width:9, height:9, borderRadius:"50%",
                background:BRAND.navyDark, flexShrink:0 }} />
            ))}
          </div>

          {/* Ticket body */}
          <div style={{ padding:"clamp(16px,3vw,28px) clamp(20px,4vw,32px)",
            display:"flex", gap:"clamp(16px,4vw,32px)",
            alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontFamily:"monospace", fontSize:13, color:BRAND.gold,
                fontWeight:700, letterSpacing:"0.12em", marginBottom:10 }}>
                {ticket.id}
              </div>
              <div style={{ fontFamily:"'Cinzel', serif",
                fontSize:"clamp(18px,3vw,24px)", fontWeight:700,
                color:BRAND.navyDark, marginBottom:8, lineHeight:1.2 }}>
                {ticket.name}
              </div>
              <div style={{ fontSize:13, color:"#444", marginBottom:4 }}>{ticket.position}</div>
              <div style={{ fontSize:13, color:"#444", marginBottom:4 }}>{ticket.institution}</div>
              <div style={{ fontSize:13, color:"#444", marginBottom:12 }}>{ticket.level}</div>
              <div style={{ fontSize:11, color:"#999" }}>
                Registered {new Date(ticket.registeredAt).toLocaleString("en-GB", {
                  day:"numeric", month:"long", year:"numeric",
                  hour:"2-digit", minute:"2-digit" })}
              </div>
            </div>
            <div style={{ textAlign:"center", flexShrink:0 }}>
              <QRCode data={ticket.qrURL} size={150} darkColor={BRAND.navyDark} />
              <div style={{ fontSize:9, color:"#aaa", textTransform:"uppercase",
                letterSpacing:"0.1em", marginTop:8 }}>
                Scan to enter
              </div>
            </div>
          </div>

          {/* Footer strip */}
          <div style={{ background:"#ede8df", borderTop:`1px dashed rgba(0,0,0,0.12)`,
            padding:"10px clamp(20px,4vw,32px)", fontSize:10, color:"#999", textAlign:"center" }}>
            This ticket is non-transferable · Present QR code at the entrance for admission · RUNSA Parliamentary Summit 2026
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex", gap:12, marginTop:20, flexWrap:"wrap" }} className="fade-up-3">
          <button onClick={() => window.print()}
            style={{ flex:1, minWidth:160, padding:"13px 20px",
              background:`linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`,
              color:"#fff", border:"none", borderRadius:10,
              fontSize:14, fontWeight:600, cursor:"pointer",
              fontFamily:"'Cinzel', serif", letterSpacing:"0.04em",
              boxShadow:`0 4px 16px rgba(201,146,10,0.3)` }}>
            🖨 Print / Save as PDF
          </button>
          <button onClick={onBack}
            style={{ flex:1, minWidth:160, padding:"13px 20px",
              background:"transparent", border:`1.5px solid ${T.border}`,
              color:T.dark ? BRAND.goldLight : BRAND.navy,
              borderRadius:10, fontSize:14, cursor:"pointer" }}>
            + Register Another
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MANUAL CHECK-IN ──────────────────────────────────────────────────────────
function ManualCheckin({ regs, onSignIn, T }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const handle = async () => {
    if (!input.trim()) return;
    const raw = input.trim();
    const id = raw.includes("checkin=")
      ? ((() => { try { return new URL(raw).searchParams.get("checkin"); } catch { return raw.split("checkin=")[1]; } })())
      : raw.toUpperCase();
    const r = await onSignIn(id);
    setResult(r);
    setInput("");
    ref.current?.focus();
  };

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 20px" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:32 }} className="fade-up">
          <div style={{ fontFamily:"'Cinzel', serif",
            fontSize:"clamp(22px,4vw,32px)", fontWeight:700,
            color: T.dark ? BRAND.goldLight : BRAND.navyDark, marginBottom:8 }}>
            Manual Check-In
          </div>
          <p style={{ fontSize:13, color:T.textMuted, lineHeight:1.7 }}>
            Type a Ticket ID (e.g. <span style={{ fontFamily:"monospace", color:BRAND.gold }}>RLS-A3F7KQ</span>) and press Enter.
            <br />This is a fallback — phones scanning QR codes sign in automatically.
          </p>
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`,
          borderRadius:16, padding:"clamp(20px,4vw,36px)" }} className="fade-up-2">
          <div style={{ display:"flex", gap:10, marginBottom: result ? 24 : 0 }}>
            <input ref={ref}
              style={{ ...inputStyle(T, false), flex:1, fontSize:15 }}
              placeholder="Ticket ID or full check-in URL…"
              value={input}
              onChange={e => { setInput(e.target.value); setResult(null); }}
              onKeyDown={e => e.key === "Enter" && handle()} />
            <button onClick={handle}
              style={{ padding:"12px 20px", background:`linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`,
                color:"#fff", border:"none", borderRadius:8,
                fontSize:14, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
              Sign In
            </button>
          </div>

          {result && (
            <div style={{
              padding:"20px", borderRadius:12, textAlign:"center",
              background: result.ok ? "rgba(46,158,91,0.08)"
                : result.reason==="already" ? "rgba(201,122,16,0.08)"
                : "rgba(192,57,43,0.08)",
              border:`1px solid ${result.ok ? "rgba(46,158,91,0.3)"
                : result.reason==="already" ? "rgba(201,122,16,0.3)"
                : "rgba(192,57,43,0.3)"}`,
              color: result.ok ? "#2e9e5b"
                : result.reason==="already" ? "#c97a10" : "#c0392b",
            }} className="fade-up">
              <div style={{ fontSize:40, marginBottom:8 }}>
                {result.ok ? "✅" : result.reason==="already" ? "⚠️" : "❌"}
              </div>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:16, fontWeight:700, marginBottom:8 }}>
                {result.ok ? "Delegate Signed In"
                  : result.reason==="already" ? "Already Signed In" : "Ticket Not Found"}
              </div>
              {result.delegate && (
                <>
                  <div style={{ fontFamily:"'EB Garamond', serif", fontSize:20, fontWeight:600,
                    color:T.text, marginBottom:4 }}>{result.delegate.name}</div>
                  <div style={{ fontSize:13, color:T.textMuted }}>{result.delegate.position} · {result.delegate.institution}</div>
                  {result.ok && (
                    <div style={{ fontSize:12, color:T.textMuted, marginTop:6 }}>
                      {new Date(result.delegate.signedInAt).toLocaleTimeString("en-GB")}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({ regs, persist, T }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirmReset, setConfirmReset] = useState(false);

  // ── Download full list as CSV ──
  const downloadCSV = () => {
    const headers = ["Ticket ID","Name","Institution","Level","Position","Registered","Signed In","Sign-In Time"];
    const rows = regs.map(r => [
      r.id,
      `"${r.name}"`,
      `"${r.institution}"`,
      r.level,
      `"${r.position}"`,
      new Date(r.registeredAt).toLocaleString("en-GB"),
      r.signedIn ? "Yes" : "No",
      r.signedInAt ? new Date(r.signedInAt).toLocaleString("en-GB") : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RUNSA-Summit-Delegates-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Reset all registrations ──
  const resetAll = async () => {
    await persist([]);
    setConfirmReset(false);
  };

  const filtered = regs.filter(r => {
    const q = search.toLowerCase();
    const ms = !q || [r.name,r.institution,r.position,r.id].some(v => v.toLowerCase().includes(q));
    const mf = filter==="all" || (filter==="signed" && r.signedIn) || (filter==="pending" && !r.signedIn);
    return ms && mf;
  });

  const total = regs.length;
  const signed = regs.filter(r => r.signedIn).length;

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 20px" }}>

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
        flexWrap:"wrap", gap:16, marginBottom:28 }} className="fade-up">
        <div>
          <h2 style={{ fontFamily:"'Cinzel', serif",
            fontSize:"clamp(20px,4vw,30px)", fontWeight:700,
            color: T.dark ? BRAND.goldLight : BRAND.navyDark, marginBottom:4 }}>
            Registrations Dashboard
          </h2>
          <p style={{ fontSize:13, color:T.textMuted }}>
            RUNSA Parliamentary Summit · 29th April 2026
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={downloadCSV}
            style={{ padding:"10px 18px", borderRadius:8, cursor:"pointer",
              background:`linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`,
              color:"#fff", border:"none", fontSize:13, fontWeight:600,
              fontFamily:"'Cinzel', serif", letterSpacing:"0.03em",
              boxShadow:`0 4px 14px rgba(201,146,10,0.3)`,
              display:"flex", alignItems:"center", gap:6 }}>
            ⬇ Download List
          </button>
          <button onClick={() => setConfirmReset(true)}
            style={{ padding:"10px 18px", borderRadius:8, cursor:"pointer",
              background:"transparent",
              border:"1.5px solid rgba(192,57,43,0.4)",
              color:"#c0392b", fontSize:13, fontWeight:600,
              display:"flex", alignItems:"center", gap:6 }}>
            🗑 Reset All
          </button>
        </div>
      </div>

      {/* Reset confirmation modal */}
      {confirmReset && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:500, padding:20 }}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:16, padding:"32px", maxWidth:380, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>
            <h3 style={{ fontFamily:"'Cinzel', serif", fontSize:18, fontWeight:700,
              color: T.dark ? BRAND.goldLight : BRAND.navyDark, marginBottom:10 }}>
              Reset All Registrations?
            </h3>
            <p style={{ fontSize:13, color:T.textMuted, marginBottom:24, lineHeight:1.6 }}>
              This will permanently delete all {total} registered delegates and cannot be undone. Download the list first if you need a record.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirmReset(false)}
                style={{ flex:1, padding:"12px", borderRadius:8, cursor:"pointer",
                  border:`1px solid ${T.border}`, background:"transparent",
                  color:T.text, fontSize:14 }}>
                Cancel
              </button>
              <button onClick={resetAll}
                style={{ flex:1, padding:"12px", borderRadius:8, cursor:"pointer",
                  background:"#c0392b", border:"none",
                  color:"#fff", fontSize:14, fontWeight:700 }}>
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",
        gap:14, marginBottom:28 }} className="fade-up-2">
        {[
          { label:"Total Registered", v:total, c:BRAND.gold },
          { label:"Signed In", v:signed, c:"#2e9e5b" },
          { label:"Awaiting Arrival", v:total-signed, c:"#c97a10" },
        ].map(s => (
          <div key={s.label} style={{ background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:12, padding:"20px", textAlign:"center",
            boxShadow: T.dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 2px 12px rgba(13,31,60,0.06)" }}>
            <div style={{ fontFamily:"'Cinzel', serif", fontSize:40, fontWeight:900, color:s.c, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:11, color:T.textMuted, textTransform:"uppercase",
              letterSpacing:"0.08em", marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}
        className="fade-up-3">
        <input style={{ ...inputStyle(T, false), flex:1, minWidth:200 }}
          placeholder="Search name, institution, ID…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[["all","All"],["signed","✓ Signed In"],["pending","⏳ Pending"]].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding:"10px 16px", borderRadius:8, cursor:"pointer",
                fontSize:13, fontWeight:500, border:"none",
                background: filter===k
                  ? `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`
                  : T.dark ? "rgba(255,255,255,0.06)" : "rgba(13,31,60,0.06)",
                color: filter===k ? "#fff" : T.textMuted,
                outline: filter!==k ? `1px solid ${T.border}` : "none",
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hide-mobile" style={{ background:T.surface, border:`1px solid ${T.border}`,
        borderRadius:14, overflow:"auto",
        boxShadow: T.dark ? "0 8px 32px rgba(0,0,0,0.3)" : "0 4px 20px rgba(13,31,60,0.06)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
          <thead>
            <tr style={{ background: T.dark ? "rgba(0,0,0,0.25)" : "rgba(13,31,60,0.04)" }}>
              {["Ticket ID","Name","Institution","Level","Position","Date","Status"].map(h => (
                <th key={h} style={{ padding:"13px 16px", textAlign:"left",
                  fontSize:11, fontWeight:600,
                  color: T.dark ? BRAND.goldLight : BRAND.navy,
                  textTransform:"uppercase", letterSpacing:"0.09em",
                  borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding:"40px", textAlign:"center",
                color:T.textMuted, fontSize:14 }}>
                No registrations found.
              </td></tr>
            )}
            {filtered.map((r, i) => (
              <tr key={r.id} style={{
                borderBottom:`1px solid ${T.border}`,
                background: r.signedIn
                  ? T.dark ? "rgba(46,158,91,0.04)" : "rgba(46,158,91,0.03)"
                  : i % 2 === 0 ? "transparent"
                  : T.dark ? "rgba(255,255,255,0.01)" : "rgba(13,31,60,0.01)",
              }}>
                <td style={{ padding:"12px 16px", fontFamily:"monospace",
                  fontSize:12, color:BRAND.gold, letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
                  {r.id}
                </td>
                <td style={{ padding:"12px 16px", fontWeight:600, color:T.text }}>{r.name}</td>
                <td style={{ padding:"12px 16px", fontSize:13, color:T.textMuted }}>{r.institution}</td>
                <td style={{ padding:"12px 16px", fontSize:13, color:T.textMuted }}>{r.level}</td>
                <td style={{ padding:"12px 16px", fontSize:13, color:T.textMuted }}>{r.position}</td>
                <td style={{ padding:"12px 16px", fontSize:12, color:T.textMuted, whiteSpace:"nowrap" }}>
                  {new Date(r.registeredAt).toLocaleDateString("en-GB")}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  {r.signedIn ? (
                    <span style={{ display:"inline-block", padding:"4px 10px",
                      background:"rgba(46,158,91,0.12)", border:"1px solid rgba(46,158,91,0.3)",
                      color:"#2e9e5b", borderRadius:5, fontSize:11, fontWeight:600, lineHeight:1.7 }}>
                      ✓ Signed In<br />
                      <span style={{ fontSize:10, opacity:0.8 }}>
                        {new Date(r.signedInAt).toLocaleTimeString("en-GB")}
                      </span>
                    </span>
                  ) : (
                    <span style={{ display:"inline-block", padding:"4px 10px",
                      background:"rgba(201,122,16,0.1)", border:"1px solid rgba(201,122,16,0.3)",
                      color:"#c97a10", borderRadius:5, fontSize:11, fontWeight:600 }}>
                      ⏳ Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — shows all details */}
      <div className="show-mobile" style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 20px",
            color:T.textMuted, fontSize:14 }}>No registrations found.</div>
        )}
        {filtered.map(r => (
          <div key={r.id} style={{
            background:T.surface, border:`1px solid ${r.signedIn ? "rgba(46,158,91,0.35)" : T.border}`,
            borderRadius:12, padding:"16px",
            boxShadow: T.dark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 10px rgba(13,31,60,0.06)",
          }}>
            {/* Top row: ID + status badge */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontFamily:"monospace", fontSize:12, color:BRAND.gold,
                fontWeight:700, letterSpacing:"0.08em" }}>{r.id}</span>
              {r.signedIn ? (
                <span style={{ padding:"3px 10px",
                  background:"rgba(46,158,91,0.12)", border:"1px solid rgba(46,158,91,0.3)",
                  color:"#2e9e5b", borderRadius:20, fontSize:11, fontWeight:600 }}>
                  ✓ Signed In
                </span>
              ) : (
                <span style={{ padding:"3px 10px",
                  background:"rgba(201,122,16,0.1)", border:"1px solid rgba(201,122,16,0.3)",
                  color:"#c97a10", borderRadius:20, fontSize:11, fontWeight:600 }}>
                  ⏳ Pending
                </span>
              )}
            </div>

            {/* Name */}
            <div style={{ fontFamily:"'Cinzel', serif", fontSize:16, fontWeight:700,
              color:T.text, marginBottom:6 }}>{r.name}</div>

            {/* Details grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px", marginBottom:8 }}>
              {[
                ["Institution", r.institution],
                ["Level", r.level],
                ["Position", r.position],
                ["Registered", new Date(r.registeredAt).toLocaleDateString("en-GB")],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize:9, color:T.dark ? BRAND.goldLight : BRAND.navy,
                    textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>{label}</div>
                  <div style={{ fontSize:12, color:T.textMuted, marginTop:1 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Sign-in time if applicable */}
            {r.signedIn && r.signedInAt && (
              <div style={{ fontSize:11, color:"#2e9e5b", marginTop:6, borderTop:`1px solid rgba(46,158,91,0.2)`,
                paddingTop:6 }}>
                Signed in at {new Date(r.signedInAt).toLocaleTimeString("en-GB")}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
