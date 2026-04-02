import { useState, useEffect, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BASE_URL = "https://legislative-summit-registration.vercel.app";
const ADMIN_PIN = "LS2026";
const CHECKIN_PIN = "290426";
const SUPER_ADMIN_PIN = "Admin2026";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3SqUXGR0kqPCpG88BFRB9qUMAk08x_6Q",
  authDomain: "runsa-summit.firebaseapp.com",
  projectId: "runsa-summit",
};
const COLLECTION = "delegates";

// ─── INSTITUTION LIST ─────────────────────────────────────────────────────────
const INSTITUTIONS = [
  "Redeemer's University, Ede",
  "Adeleke University, Ede",
  "Babcock University, Ilishan-Remo",
  "Bells University of Technology, Ota",
  "Covenant University, Ota",
  "Joseph Ayo Babalola University, Ikeji-Arakeji",
  "Ladoke Akintola University of Technology, Ogbomoso",
  "Lagos State University, Ojo",
  "Lead City University, Ibadan",
  "Obafemi Awolowo University, Ile-Ife",
  "Osun State University, Osogbo",
  "University of Ibadan",
  "University of Lagos",
  "Yaba College of Technology, Lagos",
  "Others",
];

const INSTITUTION_ALIASES = {
  "redeemer's university": "Redeemer's University, Ede",
  "redeemers university": "Redeemer's University, Ede",
  "redeemers university nigeria": "Redeemer's University, Ede",
  "redeemer's university nigeria": "Redeemer's University, Ede",
  "redeemers university, ede": "Redeemer's University, Ede",
  "run": "Redeemer's University, Ede",
  "redeemer university": "Redeemer's University, Ede",
  "adeleke university": "Adeleke University, Ede",
  "adeleke university, ede": "Adeleke University, Ede",
  "adeleke": "Adeleke University, Ede",
  "babcock university": "Babcock University, Ilishan-Remo",
  "babcock university, ilishan-remo": "Babcock University, Ilishan-Remo",
  "babcock": "Babcock University, Ilishan-Remo",
  "bells university of technology": "Bells University of Technology, Ota",
  "bells university of technology, ota": "Bells University of Technology, Ota",
  "bells university": "Bells University of Technology, Ota",
  "bellstech": "Bells University of Technology, Ota",
  "bells": "Bells University of Technology, Ota",
  "covenant university": "Covenant University, Ota",
  "covenant university, ota": "Covenant University, Ota",
  "covenant": "Covenant University, Ota",
  "joseph ayo babalola university": "Joseph Ayo Babalola University, Ikeji-Arakeji",
  "joseph ayo babalola university, ikeji-arakeji": "Joseph Ayo Babalola University, Ikeji-Arakeji",
  "jabu": "Joseph Ayo Babalola University, Ikeji-Arakeji",
  "j.a.b.u": "Joseph Ayo Babalola University, Ikeji-Arakeji",
  "jabu law": "Joseph Ayo Babalola University, Ikeji-Arakeji",
  "jabu src": "Joseph Ayo Babalola University, Ikeji-Arakeji",
  "ladoke akintola university of technology": "Ladoke Akintola University of Technology, Ogbomoso",
  "ladoke akintola university of technology, ogbomoso": "Ladoke Akintola University of Technology, Ogbomoso",
  "lautech": "Ladoke Akintola University of Technology, Ogbomoso",
  "lagos state university": "Lagos State University, Ojo",
  "lagos state university, ojo": "Lagos State University, Ojo",
  "lasu": "Lagos State University, Ojo",
  "lead city university": "Lead City University, Ibadan",
  "lead city university, ibadan": "Lead City University, Ibadan",
  "leadcity": "Lead City University, Ibadan",
  "lead city": "Lead City University, Ibadan",
  "obafemi awolowo university": "Obafemi Awolowo University, Ile-Ife",
  "obafemi awolowo university, ile-ife": "Obafemi Awolowo University, Ile-Ife",
  "oau": "Obafemi Awolowo University, Ile-Ife",
  "great ife": "Obafemi Awolowo University, Ile-Ife",
  "osun state university": "Osun State University, Osogbo",
  "osun state university, osogbo": "Osun State University, Osogbo",
  "uniosun": "Osun State University, Osogbo",
  "university of ibadan": "University of Ibadan",
  "ui": "University of Ibadan",
  "university of lagos": "University of Lagos",
  "unilag": "University of Lagos",
  "yaba college of technology": "Yaba College of Technology, Lagos",
  "yaba college of technology, lagos": "Yaba College of Technology, Lagos",
  "yabatech": "Yaba College of Technology, Lagos",
  "yaba tech": "Yaba College of Technology, Lagos",
};

function normalizeInstitution(raw) {
  if (!raw) return raw;
  const key = raw.trim().toLowerCase();
  return INSTITUTION_ALIASES[key] || raw;
}

function stringSimilarity(a, b) {
  const s1 = a.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const s2 = b.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;
  const bigrams = s => {
    const set = new Set();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
  };
  const b1 = bigrams(s1), b2 = bigrams(s2);
  let inter = 0;
  b1.forEach(g => { if (b2.has(g)) inter++; });
  return (2 * inter) / (b1.size + b2.size);
}

function canonicaliseInstitution(raw, existingCanonicals) {
  const norm = normalizeInstitution(raw);
  if (!norm) return norm;
  for (const canon of existingCanonicals) {
    if (stringSimilarity(norm, canon) >= 0.70) return canon;
  }
  return norm;
}

// ─── BRAND COLOURS ────────────────────────────────────────────────────────────
const BRAND = {
  navyDark:    "#0a1628",
  navy:        "#1a3a6b",
  navyMid:     "#1e4d8c",
  navyDeep:    "#060d1a",
  gold:        "#c9920a",
  goldLight:   "#e8b84b",
  goldPale:    "#f5d57a",
  green:       "#39e07a",
  greenDim:    "rgba(57,224,122,0.1)",
  greenGlow:   "rgba(57,224,122,0.22)",
  cream:       "#f5f0e8",
  creamDark:   "#e8e0d0",
  white:       "#ffffff",
  // Dark mode surfaces — slightly warmer/lighter so badges read clearly
  darkBg:      "#080f1e",
  darkSurface: "#0f1e36",
  darkSurface2:"#152440",
  darkBorder:  "rgba(90,130,200,0.35)",
  darkBorderAccent: "rgba(57,224,122,0.22)",
  darkBorderGold: "rgba(200,146,10,0.28)",
  // Light mode — clean cool off-white instead of cream; much better contrast
  lightBg:     "#f4f6fb",
  lightSurface:"#ffffff",
  lightBorder: "rgba(26,58,107,0.14)",
};

function genId() {
  return "RLS-" + Math.random().toString(36).substring(2,8).toUpperCase();
}
function checkinURL(id) {
  return `${BASE_URL}?checkin=${id}`;
}

// ─── FIREBASE HELPERS ─────────────────────────────────────────────────────────
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
async function fbLoadRegs() {
  try {
    const db = await initFirebase();
    const snap = await db.collection(COLLECTION).orderBy("registeredAt", "desc").get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.error("Firebase load error:", e); return []; }
}
// Pending-save queue — IDs registered but not yet confirmed saved to Firestore.
// Kept in module scope so the polling loop can skip these records (they are
// already in local state) and retry saving them on the next cycle.
const _pendingSaves = new Map(); // id → reg object

async function fbAddReg(reg) {
  _pendingSaves.set(reg.id, reg); // mark as pending immediately
  let lastErr = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const db = await initFirebase();
      await db.collection(COLLECTION).doc(reg.id).set(reg);
      _pendingSaves.delete(reg.id); // confirmed saved
      return;
    } catch (e) {
      lastErr = e;
      console.warn(`Firebase add attempt ${attempt} failed:`, e.message);
      if (attempt < 4) await new Promise(r => setTimeout(r, attempt * 1200));
    }
  }
  console.error("Firebase add FAILED after 4 attempts:", lastErr);
  // Leave in _pendingSaves so the polling loop retries on next tick
}

