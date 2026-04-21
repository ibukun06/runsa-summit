import { useState, useEffect, useRef, useCallback, createContext, useContext, memo } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
//  RUNSA LEGISLATIVE SUMMIT 2026 — COMPLETE DIGITAL PROGRAMME v3.0
//  Single-file · All-in-one · Theme-aware · Fully Animated · Mobile-first
// ═══════════════════════════════════════════════════════════════════════════════

const ThemeCtx = createContext({ isDark: true, toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

// ─── BRAND PALETTES ───────────────────────────────────────────────────────────
const DARK = {
  bg: "#030810", bgMid: "#060d1a", bgSurface: "rgba(6,10,20,0.82)", bgCard: "rgba(6,13,26,0.92)",
  navy: "#0a1628", navyMid: "#1a3a6b", navyDeep: "#030810",
  gold: "#c9920a", goldLight: "#e8b84b", goldPale: "#f5d57a",
  green: "#39e07a", greenDim: "rgba(57,224,122,0.12)",
  cream: "#f5f0e8", textMuted: "rgba(245,240,232,0.72)", textFaint: "rgba(245,240,232,0.42)",
  purple: "#c4a8f5", blue: "#7ab8f5", red: "#f56b5b",
  border: "rgba(26,58,107,0.45)", borderGold: "rgba(201,146,10,0.35)",
  glass: "rgba(6,10,20,0.92)", glassBlur: "blur(24px) saturate(180%)",
  shadowCard: "0 8px 32px rgba(0,0,0,0.5)", shadowGold: "0 0 30px rgba(201,146,10,0.22)",
};
const LIGHT = {
  bg: "#f5f0e8", bgMid: "#ede8e0", bgSurface: "rgba(255,255,255,0.92)", bgCard: "rgba(255,255,255,0.97)",
  navy: "#1a3a6b", navyMid: "#2a5298", navyDeep: "#f5f0e8",
  gold: "#8a6200", goldLight: "#a07800", goldPale: "#7a5c00",
  green: "#1a7a4a", greenDim: "rgba(26,122,74,0.12)",
  cream: "#1a1a2e", textMuted: "rgba(26,26,46,0.72)", textFaint: "rgba(26,26,46,0.48)",
  purple: "#6b3fa0", blue: "#1a4a8a", red: "#c0392b",
  border: "rgba(26,58,107,0.22)", borderGold: "rgba(138,98,0,0.35)",
  glass: "rgba(245,240,232,0.96)", glassBlur: "blur(20px) saturate(150%)",
  shadowCard: "0 8px 32px rgba(26,58,107,0.12)", shadowGold: "0 0 24px rgba(138,98,0,0.18)",
};

// ─── IMAGE PATHS ──────────────────────────────────────────────────────────────
// Save images to public/ folder:
//  /public/speakers/        → sobadu-oluwanifemi.jpg/.png, rt-hon-adewale.jpg/.png, hon-adewunmi.jpg/.png
//                              hon-kasope.jpg/.png, hon-abiola.jpg/.png, hon-anisere.jpg/.png, dr-lanre.jpg/.png
//                              akinola-boluwatife.jpg/.png, odunsi-oluwatobiloba.jpg/.png, ayodele-olamilekun.jpg/.png
//                              chief-whip.jpg/.png (Hon. Oluwafemi Ibukunoluwa)
//  /public/patrons/         → patron-vc.jpg/.png (Prof. Shedrach), patron-dean.jpg/.png (Prof. Adesina)
//  /public/gallery/         → gallery-1.jpg/.png … gallery-12.jpg/.png (PNG gives clearer quality)
//  /public/institutions/    → ui-logo.png, lasu-logo.png, bu-logo.png, au-logo.png,
//                              jabu-logo.png, uniosun-logo.png, yabatech-logo.png, oau-logo.png, cu-logo.png
//  /public/council-logo.png → RUNSA Legislative Council official logo (replaces "LS" text in nav/footer)
//  All images: JPG or PNG supported. PNG recommended for logos and clearer photos. Max 400KB each.
const SP = "/speakers";
const PA = "/patrons";
const GA = "/gallery";
const INST = "/institutions";

// Council logo — place your official logo at /public/council-logo.png
// If the file is missing the "LS" text badge will be shown as fallback.
const COUNCIL_LOGO = "/council-logo.png";

// ─── PEOPLE DATA ──────────────────────────────────────────────────────────────
const PEOPLE = {
  profShedrach: {
    id: "prof-shedrach", name: "Prof. Shedrach Oluwafemi Akindele",
    role: "Vice Chancellor, Redeemer's University, Ede", title: "Prof.",
    institution: "Redeemer's University, Ede",
    image: `${PA}/patron-vc.jpg`,
    bio: "Distinguished academic, visionary administrator, and Chief Patron of the inaugural RUNSA Legislative Summit 2026. Prof. Akindele's commitment to student-led governance and institutional excellence has been foundational to this entire initiative. As Vice Chancellor, his leadership exemplifies the transformative power of democratic values in education, and his presence at the Awards Presentation honours the outstanding delegates of this historic day.",
    initials: "SA", category: "patron", featured: false,
  },
  sobadu: {
    id: "sobodu-oluwanifemi", name: "Rt. Hon. Sobodu Oluwanifemi Oladipupo",
    role: "Speaker, RUNSA Legislative Council", title: "Rt. Hon.",
    institution: "Redeemer's University, Ede",
    image: `${SP}/sobodu-oluwanifemi.jpg`,
    bio: "An eloquent and visionary leader of the RUNSA Legislative Council. Rt. Hon. Sobodu Oluwanifemi brings unmatched oratory and institutional drive to student governance. His passion for democratic student representation and welfare reform has made him a standout figure in campus legislative circles. As the presiding Speaker of the Council, he officially welcomes all delegates and dignitaries to this landmark summit.",
    initials: "SO", category: "speaker", featured: true,
  },
  rtHonAdewale: {
    id: "rt-hon-adewale", name: "Rt. Hon. Adewale Olumide Egbedun",
    role: "Main Keynote Speaker — Speaker 5", title: "Rt. Hon.",
    institution: "",
    image: `${SP}/rt-hon-adewale.jpg`,
    bio: "The summit's headline speaker, Rt. Hon. Egbedun brings charismatic leadership and razor-sharp legislative acumen to the podium. His keynote address — the summit's centrepiece — promises a powerful, transformative exploration of the role of student legislation in national development and the future of democratic leadership in Nigeria. A figure whose words have the rare ability to move minds and shift narratives.",
    initials: "AE", category: "speaker", featured: true,
  },
  honAdewunmi: {
    id: "hon-adewunmi", name: "Hon. Adewunmi Adeyemi Irekandu",
    role: "Keynote Speaker 1", title: "Hon.",
    institution: "",
    image: `${SP}/hon-adewunmi.jpg`,
    bio: "Opening the day's keynote addresses, Hon. Irekandu sets the intellectual tone of the summit with a compelling exploration of the architecture of sustainable student governance and the legislative frameworks that drive meaningful change. His meticulous research and gifted communication consistently yield practical, transferable insights for building stronger student institutions.",
    initials: "AI", category: "speaker", featured: true,
  },
  honKasope: {
    id: "hon-kasope", name: "Hon. Prince Dr. Kasope Ajibade Abolarin",
    role: "Keynote Speaker 2", title: "Hon. Prince Dr.",
    institution: "",
    image: `${SP}/hon-kasope.jpg`,
    bio: "A distinguished speaker and legislator, renowned for his deep understanding of legislative oversight in student unions — its mechanisms, its power, and its broader implications for accountable and transparent leadership. His academic and practical research in student union governance has made him a respected and formidable voice whose address promises to be one of the summit's most insightful sessions.",
    initials: "KA", category: "speaker", featured: true,
  },
  honAbiola: {
    id: "hon-abiola", name: "Hon. Abiola Jeremiah Awoyeye",
    role: "Keynote Speaker 3", title: "Hon.",
    institution: "",
    image: `${SP}/hon-abiola.jpg`,
    bio: "A tech-forward thinker and dynamic speaker who bridges traditional governance with modern innovation. Hon. Awoyeye's address brings a visionary perspective on digital transformation in legislative processes and the frameworks needed for building productive cross-institutional collaboration. He also anchors the Legislative Trivia Quiz segments, bringing fresh energy to every moment he leads.",
    initials: "AA", category: "speaker", featured: true,
  },
  drLanre: {
    id: "dr-lanre", name: "Dr. Lanre Oyegbola Sodipo",
    role: "Keynote Speaker 4 — Policy Expert", title: "Dr.",
    institution: "",
    image: `${SP}/dr-lanre.jpg`,
    bio: "A celebrated policy expert whose experience in governance reform, policy formulation, and leadership development has made him a sought-after voice at national forums. Dr. Sodipo's keynote is a masterclass in visionary thinking and decisive action — delivering rich insights on policy-making for the next generation of leaders. A panelist whose intellectual range and depth consistently elevate every stage he graces.",
    initials: "LS", category: "speaker", featured: true,
  },
  honAnisere: {
    id: "hon-anisere", name: "Hon. Anisere",
    role: "Speaker 6 — House Sitting Presiding Officer", title: "Hon.",
    institution: "",
    image: `${SP}/hon-anisere.jpg`,
    bio: "Presiding officer of the summit's marquee House Sitting session, Hon. Anisere commands the chamber with precision and decorum. Demonstrating live parliamentary procedures at the highest standard, this immersive session showcases motion debates, real-time resolution passing, and democratic practice in action — an unforgettable live legislative experience for every delegate in attendance.",
    initials: "AN", category: "speaker", featured: true,
  },
  akinolaBoluwatife: {
    id: "akinola-boluwatife", name: "Miss Akinola Boluwatife",
    role: "Chapel President, Redeemer's University", title: "Miss",
    institution: "Redeemer's University, Ede",
    image: `${SP}/akinola-boluwatife.jpg`,
    bio: "Chapel President leading the spiritual community of Redeemer's University with grace and dedication. She sets the tone for this historic summit with an opening prayer that reminds every delegate of the spiritual foundation underpinning their pursuit of excellence and democratic leadership.",
    initials: "AB", category: "performer", featured: false,
  },
  odunsiOluwatobiloba: {
    id: "odunsi-oluwatobiloba", name: "Hon. Odunsi Oluwatobiloba Eriifeoluwa",
    role: "Chairperson, Planning Committee", title: "Hon.",
    institution: "Redeemer's University, Ede",
    image: `${SP}/odunsi-oluwatobiloba.jpg`,
    bio: "As Chairperson of the Planning Committee, Hon. Odunsi has been the driving force behind the seamless organisation of the RUNSA Legislative Summit 2026. Her meticulous leadership, tireless coordination, and sharp attention to detail have ensured every aspect of this summit reflects excellence. She steps into the spotlight during the Appreciation of Sponsors to publicly recognise the generous partners who made this day possible.",
    initials: "OT", category: "appreciation", featured: false,
  },
  ayodeleOlamilekun: {
    id: "ayodele-olamilekun", name: "Hon. Ayodele Olamilekan",
    role: "Deputy Speaker, RUNSA Legislative Council", title: "Hon.",
    institution: "Redeemer's University, Ede",
    image: `${SP}/ayodele-olamilekun.jpg`,
    bio: "A distinguished member and Deputy Speaker of the RUNSA Legislative Council, charged with delivering the summit's closing Vote of Thanks — a moment of collective gratitude that closes this landmark event on a note of appreciation, unity, and hope for the future of student legislative excellence. His eloquence and warmth embody everything this summit stands for.",
    initials: "AO", category: "appreciation", featured: false,
  },
};

// ─── PATRONS ──────────────────────────────────────────────────────────────────
const PATRONS = [
  {
    id: "patron-vc",
    name: "Prof. Shedrach Oluwafemi Akindele",
    title: "Chief Patron",
    role: "Vice Chancellor, Redeemer's University, Ede",
    image: `${PA}/patron-vc.jpg`,
    initials: "SA",
    bio: "Distinguished academic, visionary administrator, and Chief Patron of the inaugural RUNSA Legislative Summit 2026. Prof. Akindele's unwavering belief in student-led governance and institutional excellence has been the cornerstone of this entire initiative. As Vice Chancellor of Redeemer's University, his leadership exemplifies the transformative power of democratic values in education, and his presence as Awards presenter honours the outstanding delegates of this historic gathering.",
  },
  {
    id: "patron-dean",
    name: "Prof. Olanrewaju Adesina",
    title: "Patron",
    role: "Dean, Faculty of Engineering, Redeemer's University",
    image: `${PA}/patron-dean.jpg`,
    initials: "OA",
    bio: "A distinguished academic leader and esteemed Patron of the RUNSA Legislative Summit 2026. Prof. Adesina's generous support as Dean of the Faculty of Engineering — whose world-class Sapetro Lecture Theatre proudly hosts this historic summit — reflects his deep commitment to nurturing the holistic development of students beyond the classroom. His encouragement of student-led initiatives is an inspiration to all.",
  },
];

// ─── PLANNING COMMITTEE LEADERS (with photo cards) ────────────────────────────
const COMMITTEE_LEADERS = [
  { id: "pcl-speaker", name: "Rt. Hon. Sobodu Oluwanifemi", role: "Hon. Speaker, RUNSA Legislative Council", initials: "SO", image: `${SP}/sobadu-oluwanifemi.jpg` },
  { id: "pcl-dep", name: "Hon. Ayodele Olamilekan", role: "Hon. Deputy Speaker, RUNSA Legislative Council", initials: "AO", image: `${SP}/ayodele-olamilekun.jpg` },
  { id: "pcl-whip", name: "Hon. Oluwafemi Ibukunoluwa", role: "Chief Whip, RUNSA Legislative Council", initials: "OI", image: `${SP}/chief-whip.jpg` },
  { id: "pcl-chair", name: "Hon. Odunsi Oluwatobiloba", role: "Chairperson, Planning Committee", initials: "OT", image: `${SP}/odunsi-oluwatobiloba.jpg` },
];

// ─── PLANNING COMMITTEE UNITS (listed, no photos) ─────────────────────────────
const COMMITTEE_UNITS = [
  {
    unit: "Secretariat",
    members: [
      { name: "Hon. Adesina Emmanuel", role: "Deputy Chairperson, Planning Committee" },
      { name: "Hon. Benedict Enoch", role: "Legislative Secretary, RUNSA Legislative Council" },
      { name: "Hon. Dosumu Oluwafikayomi", role: "Secretary, Planning Committee" },
    ],
  },
  {
    unit: "Anchors",
    members: [{ name: "Hon. Adeniyi Temiloluwa", role: "Team Head" }],
  },
  {
    unit: "Registration",
    members: [
      { name: "Hon. Adegboye David", role: "Team Head" },
      { name: "Hon. Fawole Oreoluwanimi", role: "Assistant" },
    ],
  },
  {
    unit: "Welfare",
    members: [
      { name: "Hon. Olopade Eniola", role: "Team Head" },
      { name: "Adigwe Valerie", role: "Team Head" },
    ],
  },
  {
    unit: "Hospitality",
    members: [{ name: "Hon. Ikonne Precious", role: "Team Head" }],
  },
  {
    unit: "Logistics",
    members: [
      { name: "Hon. Tony Oghena Perpetual", role: "Team Head" },
      { name: "Hon. Michael Taylor", role: "Assistant" },
    ],
  },
  {
    unit: "Team Tech",
    members: [{ name: "Hon. Kala-Dappa Ibinabo", role: "Team Head" }],
  },
  {
    unit: "Publicity",
    members: [{ name: "Hon. Akinola Daniel", role: "Team Head" }],
  },
];

// ─── SESSION CATEGORY STYLES ──────────────────────────────────────────────────
const CAT_STYLES = {
  "main-stage":  { bg: "rgba(201,146,10,0.13)",  border: "rgba(201,146,10,0.4)",  text: "#e8b84b", label: "MAIN STAGE" },
  "ceremonial":  { bg: "rgba(26,58,107,0.2)",    border: "rgba(26,58,107,0.55)",  text: "#7ab8f5", label: "CEREMONIAL" },
  "interactive": { bg: "rgba(57,224,122,0.09)",  border: "rgba(57,224,122,0.35)", text: "#39e07a", label: "INTERACTIVE" },
  "networking":  { bg: "rgba(196,168,245,0.1)",  border: "rgba(196,168,245,0.35)",text: "#c4a8f5", label: "NETWORKING" },
};

// ─── ORDER OF SERVICE ─────────────────────────────────────────────────────────
const SESSIONS = [
  {
    id: "red-carpet", start: "09:00", end: "09:45",
    title: "Red Carpet & Registration",
    desc: "Welcome of delegates from all invited institutions. Collect your summit badge and materials, make connections, and soak in the atmosphere of this historic gathering. Photography and networking encouraged.",
    cat: "ceremonial", people: [],
  },
  {
    id: "opening-prayer", start: "09:45", end: "09:50",
    title: "Opening Prayer",
    desc: "A solemn invocation to open the summit in the spirit of wisdom, purpose, and excellence — led by the Chapel President of Redeemer's University.",
    cat: "ceremonial", people: ["akinolaBoluwatife"],
  },
  {
    id: "anthems", start: "09:50", end: "09:57",
    title: "National & School Anthem",
    desc: "Solemn rendition of the Nigerian National Anthem followed by the Redeemer's University School Anthem — a reminder of our roots and our shared aspiration.",
    cat: "ceremonial", people: [],
  },
  {
    id: "welcome", start: "09:57", end: "10:02",
    title: "Welcome Address",
    desc: "The official welcome address to all delegates, distinguished guests, and honoured patrons of the inaugural RUNSA Legislative Summit — delivered by the Speaker of the Legislative Council.",
    cat: "ceremonial", people: ["sobadu"],
  },
  {
    id: "recognition", start: "10:02", end: "10:09",
    title: "Recognition of Dignitaries",
    desc: "Formal introduction and recognition of all distinguished guests, dignitaries, and principal officers gracing this summit with their presence and support.",
    cat: "ceremonial", people: [],
  },
  {
    id: "speaker-1", start: "10:09", end: "10:34",
    title: "Keynote Address — Speaker 1",
    desc: "Opening keynote exploring the architecture of sustainable student governance and the legislative frameworks that drive meaningful change across Nigerian universities.",
    cat: "main-stage", people: ["honAdewunmi"],
  },
  {
    id: "trivia-1", start: "10:34", end: "10:49",
    title: "Legislative Trivia Quiz — Round 1",
    desc: "An engaging and competitive quiz testing delegates' knowledge of parliamentary history, Nigerian governance structures, and legislative procedures. Top performers advance to the Grand Final Round!",
    cat: "interactive", people: ["honAbiola"],
  },
  {
    id: "speaker-2", start: "10:49", end: "11:14",
    title: "Keynote Address — Speaker 2",
    desc: "An in-depth exploration of legislative oversight in student unions — its mechanisms, its power, and broader implications for accountable and transparent democratic leadership.",
    cat: "main-stage", people: ["honKasope"],
  },
  {
    id: "trivia-final", start: "11:14", end: "11:29",
    title: "Legislative Trivia Quiz — Grand Final",
    desc: "The grand finale! Top quiz contestants battle for the championship title and exclusive summit prizes in this thrilling concluding round. Democracy, knowledge, and glory on the line.",
    cat: "interactive", people: ["honAbiola"],
  },
  {
    id: "speaker-3", start: "11:29", end: "11:54",
    title: "Keynote Address — Speaker 3",
    desc: "A visionary presentation on digital transformation in legislative processes and the frameworks needed for building productive cross-institutional collaboration in the modern era.",
    cat: "main-stage", people: ["honAbiola"],
  },
  {
    id: "networking-1", start: "11:54", end: "12:04",
    title: "Networking & Recess",
    desc: "A refreshing break to connect with delegates from other institutions, exchange ideas, and build lasting relationships that extend well beyond today's summit.",
    cat: "networking", people: [],
  },
  {
    id: "panel", start: "12:04", end: "12:34",
    title: "Special Panel Session",
    desc: "A dynamic panel featuring the Honourable Presidents, Senate Presidents, and Speakers of all invited external institutions — all legislative heads on one stage. A historic, high-level discourse on student governance, policy, and democratic practice across Nigerian universities.",
    cat: "main-stage", people: [],
  },
  {
    id: "speaker-4", start: "12:34", end: "12:59",
    title: "Keynote Address — Speaker 4",
    desc: "Policy making for the next generation of leaders — rich insights from a renowned external policy expert with deep experience in governance reform, policy formulation, and leadership development.",
    cat: "main-stage", people: ["drLanre"],
  },
  {
    id: "speaker-5", start: "12:59", end: "13:29",
    title: "Main Keynote Address — Speaker 5",
    desc: "The summit's headline address. A powerful, transformative keynote on the role of student legislation in national development and the future of democratic leadership — the defining session of the day.",
    cat: "main-stage", people: ["rtHonAdewale"],
  },
  {
    id: "house-sitting", start: "13:29", end: "14:14",
    title: "House Sitting — Speaker 6",
    desc: "A live simulated legislative house sitting — showcasing parliamentary procedures, motion debates, and real-time resolution passing. The most immersive democratic experience of the summit. Democracy in action!",
    cat: "main-stage", people: ["honAnisere"],
  },
  {
    id: "qa", start: "14:14", end: "14:24",
    title: "Q&A Session",
    desc: "Open floor for delegates to engage directly with speakers — ask questions, seek clarity, and deepen your understanding of the day's most compelling themes and ideas.",
    cat: "interactive", people: [],
  },
  {
    id: "pitch", start: "14:24", end: "14:39",
    title: "Pitch Yourself",
    desc: "Delegates get their moment to pitch their vision, leadership philosophy, and value proposition. A bold, energising climax to the substantive sessions — 60 seconds to make your mark.",
    cat: "interactive", people: [],
  },
  {
    id: "sponsors", start: "14:39", end: "14:43",
    title: "Appreciation of Sponsors",
    desc: "A dedicated moment of public recognition and heartfelt gratitude to all sponsors whose generous investment made the RUNSA Legislative Summit 2026 a magnificent reality.",
    cat: "ceremonial", people: ["odunsiOluwatobiloba"],
  },
  {
    id: "awards", start: "14:43", end: "14:53",
    title: "Presentation of Awards",
    desc: "Recognition of outstanding delegates, trivia champions, best pitchers, and exceptional contributors who have made a distinguished mark on this legislative community.",
    cat: "ceremonial", people: ["profShedrach"],
  },
  {
    id: "vote-thanks", start: "14:53", end: "14:57",
    title: "Vote of Thanks",
    desc: "The official closing vote of thanks — an eloquent expression of collective gratitude to every person, institution, and sponsor who contributed to this landmark summit.",
    cat: "ceremonial", people: ["ayodeleOlamilekun"],
  },
  {
    id: "closing-net", start: "14:57", end: "15:05",
    title: "Networking & Group Photographs",
    desc: "The final networking session and group photographs. Capture memories, exchange contacts, and celebrate the close of a truly historic and successful summit together!",
    cat: "networking", people: [],
  },
];

// ─── GALLERY DATA — grouped by event segment ──────────────────────────────────
// Add more images per section by extending the `items` array.
// PNG files are fully supported — just use the correct extension in `src`.
const GALLERY_SECTIONS = [
  {
    id: "red-carpet", label: "Red Carpet & Registration",
    items: [
      { id: "g1", src: `${GA}/gallery-1.jpg`, caption: "Red Carpet Arrivals" },
      { id: "g2", src: `${GA}/gallery-2.jpg`, caption: "Delegate Check-In" },
    ],
  },
  {
    id: "opening", label: "Opening Ceremony",
    items: [
      { id: "g3", src: `${GA}/gallery-3.jpg`, caption: "Opening Ceremony" },
      { id: "g4", src: `${GA}/gallery-4.jpg`, caption: "Welcome Address" },
    ],
  },
  {
    id: "keynotes", label: "Keynote Sessions",
    items: [
      { id: "g5", src: `${GA}/gallery-5.jpg`, caption: "Keynote Address" },
      { id: "g6", src: `${GA}/gallery-6.jpg`, caption: "Legislative Trivia Quiz" },
    ],
  },
  {
    id: "panel", label: "Panel Session",
    items: [
      { id: "g7", src: `${GA}/gallery-7.jpg`, caption: "Panel Discussion" },
    ],
  },
  {
    id: "house-sitting", label: "House Sitting",
    items: [
      { id: "g8", src: `${GA}/gallery-8.jpg`, caption: "House Sitting Session" },
    ],
  },
  {
    id: "awards-closing", label: "Awards & Closing",
    items: [
      { id: "g9",  src: `${GA}/gallery-9.jpg`,  caption: "Pitch Yourself" },
      { id: "g10", src: `${GA}/gallery-10.jpg`, caption: "Awards Presentation" },
      { id: "g11", src: `${GA}/gallery-11.jpg`, caption: "Vote of Thanks" },
      { id: "g12", src: `${GA}/gallery-12.jpg`, caption: "Group Photograph" },
    ],
  },
];
// Flat list kept for backwards-compat
const GALLERY_ITEMS = GALLERY_SECTIONS.flatMap(s => s.items);

// ═══════════════════════════════════════════════════════════════════════════════
//  GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const GlobalStyles = memo(({ isDark }) => {
  const B = isDark ? DARK : LIGHT;
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; width: 100%; max-width: 100%; overflow-x: hidden; }
    body {
      font-family: 'Inter', sans-serif;
      background: ${B.bg};
      color: ${B.cream};
      min-height: 100vh; overflow-x: hidden;
      width: 100%; max-width: 100%;
      transition: background 0.4s ease, color 0.4s ease;
    }
    ::selection { background: rgba(201,146,10,0.35); color: ${B.cream}; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${isDark ? "rgba(26,58,107,0.6)" : "rgba(138,98,0,0.35)"}; border-radius: 3px; }
    :focus-visible { outline: 2px solid ${B.goldLight}; outline-offset: 3px; }

    @keyframes fadeUp    { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
    @keyframes slideUp   { from{opacity:0;transform:translateY(55px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideInL  { from{opacity:0;transform:translateX(-45px)} to{opacity:1;transform:translateX(0)} }
    @keyframes slideInR  { from{opacity:0;transform:translateX(45px)} to{opacity:1;transform:translateX(0)} }
    @keyframes popIn     { from{opacity:0;transform:scale(0.82)} to{opacity:1;transform:scale(1)} }
    @keyframes scaleIn   { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
    @keyframes pulseGlow {
      0%,100%{box-shadow:0 0 0 0 rgba(201,146,10,0),0 0 0 0 rgba(201,146,10,0);}
      50%    {box-shadow:0 0 22px 4px rgba(201,146,10,0.28),0 0 50px 8px rgba(201,146,10,0.10);}
    }
    @keyframes greenPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes blink      { 0%,100%{opacity:1} 50%{opacity:0.2} }
    @keyframes spinSlow   { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
    @keyframes bounce     { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-14px)} 70%{transform:translateY(-6px)} }
    @keyframes floatY     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes floatX     { 0%,100%{transform:translateX(0)} 50%{transform:translateX(8px)} }
    @keyframes shimmer    { 0%{background-position:-500px 0} 100%{background-position:500px 0} }
    @keyframes ripple     { to{transform:translate(-50%,-50%) scale(3.5);opacity:0} }
    @keyframes gradShift  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes borderGlow { 0%,100%{border-color:rgba(201,146,10,0.3)} 50%{border-color:rgba(201,146,10,0.75)} }
    @keyframes orbFloat   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-20px) scale(1.05)} }
    @keyframes heartbeat  { 0%,100%{transform:scale(1)} 14%{transform:scale(1.08)} 28%{transform:scale(1)} 42%{transform:scale(1.05)} 56%{transform:scale(1)} }
    @keyframes slideDown  { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideNextIn  { from{opacity:0;transform:translateX(80px)}  to{opacity:1;transform:translateX(0)} }
    @keyframes slidePrevIn  { from{opacity:0;transform:translateX(-80px)} to{opacity:1;transform:translateX(0)} }
    @keyframes slideNextOut { from{opacity:1;transform:translateX(0)}     to{opacity:0;transform:translateX(-80px)} }
    @keyframes slidePrevOut { from{opacity:1;transform:translateX(0)}     to{opacity:0;transform:translateX(80px)} }
    @keyframes glow360    {
      0%  {box-shadow:0 0 0 0 rgba(201,146,10,0);}
      25% {box-shadow:4px 0 18px 2px rgba(201,146,10,0.25);}
      50% {box-shadow:0 4px 18px 2px rgba(201,146,10,0.25);}
      75% {box-shadow:-4px 0 18px 2px rgba(201,146,10,0.25);}
      100%{box-shadow:0 0 0 0 rgba(201,146,10,0);}
    }
    /* ── DONE FLASH — achievement effect on marking a session complete ── */
    @keyframes doneRipple {
      0%   { opacity: 0.7; box-shadow: 0 0 0 0 rgba(57,224,122,0.65); transform: scale(1); }
      50%  { opacity: 0.4; box-shadow: 0 0 0 18px rgba(57,224,122,0.18); }
      100% { opacity: 0;   box-shadow: 0 0 0 38px rgba(57,224,122,0); transform: scale(1.015); }
    }
    @keyframes checkBounce {
      0%   {transform:scale(1)    rotate(0deg);}
      25%  {transform:scale(1.55) rotate(-10deg);}
      55%  {transform:scale(0.88) rotate(4deg);}
      75%  {transform:scale(1.12) rotate(-2deg);}
      100% {transform:scale(1)    rotate(0deg);}
    }
    @keyframes starSpin  {
      0%   {transform:rotate(0deg)   scale(0);  opacity:1;}
      80%  {transform:rotate(280deg) scale(1.3);opacity:0.9;}
      100% {transform:rotate(360deg) scale(0);  opacity:0;}
    }

    .au-fadeUp  { animation: fadeUp  0.65s cubic-bezier(0.34,1.1,0.64,1) both; }
    .au-fadeIn  { animation: fadeIn  0.5s ease both; }
    .au-slideUp { animation: slideUp 0.72s cubic-bezier(0.34,1.1,0.64,1) both; }
    .au-popIn   { animation: popIn   0.42s cubic-bezier(0.34,1.56,0.64,1) both; }
    .au-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.34,1.1,0.64,1) both; }
    .au-slideL  { animation: slideInL 0.6s cubic-bezier(0.34,1.1,0.64,1) both; }
    .au-slideR  { animation: slideInR 0.6s cubic-bezier(0.34,1.1,0.64,1) both; }
    .d1{animation-delay:0.07s}.d2{animation-delay:0.14s}.d3{animation-delay:0.21s}
    .d4{animation-delay:0.28s}.d5{animation-delay:0.35s}.d6{animation-delay:0.42s}

    /* ── SCROLL REVEAL ── */
    .rv   { opacity:0; transform:translateY(32px);  transition:opacity 0.65s cubic-bezier(0.34,1.1,0.64,1),transform 0.65s cubic-bezier(0.34,1.1,0.64,1); }
    .rv-l { opacity:0; transform:translateX(-44px); transition:opacity 0.65s cubic-bezier(0.34,1.1,0.64,1),transform 0.65s cubic-bezier(0.34,1.1,0.64,1); }
    .rv-r { opacity:0; transform:translateX(44px);  transition:opacity 0.65s cubic-bezier(0.34,1.1,0.64,1),transform 0.65s cubic-bezier(0.34,1.1,0.64,1); }
    .rv-s { opacity:0; transform:scale(0.88);       transition:opacity 0.55s cubic-bezier(0.34,1.1,0.64,1),transform 0.55s cubic-bezier(0.34,1.1,0.64,1); }
    .rv.on  { opacity:1; transform:translateY(0); }
    .rv-l.on{ opacity:1; transform:translateX(0); }
    .rv-r.on{ opacity:1; transform:translateX(0); }
    .rv-s.on{ opacity:1; transform:scale(1); }

    .hover-lift { transition:transform 0.28s cubic-bezier(0.34,1.1,0.64,1),box-shadow 0.28s ease; }
    .hover-lift:hover { transform:translateY(-6px) scale(1.02); box-shadow:0 18px 48px rgba(0,0,0,0.45)!important; }
    .hover-glow  { transition:box-shadow 0.3s ease, border-color 0.3s ease; }
    .hover-glow:hover { box-shadow: 0 0 32px rgba(201,146,10,0.28)!important; border-color: rgba(201,146,10,0.65)!important; }
    .btn-spring { transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease; }
    .btn-spring:hover  { transform:translateY(-3px) scale(1.04); }
    .btn-spring:active { transform:scale(0.96); }
    .img-zoom { overflow:hidden; }
    .img-zoom img { transition:transform 0.55s cubic-bezier(0.34,1.1,0.64,1); }
    .img-zoom:hover img { transform:scale(1.1); }

    .glass        { background:${B.glass}; backdrop-filter:${B.glassBlur}; -webkit-backdrop-filter:${B.glassBlur}; }
    .glass-strong { background:${isDark ? "rgba(3,8,16,0.97)" : "rgba(245,240,232,0.98)"}; backdrop-filter:blur(28px) saturate(200%); -webkit-backdrop-filter:blur(28px) saturate(200%); }
    .live-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:${B.green}; animation:greenPulse 1.8s infinite; }
    .g-text  { background:linear-gradient(135deg,${B.goldPale} 0%,${B.goldLight} 45%,#ffffff 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .g-text-b{ background:linear-gradient(135deg,${B.blue} 0%,${B.purple} 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .spk-card:hover .spk-glow { opacity:1!important; }
    .spk-card:hover .spk-ring { animation:glow360 2s infinite!important; }
    body::after { content:''; position:fixed; inset:0; pointer-events:none; z-index:9997; opacity:${isDark ? "0.18" : "0.07"};
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E"); }

    @media (prefers-reduced-motion:reduce) {
      *,*::before,*::after { animation-duration:0.01ms!important; animation-iteration-count:1!important; transition-duration:0.01ms!important; }
    }
    @media(max-width:768px) {
      .hide-m    { display:none!important; }
      .hero-t    { font-size:clamp(34px,12vw,60px)!important; }
      .tl-axis   { left:14px!important; }
      .session-ml{ margin-left:26px!important; }
      .tl-node   { left:-30px!important; }
    }
    @media(min-width:769px) { .hide-d { display:none!important; } }
    ${!isDark ? `.g-text { background:linear-gradient(135deg,#7a5c00,#a07800,#5a4000); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }` : ""}
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
});

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
let _toastEl = null;
function getToastEl() {
  if (_toastEl && document.body.contains(_toastEl)) return _toastEl;
  _toastEl = document.createElement("div");
  _toastEl.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10000;display:flex;flex-direction:column;align-items:center;gap:10px;max-width:380px;width:90%;pointer-events:none;";
  document.body.appendChild(_toastEl);
  return _toastEl;
}
function showToast(msg, type = "info", dur = 2800) {
  const c = getToastEl();
  const el = document.createElement("div");
  const bg  = type === "success" ? "#1a4a2e" : type === "error" ? "#4a1a1a" : "#0f1e36";
  const bdr = type === "success" ? "#2e9e5b" : type === "error" ? "#c0392b" : "#1a3a6b";
  const ico = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
  el.style.cssText = `background:${bg};border:1px solid ${bdr};border-radius:14px;padding:14px 18px;color:#f5f0e8;font-family:'Inter',sans-serif;font-size:13px;line-height:1.5;display:flex;align-items:center;gap:10px;box-shadow:0 10px 40px rgba(0,0,0,0.5);pointer-events:auto;cursor:pointer;transform:translateY(-20px);opacity:0;transition:all 0.32s cubic-bezier(0.34,1.56,0.64,1);text-align:left;`;
  el.innerHTML = `<span style="font-size:17px;flex-shrink:0">${ico}</span><span>${msg}</span>`;
  c.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = "translateY(0)"; el.style.opacity = "1"; }));
  setTimeout(() => { el.style.transform = "translateY(-20px)"; el.style.opacity = "0"; setTimeout(() => { if (c.contains(el)) c.removeChild(el); }, 350); }, dur);
}

