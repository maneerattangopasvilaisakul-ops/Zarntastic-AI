import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Add firebase-admin imports
const adminImports = `
import * as admin from "firebase-admin";
let adminAuth: any = null;
try {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  admin.initializeApp({ projectId: config.projectId });
  adminAuth = admin.auth();
} catch (e) {
  console.error("Firebase Admin init failed:", e);
}

const requireAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(403).json({ error: 'Forbidden' });
  }
};
`;

content = content.replace('let db: any = null;', adminImports + '\nlet db: any = null;');

// Patch GET /api/bookings to scrub PII if no token
const getBookingsRe = /app\.get\("\/api\/bookings", \(req, res\) => \{[\s\S]*?res\.json\(bookings\);\n\}\);/m;
const getBookingsNew = `app.get("/api/bookings", async (req, res) => {
  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
    const token = authHeader.split('Bearer ')[1];
    try {
      await adminAuth.verifyIdToken(token);
      isAdmin = true;
    } catch (e) { }
  }

  const status = req.query.status as string;
  let result = bookings;
  if (status && status !== "all") {
    result = bookings.filter((b) => b.payment.status === status);
  }

  if (!isAdmin) {
    // Scrub PII for public access
    result = result.map(b => ({
      ...b,
      customer: { ...b.customer, name: "***", phone: "***", lineId: "***", email: "***" },
      meetingLink: "***"
    }));
  }

  res.json(result);
});`;
content = content.replace(getBookingsRe, getBookingsNew);

// Patch POST /api/bookings/:id/status to require admin
const postStatusRe = /app\.post\("\/api\/bookings\/:id\/status", async \(req, res\) => \{/m;
const postStatusNew = `app.post("/api/bookings/:id/status", requireAdmin, async (req, res) => {`;
content = content.replace(postStatusRe, postStatusNew);

// Fix BUG-003: Negative Price in POST /api/bookings
const postBookingsRe = /app\.post\("\/api\/bookings", async \(req, res\) => \{\n\s*const \{\n\s*courseId,\n\s*courseTitle,\n\s*totalHours,\n\s*totalDays,\n\s*totalPrice,\n\s*customer,\n\s*schedule,\n\s*\} = req\.body;\n\n\s*if \(!courseId \|\| !customer\?\.name \|\| !customer\?\.phone \|\| !Array\.isArray\(schedule\) \|\| schedule\.length === 0\) \{\n\s*return res\.status\(400\)\.json\(\{ error: "กรุณากรอกข้อมูลการจองและระบุตารางเรียนให้ครบถ้วน" \}\);\n\s*\}/m;
const postBookingsNew = `app.post("/api/bookings", async (req, res) => {
  const {
    courseId,
    courseTitle,
    totalHours,
    totalDays,
    totalPrice,
    customer,
    schedule,
  } = req.body;

  if (!courseId || !customer?.name || !customer?.phone || !Array.isArray(schedule) || schedule.length === 0) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลการจองและระบุตารางเรียนให้ครบถ้วน" });
  }

  if (typeof totalPrice !== 'number' || totalPrice <= 0) {
    return res.status(400).json({ error: "ราคาคอร์สไม่ถูกต้อง" });
  }`;
content = content.replace(postBookingsRe, postBookingsNew);

// Fix BUG-004: AI Fallback Auto-Approve Slip
const slipFallbackRe = /let aiVerificationResult: any = \{\n\s*detectedAmount: manualAmount \|\| booking\.totalPrice,\n\s*detectedDate: new Date\(\)\.toISOString\(\)\.slice\(0, 16\)\.replace\("T", " "\),\n\s*detectedRef: referenceNo \|\| `REF-\$\{Math\.floor\(10000000 \+ Math\.random\(\) \* 90000000\)\}`,\n\s*confidence: 0\.96,\n\s*statusMatch: true,\n\s*notes: "สลิปได้รับการตรวจวิเคราะห์ ยอดเงินตรงกับราคาคอร์ส",\n\s*\};/m;
const slipFallbackNew = `let aiVerificationResult: any = {
    detectedAmount: manualAmount || 0,
    detectedDate: new Date().toISOString().slice(0, 16).replace("T", " "),
    detectedRef: referenceNo || \`REF-\${Math.floor(10000000 + Math.random() * 90000000)}\`,
    confidence: 0,
    statusMatch: false,
    notes: "รอการตรวจสอบสลิปโดยผู้ดูแลระบบ (Manual Verification)",
  };`;
content = content.replace(slipFallbackRe, slipFallbackNew);

fs.writeFileSync('server.ts', content);