// Retry any pending saves — called inside the polling loop
async function fbRetryPendingSaves() {
  if (_pendingSaves.size === 0) return;
  for (const [id, reg] of [..._pendingSaves.entries()]) {
    try {
      const db = await initFirebase();
      await db.collection(COLLECTION).doc(id).set(reg);
      _pendingSaves.delete(id);
      console.log("[Retry] Saved pending registration:", id);
    } catch (e) {
      console.warn("[Retry] Still failing for", id, e.message);
    }
  }
}
async function fbSignIn(id) {
  try {
    const db = await initFirebase();
    const ref = db.collection(COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, reason: "notfound" };
    const reg = { id: snap.id, ...snap.data() };
    if (reg.signedIn) return { ok: false, reason: "already", delegate: reg };
    const now = new Date().toISOString();
    await ref.update({ signedIn: true, signedInAt: now });
    return { ok: true, delegate: { ...reg, signedIn: true, signedInAt: now } };
  } catch (e) { console.error("Firebase sign-in error:", e); return { ok: false, reason: "notfound" }; }
}
async function fbResetAll() {
  try {
    const db = await initFirebase();
    const snap = await db.collection(COLLECTION).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (e) { console.error("Firebase reset error:", e); }
}
async function fbDeleteDelegate(id) {
  try {
    const db = await initFirebase();
    await db.collection(COLLECTION).doc(id).delete();
  } catch (e) { console.error("Firebase delete error:", e); }
}

// Look up an existing registration by ticket ID
async function fbLookupById(id) {
  try {
    const db = await initFirebase();
    const snap = await db.collection(COLLECTION).doc(id.trim().toUpperCase()).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) { console.error("Firebase lookup error:", e); return null; }
}
// ─── LEGACY BADGE MIGRATION ───────────────────────────────────────────────────
// Old records (registered before the delegate-type system was introduced) have
// empty delegateType and badge fields. This function infers the correct values
// from the position, institution, and level already stored, then writes them
// back to Firestore in a single batch so every record is consistent.
//
// Rules (in priority order):
//   1. Already has a badge → skip (already migrated or new-system record)
//   2. Volunteer position keywords → badge = VOLUNTEER, type = volunteer
//   3. External institution (not Redeemer's) → badge = EXTERNAL DELEGATE, type = external
//   4. RUN LC positions (Speaker, Chief Whip, Committee Chair, Honourable Member …)
//      → badge = RUNSA OFFICIAL, type = runsa-lc-member or runsa-lc-principal
//   5. RUN exec positions (President, Vice President …) → badge = RUNSA OFFICIAL, type = runsa-exec
//   6. Everything else at RUN → badge = DELEGATE, type = run-student

const RUNSA_RUN_INSTITUTION_KEYWORDS = [
  "redeemer", "run", "r.u.n"
];

function isRunInstitution(inst) {
  if (!inst) return false;
  const s = inst.toLowerCase().trim();
  return RUNSA_RUN_INSTITUTION_KEYWORDS.some(k => s.includes(k));
}

const LC_PRINCIPAL_POSITIONS = [
  "speaker", "deputy speaker", "chief whip", "legislative secretary",
  "speaker / president", "deputy speaker / vice president",
];
const LC_MEMBER_POSITIONS = [
  "honourable member", "committee chair", "other legislative officer",
  "majority leader", "minority leader", "clerk of the house",
];
const EXEC_POSITIONS = [
  "president", "vice president", "general secretary", "assistant general secretary",
  "financial secretary", "treasurer", "welfare director", "assistant welfare director",
  "public relations officer", "sports director", "social director", "chapel president",
];
// Volunteer unit keywords — checked BEFORE exec positions to avoid "welfare" vs "welfare director" clash
// We check these as EXACT position matches (trimmed lowercase) not substring, to avoid false positives
const VOLUNTEER_POSITIONS_EXACT = new Set([
  "ushering & protocol", "logistics", "registration", "team tech",
  "anchors", "welfare", "welfare unit", "general volunteer", "volunteer",
]);
const VOLUNTEER_KEYWORDS = [
  "ushering", "team tech", "anchors", "general volunteer",
];

function inferDelegateType(reg) {
  const pos  = (reg.position || "").toLowerCase().trim();
  const inst = (reg.institution || "").toLowerCase().trim();
  const lvl  = (reg.level || "").toLowerCase().trim();

  // Already migrated — don't touch
  if (reg.badge) return null;

  // Volunteer — check exact match first (unit names like "Welfare", "Logistics")
  // then substring keywords, then level fallback
  if (VOLUNTEER_POSITIONS_EXACT.has(pos) || VOLUNTEER_KEYWORDS.some(k => pos.includes(k)) || lvl === "volunteer") {
    return { delegateType: "volunteer", badge: "VOLUNTEER" };
  }

  // External (non-RUN institution with a student level, i.e., not just "N/A")
  if (!isRunInstitution(inst) && inst && lvl && lvl !== "n/a") {
    return { delegateType: "external", badge: "EXTERNAL DELEGATE" };
  }

  // RUN LC principal
  if (LC_PRINCIPAL_POSITIONS.some(p => pos.includes(p))) {
    return { delegateType: "runsa-lc-principal", badge: "RUNSA OFFICIAL" };
  }

  // RUN LC member
  if (LC_MEMBER_POSITIONS.some(p => pos.includes(p))) {
    return { delegateType: "runsa-lc-member", badge: "RUNSA OFFICIAL" };
  }

  // RUN Executive
  if (EXEC_POSITIONS.some(p => pos.includes(p))) {
    return { delegateType: "runsa-exec", badge: "RUNSA OFFICIAL" };
  }

  // RUN student (catch-all for RUN with level)
  if (isRunInstitution(inst) && lvl && lvl !== "n/a") {
    // If position is "student" or "departmental representative"
    return { delegateType: "run-student", badge: "DELEGATE" };
  }

  // Past honourables
  if (pos.includes("past")) {
    return { delegateType: "past-hon", badge: "PAST HONOURABLE" };
  }

  // Distinguished guest
  if (pos.includes("guest") || pos.includes("panelist") || pos.includes("senator") || pos.includes("house of assembly")) {
    return { delegateType: "guest", badge: "DISTINGUISHED GUEST" };
  }

  // Default for anything at RUN with no level (N/A) — likely an official
  if (isRunInstitution(inst)) {
    return { delegateType: "runsa-lc-member", badge: "RUNSA OFFICIAL" };
  }

  return null; // can't determine — leave alone
}

// Also normalise messy institution names for old records
function normaliseInstitutionForMigration(inst) {
  if (!inst) return inst;
  const s = inst.trim().toLowerCase().replace(/\s+/g, " ");
  if (RUNSA_RUN_INSTITUTION_KEYWORDS.some(k => s.includes(k))) {
    return "Redeemer's University, Ede";
  }
  return inst.trim();
}

async function fbMigrateLegacyBadges(regs, onProgress) {
  // Only process records that need migration
  const toMigrate = regs.filter(r => !r.badge);
  if (toMigrate.length === 0) return 0;

  try {
    const db = await initFirebase();
    // Firestore batch limit is 500 writes
    let migrated = 0;
    const BATCH_SIZE = 400;

    for (let i = 0; i < toMigrate.length; i += BATCH_SIZE) {
      const chunk = toMigrate.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      let batchWrites = 0;

      chunk.forEach(reg => {
        const inferred = inferDelegateType(reg);
        if (!inferred) return;
        const normInst = normaliseInstitutionForMigration(reg.institution);
        const updates = { ...inferred };
        if (normInst !== reg.institution) updates.institution = normInst;
        const ref = db.collection(COLLECTION).doc(reg.id);
        batch.update(ref, updates);
        batchWrites++;
      });

      if (batchWrites > 0) {
        await batch.commit();
        migrated += batchWrites;
        if (onProgress) onProgress(migrated, toMigrate.length);
      }
    }
    return migrated;
  } catch (e) {
    console.error("Migration error:", e);
    return 0;
  }
}

const SETTINGS_DOC = "checkin";
const SETTINGS_COL = "settings";
async function fbGetCheckinOpen() {
  try {
    const db = await initFirebase();
    const snap = await db.collection(SETTINGS_COL).doc(SETTINGS_DOC).get();
    if (!snap.exists) return false;
    return snap.data().open === true;
  } catch (e) { return false; }
}
async function fbSetCheckinOpen(open) {
  try {
    const db = await initFirebase();
    await db.collection(SETTINGS_COL).doc(SETTINGS_DOC).set({ open });
  } catch (e) { console.error("checkin gate write error:", e); }
}
const REGISTRATION_SETTINGS_DOC = "registration";
async function fbGetRegistrationOpen() {
  try {
    const db = await initFirebase();
    const snap = await db.collection(SETTINGS_COL).doc(REGISTRATION_SETTINGS_DOC).get();
    if (!snap.exists) return true; // Default to OPEN if not set
    return snap.data().open !== false; // Default true unless explicitly false
  } catch (e) { return true; }
}
async function fbSetRegistrationOpen(open) {
  try {
    const db = await initFirebase();
    await db.collection(SETTINGS_COL).doc(REGISTRATION_SETTINGS_DOC).set({ open });
  } catch (e) { console.error("registration gate write error:", e); }
}
// ─── CSV / EXCEL DOWNLOAD ─────────────────────────────────────────────────────
// Escapes a single cell value for RFC-4180 CSV:
//   • wraps in double-quotes if the value contains comma, quote, newline or leading/trailing space
//   • doubles any embedded double-quotes
function csvCell(val) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[,"\n\r]/.test(s) || s !== s.trim()) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Builds a UTF-8 BOM + CSV string that opens cleanly in both Excel and Google Sheets.
// BOM (﻿) tells Excel the file is UTF-8 so accented/special characters render correctly.
function buildCSV(rows) {
  const headers = ["Ticket ID","Full Name","Delegate Type","Position","Institution","Department / Level","Badge","Registered At","Checked In","Check-In Time"];
  const lines = [headers.map(csvCell).join(",")];
  rows.forEach(r => {
    lines.push([
      r.id,
      r.name,
      r.delegateType || "",
      r.position || "",
      r.institution || "",
      r.department || r.level || "",
      r.badge || "",
      r.registeredAt ? new Date(r.registeredAt).toLocaleString("en-GB") : "",
      r.signedIn ? "Yes" : "No",
      r.signedIn && r.signedInAt ? new Date(r.signedInAt).toLocaleString("en-GB") : "",
    ].map(csvCell).join(","));
  });
  return "\uFEFF" + lines.join("\r\n");   // CRLF line endings for Excel on Windows
}

// Builds a minimal XLSX file in-browser without any library.
// Uses the SpreadsheetML (XML-based) format supported by Excel 2007+ and Google Sheets.
// All values are written as inline strings to avoid any date/number formatting surprises.
function buildXLSX(rows) {
  const headers = ["Ticket ID","Full Name","Delegate Type","Position","Institution","Department / Level","Badge","Registered At","Checked In","Check-In Time"];

  // Shared-string table — deduplicates strings to keep file size small
  const sst = [];
  const sstIdx = {};
  function si(val) {
    const s = val === null || val === undefined ? "" : String(val);
    if (sstIdx[s] === undefined) { sstIdx[s] = sst.length; sst.push(s); }
    return sstIdx[s];
  }

  const dataRows = rows.map(r => [
    r.id,
    r.name,
    r.delegateType || "",
    r.position || "",
    r.institution || "",
    r.department || r.level || "",
    r.badge || "",
    r.registeredAt ? new Date(r.registeredAt).toLocaleString("en-GB") : "",
    r.signedIn ? "Yes" : "No",
    r.signedIn && r.signedInAt ? new Date(r.signedInAt).toLocaleString("en-GB") : "",
  ]);

  // Pre-compute all shared-string indices (headers first so column A=0, etc.)
  const headerIdx = headers.map(h => si(h));
  const dataIdx   = dataRows.map(row => row.map(v => si(v)));

  // Column letter helper (A-Z only — 10 columns, all fine)
  const colLetter = n => String.fromCharCode(65 + n);

  // Build worksheet XML
  let sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  sheetXml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n';
  sheetXml += '<sheetData>\n';

  // Header row (row 1)
  sheetXml += '<row r="1">';
  headerIdx.forEach((idx, c) => {
    sheetXml += `<c r="${colLetter(c)}1" t="s"><v>${idx}</v></c>`;
  });
  sheetXml += '</row>\n';

  // Data rows
  dataIdx.forEach((row, ri) => {
    const rowNum = ri + 2;
    sheetXml += `<row r="${rowNum}">`;
    row.forEach((idx, c) => {
      sheetXml += `<c r="${colLetter(c)}${rowNum}" t="s"><v>${idx}</v></c>`;
    });
    sheetXml += '</row>\n';
  });
  sheetXml += '</sheetData>\n</worksheet>';

  // Shared strings XML
  let sstXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  sstXml += `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sst.length}" uniqueCount="${sst.length}">\n`;
  sst.forEach(s => {
    // Escape XML special chars; preserve leading/trailing spaces with xml:space
    const escaped = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    sstXml += `<si><t xml:space="preserve">${escaped}</t></si>\n`;
  });
  sstXml += '</sst>';

  // Workbook XML
  const wbXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n' +
    '<sheets><sheet name="Delegates" sheetId="1" r:id="rId1"/></sheets>\n</workbook>';

  // Relationships
  const wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>\n' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>\n' +
    '</Relationships>';

  const pkgRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n' +
    '</Relationships>';

  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n' +
    '<Default Extension="xml" ContentType="application/xml"/>\n' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n' +
    '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>\n' +
    '</Types>';

  // Pack into ZIP using JSZip (loaded dynamically)
  return { wbXml, wbRels, pkgRels, contentTypes, sheetXml, sstXml };
}

async function downloadXLSX(rows, filename) {
  // Load JSZip from CDN
  await new Promise((resolve, reject) => {
    if (window.JSZip) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
  const parts = buildXLSX(rows);
  const zip = new window.JSZip();
  zip.file("[Content_Types].xml", parts.contentTypes);
  zip.file("_rels/.rels", parts.pkgRels);
  zip.file("xl/workbook.xml", parts.wbXml);
  zip.file("xl/_rels/workbook.xml.rels", parts.wbRels);
  zip.file("xl/worksheets/sheet1.xml", parts.sheetXml);
  zip.file("xl/sharedStrings.xml", parts.sstXml);
  const blob = await zip.generateAsync({ type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function downloadCSV(rows, filename) {
  const csv = buildCSV(rows);
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ─── QR CODE ──────────────────────────────────────────────────────────────────
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
        new window.QRCode(ref.current, { text: data, width: size, height: size, colorDark: darkColor, colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.H });
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
      {!ready && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f0f0", borderRadius:6, fontSize:11, color:"#888" }}>Generating…</div>}
      <div ref={ref} />
    </div>
  );
}
// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
function GlobalStyles({ dark }) {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body {
      font-family: 'Inter', sans-serif;
      background: ${dark ? "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(26,58,107,0.4) 0%, transparent 60%), " + BRAND.navyDeep : BRAND.lightBg};
      color: ${dark ? BRAND.creamDark : BRAND.navyDark};
      transition: background 0.3s, color 0.3s;
      min-height: 100vh;
    }
    input, select, textarea, button { font-family: 'Inter', sans-serif; }
    input::placeholder { color: ${dark ? "rgba(232,224,208,0.3)" : "rgba(13,31,60,0.32)"}; }
    select option { background: ${dark ? BRAND.darkSurface : BRAND.white}; color: ${dark ? BRAND.creamDark : BRAND.navyDark}; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(57,224,122,0.35); } 50% { box-shadow: 0 0 0 12px rgba(57,224,122,0); } }
    @keyframes greenPulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
    @keyframes glowLine { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
    @keyframes rippleAnim { to { transform: translate(-50%,-50%) scale(1); opacity: 0; } }
    @keyframes slideInRight { from { opacity:0; transform:translateX(32px); } to { opacity:1; transform:translateX(0); } }
    @keyframes popIn { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
    @keyframes shimmer { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
    .fade-up  { animation: fadeUp 0.38s cubic-bezier(0.34,1.1,0.64,1) both; }
    .fade-up-2{ animation: fadeUp 0.38s 0.07s cubic-bezier(0.34,1.1,0.64,1) both; }
    .fade-up-3{ animation: fadeUp 0.38s 0.14s cubic-bezier(0.34,1.1,0.64,1) both; }
    .pop-in   { animation: popIn 0.32s cubic-bezier(0.34,1.56,0.64,1) both; }
    .slide-in { animation: slideInRight 0.35s cubic-bezier(0.34,1.1,0.64,1) both; }
    .live-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:${BRAND.green}; animation:greenPulse 2s infinite; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${dark ? "rgba(26,58,107,0.6)" : "rgba(201,146,10,0.22)"}; border-radius: 3px; }
    input:focus, select:focus { outline: none; border-color: ${BRAND.goldLight} !important; box-shadow: 0 0 0 3px rgba(232,184,75,0.14); transition: border-color 0.2s, box-shadow 0.2s; }
    button { transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s; }
    button:active:not(:disabled) { transform: scale(0.97); }
    a { transition: color 0.15s, opacity 0.15s; }
    @keyframes navSlide { from { transform:scaleX(0); } to { transform:scaleX(1); } }
    .nav-active-bar { position:absolute; bottom:-1px; left:0; right:0; height:2px; background:linear-gradient(90deg,${BRAND.gold},${BRAND.goldLight}); border-radius:2px; animation:navSlide 0.2s ease; transform-origin:left; }
    @keyframes floatLabel { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    .form-field-enter { animation: floatLabel 0.22s cubic-bezier(0.34,1.1,0.64,1) both; }
    @keyframes checkmarkDraw { from{stroke-dashoffset:30} to{stroke-dashoffset:0} }
    @media print {
      body * { visibility: hidden !important; }
      #printable-ticket, #printable-ticket * { visibility: visible !important; }
      #printable-ticket { position: fixed; top: 0; left: 0; width: 100%; box-shadow: none !important; }
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// ─── CONFETTI BURST ───────────────────────────────────────────────────────────
function fireConfetti() {
  const colors = ["#c9920a","#e8b84b","#39e07a","#a8c4f5","#f5d57a","#ffffff"];
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const particles = Array.from({length: 90}, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * 40,
    vx: (Math.random() - 0.5) * 5,
    vy: 2 + Math.random() * 4,
    size: 5 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 8,
    shape: Math.random() > 0.5 ? "rect" : "circle",
    life: 1,
  }));
  let frame;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
      p.vy += 0.08; p.life -= 0.012;
      if (p.y < canvas.height && p.life > 0) { alive = true; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      if (p.shape === "rect") ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
      else { ctx.beginPath(); ctx.arc(0, 0, p.size/2, 0, Math.PI*2); ctx.fill(); }
      ctx.restore();
    });
    if (alive) frame = requestAnimationFrame(draw);
    else { cancelAnimationFrame(frame); document.body.removeChild(canvas); }
  };
  draw();
}

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
let _toastContainer = null;
function getToastContainer() {
  if (_toastContainer && document.body.contains(_toastContainer)) return _toastContainer;
  _toastContainer = document.createElement("div");
  _toastContainer.style.cssText = "position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;max-width:340px;pointer-events:none;";
  document.body.appendChild(_toastContainer);
  return _toastContainer;
}

function showToast(msg, type = "info", duration = 3500) {
  const c = getToastContainer();
  const el = document.createElement("div");
  const bg = type === "success" ? "#1a4a2e" : type === "error" ? "#4a1a1a" : type === "warning" ? "#3a2a00" : "#0f1e36";
  const border = type === "success" ? "#2e9e5b" : type === "error" ? "#c0392b" : type === "warning" ? "#c9920a" : "#1a3a6b";
  const icon = type === "success" ? "✅" : type === "error" ? "❌" : type === "warning" ? "⚠️" : "ℹ️";
  el.style.cssText = `background:${bg};border:1px solid ${border};border-radius:10px;padding:12px 16px;color:#f5f0e8;font-family:'Inter',sans-serif;font-size:13px;line-height:1.5;display:flex;align-items:flex-start;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,0.5);pointer-events:auto;transform:translateX(120%);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),opacity 0.3s;`;
  el.innerHTML = `<span style="font-size:16px;flex-shrink:0">${icon}</span><span>${msg}</span>`;
  c.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = "translateX(0)"; }));
  setTimeout(() => {
    el.style.transform = "translateX(120%)"; el.style.opacity = "0";
    setTimeout(() => { if (c.contains(el)) c.removeChild(el); }, 350);
  }, duration);
}

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    const start = prev.current; const end = target;
    prev.current = end;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ─── RIPPLE BUTTON ────────────────────────────────────────────────────────────
function RippleBtn({ onClick, style, children, disabled, className }) {
  const ref = useRef(null);
  const handleClick = e => {
    if (disabled) return;
    const btn = ref.current;
    if (!btn) { onClick && onClick(e); return; }
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:rgba(255,255,255,0.25);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%) scale(0);animation:rippleAnim 0.55s linear;left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px;`;
    btn.style.overflow = "hidden"; btn.style.position = "relative";
    btn.appendChild(ripple);
    setTimeout(() => { if (btn.contains(ripple)) btn.removeChild(ripple); }, 600);
    onClick && onClick(e);
  };
  return <button ref={ref} onClick={handleClick} style={style} disabled={disabled} className={className}>{children}</button>;
}

// ─── VIEW TRANSITION ─────────────────────────────────────────────────────────
// Wraps each view in a fade+slide transition. Uses a key to re-mount on change.
// GPU-accelerated with will-change: transform. Zero layout shift.
function ViewTransition({ viewKey, children }) {
  const [displayKey, setDisplayKey] = useState(viewKey);
  const [phase, setPhase] = useState("in"); // "in" | "out"
  const timerRef = useRef(null);

  useEffect(() => {
    if (viewKey === displayKey) return;
    // Phase 1: fade out current
    setPhase("out");
    timerRef.current = setTimeout(() => {
      // Phase 2: swap content + fade in new
      setDisplayKey(viewKey);
      setPhase("in");
    }, 180);
    return () => clearTimeout(timerRef.current);
  }, [viewKey]);

  const style = {
    willChange: "opacity, transform",
    transition: "opacity 0.18s ease, transform 0.18s ease",
    opacity: phase === "out" ? 0 : 1,
    transform: phase === "out" ? "translateY(6px)" : "translateY(0)",
  };

  return <div style={style}>{children}</div>;
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = sessionStorage.getItem("runsa-theme");
    if (saved === "light") return false;
    if (saved === "dark") return true;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true;
  });
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("register");
  const [ticket, setTicket] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("checkin")) setView("checkin-auto");
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => { const saved = sessionStorage.getItem("runsa-theme"); if (!saved) setDark(e.matches); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const menuOpenTimeRef = useRef(null);
  useEffect(() => { if (menuOpen) menuOpenTimeRef.current = Date.now(); }, [menuOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    let startY = null;
    const handleTouchStart = e => { startY = e.touches[0].clientY; };
    const handleTouchMove = e => {
      if (startY === null) return;
      const delta = Math.abs(e.touches[0].clientY - startY);
      const age = Date.now() - (menuOpenTimeRef.current || 0);
      if (delta > 40 && age > 300) setMenuOpen(false);
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => { window.removeEventListener("touchstart", handleTouchStart); window.removeEventListener("touchmove", handleTouchMove); };
  }, [menuOpen]);

  useEffect(() => {
    fbLoadRegs().then(async r => {
      // Apply inferred badges locally immediately so UI renders correctly
      // even before the Firebase batch write completes
      const enriched = r.map(reg => {
        if (reg.badge) return reg; // already good
        const inferred = inferDelegateType(reg);
        if (!inferred) return reg;
        const normInst = normaliseInstitutionForMigration(reg.institution);
        return { ...reg, ...inferred, institution: normInst };
      });
      setRegs(enriched);
      setLoading(false);
      // Background: write inferred badges back to Firestore for any unmigrated records
      const unmigrated = r.filter(reg => !reg.badge);
      if (unmigrated.length > 0) {
        fbMigrateLegacyBadges(r, (done, total) => {
          // silently complete — regs are already enriched in local state
        }).then(count => {
          if (count > 0) console.log(`[Migration] Backfilled ${count} legacy records in Firestore.`);
        });
      }
    });
  }, []);
  useEffect(() => {
    const interval = setInterval(async () => {
      // First retry any pending saves that failed on first attempt
      await fbRetryPendingSaves();
      // Then fetch latest from Firebase
      const r = await fbLoadRegs();
      const enriched = r.map(reg => {
        if (reg.badge) return reg;
        const inferred = inferDelegateType(reg);
        if (!inferred) return reg;
        const normInst = normaliseInstitutionForMigration(reg.institution);
        return { ...reg, ...inferred, institution: normInst };
      });
      // CRITICAL: merge any pending saves back in — these are registered but
      // not yet confirmed in Firestore, so they won't appear in the fetch above.
      // Without this merge they would disappear from the UI on every poll tick.
      setRegs(prev => {
        const serverIds = new Set(enriched.map(r => r.id));
        const pendingOnly = [..._pendingSaves.values()].filter(p => !serverIds.has(p.id));
        return [...pendingOnly, ...enriched];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => { 
  fbGetCheckinOpen().then(v => setCheckinOpen(v)); 
  fbGetRegistrationOpen().then(v => setRegistrationOpen(v));
}, []);

  // Listen for manual migration refreshes triggered from the Admin panel
  useEffect(() => {
    const handler = e => { if (e.detail) setRegs(e.detail); };
    window.addEventListener("runsa-regs-refresh", handler);
    return () => window.removeEventListener("runsa-regs-refresh", handler);
  }, []);

  const handleRegister = async form => {
    // _forceTicket: delegate retrieved their existing record via lookup — just show it
    if (form._forceTicket) {
      setTicket({ ...form, _isDuplicate: false });
      setView("ticket");
      return;
    }
    
    // Check if registration is closed (super admin only toggle)
    if (!registrationOpen) { 
      alert("Registration is currently closed. Please contact the registration unit for assistance."); 
      return; 
    }
    
    if (regs.length >= 450) { alert("Registration is now closed. The maximum number of delegates (450) has been reached."); return; }
    const nameWords = s => s.trim().toLowerCase().replace(/\s+/g, " ").split(" ").filter(Boolean).sort().join(" ");
    const incomingWords = nameWords(form.name);
    const existing = regs.find(r => nameWords(r.name || "") === incomingWords);
    if (existing) { setTicket({ ...existing, _isDuplicate: true }); setView("ticket"); return; }
    const id = genId();
    const t = { id, qrURL: checkinURL(id), ...form, registeredAt: new Date().toISOString(), signedIn: false, signedInAt: null };
    // Show ticket immediately so the user has their QR code while we save
    setRegs(prev => [t, ...prev]);
    setTicket(t);
    setView("ticket");
    // Celebrate! 🎉
    setTimeout(() => fireConfetti(), 200);
    showToast("Registration successful! Your ticket is ready.", "success");
    // AWAIT the save — fbAddReg retries 4 times internally and keeps the record
    // in _pendingSaves until confirmed. The polling loop will also retry.
    await fbAddReg(t);
  };

  const signIn = async id => {
    const local = regs.find(r => r.id === id);
    if (local && local.signedIn) return { ok: false, reason: "already", delegate: local };
    if (local) {
      const now = new Date().toISOString();
      const updated = { ...local, signedIn: true, signedInAt: now };
      setRegs(prev => prev.map(r => r.id === id ? updated : r));
      fbSignIn(id);
      return { ok: true, delegate: updated };
    }
    const result = await fbSignIn(id);
    if (result.ok) setRegs(prev => [...prev, result.delegate]);
    return result;
  };

  const resetAll = async () => { await fbResetAll(); setRegs([]); };
  const deleteDelegate = async id => { setRegs(prev => prev.filter(r => r.id !== id)); fbDeleteDelegate(id); };

  const T = {
    dark, gold: BRAND.gold, goldLight: BRAND.goldLight, navy: BRAND.navy,
    navyDark: BRAND.navyDark, cream: BRAND.cream, creamDark: BRAND.creamDark,
    green: BRAND.green, greenDim: BRAND.greenDim, greenGlow: BRAND.greenGlow,
    bg: dark ? BRAND.darkBg : BRAND.lightBg,
    surface: dark ? BRAND.darkSurface : BRAND.lightSurface,
    surface2: dark ? BRAND.darkSurface2 : "#f8f5f0",
    border: dark ? BRAND.darkBorder : BRAND.lightBorder,
    borderAccent: dark ? BRAND.darkBorderAccent : "rgba(57,224,122,0.2)",
    borderGold: dark ? BRAND.darkBorderGold : BRAND.lightBorder,
    text: dark ? BRAND.creamDark : BRAND.navyDark,
    textMuted: dark ? "rgba(232,224,208,0.52)" : "rgba(13,31,60,0.48)",
  };

  if (loading) return (
    <>
      <GlobalStyles dark={dark} />
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:T.bg, gap:20 }}>
        <img src="/legislative-council-logo.jpg" alt="" style={{ width:72, height:72, borderRadius:"50%", border:`2px solid ${BRAND.goldLight}`, objectFit:"cover", boxShadow:`0 0 20px rgba(200,146,10,0.3)` }} onError={e => e.target.style.display="none"} />
        <div style={{ width:40, height:40, border:`2px solid rgba(26,58,107,0.3)`, borderTop:`2px solid ${BRAND.goldLight}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        <div style={{ textAlign:"center" }}>
          <p style={{ color:BRAND.goldLight, fontFamily:"'Bebas Neue', sans-serif", fontSize:22, letterSpacing:"0.18em" }}>RUNSA LEGISLATIVE SUMMIT 2026</p>
          <p style={{ color:T.textMuted, fontSize:11, letterSpacing:"0.1em", marginTop:4 }}>LOADING...</p>
        </div>
      </div>
    </>
  );

  if (view === "checkin-auto") {
    const id = new URLSearchParams(window.location.search).get("checkin");
    return (
      <>
        <GlobalStyles dark={dark} />
        <AutoCheckin id={id} onSignIn={signIn} T={T} onHome={() => { window.history.replaceState({}, "", "/"); setView("register"); }} />
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
      <header style={{ position:"sticky", top:0, zIndex:200, background: dark ? "rgba(6,13,26,0.95)" : "rgba(240,236,227,0.97)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${dark ? "rgba(26,58,107,0.5)" : "rgba(26,58,107,0.12)"}`, boxShadow: dark ? "0 1px 0 rgba(26,58,107,0.3)" : "0 1px 0 rgba(26,58,107,0.06)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {/* INCREASED logo size from 36 to 48 */}
            <img src="/legislative-council-logo.jpg" alt="Legislative Council"
              style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", border:`2px solid ${BRAND.goldLight}`, boxShadow:`0 0 12px rgba(200,146,10,0.25)` }}
              onError={e => e.target.style.display="none"} />
            <div>
              <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:20, color: dark ? BRAND.green : BRAND.navyDark, lineHeight:1, letterSpacing:"0.1em" }}>Redeemer's University Students' Association</div>
              <div style={{ fontSize:10, color:T.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", lineHeight:1, marginTop:3 }}>Legislative Council · Summit 2026</div>
            </div>
          </div>

          <nav style={{ display:"flex", alignItems:"center", gap:4 }} className="hide-on-mobile">
            {navItems.map(n => (
              <button key={n.key} onClick={() => setView(n.key)} style={{ padding:"7px 18px", borderRadius:6, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, letterSpacing:"0.06em", fontFamily:"'Inter', sans-serif", transition:"all 0.2s", background: view === n.key ? `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})` : "transparent", color: view === n.key ? "#fff" : dark ? "rgba(232,224,208,0.65)" : BRAND.navy, boxShadow: view === n.key ? "0 2px 12px rgba(201,146,10,0.25)" : "none" }}>{n.label}</button>
            ))}
            {/* Card Generator cross-link button */}
            <a href="/card" style={{ padding:"7px 14px", borderRadius:6, border:`1px solid ${dark ? "rgba(201,146,10,0.35)" : "rgba(201,146,10,0.4)"}`, cursor:"pointer", fontSize:11, fontWeight:600, letterSpacing:"0.05em", fontFamily:"'Inter', sans-serif", textDecoration:"none", color: dark ? BRAND.goldLight : BRAND.gold, background:"transparent", display:"inline-flex", alignItems:"center", gap:5 }}>
              🎨 <span>Attendee Card</span>
            </a>
            <button onClick={() => { const nd = !dark; setDark(nd); sessionStorage.setItem("runsa-theme", nd ? "dark" : "light"); }} style={{ marginLeft:6, padding:"6px 10px", borderRadius:6, border:`1px solid ${dark ? "rgba(26,58,107,0.45)" : "rgba(26,58,107,0.15)"}`, background:"transparent", cursor:"pointer", fontSize:13, fontWeight:500, color: dark ? BRAND.goldLight : BRAND.navy }}>
              {dark ? "Light" : "Dark"}
            </button>
          </nav>

          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={() => setMenuOpen(o => !o)} style={{ width:36, height:36, borderRadius:8, border:`1px solid ${dark ? "rgba(26,58,107,0.5)" : "rgba(26,58,107,0.15)"}`, background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color: dark ? BRAND.goldLight : BRAND.navy }} aria-label="Menu">
              <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                {menuOpen ? <><path d="M1 1L15 11M15 1L1 11" stroke="currentColor" strokeWidth="1.8" fill="none"/></> : <><rect y="0" width="16" height="1.8" rx="1"/><rect y="5.1" width="11" height="1.8" rx="1"/><rect y="10.2" width="16" height="1.8" rx="1"/></>}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div style={{ background: dark ? BRAND.darkSurface : BRAND.white, borderTop:`1px solid ${dark ? "rgba(26,58,107,0.4)" : "rgba(26,58,107,0.1)"}`, padding:"16px 20px 20px" }}>
            {navItems.map(n => (
              <button key={n.key} onClick={() => { setView(n.key); setMenuOpen(false); }} style={{ display:"block", width:"100%", textAlign:"left", padding:"13px 16px", marginBottom:6, borderRadius:8, border:`1px solid ${view === n.key ? "transparent" : dark ? "rgba(26,58,107,0.4)" : "rgba(26,58,107,0.1)"}`, background: view === n.key ? `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})` : "transparent", color: view === n.key ? "#fff" : T.text, fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"0.04em" }}>{n.label}</button>
            ))}
            {/* Card Generator in mobile menu */}
            <a href="/card" style={{ display:"block", width:"100%", textAlign:"left", padding:"13px 16px", marginBottom:6, borderRadius:8, border:`1px solid ${dark ? "rgba(201,146,10,0.35)" : "rgba(201,146,10,0.3)"}`, background:"transparent", color: dark ? BRAND.goldLight : BRAND.gold, fontSize:13, fontWeight:600, textDecoration:"none" }}>
              🎨 Create Attendee Card
            </a>
            <button onClick={() => { const nd = !dark; setDark(nd); sessionStorage.setItem("runsa-theme", nd ? "dark" : "light"); }} style={{ display:"block", width:"100%", textAlign:"left", padding:"13px 16px", borderRadius:8, border:`1px solid ${dark ? "rgba(26,58,107,0.4)" : "rgba(26,58,107,0.1)"}`, background:"transparent", color:T.text, fontSize:13, fontWeight:500, cursor:"pointer" }}>
              {dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </button>
          </div>
        )}
      </header>

      <main style={{ minHeight:"calc(100vh - 64px)", position:"relative", overflow:"hidden" }}>
        <ViewTransition viewKey={view}>
          {view === "register" && <RegisterView onRegister={handleRegister} T={T} registrationOpen={registrationOpen} />}
          {view === "ticket" && (ticket
            ? <TicketView ticket={ticket} onBack={() => setView("register")} onCreateCard={() => { window.open(`${BASE_URL}/card?prefill=${encodeURIComponent(ticket.id)}`, "_blank"); }} T={T} />
            : <RegisterView onRegister={handleRegister} T={T} />)}
          {view === "checkin" && <ManualCheckin onSignIn={signIn} T={T} />}
          {view === "admin" && <AdminView regs={regs} onReset={resetAll} onDeleteDelegate={deleteDelegate} checkinOpen={checkinOpen} onToggleCheckin={async v => { setCheckinOpen(v); await fbSetCheckinOpen(v); }} registrationOpen={registrationOpen} onToggleRegistration={async v => { setRegistrationOpen(v); await fbSetRegistrationOpen(v); }} T={T} />}
        </ViewTransition>
      </main>

      <footer style={{ borderTop:`1px solid ${dark ? "rgba(26,58,107,0.4)" : "rgba(26,58,107,0.1)"}`, padding:"32px 20px 24px", textAlign:"center", background: dark ? BRAND.darkSurface : BRAND.lightBg }}>
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:20 }}>
          {Array.from({length:18}).map((_,i) => <div key={i} style={{ width:5, height:5, borderRadius:"50%", background: dark ? `rgba(201,146,10,${i%3===0?0.5:0.2})` : `rgba(26,58,107,${i%3===0?0.3:0.12})` }} />)}
        </div>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:16, marginBottom:14 }}>
          <img src="/runsa-logo.jpg" alt="RUNSA" style={{ height:30, objectFit:"contain" }} onError={e => e.target.style.display="none"} />
          <div style={{ width:1, height:28, background: dark ? "rgba(26,58,107,0.4)" : "rgba(26,58,107,0.15)" }} />
          <img src="/legislative-council-logo.jpg" alt="Legislative Council" style={{ height:30, objectFit:"contain", borderRadius:"50%", border:`1.5px solid ${BRAND.goldLight}` }} onError={e => e.target.style.display="none"} />
        </div>
        <p style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:13, color: dark ? BRAND.goldLight : BRAND.navy, letterSpacing:"0.14em", marginBottom:6 }}>LEGISLATIVE SUMMIT 2026</p>
        <p style={{ fontSize:11, color:T.textMuted, lineHeight:1.7, letterSpacing:"0.03em" }}>
          29th April, 2026 · Sapetro Lecture Theatre, Redeemer's University Nigeria<br />
          © Redeemer's University Students' Association — Legislative Council
        </p>
      </footer>

      <style>{`
        @media (min-width: 641px) { .show-mobile { display:none !important; } .hide-on-mobile { display:flex !important; } }
        @media (max-width: 640px) { .hide-on-mobile { display:none !important; } .hide-mobile { display:none !important; } .show-mobile { display:flex !important; flex-direction:column; } }
      `}</style>
    </>
  );
}