// ─── SCROLL REVEAL — stable, MutationObserver-backed ─────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("on"); }),
      { threshold: 0.06, rootMargin: "0px 0px -20px 0px" }
    );
    const observeNew = () => {
      document.querySelectorAll(".rv,.rv-l,.rv-r,.rv-s").forEach(el => {
        if (!el.dataset.rvObserved) { el.dataset.rvObserved = "1"; io.observe(el); }
      });
    };
    observeNew();
    const mo = new MutationObserver(observeNew);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []); // runs once — MutationObserver handles new elements
}

// ─── PARTICLE CANVAS ──────────────────────────────────────────────────────────
const ParticleCanvas = memo(({ isDark }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, animId;
    const COUNT = window.innerWidth < 768 ? 35 : 65;
    const DIST = 115;
    const particles = [];
    const resize = () => {
      const p = canvas.parentElement;
      W = canvas.width = p ? p.clientWidth : window.innerWidth;
      H = canvas.height = p ? p.clientHeight : window.innerHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    for (let i = 0; i < COUNT; i++) {
      particles.push({ x: Math.random()*W, y: Math.random()*H, vx:(Math.random()-0.5)*0.45, vy:(Math.random()-0.5)*0.45, r:Math.random()*2+0.8, a:Math.random()*0.5+0.18, pulse:Math.random()*Math.PI*2 });
    }
    const goldR = isDark ? [201,146,10] : [138,98,0];
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i+1; j < particles.length; j++) {
          const dx = particles[i].x-particles[j].x, dy = particles[i].y-particles[j].y;
          const d = Math.sqrt(dx*dx+dy*dy);
          if (d < DIST) { const al=(1-d/DIST)*0.13; ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.strokeStyle=`rgba(${goldR[0]},${goldR[1]},${goldR[2]},${al})`; ctx.lineWidth=0.5; ctx.stroke(); }
        }
      }
      particles.forEach(p => {
        p.x+=p.vx; p.y+=p.vy; p.pulse+=0.014;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        const al=p.a*(0.65+0.35*Math.sin(p.pulse));
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2.8);
        g.addColorStop(0,`rgba(${goldR[0]+30},${goldR[1]+38},${goldR[2]+65},${al})`);
        g.addColorStop(0.5,`rgba(${goldR[0]},${goldR[1]},${goldR[2]},${al*0.45})`);
        g.addColorStop(1,`rgba(${goldR[0]},${goldR[1]},${goldR[2]},0)`);
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.8,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, [isDark]);
  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:1, pointerEvents:"none" }} />;
});

