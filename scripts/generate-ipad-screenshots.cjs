#!/usr/bin/env node
/**
 * iPad Pro 12.9" App Store screenshot generator
 * Authenticates against the running dev server, creates demo case data,
 * then captures real app routes at 2048×2732px (1024×1366 CSS @ DPR 2).
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const BASE_URL  = "http://localhost:5000";
const OUT_DIR   = path.join(__dirname, "..", "public");
const CSS_W     = 1024;
const CSS_H     = 1366;
const DPR       = 2;   // → 2048×2732 physical pixels

const DEMO_EMAIL    = "ipad-screenshots@mednote-demo.local";
const DEMO_PASSWORD = "Screenshot2026!";

// Full SOAP note fields to inject into the demo case
const DEMO_CASE_DATA = {
  patientName: "James Harrington",
  mrn:         "MRN-48291",
  age:         58,
  gender:      "M",
  chiefComplaint: "Substernal chest pressure radiating to the left arm",
};

const DEMO_SOAP = {
  status: "completed",
  hpi: "58-year-old male with a history of hypertension and hyperlipidemia presents with 2 hours of substernal chest pressure 8/10, radiating to the left arm, associated with diaphoresis and mild shortness of breath. Onset was sudden while resting. No pleuritic component, no cough, no fever. Denies prior episodes. Last well yesterday evening.",
  ros: {
    Cardiovascular: "Positive for chest pain, diaphoresis. Negative for palpitations, syncope.",
    Respiratory:    "Mild dyspnea on presentation. Negative for cough, wheezing.",
    Gastrointestinal: "Negative for nausea, vomiting, abdominal pain.",
    Neurological:   "Negative for headache, dizziness, focal weakness.",
  },
  physicalExam: JSON.stringify({
    Vitals:         "BP 152/94 mmHg, HR 98 bpm, RR 18/min, O₂ Sat 97% on RA, Temp 37.1°C",
    General:        "Alert, anxious-appearing, diaphoretic, in moderate distress",
    Cardiovascular: "Regular rate and rhythm, no murmurs/gallops/rubs, no JVD",
    Respiratory:    "Clear to auscultation bilaterally, no wheezing or crackles",
    Abdomen:        "Soft, non-tender, non-distended, no organomegaly",
    Extremities:    "No peripheral edema, distal pulses intact bilaterally",
  }),
  assessment: "Acute Coronary Syndrome — Probable NSTEMI. Rule out STEMI. Concurrent hypertensive urgency.",
  plan: "1. Aspirin 325mg PO STAT\n2. Nitroglycerin 0.4mg SL PRN chest pain\n3. 12-lead ECG STAT, repeat if ongoing symptoms\n4. Cardiology consult — emergent\n5. Serial troponins q3h × 3 sets\n6. Heparin infusion — pending cardiology review\n7. NPO, IV access, continuous cardiac telemetry\n8. Portable CXR\n9. CBC, BMP, coagulation panel\n10. Bedside echo if available",
  differentialDiagnosis: [
    { diagnosis: "Acute Coronary Syndrome / NSTEMI", icdCode: "I21.9", likelihood: "High", reasoning: "Classic presentation with risk factors" },
    { diagnosis: "Unstable Angina", icdCode: "I20.0", likelihood: "Medium", reasoning: "Chest pressure without confirmed enzyme rise" },
    { diagnosis: "Aortic Dissection", icdCode: "I71.00", likelihood: "Low", reasoning: "No pulse differential, no tearing quality" },
    { diagnosis: "GERD / Esophageal Spasm", icdCode: "K21.0", likelihood: "Low", reasoning: "Diaphoresis makes GI etiology less likely" },
  ],
  patientEducation: "Explained diagnosis and need for urgent cardiac evaluation. Instructed patient to avoid exertion. Advised to call 911 if symptoms worsen at any time.",
  treatmentRedFlags: "Return immediately if: chest pain worsens or is unrelieved by nitroglycerin, shortness of breath increases, you experience loss of consciousness or near-syncope, arm/jaw/back pain intensifies.",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiPost(url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${url}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res;
}

async function apiPatch(url, body, token) {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res;
}

async function setupDemoData() {
  console.log("  Setting up demo account...");
  let token, userId, user;

  // Try login first (user may already exist from a previous run)
  const loginRes = await apiPost("/api/auth/login", { email: DEMO_EMAIL, password: DEMO_PASSWORD });
  if (loginRes.ok) {
    const data = await loginRes.json();
    token  = data.token;
    userId = data.user.id;
    user   = data.user;
    console.log(`  Logged in as existing demo user (id=${userId})`);
  } else {
    // Register fresh
    const regRes = await apiPost("/api/auth/register", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      firstName: "Sarah",
      lastName: "Chen",
    });
    if (!regRes.ok) {
      const err = await regRes.json();
      throw new Error(`Register failed: ${err.message}`);
    }
    const data = await regRes.json();
    token  = data.token;
    userId = data.user.id;
    user   = data.user;
    console.log(`  Registered demo user (id=${userId})`);
  }

  // Accept terms if not already accepted (required to access app screens)
  await fetch(`${BASE_URL}/api/auth/accept-terms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });

  // Fetch fresh user (with termsAcceptedAt populated)
  const userRes = await fetch(`${BASE_URL}/api/auth/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (userRes.ok) user = await userRes.json();

  // Check if a completed demo case already exists
  let caseId = null;
  const casesRes = await fetch(`${BASE_URL}/api/cases?userId=${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (casesRes.ok) {
    const cases = await casesRes.json();
    const existing = cases.find(c => c.patientName === DEMO_CASE_DATA.patientName && c.status === "completed");
    if (existing) {
      caseId = existing.id;
      console.log(`  Reusing existing demo case (id=${caseId})`);
    }
  }

  if (!caseId) {
    const createRes = await apiPost("/api/cases", { ...DEMO_CASE_DATA, userId }, token);
    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(`Cannot create demo case: ${err.message || err.error}`);
    }
    const newCase = await createRes.json();
    caseId = newCase.id;
    console.log(`  Created demo case (id=${caseId})`);

    // Inject full SOAP note directly
    const patchRes = await apiPatch(`/api/cases/${caseId}`, DEMO_SOAP, token);
    if (patchRes.ok) {
      console.log("  Injected full SOAP note");
    } else {
      const err = await patchRes.json().catch(() => ({}));
      console.warn("  PATCH warning:", err);
    }
  }

  return { user: { ...user, token }, token, userId, caseId };
}

async function injectAuth(page, user) {
  await page.evaluate((u) => {
    localStorage.setItem("user", JSON.stringify(u));
  }, user);
}

async function waitForContent(page, selector, timeoutMs = 14000) {
  try {
    await page.waitForSelector(selector, { timeout: timeoutMs });
  } catch {
    console.warn(`  Timed out waiting for: ${selector}`);
  }
  await new Promise(r => setTimeout(r, 2000));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log("Preparing demo data via live API...");
  let demoData;
  try {
    demoData = await setupDemoData();
  } catch (err) {
    console.error("Failed to set up demo data:", err.message);
    process.exit(1);
  }
  const { user, caseId } = demoData;
  console.log(`Demo ready — caseId=${caseId}\n`);

  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  const screens = [
    {
      name:    "ipad-screenshot-1-home",
      url:     `${BASE_URL}/home`,
      waitFor: '[data-testid="link-new-session"]',
    },
    {
      name:    "ipad-screenshot-2-recording",
      url:     `${BASE_URL}/record`,
      waitFor: '[data-testid="button-record"]',
    },
    {
      name:    "ipad-screenshot-3-notes",
      url:     `${BASE_URL}/cases/${caseId}`,
      waitFor: "h2, [data-testid], main",
    },
  ];

  for (const { name, url, waitFor } of screens) {
    console.log(`Capturing ${name} → ${url}`);
    const page = await browser.newPage();

    await page.setViewport({ width: CSS_W, height: CSS_H, deviceScaleFactor: DPR });

    // 1. Load app root (establishes origin for localStorage)
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 15000 });
    // 2. Inject auth before navigation so SPA reads it on mount
    await injectAuth(page, user);
    // 3. Navigate to the target screen
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

    if (waitFor) await waitForContent(page, waitFor);

    const outPath = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: outPath, fullPage: false });

    const stat = fs.statSync(outPath);
    console.log(`  Saved → ${outPath} (${(stat.size / 1024).toFixed(0)} KB)`);
    await page.close();
  }

  await browser.close();
  console.log("\nDone! All 3 iPad screenshots captured from the real app UI.");
})();