// ─── AUTO CHECK-IN ────────────────────────────────────────────────────────────
function AutoCheckin({ id, onSignIn, onHome, T }) {
  const [status, setStatus] = useState("loading");
  const [delegate, setDelegate] = useState(null);
  useEffect(() => {
    if (!id) { setStatus("notfound"); return; }
    let cancelled = false;
    (async () => {
      const isOpen = await fbGetCheckinOpen();
      if (cancelled) return;
      if (!isOpen) { setStatus("locked"); return; }
      const r = await onSignIn(id);
      if (cancelled) return;
      if (r.ok) { setDelegate(r.delegate); setStatus("success"); }
      else if (r.reason === "already") { setDelegate(r.delegate); setStatus("already"); }
      else setStatus("notfound");
    })();
    return () => { cancelled = true; };
  }, [id]);
  const statusMap = {
    loading:  { icon:"⏳", label:"Verifying ticket…",  accent:"#888" },
    success:  { icon:"✅", label:"Delegate Signed In",  accent:"#2e9e5b" },
    already:  { icon:"⚠️", label:"Already Signed In",  accent:"#c97a10" },
    notfound: { icon:"❌", label:"Invalid Ticket",      accent:"#c0392b" },
    locked:   { icon:"🔒", label:"Check-In Is Closed", accent:"#1a3a6b" },
  };
  const s = statusMap[status];
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:16, background:T.bg }}>
      <div style={{ width:"100%", maxWidth:420, borderRadius:20, background:T.surface, border:`1px solid ${T.border}`, boxShadow: T.dark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 12px 48px rgba(13,31,60,0.12)", overflow:"hidden" }}>
        <div style={{ background:`linear-gradient(135deg, ${BRAND.navyDark}, ${BRAND.navy})`, padding:"20px 24px", display:"flex", alignItems:"center", gap:14 }}>
          <img src="/legislative-council-logo.jpg" alt="" style={{ width:52, height:52, borderRadius:"50%", objectFit:"cover", border:`2px solid ${BRAND.goldLight}` }} onError={e => e.target.style.display="none"} />
          <div>
            <div style={{ fontFamily:"'Cinzel', serif", fontSize:13, color:BRAND.goldLight, fontWeight:700, letterSpacing:"0.06em" }}>RUNSA LEGISLATIVE COUNCIL</div>
            <div style={{ fontSize:11, color:"rgba(245,240,232,0.65)", marginTop:2 }}>Legislative Summit 2026 · Entry System</div>
          </div>
        </div>
        <div style={{ padding:"32px 24px", textAlign:"center" }}>
          {status === "loading" && <div><div style={{ width:52, height:52, border:`4px solid ${T.border}`, borderTop:`4px solid ${BRAND.gold}`, borderRadius:"50%", animation:"spin 0.9s linear infinite", margin:"0 auto 16px" }} /><p style={{ color:T.textMuted, fontSize:14 }}>Verifying your ticket…</p></div>}
          {status !== "loading" && (
            <div className="fade-up">
              <div style={{ fontSize:64, marginBottom:12, lineHeight:1 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:20, fontWeight:700, color:s.accent, marginBottom:16, letterSpacing:"0.03em" }}>{s.label}</div>
              {delegate && (
                <div style={{ background: T.dark ? "rgba(255,255,255,0.04)" : "rgba(13,31,60,0.04)", border:`1px solid ${T.border}`, borderRadius:12, padding:"18px 20px", marginBottom:20 }}>
                  <div style={{ fontFamily:"'EB Garamond', serif", fontSize:22, fontWeight:600, color:T.text, marginBottom:6 }}>{delegate.name}</div>
                  <div style={{ fontSize:13, color:T.textMuted, marginBottom:3 }}>{delegate.position}</div>
                  <div style={{ fontSize:13, color:T.textMuted, marginBottom:3 }}>{delegate.institution}</div>
                  {(delegate.department || delegate.level) && (delegate.department || delegate.level) !== "N/A" && <div style={{ fontSize:13, color:T.textMuted }}>{delegate.department || delegate.level}</div>}
                  <div style={{ fontFamily:"monospace", fontSize:12, color:BRAND.gold, marginTop:10, letterSpacing:"0.08em" }}>{delegate.id}</div>
                  {status === "success" && <div style={{ fontSize:12, color:T.textMuted, marginTop:6 }}>Signed in at {new Date(delegate.signedInAt).toLocaleTimeString("en-GB")}</div>}
                </div>
              )}
              {status === "notfound" && <p style={{ fontSize:13, color:T.textMuted, marginBottom:20, lineHeight:1.6 }}>This QR code is not registered in the RUNSA Legislative Summit system. Please contact the registration unit.</p>}
              {status === "locked" && <p style={{ fontSize:13, color:T.textMuted, marginBottom:20, lineHeight:1.6 }}>Check-in is currently <strong style={{ color:"#e8b84b" }}>closed</strong>. Please contact the registration unit.</p>}
              {status === "already" && <p style={{ fontSize:13, color:T.textMuted, marginBottom:20, lineHeight:1.6 }}>This ticket was already used for entry. Do not grant admission without verification from the registration unit.</p>}
              <div style={{ display:"inline-block", padding:"10px 28px", borderRadius:6, background:`${s.accent}18`, border:`1.5px solid ${s.accent}55`, color:s.accent, fontSize:14, fontWeight:700, letterSpacing:"0.08em", fontFamily:"'Cinzel', serif", marginBottom:20, animation: status === "success" ? "pulse 2s infinite" : "none" }}>
                {status === "success" && "✓ ENTRY GRANTED"}
                {status === "already" && "⚠ DUPLICATE SCAN"}
                {status === "notfound" && "✗ ENTRY DENIED"}
                {status === "locked" && "🔒 CHECK-IN CLOSED"}
              </div>
            </div>
          )}
          <button onClick={onHome} style={{ display:"block", width:"100%", padding:"12px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:13, cursor:"pointer" }}>← Back to Registration</button>
        </div>
      </div>
    </div>
  );
}

// ─── DELEGATE TYPES ───────────────────────────────────────────────────────────
// Top-level choices shown to the registrant
const DELEGATE_TYPES = [
  { value:"external",    label:"External Delegate",              desc:"Delegate from another university" },
  { value:"guest",       label:"Distinguished Guest",            desc:"Invited dignitary or special guest" },
  { value:"internal",    label:"Internal Delegate (RUNSA)",      desc:"Current RUNSA official — LC, Executive, or Past LC" },
  { value:"run-student", label:"Redeemer's University Student",  desc:"RUN student, association member, or faculty representative" },
  { value:"volunteer",   label:"Volunteer",                      desc:"Summit volunteer team member" },
];

// Sub-roles shown only when "internal" is selected
const INTERNAL_SUBROLES = [
  { value:"runsa-lc-principal",  label:"Current LC — Principal Officer",  desc:"Speaker, Dep. Speaker, Legislative Secretary, Chief Whip" },
  { value:"runsa-lc-member",     label:"Current LC — Member",             desc:"Committee Chair, Honourable Member, Other Legislative Officer" },
  { value:"runsa-exec",          label:"RUNSA Executive",                  desc:"Current executive arm member" },
  { value:"past-hon",            label:"Immediate Past LC Member",         desc:"Past principal officer or honourable member" },
];

// Position options by type (including sub-roles)
const POSITIONS_BY_TYPE = {
  "external": [
    "Rt. Hon. Speaker",
    "Deputy Speaker",
    "Senate President",
    "Chairperson",
    "President",
    "Chief Whip",
    "Deputy Chief Whip",
    "Secretary General",
    "Committee Chair",
    "Financial Secretary",
    "Other Legislative Officer",
    "Honourable Member",
    "Departmental Representative",
    "Student",
    "Staff",
  ],
  "guest": [
    "Rt. Hon. Speaker, House of Assembly",
    "Honourable Member, House of Assembly",
    "Guest Speaker / Panelist",
  ],
  "runsa-lc-principal": [
    "Speaker",
    "Deputy Speaker",
    "Legislative Secretary",
    "Chief Whip",
  ],
  "runsa-lc-member": [
    "Committee Chair",
    "Honourable Member",
    "Other Legislative Officer",
  ],
  "runsa-exec": [
    "President",
    "Vice President",
    "General Secretary",
    "Assistant General Secretary",
    "Financial Secretary",
    "Treasurer",
    "Welfare Director",
    "Assistant Welfare Director",
    "Public Relations Officer",
    "Sports Director",
    "Social Director",
    "Chapel President",
  ],
  "past-hon": [
    "Speaker",
    "Deputy Speaker",
    "Legislative Secretary",
    "Chief Whip",
    "Honourable Member",
  ],
  "run-student": [
    "Student",
    "Departmental Representative",
    "Chapel Executive",
  ],
  "volunteer": [
    "Ushering & Protocol",
    "Logistics",
    "Registration",
    "Team Tech",
    "Anchors",
    "Welfare Unit",
    "General Volunteer",
  ],
};

// Which types show the institution dropdown
const TYPE_SHOWS_INSTITUTION = { external: true };
const DEPARTMENTS = [
  "Accounting", "Actuarial Science", "Architecture", "Banking & Finance", 
  "Biochemistry", "Building Technology", "Business Administration", 
  "Christian Religious Studies", "Civil Engineering", "Computer Engineering", 
  "Computer Science", "Cyber Security", "Economics", "Educational Management", 
  "Educational Technology", "Electrical & Electronic Engineering", "English", 
  "Environmental Management & Toxicology", "Estate Management", "French", 
  "Geology", "History & International Studies", "Hospitality & Tourism Management", 
  "Human Anatomy", "Human Physiology", "Industrial Chemistry", "Industrial Mathematics", 
  "Industrial Mathematics & Computer Science", "Industrial Technology Education", 
  "Information Technology", "Insurance", "Law", "Marketing", "Mass Communication", 
  "Mechanical Engineering", "Medical Laboratory Science", "Microbiology", 
  "Nursing Science", "Petroleum Chemistry", "Philosophy", "Physics with Electronics", 
  "Physiotherapy", "Political Science", "Psychology", "Public Administration", 
  "Public Health", "Quantity Surveying", "Social Work", "Sociology", 
  "Statistics", "Statistics & Data Science", "Technical Education", 
  "Theatre Arts", "Transport Management", "Urban & Regional Planning"
];

// Fixed institution for non-external types
const TYPE_INSTITUTION = {
  "runsa-lc-principal": "Redeemer's University, Ede",
  "runsa-lc-member":    "Redeemer's University, Ede",
  "runsa-exec":         "Redeemer's University, Ede",
  "past-hon":           "Redeemer's University, Ede",
  "run-student":        "Redeemer's University, Ede",
  "volunteer":          "Redeemer's University, Ede",
  "guest":              "",
};

// Badge colours and labels
// Badge: { label, bg, border, color }
// getBadge returns theme-aware badge styles.
// Pass dark=true for dark mode, dark=false (or omit) for light mode.
function getBadge(effectiveType, dark = false) {
  const badges = {
    "external": {
      label:"EXTERNAL DELEGATE",
      bg:     dark ? "rgba(57,224,122,0.18)"  : "rgba(57,224,122,0.10)",
      border: dark ? "rgba(57,224,122,0.55)"  : "rgba(57,224,122,0.35)",
      color:  dark ? "#5deba0"                : "#1a7a40",
    },
    "guest": {
      label:"DISTINGUISHED GUEST",
      bg:     dark ? "rgba(232,184,75,0.18)"  : "rgba(201,146,10,0.10)",
      border: dark ? "rgba(232,184,75,0.55)"  : "rgba(201,146,10,0.40)",
      color:  dark ? BRAND.goldLight          : BRAND.gold,
    },
    "runsa-lc-principal": {
      label:"RUNSA OFFICIAL",
      bg:     dark ? "rgba(90,140,230,0.20)"  : "rgba(13,31,60,0.07)",
      border: dark ? "rgba(120,170,255,0.50)" : "rgba(26,58,107,0.25)",
      color:  dark ? "#a8c4f5"               : BRAND.navyDark,
    },
    "runsa-lc-member": {
      label:"RUNSA OFFICIAL",
      bg:     dark ? "rgba(90,140,230,0.20)"  : "rgba(13,31,60,0.07)",
      border: dark ? "rgba(120,170,255,0.50)" : "rgba(26,58,107,0.25)",
      color:  dark ? "#a8c4f5"               : BRAND.navyDark,
    },
    "runsa-exec": {
      label:"RUNSA OFFICIAL",
      bg:     dark ? "rgba(90,140,230,0.20)"  : "rgba(13,31,60,0.07)",
      border: dark ? "rgba(120,170,255,0.50)" : "rgba(26,58,107,0.25)",
      color:  dark ? "#a8c4f5"               : BRAND.navyDark,
    },
    "past-hon": {
      label:"PAST HONOURABLE",
      bg:     dark ? "rgba(160,120,240,0.20)" : "rgba(26,58,107,0.08)",
      border: dark ? "rgba(180,150,255,0.50)" : "rgba(26,58,107,0.28)",
      color:  dark ? "#c4a8f5"               : BRAND.navy,
    },
    "run-student": {
      label:"DELEGATE",
      bg:     dark ? "rgba(70,130,200,0.20)"  : "rgba(30,77,140,0.07)",
      border: dark ? "rgba(100,160,240,0.50)" : "rgba(30,77,140,0.25)",
      color:  dark ? "#90bdf5"               : BRAND.navyMid,
    },
    "volunteer": {
      label:"VOLUNTEER",
      bg:     dark ? "rgba(57,224,122,0.14)"  : "rgba(57,160,100,0.08)",
      border: dark ? "rgba(57,224,122,0.40)"  : "rgba(57,160,100,0.28)",
      color:  dark ? "#5deba0"               : "#2a7a50",
    },
  };
  return badges[effectiveType] || null;
}

// ─── REGISTER VIEW ────────────────────────────────────────────────────────────
function RegisterView({ onRegister, T, registrationOpen }) {
  const [form, setForm] = useState({ name:"", delegateType:"", subRole:"", institution:"", institutionOther:"", department:"", position:"" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));
  const clrErr = k => setErrors(e => ({ ...e, [k]:"" }));

  const dt = form.delegateType;
  // The effective type for positions/badges — for "internal", use the sub-role
  const effectiveType = dt === "internal" ? form.subRole : dt;

  const showSubRole      = dt === "internal";
  const showInstitution  = !!TYPE_SHOWS_INSTITUTION[effectiveType];
  // Only show department if they are a RUN student AND their position is exactly "Departmental Representative"
  const showDepartment   = effectiveType === "run-student" && form.position === "Departmental Representative";
  const showPosition     = !!effectiveType && effectiveType !== "internal";
  const positions        = effectiveType ? (POSITIONS_BY_TYPE[effectiveType] || []) : [];

  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name         = "Full name is required";
    if (!dt)                        e.delegateType  = "Please select your delegate type";
    if (dt === "internal" && !form.subRole) e.subRole = "Please select your RUNSA role";
    if (showInstitution) {
      if (!form.institution)        e.institution   = "Please select your institution";
      if (form.institution === "Others" && !form.institutionOther.trim()) e.institutionOther = "Please enter your institution name";
    }
    if (showDepartment) {
      if (!form.department)         e.department    = "Please select your department";
      if (form.department === "Others" && !form.departmentOther.trim()) e.departmentOther = "Please enter your department name";
    }
    if (showPosition && !form.position) e.position  = "Please select your position";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setBusy(true);
    const resolvedInstitution = showInstitution
      ? (form.institution === "Others" ? form.institutionOther.trim() : form.institution)
      : (TYPE_INSTITUTION[effectiveType] || "");
      
    // Only resolve the department if the field was actually shown (i.e. they are a Dept Rep)
    const resolvedDepartment = showDepartment && form.department
      ? (form.department === "Others" ? form.departmentOther.trim() : form.department)
      : "N/A";
    const badgeObj = getBadge(effectiveType);
    const badge = badgeObj ? badgeObj.label : "";
    await onRegister({
      ...form,
      delegateType: effectiveType,
      institution: resolvedInstitution,
      department: resolvedDepartment,
      badge,
    });
    setBusy(false);
  };
  
  // Banner messages per effective type
  const banners = {
    "runsa-lc-principal": { icon:"🏛️", bg:"rgba(13,31,60,0.08)", border:T.border, color: T.dark ? BRAND.goldLight : BRAND.navyDark, text:"Registering as a <strong>Current LC Principal Officer</strong> — institution auto-set to Redeemer's University." },
    "runsa-lc-member":    { icon:"🏛️", bg:"rgba(13,31,60,0.08)", border:T.border, color: T.dark ? BRAND.goldLight : BRAND.navyDark, text:"Registering as a <strong>Current LC Member</strong> — institution auto-set to Redeemer's University." },
    "runsa-exec":         { icon:"🏛️", bg:"rgba(13,31,60,0.08)", border:T.border, color: T.dark ? BRAND.goldLight : BRAND.navyDark, text:"Registering as a <strong>RUNSA Executive</strong> — institution auto-set to Redeemer's University." },
    "past-hon":           { icon:"🏛️", bg:"rgba(201,146,10,0.07)", border:"rgba(201,146,10,0.3)", color: T.dark ? BRAND.goldLight : BRAND.navyDark, text:"Registering as an <strong>Immediate Past LC Member</strong> — institution auto-set to Redeemer's University." },
    "run-student":        { icon:"🎓", bg:"rgba(26,58,107,0.06)", border:T.border, color: T.dark ? BRAND.goldLight : BRAND.navyDark, text:"Registering as a <strong>Redeemer's University Student</strong> — includes association members, club officers, and faculty representatives. Institution auto-set." },
    "volunteer":          { icon:"✅", bg:"rgba(57,224,122,0.08)", border:"rgba(57,224,122,0.25)", color: T.dark ? "#39e07a" : "#1a7a40", text:"Registering as a <strong>Volunteer</strong> — no institution or level required." },
    "guest":              { icon:"🌟", bg:"rgba(201,146,10,0.07)", border:"rgba(201,146,10,0.3)", color: T.dark ? BRAND.goldLight : BRAND.navyDark, text:"Registering as a <strong>Distinguished Guest</strong> — no institution required." },
  };
  const banner = banners[effectiveType];

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 20px" }}>
      <div style={{ textAlign:"center", marginBottom:52 }} className="fade-up">
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:20, marginBottom:32, flexWrap:"wrap" }}>
          <img src="/runsa-logo.jpg" alt="RUNSA" style={{ height:72, objectFit:"contain", filter: T.dark ? "drop-shadow(0 0 14px rgba(57,224,122,0.3))" : "none" }} onError={e => e.target.style.display="none"} />
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:1, height:28, background: T.dark ? "rgba(26,58,107,0.5)" : "rgba(26,58,107,0.15)" }} />
            <div style={{ width:6, height:6, borderRadius:"50%", background:T.dark?BRAND.green:BRAND.navy }} />
            <div style={{ width:1, height:28, background: T.dark ? "rgba(26,58,107,0.5)" : "rgba(26,58,107,0.15)" }} />
          </div>
          <img src="/legislative-council-logo.jpg" alt="Legislative Council" style={{ height:72, objectFit:"contain", borderRadius:"50%", border:`2.5px solid ${BRAND.goldLight}`, boxShadow:`0 0 18px rgba(200,146,10,0.3)` }} onError={e => e.target.style.display="none"} />
        </div>

        <div style={{ display:"inline-flex", alignItems:"center", gap:8, border:`1px solid ${T.dark ? "rgba(201,146,10,0.35)" : "rgba(26,58,107,0.2)"}`, color: T.dark ? BRAND.goldLight : BRAND.navy, padding:"6px 20px", borderRadius:100, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:20, background: T.dark ? "rgba(201,146,10,0.06)" : "rgba(26,58,107,0.04)" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:T.dark?BRAND.goldLight:BRAND.navy, display:"inline-block" }} />
          29th April 2026 · Redeemer's University, Ede
        </div>

        <div style={{ marginBottom:8 }}>
          <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"clamp(48px, 10vw, 96px)", lineHeight:0.95, letterSpacing:"0.04em", ...(T.dark ? { background:"linear-gradient(135deg, #f5d57a 0%, #e8b84b 40%, #ffffff 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" } : { color: BRAND.gold }) }}>LEGISLATIVE</div>
          <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"clamp(48px, 10vw, 96px)", lineHeight:0.95, letterSpacing:"0.04em", ...(T.dark ? { background:"linear-gradient(135deg, #39e07a 0%, #e8b84b 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" } : { color: BRAND.navy }) }}>SUMMIT 2026</div>
        </div>

        <div style={{ display:"inline-block", background: T.dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.9)", border:`1px solid ${T.dark ? "rgba(255,255,255,0.1)" : "rgba(26,58,107,0.12)"}`, borderRadius:6, padding:"8px 24px", marginTop:16 }}>
          <div style={{ fontSize:9, letterSpacing:"0.16em", color:T.textMuted, textTransform:"uppercase", marginBottom:3 }}>Theme</div>
          <div style={{ fontFamily:"'Cinzel', serif", fontSize:"clamp(12px,2vw,15px)", fontWeight:700, color: T.dark ? BRAND.goldLight : BRAND.navyDark }}>The Catalyst of Transformation</div>
          <div style={{ fontFamily:"'EB Garamond', serif", fontStyle:"italic", fontSize:"clamp(12px,1.5vw,14px)", color:T.textMuted, marginTop:2 }}>Legislating the Future for Democratic Leadership</div>
        </div>
      </div>

      <div style={{ maxWidth:640, margin:"0 auto", background:T.surface, border:`1px solid ${T.dark ? "rgba(26,58,107,0.5)" : "rgba(26,58,107,0.12)"}`, borderRadius:18, boxShadow: T.dark ? "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(26,58,107,0.2)" : "0 8px 40px rgba(13,31,60,0.1)", overflow:"hidden" }} className="fade-up-2">
        <div style={{ background:`linear-gradient(135deg, ${BRAND.navyDark} 0%, ${BRAND.navy} 100%)`, padding:"22px 32px", display:"flex", alignItems:"center", gap:14, borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize:28, color:BRAND.goldLight }}>📋</div>
          <div>
            <h2 style={{ fontFamily:"'Cinzel', serif", fontSize:18, fontWeight:700, color:BRAND.goldLight, letterSpacing:"0.04em" }}>Delegate Registration</h2>
            <p style={{ fontSize:12, color:"rgba(245,240,232,0.6)", marginTop:3 }}>Register to receive your personal QR entry ticket</p>
          </div>
        </div>

        <div style={{ padding:"32px" }}>
          {/* Info banner */}
          {banner && (
            <div style={{ background:banner.bg, border:`1px solid ${banner.border}`, borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:banner.color, lineHeight:1.5 }}
              dangerouslySetInnerHTML={{ __html: `${banner.icon} ${banner.text}` }} />
          )}
          
          {!registrationOpen && ( 
            <div style={{ background:"rgba(192,57,43,0.1)", border:"1px solid rgba(192,57,43,0.4)", borderRadius:10, padding:"14px 18px", marginBottom:20, textAlign:"center" }}>
              <div style={{ fontSize:20, marginBottom:6 }}>🔒</div>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:15, fontWeight:700, color:"#c0392b", marginBottom:4 }}>Registration is Currently Closed</div>
              <div style={{ fontSize:12, color:T.textMuted }}>Please contact the registration unit for assistance.</div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:20, marginBottom:28 }}>
            {/* Full Name */}
            <FormField label="Full Name" error={errors.name} T={T}>
              <input style={inputStyle(T, !!errors.name)} placeholder="e.g. John Doe" value={form.name} onChange={e => { set("name", e.target.value); clrErr("name"); }} />
            </FormField>

            {/* I Am Registering As */}
            <FormField label="I Am Registering As" error={errors.delegateType} T={T}>
              <select style={selectStyle(T, !!errors.delegateType)} value={form.delegateType}
                onChange={e => { set("delegateType", e.target.value); set("subRole",""); set("position",""); set("institution",""); clrErr("delegateType"); clrErr("subRole"); }}>
                <option value="">— Select Delegate Type —</option>
                {DELEGATE_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </FormField>

            {/* Sub-role for Internal Delegates */}
            {showSubRole && (
              <FormField label="My RUNSA Role" error={errors.subRole} T={T}>
                <select style={selectStyle(T, !!errors.subRole)} value={form.subRole}
                  onChange={e => { set("subRole", e.target.value); set("position",""); clrErr("subRole"); }}>
                  <option value="">— Select Your Specific Role —</option>
                  {INTERNAL_SUBROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {form.subRole && (
                  <div style={{ fontSize:11, color:T.textMuted, marginTop:6, lineHeight:1.5 }}>
                    {INTERNAL_SUBROLES.find(r => r.value === form.subRole)?.desc}
                  </div>
                )}
              </FormField>
            )}

            {/* Position / Role */}
            {showPosition && (
              <FormField label="Position / Role" error={errors.position} T={T}>
                <select style={selectStyle(T, !!errors.position)} value={form.position}
                  onChange={e => { set("position", e.target.value); clrErr("position"); }}>
                  <option value="">— Select Position —</option>
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </FormField>
            )}

            {/* Institution (External only) */}
            {showInstitution && (
              <FormField label="Tertiary Institution" error={errors.institution || errors.institutionOther} T={T}>
                <select style={selectStyle(T, !!errors.institution)} value={form.institution}
                  onChange={e => { set("institution", e.target.value); clrErr("institution"); clrErr("institutionOther"); }}>
                  <option value="">— Select Institution —</option>
                  {INSTITUTIONS.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                </select>
                {form.institution === "Others" && (
                  <input style={{ ...inputStyle(T, !!errors.institutionOther), marginTop:10 }} placeholder="Type your institution name" value={form.institutionOther} onChange={e => { set("institutionOther", e.target.value); clrErr("institutionOther"); }} />
                )}
              </FormField>
            )}

            {/* GUARANTEED DEPARTMENT DROPDOWN */}
            {showDepartment && (
              <FormField label="Department" error={errors.department || errors.departmentOther} T={T}>
                <select style={selectStyle(T, !!errors.department)} value={form.department}
                  onChange={e => { set("department", e.target.value); clrErr("department"); clrErr("departmentOther"); }}>
                  <option value="">— Select Department —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {form.department === "Others" && (
                  <input 
                    style={{ ...inputStyle(T, !!errors.departmentOther), marginTop:10 }} 
                    placeholder="Type your department name" 
                    value={form.departmentOther || ""} 
                    onChange={e => { set("departmentOther", e.target.value); clrErr("departmentOther"); }} 
                  />
                )}
              </FormField>
            )}
          </div>
          <button onClick={submit} disabled={busy || !registrationOpen} style={{ width:"100%", padding:"14px 20px", background: (busy || !registrationOpen) ? "#888" : `linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.navy} 120%)`, color:"#fff", border:"none", borderRadius:10, fontSize:15, fontWeight:600, cursor: (busy || !registrationOpen) ? "not-allowed" : "pointer", fontFamily:"'Cinzel', serif", letterSpacing:"0.05em", boxShadow: (busy || !registrationOpen) ? "none" : `0 4px 20px rgba(201,146,10,0.35)`, transition:"all 0.2s" }}>
            {!registrationOpen ? "Registration Closed" : (busy ? "Generating your ticket…" : "Register & Get My Ticket →")}
          </button>
        </div>
      </div>

      {/* Already registered? cross-link */}
      <div style={{ maxWidth:640, margin:"16px auto 0", textAlign:"center" }}>
        <p style={{ fontSize:12, color:T.textMuted, marginBottom:8 }}>Already registered and need your Attendee Card?</p>
        <a href="/card" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 22px", borderRadius:8, border:`1px solid ${T.dark ? "rgba(201,146,10,0.4)" : "rgba(201,146,10,0.5)"}`, color: T.dark ? BRAND.goldLight : BRAND.gold, fontSize:13, fontWeight:600, textDecoration:"none", background:"transparent" }}>
          🎨 Create Attendee Card →
        </a>
      </div>

      {/* ── RETRIEVE OLD TICKET ─────────────────────────────────────────── */}
      <RetrieveTicket onFound={onRegister} T={T} />

      <div style={{ maxWidth:640, margin:"16px auto 0", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12 }}>
        {[{ icon:"🎓", text:"Open to all delegates and guests" }, { icon:"🎫", text:"Instant QR ticket on submission" }].map(({ icon, text }) => (
          <div key={text} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, fontSize:12, color:T.textMuted }}>
            <span style={{ fontSize:20 }}>{icon}</span>{text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RETRIEVE EXISTING TICKET ─────────────────────────────────────────────────
// Delegates who already registered can look up their ticket by ID.
// This re-renders it with the latest visual design while keeping their original
// registration number, QR code, and all stored data intact.
function RetrieveTicket({ onFound, T }) {
  const [open, setOpen]     = useState(false);
  const [id, setId]         = useState("");
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState("");
  const [found, setFound]   = useState(null);

  const handleLookup = async () => {
    if (!id.trim()) return;
    setBusy(true); setErr(""); setFound(null);
    const reg = await fbLookupById(id.trim());
    setBusy(false);
    if (!reg) {
      setErr("No registration found for that ID. Check the code and try again.");
    } else {
      setFound(reg);
    }
  };

  const handleLoad = () => {
    // Pass the found record back to the parent as a "duplicate" so it shows
    // the TicketView with the existing data — no new record is created.
    onFound({ ...found, _forceTicket: true });
  };

  return (
    <div style={{ maxWidth:640, margin:"20px auto 0" }}>
      <button onClick={() => { setOpen(o => !o); setErr(""); setFound(null); setId(""); }}
        style={{ width:"100%", padding:"13px 20px",
          background:"transparent",
          border:`1px solid ${T.dark ? "rgba(26,58,107,0.55)" : "rgba(26,58,107,0.2)"}`,
          borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
          color: T.dark ? BRAND.goldLight : BRAND.navyDark,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          fontFamily:"'Cinzel', serif", letterSpacing:"0.03em" }}>
        <span>🔍 Already registered? Retrieve your ticket</span>
        <span style={{ fontSize:11, color:T.textMuted, fontFamily:"'Inter', sans-serif", fontWeight:400 }}>
          {open ? "▲ hide" : "▼ expand"}
        </span>
      </button>

      {open && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`,
          borderTop:"none", borderRadius:"0 0 10px 10px",
          padding:"20px 24px" }} className="fade-up">
          <p style={{ fontSize:12, color:T.textMuted, marginBottom:14, lineHeight:1.6 }}>
            Enter your <strong style={{ color: T.dark ? BRAND.goldLight : BRAND.navyDark }}>RLS ticket code</strong> (e.g. <span style={{ fontFamily:"monospace", color:BRAND.gold }}>RLS-A3F7KQ</span>) from your original registration. Your ticket ID and QR code stay exactly the same — but your <strong style={{ color: T.dark ? BRAND.goldLight : BRAND.navyDark }}>Ticket, Attendee Card, and Volunteer Tag</strong> will now render with the latest design and correct badges. Download or save them after loading.
          </p>
          <div style={{ display:"flex", gap:10, marginBottom: err || found ? 14 : 0 }}>
            <input
              style={{ ...inputStyle(T, !!err), flex:1, letterSpacing:"0.06em", textTransform:"uppercase" }}
              placeholder="e.g. RLS-A3F7KQ"
              value={id}
              onChange={e => { setId(e.target.value.toUpperCase()); setErr(""); setFound(null); }}
              onKeyDown={e => e.key === "Enter" && handleLookup()} />
            <button onClick={handleLookup} disabled={busy || !id.trim()}
              style={{ padding:"12px 20px", background:`linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`,
                color:"#fff", border:"none", borderRadius:8,
                fontSize:13, fontWeight:600, cursor: busy ? "not-allowed" : "pointer",
                whiteSpace:"nowrap", opacity: busy ? 0.6 : 1 }}>
              {busy ? "Looking…" : "Find →"}
            </button>
          </div>

          {err && (
            <div style={{ padding:"10px 14px", background:"rgba(192,57,43,0.08)",
              border:"1px solid rgba(192,57,43,0.3)", borderRadius:8,
              fontSize:12, color:"#c0392b" }}>❌ {err}</div>
          )}

          {found && (
            <div style={{ background: T.dark ? "rgba(255,255,255,0.04)" : "rgba(13,31,60,0.04)",
              border:`1px solid ${T.border}`, borderRadius:10, padding:"16px 18px" }}
              className="fade-up">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap", marginBottom:12 }}>
                <div>
                  <div style={{ fontFamily:"monospace", fontSize:12, color:BRAND.gold, letterSpacing:"0.1em", marginBottom:6 }}>{found.id}</div>
                  <div style={{ fontFamily:"'Cinzel', serif", fontSize:17, fontWeight:700, color:T.text, marginBottom:4 }}>{found.name}</div>
                  <div style={{ fontSize:12, color:T.textMuted }}>{found.position}</div>
                  {found.institution && <div style={{ fontSize:12, color:T.textMuted }}>{found.institution}</div>}
                </div>
                {found.badge && (
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
                    padding:"3px 8px", borderRadius:4, alignSelf:"flex-start",
                    background: found.badge === "EXTERNAL DELEGATE" ? "rgba(57,224,122,0.1)"
                      : found.badge === "DISTINGUISHED GUEST" ? "rgba(201,146,10,0.1)"
                      : "rgba(13,31,60,0.08)",
                    color: found.badge === "EXTERNAL DELEGATE" ? "#1a7a40"
                      : found.badge === "DISTINGUISHED GUEST" ? BRAND.gold : BRAND.navy,
                    border:`1px solid ${found.badge === "EXTERNAL DELEGATE" ? "rgba(57,224,122,0.3)"
                      : found.badge === "DISTINGUISHED GUEST" ? "rgba(201,146,10,0.3)" : T.border}` }}>
                    {found.badge}
                  </span>
                )}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, color:T.textMuted, marginBottom:14 }}>
                <span>{found.signedIn ? "✅ Already checked in" : "⏳ Not yet checked in"}</span>
                <span>·</span>
                <span>Registered {new Date(found.registeredAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</span>
              </div>
              <button onClick={handleLoad}
                style={{ width:"100%", padding:"12px 20px",
                  background:`linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.navy} 120%)`,
                  color:"#fff", border:"none", borderRadius:9,
                  fontSize:13, fontWeight:700, cursor:"pointer",
                  fontFamily:"'Cinzel', serif", letterSpacing:"0.04em",
                  boxShadow:`0 4px 20px rgba(201,146,10,0.3)` }}>
                🎫 Load Updated Ticket → Save, Print & Create Card
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormField({ label, error, children, T }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:600, color: T.dark ? BRAND.goldLight : BRAND.navy, textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:7 }}>{label}</label>
      {children}
      {error && <span style={{ fontSize:12, color:"#c0392b", marginTop:5, display:"block" }}>{error}</span>}
    </div>
  );
}

function inputStyle(T, hasErr) {
  return { width:"100%", padding:"12px 14px", background: T.dark ? "rgba(255,255,255,0.05)" : "rgba(13,31,60,0.04)", border:`1.5px solid ${hasErr ? "#c0392b" : T.border}`, borderRadius:8, color:T.text, fontSize:14, outline:"none", transition:"border-color 0.2s" };
}
function selectStyle(T, hasErr) {
  return { ...inputStyle(T, hasErr), cursor:"pointer", appearance:"none", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='${encodeURIComponent(BRAND.gold)}' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center", paddingRight:36 };
}

// ─── TICKET IMAGE DOWNLOAD (iOS/Mac safe) ─────────────────────────────────────
// window.print() is unreliable on iOS Safari and macOS Safari — it either opens
// a confusing system dialog or silently fails. Instead we render the ticket
// element to a canvas via html2canvas and download as a .jpg image.
// This works on every device/OS/browser with zero user confusion.
async function downloadTicketAsImage(elementId, filename) {
  try {
    // Dynamically load html2canvas only when needed
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const el = document.getElementById(elementId);
    if (!el) return;
    const canvas = await window.html2canvas(el, {
      scale: 2,           // 2× for retina sharpness
      useCORS: true,      // allow cross-origin images (logo)
      backgroundColor: "#ffffff",
      logging: false,
    });
    const url = canvas.toDataURL("image/jpeg", 0.95);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (e) {
    console.error("Ticket image download failed:", e);
    // Fallback to print dialog if html2canvas fails
    window.print();
  }
}

// ─── TICKET VIEW ──────────────────────────────────────────────────────────────
function TicketView({ ticket, onBack, onCreateCard, T }) {
  const badgeObj = getBadge(ticket.delegateType, T.dark);
  const [saving, setSaving] = useState(false);

  // Detect iOS / macOS Safari — these have the unreliable print-to-PDF UX
  const isApple = typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) &&
    (navigator.maxTouchPoints > 0 || /Safari/.test(navigator.userAgent));

  const handleSave = async () => {
    setSaving(true);
    const fname = `RUNSA-Summit-Ticket-${ticket.id}.jpg`;
    await downloadTicketAsImage("printable-ticket", fname);
    setSaving(false);
  };

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 20px" }}>
      <div style={{ maxWidth:620, margin:"0 auto" }}>
        {ticket._isDuplicate ? (
          <div style={{ background:"rgba(201,146,10,0.1)", border:"1px solid rgba(201,146,10,0.4)", color: T.dark ? BRAND.goldLight : BRAND.navyDark, padding:"14px 20px", borderRadius:10, marginBottom:24, fontSize:14, textAlign:"center", fontWeight:500, lineHeight:1.6 }} className="fade-up">
            ⚠️ You have already registered! Here is your existing ticket.<br /><span style={{ fontSize:12, opacity:0.7 }}>No new registration was created.</span>
          </div>
        ) : (
          <div style={{ background:"rgba(46,158,91,0.12)", border:"1px solid rgba(46,158,91,0.3)", color:"#2e9e5b", padding:"12px 20px", borderRadius:10, marginBottom:24, fontSize:14, textAlign:"center", fontWeight:500 }} className="fade-up">
            ✓ Registration successful! Your entry ticket is ready.
          </div>
        )}

        <div id="printable-ticket" style={{ background:"#ffffff", borderRadius:16, overflow:"hidden", boxShadow:"0 20px 64px rgba(0,0,0,0.25)", border:`1px solid ${BRAND.gold}44` }} className="fade-up-2">
          <div style={{ background:`linear-gradient(135deg, ${BRAND.navyDark}, ${BRAND.navy})`, padding:"clamp(16px,3vw,24px) clamp(20px,4vw,32px)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <div>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:10, color:BRAND.goldLight, letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:4 }}>RUNSA · Legislative Council</div>
              <div style={{ fontFamily:"'EB Garamond', serif", fontSize:"clamp(16px,3vw,22px)", fontWeight:600, color:BRAND.cream, marginBottom:4 }}>Legislative Summit 2026</div>
              <div style={{ fontSize:11, color:"rgba(245,240,232,0.55)" }}>29 April 2026 · Sapetro Lecture Theatre, Redeemer's University Nigeria</div>
            </div>
            <img src="/legislative-council-logo.jpg" alt="" style={{ width:"clamp(44px,8vw,60px)", height:"clamp(44px,8vw,60px)", borderRadius:"50%", objectFit:"cover", border:`2px solid ${BRAND.goldLight}55`, opacity:0.85 }} onError={e => e.target.style.display="none"} />
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", background:BRAND.cream, overflow:"hidden" }}>
            {Array.from({ length: 32 }).map((_, i) => <div key={i} style={{ width:9, height:9, borderRadius:"50%", background:BRAND.navyDark, flexShrink:0 }} />)}
          </div>

          <div style={{ padding:"clamp(20px,3vw,32px) clamp(20px,4vw,32px)", display:"flex", gap:"clamp(20px,4vw,36px)", alignItems:"center", flexWrap:"wrap", minHeight:280 }}>
            <div style={{ flex:1, minWidth:200, display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                <div style={{ fontFamily:"monospace", fontSize:13, color:BRAND.gold, fontWeight:700, letterSpacing:"0.12em" }}>{ticket.id}</div>
                {badgeObj && (
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", padding:"3px 8px", borderRadius:4, background:badgeObj.bg, color:badgeObj.color, border:`1px solid ${badgeObj.border}` }}>{badgeObj.label}</span>
                )}
              </div>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:"clamp(18px,3vw,24px)", fontWeight:700, color:BRAND.navyDark, lineHeight:1.2, textTransform:"uppercase" }}>{ticket.name}</div>
              <div style={{ fontSize:14, color:"#444", fontWeight:500 }}>{ticket.position}</div>
              {ticket.institution && <div style={{ fontSize:14, color:"#555" }}>{ticket.institution}</div>}
              {ticket.delegateType === "run-student" && (ticket.department || ticket.level) && (ticket.department || ticket.level) !== "N/A" && <div style={{ fontSize:13, color:"#777" }}>{ticket.department || ticket.level}</div>}
              <div style={{ fontSize:11, color:"#999" }}>Registered {new Date(ticket.registeredAt).toLocaleString("en-GB", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}</div>
            </div>
            <div style={{ textAlign:"center", flexShrink:0 }}>
              <QRCode data={ticket.qrURL} size={150} darkColor={BRAND.navyDark} />
              <div style={{ fontSize:9, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:8 }}>Scan to enter</div>
            </div>
          </div>

          <div style={{ background:"#ede8df", borderTop:"1px dashed rgba(0,0,0,0.12)", padding:"10px clamp(20px,4vw,32px)", fontSize:10, color:"#999", textAlign:"center" }}>
            This ticket is non-transferable · Present QR code at the entrance · RUNSA Legislative Summit 2026
          </div>
        </div>

        <div style={{ display:"flex", gap:12, marginTop:20, flexWrap:"wrap" }} className="fade-up-3">
          <button onClick={onCreateCard} style={{ flex:1, minWidth:160, padding:"14px 20px", background:`linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.navy} 120%)`, color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Cinzel', serif", letterSpacing:"0.04em", boxShadow:`0 4px 20px rgba(201,146,10,0.35)` }}>
            🎨 Create Attendee Card
          </button>

          {/* Primary download — canvas image (works on ALL devices including iOS/Mac) */}
          <button onClick={handleSave} disabled={saving}
            style={{ flex:1, minWidth:140, padding:"14px 20px",
              background: saving ? "#888" : `linear-gradient(135deg, ${BRAND.navyDark}, ${BRAND.navyMid})`,
              color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:600,
              cursor: saving ? "not-allowed" : "pointer", fontFamily:"'Cinzel', serif",
              boxShadow: saving ? "none" : "0 3px 14px rgba(10,22,40,0.3)" }}>
            {saving ? "⏳ Saving…" : "📥 Save Ticket"}
          </button>

          {/* Secondary — print/PDF (shown for non-Apple devices where it works reliably) */}
          {!isApple && (
            <button onClick={() => window.print()}
              style={{ flex:1, minWidth:120, padding:"14px 20px", background:"transparent",
                border:`1.5px solid ${T.border}`, color:T.dark ? BRAND.goldLight : BRAND.navy,
                borderRadius:10, fontSize:12, cursor:"pointer" }}>
              🖨 Print / PDF
            </button>
          )}

          <button onClick={onBack} style={{ flex:1, minWidth:130, padding:"14px 20px", background:"transparent", border:`1.5px solid ${T.border}`, color:T.dark ? BRAND.goldLight : BRAND.navy, borderRadius:10, fontSize:13, cursor:"pointer" }}>
            + Register Another
          </button>
        </div>

        {/* iOS/Safari hint */}
        {isApple && (
          <div style={{ marginTop:12, padding:"10px 16px", background:"rgba(201,146,10,0.07)", border:"1px solid rgba(201,146,10,0.25)", borderRadius:8, fontSize:11, color: T.dark ? BRAND.goldLight : BRAND.navyDark, textAlign:"center", lineHeight:1.6 }}>
            📱 Ticket saved as an image. To also save as PDF: tap <strong>Share → Print</strong> then pinch-zoom the preview to open in PDF viewer.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MANUAL CHECK-IN ──────────────────────────────────────────────────────────
function ManualCheckin({ onSignIn, T }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const handle = async () => {
    if (!input.trim() || busy) return;
    setBusy(true);
    const isOpen = await fbGetCheckinOpen();
    if (!isOpen) { setResult({ ok: false, reason: "locked", msg: "Check-in is currently closed. Please contact registration unit." }); setBusy(false); return; }
    const raw = input.trim();
    const id = raw.includes("checkin=") ? ((() => { try { return new URL(raw).searchParams.get("checkin"); } catch { return raw.split("checkin=")[1]; } })()) : raw.toUpperCase();
    const r = await onSignIn(id);
    setResult(r); setInput(""); setBusy(false);
    ref.current?.focus();
  };

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 20px" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:32 }} className="fade-up">
          <div style={{ fontFamily:"'Cinzel', serif", fontSize:"clamp(22px,4vw,32px)", fontWeight:700, color: T.dark ? BRAND.goldLight : BRAND.navyDark, marginBottom:8 }}>Manual Check-In</div>
          <p style={{ fontSize:13, color:T.textMuted, lineHeight:1.7 }}>Type a Ticket ID (e.g. <span style={{ fontFamily:"monospace", color:BRAND.gold }}>RLS-A3F7KQ</span>) and press Enter.<br />QR code scan signs in automatically.</p>
        </div>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"clamp(20px,4vw,36px)" }} className="fade-up-2">
          <div style={{ display:"flex", gap:10, marginBottom: result ? 24 : 0 }}>
            <input ref={ref} style={{ ...inputStyle(T, false), flex:1, fontSize:15 }} placeholder="Ticket ID or full check-in URL…" value={input} onChange={e => { setInput(e.target.value); setResult(null); }} onKeyDown={e => e.key === "Enter" && handle()} />
            <button onClick={handle} disabled={busy} style={{ padding:"12px 20px", background:`linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`, color:"#fff", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor: busy ? "not-allowed" : "pointer", whiteSpace:"nowrap" }}>{busy ? "…" : "Sign In"}</button>
          </div>
          {result && (
            <div style={{ padding:"20px", borderRadius:12, textAlign:"center", background: result.ok ? "rgba(46,158,91,0.08)" : result.reason==="already" ? "rgba(201,122,16,0.08)" : result.reason==="locked" ? "rgba(26,58,107,0.12)" : "rgba(192,57,43,0.08)", border:`1px solid ${result.ok ? "rgba(46,158,91,0.3)" : result.reason==="already" ? "rgba(201,122,16,0.3)" : result.reason==="locked" ? "rgba(26,58,107,0.4)" : "rgba(192,57,43,0.3)"}`, color: result.ok ? "#2e9e5b" : result.reason==="already" ? "#c97a10" : result.reason==="locked" ? "#7bafd4" : "#c0392b" }} className="fade-up">
              <div style={{ fontSize:40, marginBottom:8 }}>{result.ok ? "✅" : result.reason==="already" ? "⚠️" : result.reason==="locked" ? "🔒" : "❌"}</div>
              <div style={{ fontFamily:"'Cinzel', serif", fontSize:16, fontWeight:700, marginBottom:8 }}>{result.ok ? "Delegate Signed In" : result.reason==="already" ? "Already Signed In" : result.reason==="locked" ? "Check-In Locked" : "Ticket Not Found"}</div>
              {result.reason === "locked" && <div style={{ fontSize:13, color:T.textMuted, marginBottom:8 }}>{result.msg}</div>}
              {result.delegate && (<><div style={{ fontFamily:"'EB Garamond', serif", fontSize:20, fontWeight:600, color:T.text, marginBottom:4 }}>{result.delegate.name}</div><div style={{ fontSize:13, color:T.textMuted }}>{result.delegate.position} · {result.delegate.institution}</div>{result.ok && <div style={{ fontSize:12, color:T.textMuted, marginTop:6 }}>{new Date(result.delegate.signedInAt).toLocaleTimeString("en-GB")}</div>}</>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CHECKIN TOGGLE ───────────────────────────────────────────────────────────
function CheckinToggle({ checkinOpen, onToggle, superAdmin, T }) {
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);

  const handleToggleClick = () => {
    if (superAdmin) { onToggle(!checkinOpen); }
    else { setShowPin(true); setPin(""); setPinErr(false); }
  };

  const handlePinConfirm = () => {
    if (pin === CHECKIN_PIN) { setShowPin(false); setPin(""); onToggle(!checkinOpen); }
    else { setPinErr(true); }
  };

  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px 24px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Cinzel', serif", fontSize:14, fontWeight:700, color: T.dark ? BRAND.goldLight : BRAND.navyDark, marginBottom:4 }}>Check-In Gate</div>
          <div style={{ fontSize:12, color:T.textMuted }}>Controls whether delegates can scan their QR codes for entry.</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background: checkinOpen ? "#2e9e5b" : "#c0392b", animation: checkinOpen ? "greenPulse 2s infinite" : "none" }} />
            <span style={{ fontSize:12, fontWeight:600, color: checkinOpen ? "#2e9e5b" : "#c0392b" }}>{checkinOpen ? "OPEN" : "CLOSED"}</span>
          </div>
          <button onClick={handleToggleClick} style={{ padding:"8px 18px", borderRadius:7, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background: checkinOpen ? "rgba(192,57,43,0.12)" : "rgba(46,158,91,0.12)", color: checkinOpen ? "#c0392b" : "#2e9e5b", border: `1px solid ${checkinOpen ? "rgba(192,57,43,0.3)" : "rgba(46,158,91,0.3)"}` }}>
            {checkinOpen ? "Close Check-In" : "Open Check-In"}
          </button>
        </div>
      </div>
      {showPin && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12, color:T.textMuted, marginBottom:8 }}>Enter Check-In PIN to {checkinOpen ? "close" : "open"} gate:</div>
          <div style={{ display:"flex", gap:8 }}>
            <input type="password" value={pin} onChange={e => { setPin(e.target.value); setPinErr(false); }} onKeyDown={e => e.key === "Enter" && handlePinConfirm()} style={{ ...inputStyle(T, pinErr), maxWidth:180 }} placeholder="PIN" autoFocus />
            <button onClick={handlePinConfirm} style={{ padding:"10px 18px", background:`linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`, border:"none", borderRadius:7, color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>Confirm</button>
            <button onClick={() => setShowPin(false)} style={{ padding:"10px 14px", background:"transparent", border:`1px solid ${T.border}`, borderRadius:7, color:T.textMuted, fontSize:12, cursor:"pointer" }}>Cancel</button>
          </div>
          {pinErr && <div style={{ fontSize:12, color:"#c0392b", marginTop:6 }}>Incorrect PIN. Try again.</div>}
        </div>
      )}
    </div>
  );
}

// ─── REGISTRATION TOGGLE ──────────────────────────────────────────────────────
function RegistrationToggle({ registrationOpen, onToggle, superAdmin, T }) {
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);

  const handleToggleClick = () => {
    if (superAdmin) { onToggle(!registrationOpen); }
    else { setShowPin(true); setPin(""); setPinErr(false); }
  };

  const handlePinConfirm = () => {
    if (pin === SUPER_ADMIN_PIN) { setShowPin(false); setPin(""); onToggle(!registrationOpen); }
    else { setPinErr(true); }
  };

  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px 24px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Cinzel', serif", fontSize:14, fontWeight:700, color: T.dark ? BRAND.goldLight : BRAND.navyDark, marginBottom:4 }}>Registration Gate</div>
          <div style={{ fontSize:12, color:T.textMuted }}>Controls whether new delegates can register for the summit.</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background: registrationOpen ? "#2e9e5b" : "#c0392b", animation: registrationOpen ? "greenPulse 2s infinite" : "none" }} />
            <span style={{ fontSize:12, fontWeight:600, color: registrationOpen ? "#2e9e5b" : "#c0392b" }}>{registrationOpen ? "OPEN" : "CLOSED"}</span>
          </div>
          <button onClick={handleToggleClick} style={{ padding:"8px 18px", borderRadius:7, border:"none", cursor:"pointer", fontSize:12, fontWeight:600, background: registrationOpen ? "rgba(192,57,43,0.12)" : "rgba(46,158,91,0.12)", color: registrationOpen ? "#c0392b" : "#2e9e5b", border: `1px solid ${registrationOpen ? "rgba(192,57,43,0.3)" : "rgba(46,158,91,0.3)"}` }}>
            {registrationOpen ? "Close Registration" : "Open Registration"}
          </button>
        </div>
      </div>
      {showPin && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12, color:T.textMuted, marginBottom:8 }}>Enter Super Admin PIN to {registrationOpen ? "close" : "open"} registration:</div>
          <div style={{ display:"flex", gap:8 }}>
            <input type="password" value={pin} onChange={e => { setPin(e.target.value); setPinErr(false); }} onKeyDown={e => e.key === "Enter" && handlePinConfirm()} style={{ ...inputStyle(T, pinErr), maxWidth:180 }} placeholder="PIN" autoFocus />
            <button onClick={handlePinConfirm} style={{ padding:"10px 18px", background:`linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`, border:"none", borderRadius:7, color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer" }}>Confirm</button>
            <button onClick={() => setShowPin(false)} style={{ padding:"10px 14px", background:"transparent", border:`1px solid ${T.border}`, borderRadius:7, color:T.textMuted, fontSize:12, cursor:"pointer" }}>Cancel</button>
          </div>
          {pinErr && <div style={{ fontSize:12, color:"#c0392b", marginTop:6 }}>Incorrect PIN. Try again.</div>}
        </div>
      )}
    </div>
  );
}

// ─── STAT CARDS (animated countUp + quick filter) ────────────────────────────
function StatCards({ total, checkedIn, pending, onFilterCheckin, T }) {
  const animTotal    = useCountUp(total, 900);
  const animChecked  = useCountUp(checkedIn, 900);
  const animPending  = useCountUp(pending, 900);
  const animSpots    = useCountUp(450 - total, 900);
  const stats = [
    { label:"Total Registered", value:animTotal,   raw:total,     max:450,       accent:BRAND.gold,    click:null,        hint:"" },
    { label:"Checked In",       value:animChecked, raw:checkedIn, max:total||1,  accent:"#2e9e5b",     click:"checked",   hint:"Click to filter" },
    { label:"Pending Entry",    value:animPending, raw:pending,   max:total||1,  accent:"#c97a10",     click:"pending",   hint:"Click to filter" },
    { label:"Spots Remaining",  value:animSpots,   raw:450-total, max:450,       accent:BRAND.navyMid, click:null,        hint:"" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:12, marginBottom:24 }} className="fade-up-2">
      {stats.map(s => (
        <div key={s.label}
          onClick={() => s.click && onFilterCheckin(s.click)}
          style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px",
            cursor: s.click ? "pointer" : "default",
            transition:"transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => { if (s.click) { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.15)`; }}}
          onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>{s.label}</div>
            {s.hint && <div style={{ fontSize:8, color:s.accent, opacity:0.7, letterSpacing:"0.05em" }}>TAP</div>}
          </div>
          <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:36, color:s.accent, lineHeight:1 }}>{s.value}</div>
          <div style={{ marginTop:8, height:3, borderRadius:2, background: T.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
            <div style={{ height:"100%", borderRadius:2, background:s.accent,
              width:`${Math.min(100, (s.raw/(s.max||1))*100)}%`,
              transition:"width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminView({ regs, onReset, onDeleteDelegate, checkinOpen, onToggleCheckin, registrationOpen, onToggleRegistration, T }) {
  const [pinInput, setPinInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [superAdmin, setSuperAdmin] = useState(false);
  const [pinErr, setPinErr] = useState(false);
  const [search, setSearch] = useState("");
  const [filterInst, setFilterInst] = useState("");
  const [filterBadge, setFilterBadge] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [logoutTimer, setLogoutTimer] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null); // { count, total }
  const [filterDelegateType, setFilterDelegateType] = useState("");
  const [filterCheckinStatus, setFilterCheckinStatus] = useState(""); // "checked" | "pending" | ""
  const [sortField, setSortField] = useState("registeredAt");
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"
  const toggleSort = field => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  // Keyboard shortcuts
  const searchRef = useRef(null);
  useEffect(() => {
    if (!authed) return;
    const handler = e => {
      // Ctrl/Cmd + F → focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // Escape → clear all filters
      if (e.key === "Escape" && (search || filterInst || filterBadge || filterDelegateType || filterCheckinStatus)) {
        setSearch(""); setFilterInst(""); setFilterBadge("");
        setFilterDelegateType(""); setFilterCheckinStatus("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [authed, search, filterInst, filterBadge, filterDelegateType, filterCheckinStatus]);

  const LOGIN_TIMEOUT_MS = 60 * 60 * 1000;

  const handleLogin = () => {
    if (pinInput === SUPER_ADMIN_PIN) { setAuthed(true); setSuperAdmin(true); setPinErr(false); startLogoutTimer(); }
    else if (pinInput === ADMIN_PIN) { setAuthed(true); setSuperAdmin(false); setPinErr(false); startLogoutTimer(); }
    else setPinErr(true);
  };

  const startLogoutTimer = () => {
    const id = setTimeout(() => { setAuthed(false); setSuperAdmin(false); setPinInput(""); }, LOGIN_TIMEOUT_MS);
    setLogoutTimer(id);
  };

  const handleLogout = () => {
    if (logoutTimer) clearTimeout(logoutTimer);
    setAuthed(false); setSuperAdmin(false); setPinInput("");
  };

  if (!authed) return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 20px" }}>
      <div style={{ maxWidth:420, margin:"0 auto", background:T.surface, border:`1px solid ${T.border}`, borderRadius:18, padding:"36px", boxShadow: T.dark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 8px 40px rgba(13,31,60,0.1)" }} className="fade-up">
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:36, marginBottom:12 }}>🔐</div>
          <div style={{ fontFamily:"'Cinzel', serif", fontSize:20, fontWeight:700, color: T.dark ? BRAND.goldLight : BRAND.navyDark }}>Admin Access</div>
          <div style={{ fontSize:12, color:T.textMuted, marginTop:6 }}>Enter your admin PIN to access the dashboard</div>
        </div>
        <input type="password" style={{ ...inputStyle(T, pinErr), marginBottom:14, fontSize:16, textAlign:"center", letterSpacing:"0.2em" }} placeholder="Enter PIN" value={pinInput} onChange={e => { setPinInput(e.target.value); setPinErr(false); }} onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus />
        {pinErr && <div style={{ fontSize:12, color:"#c0392b", textAlign:"center", marginBottom:12 }}>Incorrect PIN.</div>}
        <button onClick={handleLogin} style={{ width:"100%", padding:"13px", background:`linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`, color:"#fff", border:"none", borderRadius:9, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'Cinzel', serif" }}>Access Dashboard</button>
      </div>
    </div>
  );

  // Canonical list of institutions already seen
  const canonicals = [];
  regs.forEach(r => {
    if (r.institution) {
      const c = canonicaliseInstitution(r.institution, canonicals);
      if (!canonicals.includes(c)) canonicals.push(c);
    }
  });

  const DELEGATE_TYPE_LABELS = {
    "external":          "External Delegate",
    "guest":             "Distinguished Guest",
    "runsa-lc-principal":"LC — Principal Officer",
    "runsa-lc-member":   "LC — Member",
    "runsa-exec":        "RUNSA Executive",
    "past-hon":          "Immediate Past LC",
    "run-student":       "RUN Student",
    "volunteer":         "Volunteer",
  };
  const allDelegateTypes = [...new Set(regs.map(r => r.delegateType).filter(Boolean))].sort();

  const baseFiltered = regs.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.name?.toLowerCase().includes(q) ||
      r.id?.toLowerCase().includes(q) ||
      r.position?.toLowerCase().includes(q) ||
      r.institution?.toLowerCase().includes(q);
    const matchInst = !filterInst || canonicaliseInstitution(r.institution || "", canonicals) === filterInst;
    const matchBadge = !filterBadge || (r.badge || "") === filterBadge;
    const matchType = !filterDelegateType || (r.delegateType || "") === filterDelegateType;
    const matchCheckin = !filterCheckinStatus || (filterCheckinStatus === "checked" ? r.signedIn : !r.signedIn);
    return matchSearch && matchInst && matchBadge && matchType && matchCheckin;
  });

  const filtered = [...baseFiltered].sort((a, b) => {
    let av, bv;
    if (sortField === "name")         { av = (a.name||"").toLowerCase(); bv = (b.name||"").toLowerCase(); }
    else if (sortField === "position"){ av = (a.position||"").toLowerCase(); bv = (b.position||"").toLowerCase(); }
    else if (sortField === "institution"){ av = (a.institution||"").toLowerCase(); bv = (b.institution||"").toLowerCase(); }
    else if (sortField === "checkin") { av = a.signedIn ? 1 : 0; bv = b.signedIn ? 1 : 0; }
    else /* registeredAt */           { av = a.registeredAt||""; bv = b.registeredAt||""; }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const total = regs.length;
  const checkedIn = regs.filter(r => r.signedIn).length;
  const pending = total - checkedIn;
  const badgeCounts = {};
  regs.forEach(r => { const b = r.badge || "Internal"; badgeCounts[b] = (badgeCounts[b] || 0) + 1; });

  const allBadges = [...new Set(regs.map(r => r.badge).filter(Boolean))];

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 20px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }} className="fade-up">
        <div>
          <div style={{ fontFamily:"'Cinzel', serif", fontSize:"clamp(20px,3vw,28px)", fontWeight:700, color: T.dark ? BRAND.goldLight : BRAND.navyDark }}>Admin Dashboard {superAdmin && <span style={{ fontSize:11, background:"rgba(201,146,10,0.15)", color:BRAND.gold, border:`1px solid rgba(201,146,10,0.3)`, padding:"2px 8px", borderRadius:4, marginLeft:8, letterSpacing:"0.06em" }}>SUPER</span>}</div>
          <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>RUNSA Legislative Summit 2026 — Registration Overview</div>
        </div>
        <button onClick={handleLogout} style={{ padding:"8px 16px", background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:7, fontSize:12, cursor:"pointer" }}>Sign Out</button>
      </div>

      {/* Stats — animated countUp, clickable quick-filter */}
      <StatCards total={total} checkedIn={checkedIn} pending={pending}
        onFilterCheckin={v => setFilterCheckinStatus(v)} T={T} />

      <CheckinToggle checkinOpen={checkinOpen} onToggle={onToggleCheckin} superAdmin={superAdmin} T={T} />
      <RegistrationToggle registrationOpen={registrationOpen} onToggle={onToggleRegistration} superAdmin={superAdmin} T={T} />

      {/* ── MIGRATION BANNER ── */}
      {(() => {
        const unmigrated = regs.filter(r => !r.badge);
        const needsMigration = unmigrated.length > 0;
        return (
          <div style={{ background: needsMigration
              ? (T.dark ? "rgba(201,146,10,0.08)" : "rgba(201,146,10,0.06)")
              : (T.dark ? "rgba(46,158,91,0.06)" : "rgba(46,158,91,0.04)"),
            border:`1px solid ${needsMigration ? "rgba(201,146,10,0.3)" : "rgba(46,158,91,0.25)"}`,
            borderRadius:12, padding:"14px 20px", marginBottom:20,
            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700,
                color: needsMigration ? (T.dark ? BRAND.goldLight : BRAND.gold) : "#2e9e5b",
                marginBottom:3 }}>
                {migrating ? "⏳ Migrating legacy records…"
                  : migrateResult ? `✅ ${migrateResult.count} of ${migrateResult.total} legacy records updated with badges & types`
                  : needsMigration ? `⚠ ${unmigrated.length} legacy record${unmigrated.length > 1 ? "s" : ""} missing badge/type data`
                  : "✅ All records have badge & delegate-type data"}
              </div>
              <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.5 }}>
                {needsMigration
                  ? "These were registered before the new delegate-type system. Click to auto-assign badges and types based on their position and institution."
                  : "Every registration includes delegate type and badge. Exports will show complete data."}
              </div>
            </div>
            {needsMigration && (
              <button
                disabled={migrating}
                onClick={async () => {
                  setMigrating(true); setMigrateResult(null);
                  const count = await fbMigrateLegacyBadges(regs, () => {});
                  setMigrating(false);
                  setMigrateResult({ count, total: unmigrated.length });
                  // Reload regs from Firebase to pick up the writes
                  const fresh = await fbLoadRegs();
                  const enriched = fresh.map(reg => {
                    if (reg.badge) return reg;
                    const inferred = inferDelegateType(reg);
                    if (!inferred) return reg;
                    return { ...reg, ...inferred, institution: normaliseInstitutionForMigration(reg.institution) };
                  });
                  // Trigger parent to refresh — update via onReset trick won't work; use window event
                  window.dispatchEvent(new CustomEvent("runsa-regs-refresh", { detail: enriched }));
                }}
                style={{ padding:"9px 20px", borderRadius:8, border:"none", cursor: migrating ? "not-allowed" : "pointer",
                  fontSize:12, fontWeight:700, fontFamily:"'Cinzel', serif", letterSpacing:"0.04em",
                  background: migrating ? "#888" : `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.navy})`,
                  color:"#fff", boxShadow: migrating ? "none" : "0 3px 14px rgba(201,146,10,0.3)",
                  whiteSpace:"nowrap" }}>
                {migrating ? "Migrating…" : `🔄 Migrate ${unmigrated.length} Records`}
              </button>
            )}
          </div>
        );
      })()}

      {/* ── FILTERS ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
        {/* Row 1: search + institution */}
        <input
          ref={searchRef}
          style={{ ...inputStyle(T, false), gridColumn:"1/-1", transition:"box-shadow 0.2s" }}
          placeholder="🔍  Search name, ID, position, institution…  (Ctrl+F)"
          value={search} onChange={e => setSearch(e.target.value)}
          onFocus={e => e.target.style.boxShadow = "0 0 0 3px rgba(201,146,10,0.15)"}
          onBlur={e => e.target.style.boxShadow = "none"} />
        {/* Row 2: institution + badge */}
        <select style={selectStyle(T, false)} value={filterInst} onChange={e => setFilterInst(e.target.value)}>
          <option value="">All Institutions</option>
          {canonicals.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={selectStyle(T, false)} value={filterBadge} onChange={e => setFilterBadge(e.target.value)}>
          <option value="">All Badge Types</option>
          {allBadges.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {/* Row 3: delegate type + check-in status */}
        <select style={selectStyle(T, false)} value={filterDelegateType} onChange={e => setFilterDelegateType(e.target.value)}>
          <option value="">All Delegate Types</option>
          {allDelegateTypes.map(dt => <option key={dt} value={dt}>{DELEGATE_TYPE_LABELS[dt] || dt}</option>)}
        </select>
        <select style={selectStyle(T, false)} value={filterCheckinStatus} onChange={e => setFilterCheckinStatus(e.target.value)}>
          <option value="">All Check-In Statuses</option>
          <option value="checked">✓ Checked In</option>
          <option value="pending">⏳ Pending Entry</option>
        </select>
      </div>
      {/* Active filter chips + clear button */}
      {(search || filterInst || filterBadge || filterDelegateType || filterCheckinStatus) && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontSize:11, color:T.textMuted, marginRight:2 }}>Active:</span>
          {search && <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background: T.dark ? "rgba(201,146,10,0.12)" : "rgba(201,146,10,0.08)", border:"1px solid rgba(201,146,10,0.3)", color: T.dark ? BRAND.goldLight : BRAND.gold }}>"{search}"</span>}
          {filterInst && <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background: T.dark ? "rgba(26,58,107,0.2)" : "rgba(26,58,107,0.06)", border:`1px solid ${T.border}`, color:T.text }}>📍 {filterInst.split(",")[0]}</span>}
          {filterBadge && <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background: T.dark ? "rgba(26,58,107,0.2)" : "rgba(26,58,107,0.06)", border:`1px solid ${T.border}`, color:T.text }}>🏷 {filterBadge}</span>}
          {filterDelegateType && <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background: T.dark ? "rgba(90,140,230,0.18)" : "rgba(26,58,107,0.06)", border:`1px solid rgba(90,140,230,0.35)`, color: T.dark ? "#a8c4f5" : BRAND.navyDark }}>{DELEGATE_TYPE_LABELS[filterDelegateType] || filterDelegateType}</span>}
          {filterCheckinStatus && <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background: filterCheckinStatus === "checked" ? "rgba(46,158,91,0.1)" : "rgba(201,122,16,0.1)", border:`1px solid ${filterCheckinStatus === "checked" ? "rgba(46,158,91,0.35)" : "rgba(201,122,16,0.35)"}`, color: filterCheckinStatus === "checked" ? "#2e9e5b" : "#c97a10" }}>{filterCheckinStatus === "checked" ? "✓ Checked In" : "⏳ Pending"}</span>}
          <button onClick={() => { setSearch(""); setFilterInst(""); setFilterBadge(""); setFilterDelegateType(""); setFilterCheckinStatus(""); }}
            style={{ fontSize:11, padding:"3px 12px", borderRadius:20, border:"1px solid rgba(192,57,43,0.35)", background:"rgba(192,57,43,0.06)", color:"#c0392b", cursor:"pointer", marginLeft:4, fontWeight:600 }}>
            ✕ Clear All
          </button>
        </div>
      )}

      {/* Download row — both admin levels can download */}
      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:11, color:T.textMuted, marginRight:4 }}>Export:</span>
        <button onClick={() => downloadCSV(filtered, `RUNSA-Summit-Delegates-${new Date().toISOString().slice(0,10)}.csv`)}
          style={{ padding:"7px 16px", background: T.dark ? "rgba(57,224,122,0.1)" : "rgba(26,58,107,0.06)",
            border:`1px solid ${T.dark ? "rgba(57,224,122,0.35)" : "rgba(26,58,107,0.2)"}`,
            color: T.dark ? "#39e07a" : BRAND.navyDark, borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
            display:"flex", alignItems:"center", gap:6 }}>
          📄 CSV ({filtered.length})
        </button>
        <button onClick={async () => { await downloadXLSX(filtered, `RUNSA-Summit-Delegates-${new Date().toISOString().slice(0,10)}.xlsx`); }}
          style={{ padding:"7px 16px", background: T.dark ? "rgba(201,146,10,0.1)" : "rgba(201,146,10,0.08)",
            border:`1px solid rgba(201,146,10,0.35)`,
            color: T.dark ? BRAND.goldLight : BRAND.gold, borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
            display:"flex", alignItems:"center", gap:6 }}>
          📊 Excel ({filtered.length})
        </button>
        <button onClick={() => downloadCSV(regs, `RUNSA-Summit-ALL-${new Date().toISOString().slice(0,10)}.csv`)}
          style={{ padding:"7px 16px", background:"transparent",
            border:`1px solid ${T.border}`,
            color: T.textMuted, borderRadius:7, fontSize:11, cursor:"pointer",
            display:"flex", alignItems:"center", gap:6 }}>
          📄 All CSV ({regs.length})
        </button>
        <button onClick={async () => { await downloadXLSX(regs, `RUNSA-Summit-ALL-${new Date().toISOString().slice(0,10)}.xlsx`); }}
          style={{ padding:"7px 16px", background:"transparent",
            border:`1px solid ${T.border}`,
            color: T.textMuted, borderRadius:7, fontSize:11, cursor:"pointer",
            display:"flex", alignItems:"center", gap:6 }}>
          📊 All Excel ({regs.length})
        </button>
      </div>

      <div style={{ fontSize:12, color:T.textMuted, marginBottom:12 }}>
        Showing {filtered.length} of {total} registrations
        {superAdmin && (
          <button onClick={() => setConfirmReset(true)} style={{ marginLeft:16, padding:"4px 12px", background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.3)", color:"#c0392b", borderRadius:6, fontSize:11, cursor:"pointer" }}>⚠ Reset All</button>
        )}
        {confirmReset && (
          <span style={{ marginLeft:8 }}>
            <span style={{ color:"#c0392b", fontWeight:600, marginRight:8 }}>Delete ALL {total} records?</span>
            <button onClick={async () => { await onReset(); setConfirmReset(false); }} style={{ padding:"4px 10px", background:"#c0392b", border:"none", color:"#fff", borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer", marginRight:6 }}>Yes, Reset</button>
            <button onClick={() => setConfirmReset(false)} style={{ padding:"4px 8px", background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:5, fontSize:11, cursor:"pointer" }}>Cancel</button>
          </span>
        )}
      </div>

      <DelegateTable filtered={filtered} superAdmin={superAdmin} onDeleteDelegate={onDeleteDelegate} T={T} search={search} sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
    </div>
  );
}

// Highlight matching search text
function HighlightText({ text, query, style }) {
  if (!query || !text) return <span style={style}>{text}</span>;
  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <span style={style}>{text}</span>;
  return <span style={style}>
    {text.slice(0, idx)}
    <mark style={{ background:"rgba(232,184,75,0.45)", color:"inherit", borderRadius:2, padding:"0 1px" }}>{text.slice(idx, idx + query.length)}</mark>
    {text.slice(idx + query.length)}
  </span>;
}

function DelegateTable({ filtered, superAdmin, onDeleteDelegate, T, search = "", sortField, sortDir, onSort }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  
  const SortIcon = ({ field }) => {
    const active = sortField === field;
    return <span style={{ marginLeft:4, opacity: active ? 1 : 0.3, fontSize:9 }}>{active && sortDir === "desc" ? "▼" : "▲"}</span>;
  };
  
  const SortTh = ({ field, label, style }) => (
    <th onClick={() => onSort && onSort(field)}
      style={{ padding:"12px 16px", textAlign:"left", fontSize:9, fontWeight:700,
        color: T.dark ? BRAND.goldLight : BRAND.navy, textTransform:"uppercase",
        letterSpacing:"0.09em", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap",
        cursor:"pointer", userSelect:"none", transition:"color 0.15s",
        ...style }}>
      {label}<SortIcon field={field} />
    </th>
  );

  const BadgeChip = ({ badge }) => {
    const badgeObj = badge ? getBadge(
      badge === "EXTERNAL DELEGATE" ? "external" :
      badge === "DISTINGUISHED GUEST" ? "guest" :
      badge === "PAST HONOURABLE" ? "past-hon" :
      badge === "VOLUNTEER" ? "volunteer" :
      badge === "DELEGATE" ? "run-student" :
      badge === "RUNSA OFFICIAL" ? "runsa-exec" : null,
      T.dark
    ) : null;
    if (!badgeObj) return <span style={{ fontSize:10, color:T.textMuted }}>—</span>;
    return (
      <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", padding:"3px 7px", borderRadius:4, background:badgeObj.bg, color:badgeObj.color, border:`1px solid ${badgeObj.border}` }}>{badgeObj.label}</span>
    );
  };

  return (
    <div>
      {/* Desktop table */}
      <div className="hide-on-mobile" style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
          <thead>
            <tr style={{ background: T.dark ? "rgba(255,255,255,0.03)" : "rgba(13,31,60,0.03)" }}>
              <th style={{ padding:"12px 16px", textAlign:"left", fontSize:9, fontWeight:700, color: T.dark ? BRAND.goldLight : BRAND.navy, textTransform:"uppercase", letterSpacing:"0.09em", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>ID</th>
              <SortTh field="name" label="Name" />
              <SortTh field="institution" label="Institution" />
              <th style={{ padding:"12px 16px", textAlign:"left", fontSize:9, fontWeight:700, color: T.dark ? BRAND.goldLight : BRAND.navy, textTransform:"uppercase", letterSpacing:"0.09em", borderBottom:`1px solid ${T.border}` }}>Department</th>
              <SortTh field="position" label="Position" />
              <th style={{ padding:"12px 16px", textAlign:"left", fontSize:9, fontWeight:700, color: T.dark ? BRAND.goldLight : BRAND.navy, textTransform:"uppercase", letterSpacing:"0.09em", borderBottom:`1px solid ${T.border}` }}>Badge</th>
              <SortTh field="registeredAt" label="Date" />
              <SortTh field="checkin" label="Check-In" />
              <th style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}` }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding:"40px", textAlign:"center", color:T.textMuted, fontSize:14 }}>No registrations found.</td></tr>}
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ borderBottom:`1px solid ${T.border}`, background: r.signedIn ? (T.dark ? "rgba(46,158,91,0.04)" : "rgba(46,158,91,0.03)") : i % 2 === 0 ? "transparent" : T.dark ? "rgba(255,255,255,0.01)" : "rgba(13,31,60,0.01)" }}>
                <td style={{ padding:"12px 16px", fontFamily:"monospace", fontSize:12, color:BRAND.gold, letterSpacing:"0.08em", whiteSpace:"nowrap" }}>{r.id}</td>
                <td style={{ padding:"12px 16px", fontWeight:600, color:T.text }}><HighlightText text={r.name} query={search} /></td>
                <td style={{ padding:"12px 16px", fontSize:13, color:T.textMuted }}>{r.institution}</td>
                <td style={{ padding:"12px 16px", fontSize:13, color:T.textMuted }}>{r.department || r.level}</td>
                <td style={{ padding:"12px 16px", fontSize:13, color:T.textMuted }}>{r.position}</td>
                <td style={{ padding:"8px 16px" }}><BadgeChip badge={r.badge} /></td>
                <td style={{ padding:"12px 16px", fontSize:12, color:T.textMuted, whiteSpace:"nowrap" }}>{new Date(r.registeredAt).toLocaleDateString("en-GB")}</td>
                <td style={{ padding:"12px 16px" }}>
                  {r.signedIn ? (
                    <span style={{ display:"inline-block", padding:"4px 10px", background:"rgba(46,158,91,0.12)", border:"1px solid rgba(46,158,91,0.3)", color:"#2e9e5b", borderRadius:5, fontSize:11, fontWeight:600, lineHeight:1.7 }}>✓ Checked In<br /><span style={{ fontSize:10, opacity:0.8 }}>{new Date(r.signedInAt).toLocaleTimeString("en-GB")}</span></span>
                  ) : (
                    <span style={{ display:"inline-block", padding:"4px 10px", background:"rgba(201,122,16,0.1)", border:"1px solid rgba(201,122,16,0.3)", color:"#c97a10", borderRadius:5, fontSize:11, fontWeight:600 }}>⏳ Pending</span>
                  )}
                </td>
                <td style={{ padding:"8px 16px" }}>
                  {superAdmin && (confirmDeleteId === r.id ? (
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <span style={{ fontSize:11, color:"#c0392b", fontWeight:600 }}>Delete?</span>
                      <button onClick={() => { onDeleteDelegate(r.id); setConfirmDeleteId(null); }} style={{ padding:"4px 10px", background:"#c0392b", border:"none", color:"#fff", borderRadius:5, fontSize:11, fontWeight:700, cursor:"pointer" }}>Yes</button>
                      <button onClick={() => setConfirmDeleteId(null)} style={{ padding:"4px 8px", background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:5, fontSize:11, cursor:"pointer" }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(r.id)} style={{ padding:"5px 10px", background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.3)", color:"#c0392b", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer" }}>✕ Delete</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="show-mobile" style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.length === 0 && <div style={{ textAlign:"center", padding:"40px 20px", color:T.textMuted, fontSize:14 }}>No registrations found.</div>}
        {filtered.map(r => (
          <div key={r.id} style={{ background:T.surface, border:`1px solid ${r.signedIn ? "rgba(46,158,91,0.35)" : T.border}`, borderRadius:12, padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontFamily:"monospace", fontSize:12, color:BRAND.gold, fontWeight:700, letterSpacing:"0.08em" }}>{r.id}</span>
              {r.signedIn ? <span style={{ padding:"3px 10px", background:"rgba(46,158,91,0.12)", border:"1px solid rgba(46,158,91,0.3)", color:"#2e9e5b", borderRadius:20, fontSize:11, fontWeight:600 }}>✓ Checked In</span> : <span style={{ padding:"3px 10px", background:"rgba(201,122,16,0.1)", border:"1px solid rgba(201,122,16,0.3)", color:"#c97a10", borderRadius:20, fontSize:11, fontWeight:600 }}>⏳ Pending</span>}
            </div>
            <div style={{ fontFamily:"'Cinzel', serif", fontSize:16, fontWeight:700, color:T.text, marginBottom:4 }}>{r.name}</div>
            {r.badge && <div style={{ marginBottom:6 }}><BadgeChip badge={r.badge} /></div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px", marginBottom:8 }}>
              {[["Institution", r.institution],["Department", (r.department || r.level) && (r.department || r.level) !== "N/A" ? (r.department || r.level) : "—"],["Position", r.position],["Registered", new Date(r.registeredAt).toLocaleDateString("en-GB")]].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize:9, color: T.dark ? BRAND.goldLight : BRAND.navy, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>{label}</div>
                  <div style={{ fontSize:12, color:T.textMuted, marginTop:1 }}>{value}</div>
                </div>
              ))}
            </div>
            {r.signedIn && r.signedInAt && <div style={{ fontSize:11, color:"#2e9e5b", marginTop:6, borderTop:"1px solid rgba(46,158,91,0.2)", paddingTop:6 }}>Checked in at {new Date(r.signedInAt).toLocaleTimeString("en-GB")}</div>}
            {superAdmin && (
              <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}` }}>
                {confirmDeleteId === r.id ? (
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"#c0392b", fontWeight:600 }}>Confirm delete?</span>
                    <button onClick={() => { onDeleteDelegate(r.id); setConfirmDeleteId(null); }} style={{ padding:"5px 12px", background:"#c0392b", border:"none", color:"#fff", borderRadius:6, fontSize:12, fontWeight:700, cursor:"pointer" }}>Yes, Delete</button>
                    <button onClick={() => setConfirmDeleteId(null)} style={{ padding:"5px 10px", background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, borderRadius:6, fontSize:12, cursor:"pointer" }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(r.id)} style={{ padding:"6px 14px", background:"rgba(192,57,43,0.08)", border:"1px solid rgba(192,57,43,0.3)", color:"#c0392b", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer" }}>✕ Delete Registration</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