// ─── SPIRAL / ORB BACKGROUND ──────────────────────────────────────────────────
const SpiralBg = memo(({ isDark }) => {
  const B = isDark ? DARK : LIGHT;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
      <svg viewBox="0 0 1000 1000" style={{ position:"absolute", top:"50%", left:"50%", width:"160vmax", height:"160vmax", transform:"translate(-50%,-50%)", animation:"spinSlow 180s linear infinite", opacity: isDark?0.045:0.025 }}>
        <defs>
          <linearGradient id="spiralG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={B.gold} stopOpacity="0.6" />
            <stop offset="50%" stopColor={B.navy} stopOpacity="0.35" />
            <stop offset="100%" stopColor={B.green} stopOpacity="0.25" />
          </linearGradient>
        </defs>
        {Array.from({length:9}).map((_,i)=>(
          <g key={i} transform={`rotate(${i*40} 500 500)`}>
            <ellipse cx="500" cy="500" rx={190+i*42} ry={140+i*32} fill="none" stroke="url(#spiralG)" strokeWidth="0.7" opacity={0.28+i*0.05} />
          </g>
        ))}
        {Array.from({length:16}).map((_,i)=>(
          <circle key={`c${i}`} cx="500" cy="500" r={55+i*28} fill="none" stroke={B.gold} strokeWidth="0.35" opacity={0.07+(16-i)*0.012} />
        ))}
      </svg>
      <div style={{ position:"absolute", top:"15%", right:"8%", width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle, ${isDark?"rgba(201,146,10,0.07)":"rgba(138,98,0,0.05)"} 0%, transparent 70%)`, animation:"orbFloat 12s ease-in-out infinite", filter:"blur(40px)" }} />
      <div style={{ position:"absolute", bottom:"20%", left:"5%", width:260, height:260, borderRadius:"50%", background:`radial-gradient(circle, ${isDark?"rgba(26,58,107,0.1)":"rgba(26,58,107,0.06)"} 0%, transparent 70%)`, animation:"orbFloat 9s ease-in-out infinite 3s", filter:"blur(35px)" }} />
      <div style={{ position:"absolute", top:"55%", right:"35%", width:180, height:180, borderRadius:"50%", background:`radial-gradient(circle, ${isDark?"rgba(57,224,122,0.05)":"rgba(26,122,74,0.04)"} 0%, transparent 70%)`, animation:"orbFloat 15s ease-in-out infinite 6s", filter:"blur(30px)" }} />
    </div>
  );
});

// ─── PERSON MODAL ─────────────────────────────────────────────────────────────
const PersonModal = memo(({ person, onClose }) => {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  useEffect(() => {
    setImgLoaded(false); setImgError(false);
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = person ? "hidden" : "";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [person, onClose]);
  if (!person) return null;
  const hasImg = person.image && !imgError;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(2,6,14,0.95)", backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"10px", animation:"fadeIn 0.22s ease" }}>
      <div onClick={e=>e.stopPropagation()} className="au-popIn" style={{ width:"100%", maxWidth:540, background: isDark?"linear-gradient(150deg,rgba(10,22,40,0.99),rgba(4,10,22,0.99))":"linear-gradient(150deg,rgba(255,253,248,0.99),rgba(248,244,236,0.99))", border:`1px solid ${B.borderGold}`, borderRadius:26, boxShadow:`0 40px 100px rgba(0,0,0,0.75), ${B.shadowGold}`, position:"relative", maxHeight:"90vh", display:"flex", flexDirection:"column", overflowX:"hidden" }}>
        {/* Rainbow top bar */}
        <div style={{ flexShrink:0, height:5, background:"linear-gradient(90deg,#c9920a,#e8b84b,#39e07a,#7ab8f5,#c9920a)", backgroundSize:"300% 100%", animation:"gradShift 4s ease infinite", borderRadius:"26px 26px 0 0" }} />
        {/* Sticky close-button row — always visible even when modal content scrolls */}
        <div style={{ flexShrink:0, position:"sticky", top:0, zIndex:10, display:"flex", justifyContent:"flex-end", padding:"10px 14px 0", background:isDark?"rgba(10,22,40,0.98)":"rgba(255,253,248,0.98)" }}>
          <button onClick={onClose} style={{ width:38, height:38, borderRadius:"50%", border:`1px solid ${B.border}`, background:"transparent", color:B.textMuted, fontSize:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.color=B.goldLight;e.currentTarget.style.borderColor=B.borderGold;e.currentTarget.style.boxShadow=`0 0 14px ${B.shadowGold}`;}}
            onMouseLeave={e=>{e.currentTarget.style.color=B.textMuted;e.currentTarget.style.borderColor=B.border;e.currentTarget.style.boxShadow="none";}}>
            &times;
          </button>
        </div>
        {/* Scrollable body */}
        <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch", padding:"0 clamp(1.2rem,4vw,2.4rem) clamp(1.4rem,4vw,2.2rem)" }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            {hasImg ? (
              <div style={{ position:"relative", display:"inline-block" }}>
                {!imgLoaded && <div style={{ width:136, height:136, borderRadius:"50%", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`3px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}><span style={{ fontFamily:"'Cinzel',serif", fontSize:44, fontWeight:900, color:B.goldLight }}>{person.initials}</span></div>}
                <img src={person.image} alt={person.name} onLoad={()=>setImgLoaded(true)} onError={()=>setImgError(true)} style={{ width:136, height:136, borderRadius:"50%", objectFit:"cover", border:`3px solid ${B.goldLight}`, boxShadow:`0 0 50px rgba(201,146,10,0.3), 0 10px 30px rgba(0,0,0,0.45)`, margin:"0 auto", display:imgLoaded?"block":"none", animation:imgLoaded?"scaleIn 0.4s ease":"none" }} />
                <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`1.5px solid rgba(201,146,10,0.35)`, animation:"pulseGlow 2.8s infinite", pointerEvents:"none" }} />
                <div style={{ position:"absolute", inset:-14, borderRadius:"50%", border:"1px solid rgba(201,146,10,0.12)", animation:"pulseGlow 2.8s infinite 0.6s", pointerEvents:"none" }} />
              </div>
            ) : (
              <div style={{ position:"relative", display:"inline-block" }}>
                <div style={{ width:136, height:136, borderRadius:"50%", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`3px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", animation:"pulseGlow 2.8s infinite" }}><span style={{ fontFamily:"'Cinzel',serif", fontSize:44, fontWeight:900, color:B.goldLight }}>{person.initials}</span></div>
                <div style={{ position:"absolute", inset:-6, borderRadius:"50%", border:`1.5px solid rgba(201,146,10,0.3)`, animation:"glow360 3s infinite", pointerEvents:"none" }} />
              </div>
            )}
          </div>
          <h2 style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(1.1rem,3.5vw,1.35rem)", fontWeight:700, color:B.cream, textAlign:"center", margin:"0 0 7px", lineHeight:1.3 }}>{person.name}</h2>
          <p style={{ fontSize:"0.8rem", fontWeight:600, color:B.goldLight, textAlign:"center", margin:"0 0 4px" }}>{person.role}</p>
          {person.institution && <p style={{ fontSize:"0.78rem", color:B.textFaint, textAlign:"center", margin:"0 0 22px" }}>{person.institution}</p>}
          <div style={{ height:1, background:`linear-gradient(90deg,transparent,${B.borderGold},transparent)`, marginBottom:22 }} />
          <div>
            <p style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:B.goldLight, marginBottom:10 }}>Biography</p>
            <p style={{ fontFamily:"'EB Garamond',serif", fontSize:"0.98rem", color:B.textMuted, lineHeight:1.85 }}>{person.bio}</p>
          </div>
        </div>{/* end scrollable body */}
      </div>
    </div>
  );
});

// ─── GALLERY LIGHTBOX — animated album with swipe/slide support ──────────────
const Lightbox = memo(({ images, sectionLabel, idx, onClose, onNav }) => {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [animDir, setAnimDir]       = useState(null);
  const [displayIdx, setDisplayIdx] = useState(idx);
  const prevIdxRef = useRef(idx);

  useEffect(() => {
    if (idx !== prevIdxRef.current) {
      const dir = idx > prevIdxRef.current ? "next" : "prev";
      setAnimDir(dir);
      prevIdxRef.current = idx;
      const t = setTimeout(() => { setDisplayIdx(idx); setAnimDir(null); }, 30);
      return () => clearTimeout(t);
    }
  }, [idx]);

  useEffect(() => {
    const fn = e => { if(e.key==="Escape")onClose(); if(e.key==="ArrowLeft")onNav(-1); if(e.key==="ArrowRight")onNav(1); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose, onNav]);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const handleTouchStart = e => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd   = e => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 45 && Math.abs(dx) > dy * 1.5) {
      if (dx < 0 && idx < images.length - 1) onNav(1);
      else if (dx > 0 && idx > 0) onNav(-1);
    }
    touchStartX.current = null;
  };

  const img = images[displayIdx];
  if (!img) return null;

  const slideAnim = animDir === "next"
    ? "slideNextIn 0.32s cubic-bezier(0.34,1.1,0.64,1) both"
    : animDir === "prev"
    ? "slidePrevIn 0.32s cubic-bezier(0.34,1.1,0.64,1) both"
    : "none";

  const navBtn = (label, action, side) => (
    <button onClick={e=>{e.stopPropagation();action();}}
      style={{ position:"absolute", [side]:12, top:"50%", transform:"translateY(-50%)", width:48, height:48, borderRadius:"50%", border:`1px solid ${B.borderGold}`, background:"rgba(6,13,26,0.85)", color:B.goldLight, fontSize:26, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", zIndex:10 }}
      onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,146,10,0.2)";e.currentTarget.style.boxShadow="0 0 22px rgba(201,146,10,0.4)";}}
      onMouseLeave={e=>{e.currentTarget.style.background="rgba(6,13,26,0.85)";e.currentTarget.style.boxShadow="none";}}>
      {label}
    </button>
  );

  return (
    <div onClick={onClose} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(2,5,12,0.97)", backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", animation:"fadeIn 0.25s ease" }}>

      {/* Sticky header bar */}
      <div style={{ flexShrink:0, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid rgba(201,146,10,0.18)`, background:"rgba(2,5,12,0.7)", backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:"0.63rem", fontWeight:800, letterSpacing:"0.14em", textTransform:"uppercase", color:B.goldLight }}>{sectionLabel}</span>
          <span style={{ fontSize:"0.63rem", color:B.textFaint }}>{displayIdx + 1} / {images.length}</span>
        </div>
        <button onClick={onClose}
          style={{ width:40, height:40, borderRadius:"50%", border:`1px solid ${B.borderGold}`, background:"rgba(6,13,26,0.85)", color:B.goldLight, fontSize:24, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 0 22px rgba(201,146,10,0.35)";}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";}}>
          &times;
        </button>
      </div>

      {/* Main image area */}
      <div onClick={e=>e.stopPropagation()} style={{ flex:1, position:"relative", width:"100%", maxWidth:980, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", padding:"12px 60px" }}>
        {idx > 0 && navBtn("‹", ()=>onNav(-1), "left")}
        {idx < images.length - 1 && navBtn("›", ()=>onNav(1), "right")}
        <div key={displayIdx} style={{ width:"100%", textAlign:"center", animation:slideAnim }}>
          <div style={{ borderRadius:16, overflow:"hidden", border:`1px solid ${B.borderGold}`, boxShadow:"0 24px 70px rgba(0,0,0,0.6)", display:"inline-block", maxWidth:"100%" }}>
            <img src={img.src} alt={img.caption} style={{ width:"100%", maxHeight:"calc(100vh - 210px)", objectFit:"contain", background:`linear-gradient(135deg,${B.bgMid},${B.bg})`, display:"block" }} />
          </div>
          <p style={{ marginTop:11, fontSize:"0.84rem", color:B.textMuted, fontFamily:"'Cinzel',serif" }}>{img.caption}</p>
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div onClick={e=>e.stopPropagation()} style={{ flexShrink:0, display:"flex", gap:7, overflowX:"auto", padding:"8px 16px 12px", maxWidth:980, width:"100%", scrollbarWidth:"none" }}>
          {images.map((thumb, ti) => (
            <button key={thumb.id} onClick={()=>onNav(ti - idx)}
              style={{ flexShrink:0, width:54, height:40, borderRadius:7, overflow:"hidden", border:`2px solid ${ti === displayIdx ? B.goldLight : "transparent"}`, cursor:"pointer", background:"transparent", padding:0, opacity:ti === displayIdx ? 1 : 0.5, transition:"all 0.22s", boxShadow:ti === displayIdx ? "0 0 12px rgba(201,146,10,0.45)" : "none" }}>
              <img src={thumb.src} alt={thumb.caption} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            </button>
          ))}
        </div>
      )}
      <p style={{ flexShrink:0, fontSize:"0.65rem", color:B.textFaint, paddingBottom:10 }}>Swipe or use ← → keys to navigate · Tap outside to close</p>
    </div>
  );
});

// ─── LOGO BADGE — shows an image logo; falls back to text initials ────────────
const LogoBadge = memo(({ src, fallback, size = 40, pulse = false, style: extraStyle = {} }) => {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [err, setErr] = useState(false);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", border:`2px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0, boxShadow:"0 0 16px rgba(201,146,10,0.3)", animation:pulse?"heartbeat 4s ease-in-out infinite":"none", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, ...extraStyle }}>
      {src && !err
        ? <img src={src} alt="logo" onError={()=>setErr(true)} style={{ width:"86%", height:"86%", objectFit:"contain" }} />
        : <span style={{ fontFamily:"'Cinzel',serif", fontSize:Math.round(size*0.275), fontWeight:900, color:B.goldLight }}>{fallback}</span>
      }
    </div>
  );
});

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
const Navigation = memo(({ activeSection }) => {
  const { isDark, toggle } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 70);
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const items = [
    { id:"hero", label:"Home" }, { id:"agenda", label:"Agenda" }, { id:"speakers", label:"Speakers" },
    { id:"vote-of-thanks", label:"Vote of Thanks" }, { id:"gallery", label:"Gallery" },
    { id:"acknowledgements", label:"Acknowledgements" }, { id:"first-edition", label:"1st Edition" },
  ];
  const scrollTo = id => { setMenuOpen(false); const el = document.getElementById(id); if(el) el.scrollIntoView({ behavior:"smooth", block:"start" }); };
  return (
    <nav className="glass-strong" style={{ position:"fixed", top:0, left:0, right:0, zIndex:1000, borderBottom:scrolled?`1px solid ${B.borderGold}`:"1px solid transparent", transition:"all 0.32s ease", boxShadow:scrolled?"0 6px 36px rgba(0,0,0,0.4)":"none" }}>
      <div style={{ maxWidth:1240, margin:"0 auto", padding:"0 20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:66 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>scrollTo("hero")}>
            <LogoBadge src={COUNCIL_LOGO} fallback="LS" size={40} pulse={true} />
            <div>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:B.goldLight, letterSpacing:"0.1em", display:"block", lineHeight:1 }}>LEGISLATIVE SUMMIT</span>
              <span style={{ fontSize:8, color:B.textFaint, letterSpacing:"0.12em", textTransform:"uppercase" }}>2026 · RUNSA</span>
            </div>
          </div>
          <div className="hide-m" style={{ display:"flex", alignItems:"center", gap:2 }}>
            {items.map(item => {
              const active = activeSection === item.id;
              return (
                <button key={item.id} onClick={()=>scrollTo(item.id)} style={{ padding:"7px 13px", borderRadius:9, border:"none", background:active?"rgba(201,146,10,0.1)":"transparent", color:active?B.goldLight:B.textMuted, fontSize:11.5, fontWeight:600, letterSpacing:"0.04em", cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"all 0.22s ease", position:"relative" }}
                  onMouseEnter={e=>{e.currentTarget.style.color=B.goldLight;e.currentTarget.style.background="rgba(201,146,10,0.09)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color=active?B.goldLight:B.textMuted;e.currentTarget.style.background=active?"rgba(201,146,10,0.1)":"transparent";}}>
                  {item.label}
                  {active && <span style={{ position:"absolute", bottom:2, left:"12%", right:"12%", height:2, background:`linear-gradient(90deg,${B.gold},${B.goldLight})`, borderRadius:2, animation:"fadeIn 0.2s ease" }} />}
                </button>
              );
            })}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div className="hide-m" style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 13px", borderRadius:100, background:isDark?"rgba(57,224,122,0.08)":"rgba(26,122,74,0.08)", border:`1px solid ${isDark?"rgba(57,224,122,0.28)":"rgba(26,122,74,0.28)"}` }}>
              <span className="live-dot" />
              <span style={{ fontSize:10, fontWeight:700, color:B.green, letterSpacing:"0.08em" }}>LIVE</span>
            </div>
            <button onClick={toggle} className="btn-spring" title={isDark?"Switch to Light Mode":"Switch to Dark Mode"} style={{ width:40, height:40, borderRadius:"50%", border:`1.5px solid ${B.borderGold}`, background:isDark?"rgba(201,146,10,0.08)":"rgba(138,98,0,0.08)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, transition:"all 0.25s" }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 0 18px rgba(201,146,10,0.3)";e.currentTarget.style.borderColor=B.goldLight;}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=B.borderGold;}}>
              {isDark ? "☀️" : "🌙"}
            </button>
            <button className="hide-d" onClick={()=>setMenuOpen(o=>!o)} style={{ width:40, height:40, borderRadius:10, border:`1px solid ${B.borderGold}`, background:"rgba(201,146,10,0.06)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:B.goldLight, transition:"all 0.2s" }}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {menuOpen ? <><path d="M2 2L16 12" /><path d="M16 2L2 12" /></> : <><path d="M1 1h16" /><path d="M1 7h12" /><path d="M1 13h16" /></>}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {menuOpen && (
        <div className="hide-d glass-strong" style={{ borderTop:`1px solid ${B.borderGold}`, padding:"10px 16px 18px", animation:"slideDown 0.22s ease" }}>
          {items.map((item, i) => (
            <button key={item.id} onClick={()=>scrollTo(item.id)} style={{ display:"block", width:"100%", textAlign:"left", padding:"12px 16px", borderRadius:10, border:"none", background:activeSection===item.id?"rgba(201,146,10,0.09)":"transparent", color:activeSection===item.id?B.goldLight:B.textMuted, fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif", marginBottom:3, transition:"all 0.2s", animation:`fadeUp 0.28s ${i*0.04}s cubic-bezier(0.34,1.1,0.64,1) both` }}>
              {item.label}
            </button>
          ))}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px 4px", marginTop:6, borderTop:`1px solid ${B.border}` }}>
            <span style={{ fontSize:11, color:B.textFaint }}>Appearance</span>
            <button onClick={toggle} style={{ border:`1px solid ${B.borderGold}`, background:"transparent", borderRadius:8, padding:"5px 14px", cursor:"pointer", fontSize:13, color:B.goldLight }}>{isDark ? "☀️ Light" : "🌙 Dark"}</button>
          </div>
        </div>
      )}
    </nav>
  );
});

// ─── HERO SECTION ─────────────────────────────────────────────────────────────
const HeroSection = memo(() => {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  return (
    <section id="hero" style={{ position:"relative", width:"100%", minHeight:"100vh", overflow:"hidden", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center" }}>
      <ParticleCanvas isDark={isDark} />
      <div style={{ position:"absolute", top:"38%", left:"50%", transform:"translate(-50%,-50%)", width:"75vw", height:"55vh", background:`radial-gradient(ellipse, ${isDark?"rgba(201,146,10,0.11)":"rgba(138,98,0,0.07)"} 0%, transparent 65%)`, zIndex:2, pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"70%", right:"15%", width:"40vw", height:"30vh", background:`radial-gradient(ellipse, ${isDark?"rgba(26,58,107,0.1)":"rgba(26,58,107,0.05)"} 0%, transparent 65%)`, zIndex:2, pointerEvents:"none" }} />
      {[
        { top:"12%", left:"9%",  w:7, h:7, c:"rgba(201,146,10,0.5)",  a:"floatY 4s ease-in-out infinite" },
        { top:"22%", right:"13%",w:5, h:5, c:"rgba(57,224,122,0.45)", a:"floatY 5.5s ease-in-out infinite 1s" },
        { bottom:"22%",left:"18%",w:6, h:6, c:"rgba(124,160,240,0.4)", a:"floatY 6.5s ease-in-out infinite 0.5s" },
        { bottom:"32%",right:"9%",w:4, h:4, c:"rgba(201,146,10,0.35)", a:"floatY 5s ease-in-out infinite 2.5s" },
        { top:"48%", left:"5%",  w:3, h:3, c:"rgba(196,168,245,0.4)", a:"floatX 7s ease-in-out infinite 1s" },
        { top:"60%", right:"5%", w:5, h:5, c:"rgba(201,146,10,0.3)",  a:"floatX 8s ease-in-out infinite 2s" },
      ].map((s, i) => (
        <div key={i} style={{ position:"absolute", zIndex:2, borderRadius:"50%", width:s.w, height:s.h, background:s.c, animation:s.a, ...Object.fromEntries(["top","bottom","left","right"].filter(k=>s[k]).map(k=>[k,s[k]])) }} />
      ))}
      <div style={{ position:"relative", zIndex:3, textAlign:"center", maxWidth:860, padding:"80px 24px 40px" }}>
        <div className="au-fadeUp d1" style={{ display:"inline-flex", alignItems:"center", gap:9, padding:"8px 22px", border:`1px solid ${B.borderGold}`, borderRadius:100, fontSize:10.5, letterSpacing:"0.15em", textTransform:"uppercase", color:B.goldLight, background:"rgba(201,146,10,0.07)", marginBottom:30, animation:"pulseGlow 3s infinite" }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:B.goldLight, animation:"blink 2s infinite" }} />
          Inaugural Edition · 29th April 2026
        </div>
        <p className="au-fadeUp d2" style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(11px,1.6vw,15px)", fontWeight:600, letterSpacing:"0.28em", textTransform:"uppercase", color:B.textMuted, marginBottom:12 }}>
          Redeemer's University Nigeria Students' Association
        </p>
        <h1 className="hero-t au-slideUp d2 g-text" style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(52px,12vw,110px)", lineHeight:0.9, letterSpacing:"0.04em", marginBottom:14 }}>
          LEGISLATIVE<br />SUMMIT
        </h1>
        <p className="au-fadeUp d3" style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(13px,2vw,19px)", fontWeight:700, color:B.cream, letterSpacing:"0.07em", marginBottom:8 }}>
          THE CATALYST OF TRANSFORMATION
        </p>
        <p className="au-fadeUp d3" style={{ fontFamily:"'EB Garamond',serif", fontStyle:"italic", fontSize:"clamp(14px,1.9vw,18px)", color:B.textMuted, lineHeight:1.7, maxWidth:520, margin:"0 auto 38px" }}>
          Legislating the Future for Democratic Leadership
        </p>
        {/* Info cards — start time only, no end time */}
        <div className="au-fadeUp d4" style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginBottom:44 }}>
          {[
            { icon:"📅", text:"29th April 2026" },
            { icon:"⏰", text:"Starts 9:00 AM" },
            { icon:"📍", text:"Sapetro Lecture Theatre" },
            { icon:"🏫", text:"Redeemer's University, Ede" },
          ].map((c,i) => (
            <div key={i} className="hover-glow" style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:13, border:`1px solid ${B.border}`, background:isDark?"rgba(26,58,107,0.1)":"rgba(26,58,107,0.06)", fontSize:12.5, color:B.textMuted, transition:"all 0.25s ease", cursor:"default" }}>
              <span style={{ fontSize:18 }}>{c.icon}</span>
              <span style={{ fontWeight:500 }}>{c.text}</span>
            </div>
          ))}
        </div>
        <button className="au-fadeUp d5" onClick={()=>document.getElementById("agenda")?.scrollIntoView({ behavior:"smooth" })} style={{ background:"transparent", border:"none", cursor:"pointer", display:"inline-flex", flexDirection:"column", alignItems:"center", gap:8, color:B.textFaint, animation:"bounce 2.2s ease-in-out infinite", transition:"color 0.2s" }}
          onMouseEnter={e=>e.currentTarget.style.color=B.goldLight}
          onMouseLeave={e=>e.currentTarget.style.color=B.textFaint}>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase" }}>Explore Programme</span>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8l6 6 6-6" /></svg>
        </button>
      </div>
    </section>
  );
});

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
const SectionHeader = memo(({ pretitle, title, subtitle }) => {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  return (
    <div className="rv" style={{ textAlign:"center", marginBottom:"clamp(2rem,5vh,3.5rem)" }}>
      <p style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:B.goldLight, marginBottom:12 }}>{pretitle}</p>
      <h2 className="g-text" style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"clamp(2.2rem,6vw,3.8rem)", letterSpacing:"0.04em", lineHeight:1, margin:"0 0 14px" }}>{title}</h2>
      {subtitle && <p style={{ fontSize:"0.88rem", color:B.textMuted, fontFamily:"'EB Garamond',serif", fontStyle:"italic", maxWidth:580, margin:"0 auto", lineHeight:1.75 }}>{subtitle}</p>}
      <div style={{ width:56, height:2, background:`linear-gradient(90deg,transparent,${B.goldLight},transparent)`, margin:"18px auto 0", animation:"borderGlow 3s ease-in-out infinite" }} />
    </div>
  );
});

// ─── SESSION CARD — with done-flash achievement effect ────────────────────────
const SessionCard = memo(({ session, index, isCompleted, onToggleComplete, onPersonClick }) => {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [expanded, setExpanded] = useState(false);
  const [justDone, setJustDone] = useState(false);
  const prevCompletedRef = useRef(isCompleted);

  useEffect(() => {
    if (!prevCompletedRef.current && isCompleted) {
      setJustDone(true);
      const t = setTimeout(() => setJustDone(false), 950);
      return () => clearTimeout(t);
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted]);

  const catStyle = CAT_STYLES[session.cat];
  const now = new Date();
  const cur = now.getHours()*60 + now.getMinutes();
  const toMins = t => { const [h,m] = t.split(":").map(Number); return h*60+m; };
  const st = toMins(session.start), en = toMins(session.end);
  const isLive = cur >= st && cur < en;
  const isPast = cur >= en;

  const borderCol = isCompleted ? "rgba(57,224,122,0.45)" : isLive ? "rgba(201,146,10,0.55)" : B.border;
  const bgCol = isCompleted ? "rgba(57,224,122,0.05)" : isDark ? "rgba(6,10,20,0.78)" : "rgba(255,255,255,0.88)";

  return (
    <div className={`rv${index%2===0?"":"-r"} session-ml`} style={{ position:"relative", marginLeft:40 }}>
      {/* Timeline node */}
      <div className="tl-node" style={{ position:"absolute", left:-44, top:26, width:14, height:14, borderRadius:"50%", background:isCompleted?B.green:isLive?B.goldLight:isPast?B.border:B.bg, border:`2.5px solid ${isCompleted?B.green:isLive?B.goldLight:isPast?B.border:B.navyMid}`, zIndex:2, transition:"all 0.3s", boxShadow:isLive?`0 0 14px ${B.goldLight}`:isCompleted?`0 0 14px ${B.green}`:"none", animation:isLive?"pulseGlow 1.8s infinite":"none" }}>
        {isCompleted && <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:B.navyDeep, fontSize:8, fontWeight:900 }}>✓</span>}
      </div>

      {/* Card */}
      <div onClick={()=>setExpanded(e=>!e)} style={{ background:bgCol, backdropFilter:"blur(14px) saturate(160%)", WebkitBackdropFilter:"blur(14px) saturate(160%)", border:`1.5px solid ${borderCol}`, borderRadius:19, padding:"clamp(1rem,2.5vw,1.4rem)", boxShadow:isLive?"0 6px 32px rgba(201,146,10,0.12)":B.shadowCard, transition:"all 0.25s cubic-bezier(0.34,1.1,0.64,1)", cursor:"pointer", position:"relative", overflow:"hidden" }}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 10px 36px rgba(0,0,0,0.45), 0 0 22px rgba(201,146,10,0.1)`;}}
        onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=isLive?"0 6px 32px rgba(201,146,10,0.12)":B.shadowCard;}}>

        {/* Done flash ripple overlay */}
        {justDone && (
          <div style={{ position:"absolute", inset:-3, borderRadius:21, pointerEvents:"none", border:"2.5px solid rgba(57,224,122,0.85)", animation:"doneRipple 0.95s cubic-bezier(0.2,0,0.8,1) forwards", zIndex:20 }} />
        )}

        {/* Completed badge */}
        {isCompleted && (
          <div style={{ position:"absolute", top:8, right:8, padding:"3px 11px", borderRadius:100, background:"rgba(57,224,122,0.13)", border:"1px solid rgba(57,224,122,0.35)", display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:B.green }} />
            <span style={{ fontSize:9, fontWeight:700, color:B.green, letterSpacing:"0.06em" }}>DONE</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, flexWrap:"wrap" }}>
            <span style={{ fontSize:"0.75rem", fontWeight:600, letterSpacing:"0.06em", color:B.textMuted, textTransform:"uppercase" }}>{session.start} – {session.end}</span>
            {isLive && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 9px", borderRadius:100, background:"rgba(201,146,10,0.12)", border:"1px solid rgba(201,146,10,0.35)", fontSize:"0.6rem", fontWeight:800, color:B.goldLight, letterSpacing:"0.06em" }}>
                <span className="live-dot" style={{ background:B.goldLight, width:6, height:6 }} /> LIVE NOW
              </span>
            )}
          </div>
          <span style={{ display:"inline-flex", padding:"3px 11px", borderRadius:100, background:catStyle.bg, border:`1px solid ${catStyle.border}`, fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:catStyle.text, whiteSpace:"nowrap" }}>{catStyle.label}</span>
        </div>

        {/* Title */}
        <h3 style={{ fontFamily:"'Cinzel',serif", fontSize:"clamp(0.92rem,2vw,1.08rem)", fontWeight:700, color:isCompleted?B.textMuted:isPast&&!isCompleted?B.textFaint:B.cream, letterSpacing:"0.02em", margin:"0 0 8px", lineHeight:1.35, textDecoration:isCompleted?"line-through":"none", textDecorationColor:"rgba(57,224,122,0.5)", transition:"color 0.3s" }}>{session.title}</h3>

        {/* Description */}
        <p style={{ fontSize:"0.81rem", color:B.textMuted, lineHeight:1.65, margin:"0 0 12px", fontFamily:"'EB Garamond',serif", fontStyle:"italic", display:"-webkit-box", WebkitLineClamp:expanded?undefined:2, WebkitBoxOrient:"vertical", overflow:expanded?"visible":"hidden" }}>{session.desc}</p>

        {/* Speaker chips */}
        {session.people.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:12 }}>
            {session.people.map(pid => {
              const person = PEOPLE[pid];
              if (!person) return null;
              return (
                <button key={pid} onClick={e=>{e.stopPropagation();onPersonClick(person);}} className="btn-spring" style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 13px 5px 5px", borderRadius:100, background:"rgba(201,146,10,0.07)", border:`1.5px solid ${B.borderGold}`, cursor:"pointer", transition:"all 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,146,10,0.15)";e.currentTarget.style.boxShadow="0 3px 14px rgba(201,146,10,0.2)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,146,10,0.07)";e.currentTarget.style.boxShadow="none";}}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`1.5px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color:B.goldLight, fontFamily:"'Cinzel',serif", flexShrink:0 }}>{person.initials}</div>
                  <span style={{ fontSize:"0.7rem", fontWeight:600, color:B.textMuted, whiteSpace:"nowrap" }}>{person.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:10, borderTop:`1px solid ${B.border}`, marginTop:8 }}>
          <button onClick={e=>{e.stopPropagation();onToggleComplete(session.id);}} className="btn-spring" style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 13px", borderRadius:9, background:isCompleted?"rgba(57,224,122,0.1)":"rgba(26,58,107,0.1)", border:`1.5px solid ${isCompleted?"rgba(57,224,122,0.38)":B.border}`, color:isCompleted?B.green:B.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"all 0.22s" }}>
            <span style={{ width:15, height:15, borderRadius:4, border:`1.5px solid ${isCompleted?B.green:"currentColor"}`, background:isCompleted?B.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:B.navyDeep, fontWeight:900, animation:justDone?"checkBounce 0.55s cubic-bezier(0.34,1.56,0.64,1)":"none" }}>
              {isCompleted && "✓"}
            </span>
            {isCompleted ? "Completed ✓" : "Mark Done"}
          </button>
          <button onClick={e=>{e.stopPropagation();setExpanded(v=>!v);}} style={{ background:"transparent", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:B.textFaint, fontSize:"0.7rem", fontWeight:500, padding:4, transition:"color 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.color=B.goldLight}
            onMouseLeave={e=>e.currentTarget.style.color=B.textFaint}>
            {expanded ? "Collapse" : "Expand"}
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform:expanded?"rotate(180deg)":"rotate(0)", transition:"transform 0.3s" }}><path d="M2 4l4 4 4-4" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── AGENDA SECTION ───────────────────────────────────────────────────────────
function AgendaSection({ completedSessions, onToggleComplete, onPersonClick }) {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [filter, setFilter] = useState("all");
  useScrollReveal();

  const progress = Math.round((completedSessions.size / SESSIONS.length) * 100);
  const filters = [
    { k:"all", l:"All Sessions" }, { k:"main-stage", l:"Main Stage" },
    { k:"ceremonial", l:"Ceremonial" }, { k:"interactive", l:"Interactive" }, { k:"networking", l:"Networking" },
  ];
  const filtered = filter === "all" ? SESSIONS : SESSIONS.filter(s => s.cat === filter);

  return (
    <section id="agenda" style={{ padding:"clamp(3.5rem,9vh,5.5rem) 20px", maxWidth:820, margin:"0 auto", position:"relative" }}>
      <SectionHeader pretitle="Order of Events" title="SUMMIT AGENDA" subtitle="Tap any session to expand. Click a speaker's name to view their profile. Mark each session done as the day unfolds!" />

      {/* Progress tracker */}
      <div className="rv-s" style={{ marginBottom:32, padding:"18px 22px", borderRadius:18, background:isDark?"rgba(6,10,20,0.65)":"rgba(255,255,255,0.8)", border:`1px solid ${B.border}`, backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ fontSize:11, fontWeight:600, color:B.textMuted, letterSpacing:"0.07em" }}>EVENT PROGRESS</span>
          <span style={{ fontSize:13, fontWeight:700, color:progress===100?B.green:B.goldLight }}>{progress}%</span>
        </div>
        <div style={{ width:"100%", height:7, background:isDark?"rgba(26,58,107,0.3)":"rgba(26,58,107,0.12)", borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progress}%`, borderRadius:4, background:progress===100?`linear-gradient(90deg,${B.green},#2e9e5b)`:`linear-gradient(90deg,${B.gold},${B.goldLight})`, transition:"width 0.7s cubic-bezier(0.34,1.1,0.64,1)", boxShadow:progress===100?"0 0 14px rgba(57,224,122,0.5)":"0 0 12px rgba(201,146,10,0.4)" }} />
        </div>
        <p style={{ fontSize:10, color:B.textFaint, marginTop:8 }}>{completedSessions.size} of {SESSIONS.length} sessions completed · Saved automatically on this device</p>
      </div>

      {/* Filters */}
      <div className="rv" style={{ display:"flex", gap:8, marginBottom:32, flexWrap:"wrap", justifyContent:"center" }}>
        {filters.map(f => (
          <button key={f.k} onClick={()=>setFilter(f.k)} className="btn-spring" style={{ padding:"7px 17px", borderRadius:100, border:filter===f.k?"none":`1.5px solid ${B.border}`, background:filter===f.k?`linear-gradient(135deg,${B.gold},${B.navyMid})`:"transparent", color:filter===f.k?"#fff":B.textMuted, fontSize:11.5, fontWeight:600, cursor:"pointer", transition:"all 0.22s", whiteSpace:"nowrap", boxShadow:filter===f.k?"0 4px 16px rgba(201,146,10,0.3)":"none" }}>{f.l}</button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position:"relative" }}>
        <div className="tl-axis" style={{ position:"absolute", left:10, top:0, bottom:0, width:2, background:`linear-gradient(to bottom,${B.goldLight},${B.navyMid},${B.border})`, borderRadius:1 }} />
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {filtered.map((session, i) => (
            <SessionCard key={session.id} session={session} index={i} isCompleted={completedSessions.has(session.id)} onToggleComplete={onToggleComplete} onPersonClick={onPersonClick} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── SPEAKER CARD ─────────────────────────────────────────────────────────────
const SpeakerCard = memo(({ person, index, onClick }) => {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const hasImg = person.image && !imgError;
  return (
    <div className="rv-s spk-card" onClick={()=>onClick(person)} style={{ animationDelay:`${(index%6)*0.07}s`, background:isDark?"rgba(6,10,20,0.75)":"rgba(255,255,255,0.88)", border:`1.5px solid ${B.border}`, borderRadius:22, padding:26, textAlign:"center", cursor:"pointer", transition:"all 0.32s cubic-bezier(0.34,1.1,0.64,1)", position:"relative", overflow:"hidden", backdropFilter:"blur(10px)" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-8px) scale(1.02)";e.currentTarget.style.borderColor=B.borderGold;e.currentTarget.style.boxShadow=`0 20px 55px rgba(0,0,0,0.5), ${B.shadowGold}`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0) scale(1)";e.currentTarget.style.borderColor=B.border;e.currentTarget.style.boxShadow="none";}}>
      <div className="spk-glow" style={{ position:"absolute", inset:0, borderRadius:22, background:"radial-gradient(circle at 50% 0%, rgba(201,146,10,0.1), transparent 55%)", opacity:0, transition:"opacity 0.3s", pointerEvents:"none" }} />
      <div style={{ marginBottom:18, position:"relative", display:"inline-block" }}>
        {hasImg ? (
          <>
            {!imgLoaded && <div style={{ width:106, height:106, borderRadius:"50%", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`3px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}><span style={{ fontFamily:"'Cinzel',serif", fontSize:32, fontWeight:900, color:B.goldLight }}>{person.initials}</span></div>}
            <img src={person.image} alt={person.name} onLoad={()=>setImgLoaded(true)} onError={()=>setImgError(true)} style={{ width:106, height:106, borderRadius:"50%", objectFit:"cover", border:`3px solid ${B.goldLight}`, boxShadow:`0 4px 22px rgba(0,0,0,0.4), ${B.shadowGold}`, display:imgLoaded?"block":"none", margin:"0 auto", animation:imgLoaded?"scaleIn 0.4s ease":"none" }} />
          </>
        ) : (
          <div style={{ width:106, height:106, borderRadius:"50%", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`3px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", animation:"pulseGlow 3s infinite" }}><span style={{ fontFamily:"'Cinzel',serif", fontSize:32, fontWeight:900, color:B.goldLight }}>{person.initials}</span></div>
        )}
        <div className="spk-ring" style={{ position:"absolute", inset:-5, borderRadius:"50%", border:`1.5px solid rgba(201,146,10,0.25)`, pointerEvents:"none" }} />
        <div style={{ position:"absolute", inset:-12, borderRadius:"50%", border:`1px solid rgba(201,146,10,0.1)`, pointerEvents:"none", animation:"pulseGlow 4s infinite 0.5s" }} />
      </div>
      <h3 style={{ fontFamily:"'Cinzel',serif", fontSize:"0.82rem", fontWeight:700, color:B.cream, marginBottom:6, lineHeight:1.35 }}>{person.name}</h3>
      <p style={{ fontSize:"0.7rem", fontWeight:600, color:B.goldLight, marginBottom:4 }}>{person.role}</p>
      {person.institution && <p style={{ fontSize:"0.64rem", color:B.textFaint }}>{person.institution}</p>}
      <div style={{ marginTop:14, padding:"5px 14px", borderRadius:100, background:"rgba(201,146,10,0.07)", border:`1px solid ${B.borderGold}`, display:"inline-flex", alignItems:"center", gap:5 }}>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={B.goldLight} strokeWidth="1.5"><circle cx="6" cy="6" r="5" /><path d="M6 4v4M4 6h4" /></svg>
        <span style={{ fontSize:9, color:B.goldLight, fontWeight:700, letterSpacing:"0.07em" }}>VIEW PROFILE</span>
      </div>
    </div>
  );
});

// ─── SPEAKERS SECTION ─────────────────────────────────────────────────────────
function SpeakersSection({ onPersonClick }) {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const featured = Object.values(PEOPLE).filter(p => p.category === "speaker" && p.featured);
  const others   = Object.values(PEOPLE).filter(p => p.category !== "speaker" && p.category !== "patron" && !p.featured);
  useScrollReveal();
  return (
    <section id="speakers" style={{ padding:"clamp(3.5rem,9vh,5.5rem) 20px", maxWidth:1140, margin:"0 auto" }}>
      <SectionHeader pretitle="Distinguished Guests & Officials" title="OUR SPEAKERS" subtitle="Click any card to discover their full biography, role, and contribution to this historic summit." />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(215px,1fr))", gap:20, marginBottom:52 }}>
        {featured.map((p,i) => <SpeakerCard key={p.id} person={p} index={i} onClick={onPersonClick} />)}
      </div>
      {others.length > 0 && (
        <>
          <div className="rv" style={{ textAlign:"center", marginBottom:24 }}>
            <p style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:B.goldLight }}>Also Featuring</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14 }}>
            {others.map((p,i) => (
              <div key={p.id} className="rv-s hover-lift" onClick={()=>onPersonClick(p)} style={{ background:isDark?"rgba(6,10,20,0.55)":"rgba(255,255,255,0.78)", border:`1.5px solid ${B.border}`, borderRadius:16, padding:"18px 16px", textAlign:"center", cursor:"pointer", transition:"all 0.28s cubic-bezier(0.34,1.1,0.64,1)" }}>
                <div style={{ width:54, height:54, borderRadius:"50%", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`2px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 11px", fontSize:15, fontWeight:700, color:B.goldLight, fontFamily:"'Cinzel',serif", animation:"pulseGlow 4s infinite" }}>{p.initials}</div>
                <h4 style={{ fontFamily:"'Cinzel',serif", fontSize:"0.75rem", fontWeight:700, color:B.cream, marginBottom:4 }}>{p.name}</h4>
                <p style={{ fontSize:"0.64rem", color:B.goldLight }}>{p.role}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ─── INSTITUTION LOGO CELL — shows logo PNG, falls back to short-name text ────
function InstitutionLogo({ logo, short, pending }) {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [err, setErr] = useState(false);
  if (logo && !err) {
    return (
      <img src={logo} alt={short} onError={()=>setErr(true)}
        style={{ width:"80%", height:"80%", objectFit:"contain", display:"block" }} />
    );
  }
  return (
    <span style={{ fontSize:9, fontWeight:900, color:pending?B.textFaint:B.goldLight, fontFamily:"'Cinzel',serif", letterSpacing:"0.04em", textAlign:"center" }}>{short}</span>
  );
}

// ─── VOTE OF THANKS SECTION ────────────────────────────────────────────────────
function VoteOfThanksSection({ onPersonClick }) {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  useScrollReveal();

  const appreciations = [
    { title:"Vote of Thanks", person:PEOPLE.ayodeleOlamilekun, desc:"For eloquently closing the summit with words of collective gratitude and appreciation on behalf of all delegates and the RUNSA Legislative Council." },
    { title:"Appreciation of Sponsors", person:PEOPLE.odunsiOluwatobiloba, desc:"For publicly acknowledging and recognising the generous sponsors whose investment made this summit possible." },
    { title:"Presentation of Awards", person:PEOPLE.profShedrach, desc:"For recognising and celebrating the exceptional delegates, trivia champions, best pitchers, and outstanding contributors." },
  ];

  const externalInstitutions = [
    { name:"Students' Representative Council", parent:"University of Ibadan Students' Union", short:"UI",       logo:`${INST}/ui-logo.png` },
    { name:"Students' Parliament Council",     parent:"Lagos State University, Ojo",          short:"LASU",     logo:`${INST}/lasu-logo.png` },
    { name:"Student Legislative Council",      parent:"Babcock University, Ilisan-Remo",      short:"BU",       logo:`${INST}/bu-logo.png` },
    { name:"Student Legislative Council",      parent:"Adeleke University, Ede",              short:"AU",       logo:`${INST}/au-logo.png` },
    { name:"SRC, Students' Union & Law Council",parent:"Joseph Ayo Babalola University",     short:"JABU",     logo:`${INST}/jabu-logo.png` },
    { name:"Student Representative Council",   parent:"Osun State University",               short:"UNIOSUN",  logo:`${INST}/uniosun-logo.png` },
    { name:"Senate Council, Students' Union",  parent:"Yaba College of Technology",           short:"YabaTech",logo:`${INST}/yabatech-logo.png` },
    { name:"Students' Representative Council (SRC), Great Ife Students' Union", parent:"Obafemi Awolowo University", short:"OAU", logo:`${INST}/oau-logo.png` },
    { name:"Students' Council",                parent:"Covenant University",                  short:"CU",       logo:`${INST}/cu-logo.png`, pending:true },
  ];

  return (
    <section id="vote-of-thanks" style={{ padding:"clamp(3.5rem,9vh,5.5rem) 20px", maxWidth:960, margin:"0 auto" }}>
      <SectionHeader pretitle="Gratitude" title="VOTE OF THANKS" subtitle="We extend our deepest appreciation to every individual, institution, and organisation that contributed to the success of this historic summit." />

      {/* Appreciation cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:52 }}>
        {appreciations.map((item,i) => (
          <div key={i} className={`rv-${i%2===0?"l":"r"} hover-glow`} onClick={()=>item.person&&onPersonClick(item.person)} style={{ display:"flex", alignItems:"center", gap:22, padding:"22px 28px", borderRadius:20, background:isDark?"rgba(6,10,20,0.7)":"rgba(255,255,255,0.88)", border:`1.5px solid ${B.borderGold}`, cursor:item.person?"pointer":"default", transition:"all 0.32s cubic-bezier(0.34,1.1,0.64,1)", backdropFilter:"blur(10px)" }}
            onMouseEnter={e=>{if(item.person){e.currentTarget.style.borderColor=B.goldLight;e.currentTarget.style.boxShadow=B.shadowGold;e.currentTarget.style.transform="translateX(5px)";}}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=B.borderGold;e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateX(0)";}}>
            {item.person && <div style={{ width:60, height:60, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`2.5px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:700, color:B.goldLight, fontFamily:"'Cinzel',serif", boxShadow:"0 0 20px rgba(201,146,10,0.25)", animation:"heartbeat 5s ease-in-out infinite" }}>{item.person.initials}</div>}
            <div style={{ flex:1 }}>
              <h3 style={{ fontFamily:"'Cinzel',serif", fontSize:"0.98rem", fontWeight:700, color:B.cream, marginBottom:5 }}>{item.title}</h3>
              <p style={{ fontSize:"0.8rem", color:B.textMuted, lineHeight:1.65 }}>{item.desc}</p>
              {item.person && <p style={{ fontSize:"0.76rem", color:B.goldLight, marginTop:7, fontWeight:600 }}>{item.person.name} · {item.person.role}</p>}
            </div>
            {item.person && <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={B.borderGold} strokeWidth="1.5"><path d="M6 3l6 6-6 6" /></svg>}
          </div>
        ))}
      </div>

      {/* General thanks list */}
      <div className="rv" style={{ padding:"36px 32px", borderRadius:22, background:isDark?"rgba(6,10,20,0.5)":"rgba(255,255,255,0.7)", border:`1.5px solid ${B.border}`, textAlign:"center", marginBottom:44, position:"relative", overflow:"hidden" }}>
        {[["top:14px","left:14px","borderTop","borderLeft"],["top:14px","right:14px","borderTop","borderRight"],["bottom:14px","left:14px","borderBottom","borderLeft"],["bottom:14px","right:14px","borderBottom","borderRight"]].map(([p1,p2,b1,b2],i) => (
          <div key={i} style={{ position:"absolute", ...Object.fromEntries([[p1.split(":")[0],p1.split(":")[1]],[p2.split(":")[0],p2.split(":")[1]]]), width:28, height:28, [b1]:`2px solid ${B.goldLight}`, [b2]:`2px solid ${B.goldLight}`, opacity:0.4, pointerEvents:"none" }} />
        ))}
        <p style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:B.goldLight, marginBottom:22 }}>With Deepest Gratitude To</p>
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:10 }}>
          {[
            "All Invited Institutions & Their Delegates",
            "RUNSA — Redeemer's University Nigeria Students' Association",
            "RUNSA Legislative Council, 2025/2026 Session",
            "Redeemer's University Management",
            "Faculty of Engineering, RUN",
            "RUNSA Executive Council",
            "All Summit Volunteers",
            "Esteemed Speakers & Panelists",
            "Every Delegate Who Attended",
            "Media & Documentation Team",
            "Chapel Community & Prayer Warriors",
          ].map((item,i) => (
            <span key={i} className="btn-spring" style={{ padding:"9px 18px", borderRadius:100, background:"rgba(201,146,10,0.07)", border:`1px solid ${B.borderGold}`, fontSize:"0.78rem", color:B.textMuted, fontWeight:500, transition:"all 0.22s", cursor:"default", display:"inline-block" }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,146,10,0.14)";e.currentTarget.style.borderColor=B.goldLight;e.currentTarget.style.color=B.cream;}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,146,10,0.07)";e.currentTarget.style.borderColor=B.borderGold;e.currentTarget.style.color=B.textMuted;}}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* External institutions */}
      <div className="rv">
        <div style={{ textAlign:"center", marginBottom:22 }}>
          <p style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:B.goldLight, marginBottom:6 }}>Our Invited Institutions</p>
          <p style={{ fontSize:"0.78rem", color:B.textFaint, fontFamily:"'EB Garamond',serif", fontStyle:"italic" }}>The legislative bodies & student councils who honoured us with their presence</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {externalInstitutions.map((inst,i) => (
            <div key={i} className={`rv-${i%2===0?"l":"r"}`} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"16px 18px", borderRadius:16, background:isDark?"rgba(6,10,20,0.55)":"rgba(255,255,255,0.78)", border:`1.5px solid ${inst.pending?B.border:B.borderGold}`, position:"relative", overflow:"hidden", transition:"all 0.25s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=inst.pending?B.border:B.goldLight;e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=inst.pending?B.border:B.borderGold;e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{ width:44, height:44, borderRadius:10, flexShrink:0, background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`1.5px solid ${inst.pending?B.border:B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                <InstitutionLogo logo={inst.logo} short={inst.short} pending={inst.pending} />
              <div style={{ flex:1 }}>
                <p style={{ fontSize:"0.78rem", fontWeight:700, color:inst.pending?B.textFaint:B.cream, marginBottom:3, fontFamily:"'Cinzel',serif", lineHeight:1.3 }}>{inst.name}</p>
                <p style={{ fontSize:"0.68rem", color:B.textFaint }}>{inst.parent}</p>
                {inst.pending && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:5, padding:"2px 9px", borderRadius:100, background:"rgba(245,107,91,0.09)", border:"1px solid rgba(245,107,91,0.28)", fontSize:"0.58rem", fontWeight:700, color:"rgba(245,107,91,0.75)", letterSpacing:"0.07em" }}>
                    ⏳ PENDING CONFIRMATION
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── GALLERY SECTION ──────────────────────────────────────────────────────────
function GallerySection() {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  // Lightbox state: which section + which index within that section
  const [lightbox, setLightbox] = useState(null); // { images, sectionLabel, idx }
  const [loadedMap, setLoadedMap] = useState({});
  const [errorMap,  setErrorMap]  = useState({});
  useScrollReveal();

  const openLightbox = (section, itemIdx) => setLightbox({ images: section.items, sectionLabel: section.label, idx: itemIdx });
  const navLightbox  = dir => setLightbox(lb => lb ? { ...lb, idx: Math.max(0, Math.min(lb.idx + dir, lb.images.length - 1)) } : null);

  return (
    <section id="gallery" style={{ padding:"clamp(3.5rem,9vh,5.5rem) 20px", maxWidth:1140, margin:"0 auto" }}>
      <SectionHeader pretitle="Memories" title="PHOTO GALLERY" subtitle="Tap a section cover to open its album. Swipe or use arrow keys to browse within each segment." />

      {GALLERY_SECTIONS.map((section, si) => (
        <div key={section.id} className="rv" style={{ marginBottom:40 }}>
          {/* Section label */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <div style={{ width:4, height:20, borderRadius:2, background:`linear-gradient(to bottom,${B.goldLight},${B.navyMid})` }} />
            <p style={{ fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:B.goldLight }}>{section.label}</p>
            <span style={{ fontSize:"0.65rem", color:B.textFaint }}>({section.items.length} photo{section.items.length !== 1 ? "s" : ""})</span>
          </div>
          {/* Photo grid for this section */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
            {section.items.map((item, ii) => {
              const hasErr    = errorMap[item.id];
              const hasLoaded = loadedMap[item.id];
              return (
                <div key={item.id} className="rv-s img-zoom hover-lift" onClick={()=>!hasErr && openLightbox(section, ii)}
                  style={{ animationDelay:`${(ii%4)*0.06}s`, position:"relative", borderRadius:16, overflow:"hidden", border:`1px solid ${B.border}`, cursor:hasErr?"default":"pointer", aspectRatio:"4/3", background:isDark?"rgba(6,10,20,0.6)":"rgba(26,58,107,0.06)", transition:"all 0.28s cubic-bezier(0.34,1.1,0.64,1)" }}>
                  {!hasErr ? (
                    <img src={item.src} alt={item.caption} loading="lazy"
                      onLoad={()=>setLoadedMap(m=>({...m,[item.id]:true}))}
                      onError={()=>setErrorMap(m=>({...m,[item.id]:true}))}
                      style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:hasLoaded?1:0, transition:"opacity 0.4s ease" }} />
                  ) : (
                    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
                      <svg width="34" height="34" viewBox="0 0 36 36" fill="none" stroke={B.textFaint} strokeWidth="1.2"><rect x="2" y="6" width="32" height="24" rx="3"/><circle cx="12" cy="16" r="3"/><path d="M2 24l8-7 6 6 5-4 13 9" strokeLinejoin="round"/></svg>
                      <p style={{ fontSize:"0.7rem", color:B.textFaint, textAlign:"center", padding:"0 12px" }}>{item.caption}<br /><span style={{ fontSize:"0.6rem", opacity:0.6 }}>Photo coming soon</span></p>
                    </div>
                  )}
                  {!hasErr && (
                    <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"18px 12px 11px", background:"linear-gradient(to top,rgba(3,8,16,0.9),transparent)" }}>
                      <p style={{ fontSize:"0.73rem", fontWeight:600, color:"#f5f0e8", margin:0 }}>{item.caption}</p>
                    </div>
                  )}
                  {/* Album badge on first photo */}
                  {ii === 0 && !hasErr && (
                    <div style={{ position:"absolute", top:9, left:9, display:"flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:100, background:"rgba(201,146,10,0.18)", border:`1px solid rgba(201,146,10,0.45)`, backdropFilter:"blur(8px)" }}>
                      <svg width="9" height="9" viewBox="0 0 12 12" fill={B.goldLight}><rect x="0" y="0" width="5" height="5" rx="1"/><rect x="7" y="0" width="5" height="5" rx="1"/><rect x="0" y="7" width="5" height="5" rx="1"/><rect x="7" y="7" width="5" height="5" rx="1"/></svg>
                      <span style={{ fontSize:"0.58rem", fontWeight:700, color:B.goldLight, letterSpacing:"0.07em" }}>ALBUM</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {lightbox && (
        <Lightbox images={lightbox.images} sectionLabel={lightbox.sectionLabel} idx={lightbox.idx} onClose={()=>setLightbox(null)} onNav={navLightbox} />
      )}
    </section>
  );
}

// ─── PATRON CARD (clickable, with popup) ──────────────────────────────────────
const PatronCard = memo(({ patron, index, onClick }) => {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const hasImg = patron.image && !imgError;
  return (
    <div className={`rv-${index%2===0?"l":"r"} hover-glow`} onClick={()=>onClick(patron)} style={{ display:"flex", alignItems:"center", gap:20, padding:"22px 24px", borderRadius:20, background:isDark?"rgba(6,10,20,0.65)":"rgba(255,255,255,0.88)", border:`1.5px solid ${B.borderGold}`, cursor:"pointer", transition:"all 0.32s cubic-bezier(0.34,1.1,0.64,1)", position:"relative", overflow:"hidden" }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=B.goldLight;e.currentTarget.style.boxShadow=B.shadowGold;e.currentTarget.style.transform="translateY(-4px)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=B.borderGold;e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}>
      {/* Top glow strip */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,transparent,rgba(201,146,10,0.5),transparent)", opacity:0.6 }} />
      {/* Photo */}
      <div style={{ position:"relative", flexShrink:0 }}>
        {hasImg ? (
          <div style={{ position:"relative" }}>
            {!imgLoaded && <div style={{ width:78, height:78, borderRadius:"50%", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`3px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontFamily:"'Cinzel',serif", fontSize:22, fontWeight:900, color:B.goldLight }}>{patron.initials}</span></div>}
            <img src={patron.image} alt={patron.name} onLoad={()=>setImgLoaded(true)} onError={()=>setImgError(true)} style={{ width:78, height:78, borderRadius:"50%", objectFit:"cover", border:`3px solid ${B.goldLight}`, boxShadow:`0 0 24px rgba(201,146,10,0.3)`, display:imgLoaded?"block":"none", animation:imgLoaded?"scaleIn 0.4s ease":"none" }} />
            <div style={{ position:"absolute", inset:-4, borderRadius:"50%", border:`1px solid rgba(201,146,10,0.3)`, animation:"pulseGlow 3s infinite", pointerEvents:"none" }} />
          </div>
        ) : (
          <div style={{ width:78, height:78, borderRadius:"50%", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`3px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", animation:"pulseGlow 3s infinite" }}>
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:22, fontWeight:900, color:B.goldLight }}>{patron.initials}</span>
          </div>
        )}
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:"0.64rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:B.goldLight, marginBottom:5 }}>{patron.title}</p>
        <h4 style={{ fontFamily:"'Cinzel',serif", fontSize:"0.9rem", fontWeight:700, color:B.cream, marginBottom:4, lineHeight:1.3 }}>{patron.name}</h4>
        <p style={{ fontSize:"0.72rem", color:B.textFaint, lineHeight:1.5 }}>{patron.role}</p>
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:8, padding:"3px 10px", borderRadius:100, background:"rgba(201,146,10,0.07)", border:`1px solid ${B.borderGold}` }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke={B.goldLight} strokeWidth="1.5"><circle cx="6" cy="6" r="5" /><path d="M6 4v4M4 6h4" /></svg>
          <span style={{ fontSize:8, color:B.goldLight, fontWeight:700, letterSpacing:"0.07em" }}>VIEW PROFILE</span>
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke={B.borderGold} strokeWidth="1.5"><path d="M6 3l6 6-6 6" /></svg>
    </div>
  );
});

// ─── PLANNING COMMITTEE LEADER CARD (with photo) ──────────────────────────────
const CommitteeLeaderCard = memo(({ leader, index }) => {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);
  const hasImg = leader.image && !imgError;
  return (
    <div className="rv-s" style={{ animationDelay:`${index*0.08}s`, background:isDark?"rgba(6,10,20,0.7)":"rgba(255,255,255,0.88)", border:`1.5px solid ${B.borderGold}`, borderRadius:20, padding:"24px 18px", textAlign:"center", position:"relative", overflow:"hidden", transition:"all 0.28s cubic-bezier(0.34,1.1,0.64,1)" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-5px)";e.currentTarget.style.boxShadow=B.shadowGold;e.currentTarget.style.borderColor=B.goldLight;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor=B.borderGold;}}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,transparent,rgba(201,146,10,0.6),transparent)" }} />
      <div style={{ marginBottom:14, position:"relative", display:"inline-block" }}>
        {hasImg ? (
          <>
            {!imgLoaded && <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`2.5px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}><span style={{ fontFamily:"'Cinzel',serif", fontSize:24, fontWeight:900, color:B.goldLight }}>{leader.initials}</span></div>}
            <img src={leader.image} alt={leader.name} onLoad={()=>setImgLoaded(true)} onError={()=>setImgError(true)} style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", border:`2.5px solid ${B.goldLight}`, boxShadow:`0 0 22px rgba(201,146,10,0.3)`, display:imgLoaded?"block":"none", margin:"0 auto", animation:imgLoaded?"scaleIn 0.35s ease":"none" }} />
          </>
        ) : (
          <div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`2.5px solid ${B.goldLight}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", animation:"pulseGlow 3.5s infinite" }}>
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:24, fontWeight:900, color:B.goldLight }}>{leader.initials}</span>
          </div>
        )}
        <div style={{ position:"absolute", inset:-4, borderRadius:"50%", border:`1px solid rgba(201,146,10,0.25)`, animation:"pulseGlow 3s infinite", pointerEvents:"none" }} />
      </div>
      <h4 style={{ fontFamily:"'Cinzel',serif", fontSize:"0.8rem", fontWeight:700, color:B.cream, marginBottom:5, lineHeight:1.3 }}>{leader.name}</h4>
      <p style={{ fontSize:"0.68rem", color:B.goldLight, lineHeight:1.5 }}>{leader.role}</p>
    </div>
  );
});

// ─── ACKNOWLEDGEMENTS SECTION ─────────────────────────────────────────────────
function AcknowledgementsSection({ onPersonClick }) {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  useScrollReveal();

  return (
    <section id="acknowledgements" style={{ padding:"clamp(3.5rem,9vh,5.5rem) 20px", maxWidth:1060, margin:"0 auto" }}>
      <SectionHeader pretitle="Recognition" title="ACKNOWLEDGEMENTS" subtitle="We honour the individuals and organisations whose support made this summit a remarkable reality." />

      {/* PATRONS */}
      <div className="rv" style={{ marginBottom:60 }}>
        <p style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:B.goldLight, marginBottom:22, textAlign:"center" }}>Our Patrons</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
          {PATRONS.map((patron,i) => <PatronCard key={patron.id} patron={patron} index={i} onClick={onPersonClick} />)}
        </div>
      </div>

      {/* PLANNING COMMITTEE */}
      <div className="rv" style={{ marginBottom:48 }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <p style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.16em", textTransform:"uppercase", color:B.goldLight, marginBottom:6 }}>Planning Committee</p>
          <p style={{ fontSize:"0.78rem", color:B.textFaint, fontFamily:"'EB Garamond',serif", fontStyle:"italic" }}>The dedicated team behind every detail of this summit</p>
        </div>

        {/* 4 leaders with photo cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16, marginBottom:32 }}>
          {COMMITTEE_LEADERS.map((leader,i) => <CommitteeLeaderCard key={leader.id} leader={leader} index={i} />)}
        </div>

        {/* Unit listings */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {COMMITTEE_UNITS.map((unit,ui) => (
            <div key={ui} className="rv-s" style={{ padding:"16px 18px", borderRadius:16, background:isDark?"rgba(6,10,20,0.5)":"rgba(255,255,255,0.75)", border:`1.5px solid ${B.border}`, transition:"all 0.25s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=B.borderGold;e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=B.border;e.currentTarget.style.transform="translateY(0)";}}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:B.goldLight, boxShadow:`0 0 8px ${B.goldLight}`, flexShrink:0 }} />
                <p style={{ fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:B.goldLight }}>{unit.unit}</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {unit.members.map((m,mi) => (
                  <div key={mi} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, background:`linear-gradient(135deg,${B.navyMid},${isDark?"#0d1e38":"#2a4a8a"})`, border:`1.5px solid ${B.borderGold}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color:B.goldLight, fontFamily:"'Cinzel',serif" }}>
                      {m.name.split(" ").filter(w=>!["Hon.","Rt.","Miss","Mr."].includes(w)).map(w=>w[0]).slice(0,2).join("")}
                    </div>
                    <div>
                      <p style={{ fontSize:"0.76rem", fontWeight:600, color:B.cream, lineHeight:1.3 }}>{m.name}</p>
                      <p style={{ fontSize:"0.62rem", color:B.textFaint }}>{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FIRST EDITION SECTION ────────────────────────────────────────────────────
function FirstEditionSection() {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  useScrollReveal();
  const stats = [
    { n:"21", l:"Sessions", c:B.goldLight }, { n:"7", l:"Speakers", c:B.blue },
    { n:"9+", l:"Institutions", c:B.purple }, { n:"1", l:"Historic Day", c:B.green },
  ];
  return (
    <section id="first-edition" style={{ padding:"clamp(3.5rem,9vh,5.5rem) 20px", maxWidth:960, margin:"0 auto" }}>
      <SectionHeader pretitle="Inaugural Edition" title="THE 1ST EDITION" subtitle="The maiden RUNSA Legislative Summit marks the beginning of a prestigious new tradition in student governance and legislative excellence." />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))", gap:16, marginBottom:44 }}>
        {stats.map((s,i) => (
          <div key={i} className="rv-s hover-lift" style={{ padding:"26px 18px", borderRadius:19, textAlign:"center", background:isDark?"rgba(6,10,20,0.65)":"rgba(255,255,255,0.85)", border:`1.5px solid ${B.border}`, transition:"all 0.3s" }}>
            <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"2.8rem", color:s.c, lineHeight:1, marginBottom:7 }}>{s.n}</p>
            <p style={{ fontSize:"0.72rem", fontWeight:600, color:B.textMuted, letterSpacing:"0.1em", textTransform:"uppercase" }}>{s.l}</p>
          </div>
        ))}
      </div>
      <div className="rv" style={{ padding:"36px 32px", borderRadius:22, background:isDark?"rgba(6,10,20,0.5)":"rgba(255,255,255,0.75)", border:`1.5px solid ${B.borderGold}`, textAlign:"center", position:"relative", overflow:"hidden" }}>
        {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h],i) => (
          <div key={i} style={{ position:"absolute", [v]:14, [h]:14, width:28, height:28, [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]:`2px solid ${B.goldLight}`, [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]:`2px solid ${B.goldLight}`, opacity:0.45 }} />
        ))}
        <p style={{ fontFamily:"'EB Garamond',serif", fontSize:"1.02rem", color:B.textMuted, lineHeight:1.95, maxWidth:660, margin:"0 auto" }}>
          The 1st Edition of the RUNSA Legislative Summit stands as an enduring testament to the power of student-led governance.
          Bringing together delegates from across Nigerian institutions, this summit creates a platform for meaningful dialogue,
          knowledge exchange, and the cultivation of democratic leadership values that will shape the future of our great nation.
          From the red carpet arrivals to the final group photograph — every moment is designed to inspire, educate, and connect.
        </p>
        <div style={{ marginTop:28, display:"inline-flex", alignItems:"center", gap:10, padding:"10px 24px", borderRadius:100, border:`1px solid ${B.borderGold}`, background:"rgba(201,146,10,0.07)" }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:B.goldLight, animation:"blink 2s infinite" }} />
          <span style={{ fontSize:"0.78rem", fontWeight:600, color:B.goldLight, letterSpacing:"0.1em" }}>APRIL 29, 2026 · REDEEMER'S UNIVERSITY, EDE</span>
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer() {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const scrollTo = id => { const el = document.getElementById(id); if(el) el.scrollIntoView({ behavior:"smooth", block:"start" }); };
  return (
    <footer style={{ borderTop:`1px solid ${B.border}`, padding:"60px 20px 36px", background:isDark?"rgba(3,8,16,0.9)":"rgba(240,237,230,0.9)", position:"relative", zIndex:2 }}>
      <div style={{ maxWidth:1060, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"center", gap:5, marginBottom:36 }}>
          {Array.from({length:22}).map((_,i) => <div key={i} style={{ width:4, height:4, borderRadius:"50%", background:i%3===0?B.goldLight:B.border, animation:i%2===0?"blink 2.4s infinite":"none", opacity:0.7 }} />)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:36, marginBottom:44 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <LogoBadge src={COUNCIL_LOGO} fallback="LS" size={38} pulse={false} style={{ animation:"pulseGlow 3s infinite" }} />
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:B.goldLight, letterSpacing:"0.1em" }}>LEGISLATIVE SUMMIT</span>
            </div>
            <p style={{ fontSize:"0.76rem", color:B.textFaint, lineHeight:1.8 }}>Legislating the Future for Democratic Leadership. The inaugural student legislative summit of Redeemer's University Nigeria.</p>
          </div>
          <div>
            <p style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:B.goldLight, marginBottom:16 }}>Quick Links</p>
            {[{id:"hero",l:"Home"},{id:"agenda",l:"Agenda"},{id:"speakers",l:"Speakers"},{id:"vote-of-thanks",l:"Vote of Thanks"},{id:"gallery",l:"Gallery"},{id:"acknowledgements",l:"Acknowledgements"}].map(link => (
              <button key={link.id} onClick={()=>scrollTo(link.id)} style={{ display:"block", background:"none", border:"none", padding:"4px 0", color:B.textFaint, fontSize:"0.81rem", cursor:"pointer", fontFamily:"'Inter',sans-serif", transition:"color 0.2s", textAlign:"left" }}
                onMouseEnter={e=>e.currentTarget.style.color=B.goldLight}
                onMouseLeave={e=>e.currentTarget.style.color=B.textFaint}>
                {link.l}
              </button>
            ))}
          </div>
          <div>
            <p style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", color:B.goldLight, marginBottom:16 }}>Event Details</p>
            <p style={{ fontSize:"0.81rem", color:B.textFaint, lineHeight:1.9 }}>
              📅 29th April 2026<br />
              ⏰ Starts 9:00 AM<br />
              📍 Sapetro Lecture Theatre<br />
              🏫 Redeemer's University, Ede<br />
              🌍 Osun State, Nigeria
            </p>
          </div>
        </div>
        <div style={{ borderTop:`1px solid ${B.border}`, paddingTop:22, display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"center", gap:12 }}>
          <p style={{ fontSize:"0.7rem", color:B.textFaint }}>© 2026 Redeemer's University Students' Association — Legislative Council. All rights reserved.</p>
          <p style={{ fontSize:"0.65rem", color:B.textFaint, fontFamily:"'Cinzel',serif", letterSpacing:"0.09em" }}>1ST EDITION · CRAFTED WITH EXCELLENCE</p>
        </div>
      </div>
    </footer>
  );
}

// ─── FLOATING ACTIONS ─────────────────────────────────────────────────────────
function FloatingActions({ completedCount, totalCount }) {
  const { isDark } = useTheme();
  const B = isDark ? DARK : LIGHT;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  if (!visible) return null;
  return (
    <div style={{ position:"fixed", bottom:24, right:20, zIndex:900, display:"flex", flexDirection:"column", gap:10, alignItems:"flex-end" }}>
      {completedCount > 0 && (
        <div className="au-popIn" style={{ padding:"8px 14px", borderRadius:13, background:isDark?"rgba(4,10,20,0.94)":"rgba(255,255,255,0.94)", border:`1.5px solid rgba(57,224,122,0.38)`, display:"flex", alignItems:"center", gap:8, boxShadow:"0 6px 22px rgba(0,0,0,0.4)", backdropFilter:"blur(12px)" }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:B.green }} />
          <span style={{ fontSize:11.5, fontWeight:700, color:B.green }}>{completedCount}/{totalCount} done</span>
        </div>
      )}
      <button onClick={()=>window.scrollTo({ top:0, behavior:"smooth" })} className="btn-spring" style={{ width:50, height:50, borderRadius:"50%", background:`linear-gradient(135deg,${B.gold},${B.navyMid})`, border:"none", color:"#fff", fontSize:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 24px rgba(201,146,10,0.4)", animation:"popIn 0.3s ease" }}>
        ↑
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN AGENDA COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Agenda() {
  const [isDark, setIsDark] = useState(true);
  const toggle = useCallback(() => setIsDark(d => !d), []);
  const [activeSection, setActiveSection] = useState("hero");
  const [selectedPerson, setSelectedPerson] = useState(null);

  // ── Fix mobile viewport zoom (ensures correct 1:1 scale on all devices) ──
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "viewport"; document.head.prepend(meta); }
    meta.content = "width=device-width, initial-scale=1.0, viewport-fit=cover";
  }, []);

  // Persist completed sessions to localStorage (survives tab reloads)
  const [completedSessions, setCompletedSessions] = useState(() => {
    try { const s = localStorage.getItem("runsa-2026-done"); return s ? new Set(JSON.parse(s)) : new Set(); }
    catch { return new Set(); }
  });
  useEffect(() => {
    try { localStorage.setItem("runsa-2026-done", JSON.stringify([...completedSessions])); }
    catch { /* ignore */ }
  }, [completedSessions]);

  // Section tracker for nav active state
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if(e.isIntersecting) setActiveSection(e.target.id); }),
      { threshold:0.18, rootMargin:"-75px 0px -55% 0px" }
    );
    document.querySelectorAll("section[id]").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleToggleComplete = useCallback(id => {
    setCompletedSessions(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); showToast("Marked as pending", "info"); }
      else { next.add(id); showToast("Session complete! ✓", "success"); }
      return next;
    });
  }, []);

  const handlePersonClick = useCallback(person => setSelectedPerson(person), []);
  const B = isDark ? DARK : LIGHT;

  return (
    <ThemeCtx.Provider value={{ isDark, toggle }}>
      <div style={{ minHeight:"100vh", background:B.bg, position:"relative", transition:"background 0.4s ease" }}>
        <GlobalStyles isDark={isDark} />
        <SpiralBg isDark={isDark} />
        <Navigation activeSection={activeSection} />
        <PersonModal person={selectedPerson} onClose={()=>setSelectedPerson(null)} />

        <main>
          <HeroSection />
          <div style={{ position:"relative", zIndex:2 }}>
            <div style={{ background:isDark?"rgba(6,10,20,0.25)":"rgba(26,58,107,0.03)", borderTop:`1px solid ${B.border}` }}>
              <AgendaSection completedSessions={completedSessions} onToggleComplete={handleToggleComplete} onPersonClick={handlePersonClick} />
            </div>
            <div style={{ background:isDark?"rgba(6,10,20,0.18)":"rgba(26,58,107,0.02)", borderTop:`1px solid ${B.border}` }}>
              <SpeakersSection onPersonClick={handlePersonClick} />
            </div>
            <div style={{ background:isDark?"rgba(6,10,20,0.28)":"rgba(26,58,107,0.03)", borderTop:`1px solid ${B.border}` }}>
              <VoteOfThanksSection onPersonClick={handlePersonClick} />
            </div>
            <div style={{ background:isDark?"rgba(6,10,20,0.18)":"rgba(26,58,107,0.02)", borderTop:`1px solid ${B.border}` }}>
              <GallerySection />
            </div>
            <div style={{ background:isDark?"rgba(6,10,20,0.28)":"rgba(26,58,107,0.03)", borderTop:`1px solid ${B.border}` }}>
              <AcknowledgementsSection onPersonClick={handlePersonClick} />
            </div>
            <div style={{ background:isDark?"rgba(6,10,20,0.18)":"rgba(26,58,107,0.02)", borderTop:`1px solid ${B.border}` }}>
              <FirstEditionSection />
            </div>
            <Footer />
          </div>
        </main>

        <FloatingActions completedCount={completedSessions.size} totalCount={SESSIONS.length} />
      </div>
    </ThemeCtx.Provider>
  );
}
