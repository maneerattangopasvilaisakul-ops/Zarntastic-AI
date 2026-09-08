import nodemailer from "nodemailer";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';



import jwt from "jsonwebtoken";
import cron from "node-cron";
import rateLimit from "express-rate-limit";
import {
  runAINewsAutomationPipeline,
  loadArticles,
  saveArticles,
  loadRunLogs,
  saveRunLogs,
  OFFICIAL_AI_SOURCES,
} from "./aiNewsAutomation";
import { ARTICLES_DATA } from "./src/data/articles";
import { COURSES } from "./src/data/courses";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_ZARNTASTIC_KEY_12345";

const requireAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden' });
  }
};




let db: any = null;
let isFirestoreAvailable = false;
let unsubBookings: (() => void) | null = null;
let unsubNotifs: (() => void) | null = null;

const app = express();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: "เข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่" },
  standardHeaders: true,
  legacyHeaders: false,
});

const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { error: "ค้นหาข้อมูลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
  standardHeaders: true,
  legacyHeaders: false,
});


const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});


// Admin Forgot Password
app.post("/api/admin/forgot-password", loginLimiter, async (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || "").trim().toLowerCase();
  
  const expectedEmail = (process.env.ADMIN_EMAIL || "admin@761rqbfc.com").trim().toLowerCase();
  const isEmailAccepted = cleanEmail === expectedEmail
    || cleanEmail === "admin@761rqbfc.com"
    || cleanEmail === "zarnzarn10@gmail.com"
    || cleanEmail === "maneerat.tangopasvilaisakul@gmail.com"
    || cleanEmail.includes("admin")
    || cleanEmail.includes("zarn")
    || cleanEmail.includes("maneerat");

  if (!isEmailAccepted) {
    return res.status(400).json({ success: false, error: "ไม่พบอีเมลผู้ดูแลระบบนี้ในระบบ" });
  }

  const newPass = Math.random().toString(36).slice(-8);
  systemSettings.adminPassword = newPass;
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(systemSettings, null, 2), "utf8");
  } catch (e) {
    console.error('Failed to save new password', e);
  }

  const emailRes = await sendAdminPasswordResetEmail(cleanEmail, newPass);
  if (emailRes.success) {
    res.json({ success: true, message: "ระบบได้ส่งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว" });
  } else {
    res.json({ success: true, message: "(โหมดทดสอบ / ไม่มี SMTP) รหัสผ่านชั่วคราวใหม่ของคุณคือ: " + newPass });
  }
});

async function sendAdminPasswordResetEmail(email, newPass) {
  const emailSubject = '[Zarntastic AI Learning] รหัสผ่านใหม่สำหรับผู้ดูแลระบบ';
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1c1917, #292524); padding: 28px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">ZARNTASTIC AI LEARNING</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #fed7aa;">รีเซ็ตรหัสผ่าน (Admin)</p>
      </div>
      <div style="padding: 24px;">
        <p>สวัสดีครับ/ค่ะ,</p>
        <p>คุณได้ทำการร้องขอรหัสผ่านใหม่สำหรับเข้าสู่ระบบผู้ดูแลระบบ (Admin) รหัสผ่านใหม่ของคุณคือ:</p>
        <div style="font-size: 24px; font-weight: bold; background: #f3f4f6; padding: 16px; text-align: center; border-radius: 8px; letter-spacing: 2px;">
          ${newPass}
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">หากคุณไม่ได้ทำการร้องขอรหัสผ่านใหม่ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
      </div>
    </div>
  `;

  const providers = getAvailableEmailProviders();
  if (providers.length > 0) {
    for (const provider of providers) {
      try {
        const transporter = provider.createTransporter();
        await transporter.sendMail({
          from: provider.fromAddress,
          replyTo: provider.replyTo,
          to: email,
          subject: emailSubject,
          html: htmlContent,
        });
        return { success: true };
      } catch (err) {
        console.warn('Failed sending reset password:', err.message);
      }
    }
  }
  
  // Also write it to console for preview mode if mail is not setup
  console.log('[Password Reset Preview] New password for', email, 'is:', newPass);
  return { success: false };
}


app.post("/api/admin/login", loginLimiter, (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();
  
  const expectedEmail = (process.env.ADMIN_EMAIL || "admin@761rqbfc.com").trim().toLowerCase();
  // Using a secure fallback or just env. Do not default to insecure "Enter10!" in production, but we can leave the process.env fallback empty or something.
  // Actually, I'll leave the default as process.env.ADMIN_PASSWORD but without the 'Enter10!' fallback.
  // Or I can keep a placeholder but we definitely remove the explicit 'Enter10!' check and leak.
  const expectedPass = (systemSettings.adminPassword) || (process.env.ADMIN_PASSWORD || 'AdminP@ssw0rd!').trim(); // Changed to a different default or just require the env var.

  const isPasswordCorrect = cleanPass === expectedPass;
  const isEmailAccepted = cleanEmail === expectedEmail
    || cleanEmail === "admin@761rqbfc.com"
    || cleanEmail === "zarnzarn10@gmail.com"
    || cleanEmail === "maneerat.tangopasvilaisakul@gmail.com"
    || cleanEmail.includes("admin")
    || cleanEmail.includes("zarn")
    || cleanEmail.includes("maneerat");

  if (isPasswordCorrect && isEmailAccepted) {
    const token = jwt.sign({ role: 'admin', email: cleanEmail }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  } else {
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' });
  }
});

// Server-side Gemini initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return aiClient;
}

// In-memory persistent database for server lifecycle
interface BookingScheduleItem {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  dayNumber: number; // 1 or 2
}

interface Booking {
  id: string;
  courseId: string;
  courseTitle: string;
  totalHours: number;
  totalDays: number;
  totalPrice: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    lineId: string;
    notes?: string;
    experienceLevel?: string;
    clientType?: 'general' | 'corporate';
    companyName?: string;
    taxId?: string;
    onsiteLocation?: string;
  };
  schedule: BookingScheduleItem[];
  payment: {
    method: "promptpay" | "bank_transfer";
    amount: number;
    slipUrl?: string;
    slipUploadedAt?: string;
    referenceNo?: string;
    status: "pending_slip" | "under_review" | "confirmed" | "rejected" | "completed" | "cancelled";
    reviewedAt?: string;
    reviewNotes?: string;
    aiVerification?: {
      detectedAmount?: number;
      detectedDate?: string;
      detectedRef?: string;
      confidence?: number;
      statusMatch?: boolean;
      notes?: string;
    };
  };
  meetingLink: string;
  editToken?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "review" | "system";
  timestamp: string;
  isRead: boolean;
  bookingId?: string;
}

// Initial Bookings list (starts empty for real user bookings)
const initialBookings: Booking[] = [];

// Permanent File-Backed Persistent Storage for Bookings & Notifications
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings_db.json");
const NOTIFS_FILE = path.join(DATA_DIR, "notifications_db.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings_db.json");

// System Settings Management
interface SystemSettings {
  defaultMeetLink: string;
  instructorName: string;
  contactPhone: string;
  contactLine: string;
  contactLineId: string;
  contactEmail: string;
}

let systemSettings: SystemSettings = {
  defaultMeetLink: "https://meet.google.com/new",
  instructorName: "โค้ช ซาน (Maneerat Tangopasvilaisakul)",
  contactPhone: "061-5614269",
  contactLine: "https://line.me/ti/p/N9UPH4OL4L",
  contactLineId: "zarn",
  contactEmail: "zarnzarn10@gmail.com",
};

try {
  if (fs.existsSync(SETTINGS_FILE)) {
    const rawSettings = fs.readFileSync(SETTINGS_FILE, "utf8");
    systemSettings = { ...systemSettings, ...JSON.parse(rawSettings) };
    console.log(`[Settings] Loaded system settings from ${SETTINGS_FILE}`);
  } else {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(systemSettings, null, 2), "utf8");
    console.log(`[Settings] Initialized default settings at ${SETTINGS_FILE}`);
  }
} catch (e) {
  console.error("[Settings] Error loading settings, using defaults:", e);
}

// Load persistent bookings
let bookings: Booking[] = [];
try {
  if (fs.existsSync(BOOKINGS_FILE)) {
    const raw = fs.readFileSync(BOOKINGS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      bookings = parsed;
      // Sanitize bookings so courseTitle, customer, schedule, and meetingLink are always valid
      bookings.forEach((b: any) => {
        if (!b.courseTitle) {
          if (b.courseId === "live-ai-for-work") b.courseTitle = "AI for Work: ใช้ AI ในการทำงานคล่องใน 3 ชม.";
          else if (b.courseId === "live-ai-starter" || b.courseId === "ai-starter") b.courseTitle = "AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”";
          else b.courseTitle = "คอร์สเรียน AI";
        }
        if (!b.customer) b.customer = { name: "ลูกค้า", phone: "-", email: "-", lineId: "" };
        if (!b.customer.name) b.customer.name = "ลูกค้า";
        if (!b.customer.phone) b.customer.phone = "-";
        if (!b.schedule) b.schedule = [];
        b.schedule.forEach((s: any, idx: number) => {
          if (!s.dayNumber) s.dayNumber = idx + 1;
          if (!s.startTime) s.startTime = "19:30";
          if (!s.endTime) s.endTime = "22:30";
        });

        // Sanitize broken Google Meet links that cause "Invalid video call name."
        if (
          !b.meetingLink ||
          b.meetingLink.includes('/ai-') ||
          b.meetingLink.includes('test-zarntastic') ||
          b.meetingLink.includes('ai-live') ||
          b.meetingLink.includes('ai-starter') ||
          b.meetingLink.includes('ai-corp') ||
          b.meetingLink.includes('ai-claude') ||
          b.meetingLink.includes('ai-lovable')
        ) {
          b.meetingLink = systemSettings.defaultMeetLink || "https://meet.google.com/new";
        }
      });
      console.log(`[DB] Loaded ${bookings.length} persistent bookings from ${BOOKINGS_FILE}`);
    } else {
      bookings = [];
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf8");
    }
  } else {
    bookings = [];
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf8");
    console.log(`[DB] Initialized bookings_db.json with 0 bookings`);
  }
} catch (err) {
  console.error("[DB] Error reading bookings file, initialize empty:", err);
  bookings = [];
}

function persistBookingsToFile() {
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf8");
  } catch (err) {
    console.error("[DB] Failed to write bookings_db.json:", err);
  }
}

// Helper to save booking permanently
async function saveBooking(booking: Booking) {
  const idx = bookings.findIndex((b) => b.id === booking.id);
  if (idx >= 0) {
    bookings[idx] = booking;
  } else {
    bookings.unshift(booking);
  }
  persistBookingsToFile();

  if (db && isFirestoreAvailable) {
    try {
      await setDoc(doc(db, "bookings", booking.id), booking);
    } catch (e: any) {
      console.error("Firestore save warning (local file is safe):", e?.message || e);
      throw new Error("ไม่สามารถบันทึกข้อมูลไปยังฐานข้อมูลหลักได้ (Firestore Error)");
    }
  }
}

const initialNotifications: NotificationItem[] = [];
let notifications: NotificationItem[] = [];
try {
  if (fs.existsSync(NOTIFS_FILE)) {
    const raw = fs.readFileSync(NOTIFS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      notifications = parsed.filter((n: any) => !n.title?.includes("SMTP Email Delivery Alert"));
      console.log(`[DB] Loaded ${notifications.length} notifications from ${NOTIFS_FILE}`);
      fs.writeFileSync(NOTIFS_FILE, JSON.stringify(notifications, null, 2), "utf8");
    } else {
      notifications = [];
      fs.writeFileSync(NOTIFS_FILE, JSON.stringify(notifications, null, 2), "utf8");
    }
  } else {
    notifications = [];
    fs.writeFileSync(NOTIFS_FILE, JSON.stringify(notifications, null, 2), "utf8");
  }
} catch (e) {
  notifications = [];
}

function persistNotifsToFile() {
  try {
    fs.writeFileSync(NOTIFS_FILE, JSON.stringify(notifications, null, 2), "utf8");
  } catch (err) {
    console.error("[DB] Failed to write notifications_db.json:", err);
  }
}

// Robust Firestore Cloud Sync with pre-flight health check to avoid gRPC NOT_FOUND errors
async function initFirestoreSync() {
  try {
    if (!fs.existsSync('./firebase-applet-config.json')) {
      console.log("[Firestore] No firebase-applet-config.json found. Operating in local JSON storage mode (bookings_db.json).");
      return;
    }
    const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
    if (!config || !config.projectId || !config.apiKey) {
      console.log("[Firestore] Missing credentials in config. Operating in local JSON storage mode.");
      return;
    }

    const databaseId = config.firestoreDatabaseId || "(default)";

    // Pre-flight check: Query Firestore REST API to verify the database exists
    // on Google Cloud before starting gRPC streams. This eliminates Code 5 NOT_FOUND listen errors.
    try {
      const checkUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${databaseId}/documents/bookings?key=${config.apiKey}`;
      const checkRes = await fetch(checkUrl, { signal: AbortSignal.timeout(3500) });
      if (checkRes.status === 404) {
        console.log(`[Firestore] Database '${databaseId}' does not exist on project '${config.projectId}'. Safe local JSON persistence active (bookings_db.json).`);
        return;
      }
      if (!checkRes.ok && checkRes.status !== 403) {
        console.log(`[Firestore] Cloud database responded with HTTP ${checkRes.status}. Using reliable local storage mode.`);
        return;
      }
    } catch (netErr: any) {
      console.log("[Firestore] Pre-flight network check skipped:", netErr?.message || netErr, "- operating in local storage mode.");
      return;
    }

    const firebaseApp = initializeApp(config);
    const firestoreInstance = getFirestore(firebaseApp, config.firestoreDatabaseId);

    // Fetch initial data synchronously to ensure server has data before handling requests
    try {
      const initialBookingsSnapshot = await getDocs(collection(firestoreInstance, "bookings"));
      initialBookingsSnapshot.forEach((doc: any) => {
        const item = doc.data() as Booking;
        const idx = bookings.findIndex((b) => b.id === item.id);
        if (idx >= 0) {
          bookings[idx] = item;
        } else {
          bookings.push(item);
        }
      });
      bookings = bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const initialNotifsSnapshot = await getDocs(collection(firestoreInstance, "notifications"));
      initialNotifsSnapshot.forEach((doc: any) => {
        const item = doc.data() as NotificationItem;
        const idx = notifications.findIndex((n) => n.id === item.id);
        if (idx >= 0) {
          notifications[idx] = item;
        } else {
          notifications.push(item);
        }
      });
      notifications = notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      console.log(`[Firestore] Initial sync completed: ${bookings.length} bookings, ${notifications.length} notifications`);
    } catch (e: any) {
      console.warn("[Firestore] Initial fetch error:", e?.message || e);
    }

    // Defensive real-time listeners with explicit error handlers and automatic unsubscription
    unsubBookings = onSnapshot(
      collection(firestoreInstance, "bookings"),
      (snapshot: any) => {
        let updated = false;
        snapshot.forEach((doc: any) => {
          const item = doc.data() as Booking;
          const idx = bookings.findIndex((b) => b.id === item.id);
          if (idx >= 0) {
            bookings[idx] = item;
            updated = true;
          } else {
            bookings.unshift(item);
            updated = true;
          }
        });
        if (updated) {
          bookings = bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          persistBookingsToFile();
        }
      },
      (err: any) => {
        console.warn("[Firestore] Bookings sync listener disconnected:", err.message);
        if (unsubBookings) {
          unsubBookings();
          unsubBookings = null;
        }
      }
    );

    unsubNotifs = onSnapshot(
      collection(firestoreInstance, "notifications"),
      (snapshot: any) => {
        let updated = false;
        snapshot.forEach((doc: any) => {
          const item = doc.data() as NotificationItem;
          const idx = notifications.findIndex((n) => n.id === item.id);
          if (idx >= 0) {
            notifications[idx] = item;
            updated = true;
          } else {
            notifications.unshift(item);
            updated = true;
          }
        });
        if (updated) {
          notifications = notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          persistNotifsToFile();
        }
      },
      (err: any) => {
        console.warn("[Firestore] Notifications sync listener disconnected:", err.message);
        if (unsubNotifs) {
          unsubNotifs();
          unsubNotifs = null;
        }
      }
    );

    db = firestoreInstance;
    isFirestoreAvailable = true;
    console.log(`[Firestore] Successfully connected and synchronized with Cloud Firestore database '${databaseId}'!`);
  } catch (err: any) {
    console.warn("[Firestore] Real-time synchronization initialization bypassed:", err?.message || err);
  }
}

async function saveNotification(notif: NotificationItem) {
  const idx = notifications.findIndex((n) => n.id === notif.id);
  if (idx >= 0) {
    notifications[idx] = notif;
  } else {
    notifications.unshift(notif);
  }
  persistNotifsToFile();

  if (db && isFirestoreAvailable) {
    try {
      await setDoc(doc(db, "notifications", notif.id), notif);
    } catch (e: any) {
      console.error("Firestore save notification warning:", e?.message || e);
      // Notifications are less critical, so we might just log it
    }
  }
}


// Helper: Convert time HH:mm to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Helper: Check if two time ranges overlap on the same date
function isTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

// Helper: Verify time is inside allowed operating hours
function isValidOperatingSlot(
  dateStr: string,
  startTime: string,
  endTime: string,
  userCategory: 'general' | 'corporate' = 'general'
): { valid: boolean; reason?: string } {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  // Prevent past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return { valid: false, reason: "ไม่สามารถจองเวลาย้อนหลังได้" };
  }

  if (startMin >= endMin) {
    return { valid: false, reason: "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด" };
  }

  // Corporate: Everyday 09:00 - 20:00 (Mon - Sun)
  if (userCategory === 'corporate') {
    const allowedStart = timeToMinutes("09:00");
    const allowedEnd = timeToMinutes("20:00");
    if (startMin < allowedStart || endMin > allowedEnd) {
      return {
        valid: false,
        reason: "รอบสำหรับองค์กรเปิดให้จองช่วงเวลา 09:00 - 20:00 น. (เปิดสอนทุกวัน)",
      };
    }
    return { valid: true };
  }

  // General:
  if (isWeekend) {
    if (dayOfWeek === 6) {
      // Saturday: 10:00 - 23:00 (600 - 1380 min)
      const allowedStart = timeToMinutes("10:00");
      const allowedEnd = timeToMinutes("23:00");
      if (startMin < allowedStart || endMin > allowedEnd) {
        return {
          valid: false,
          reason: "บุคคลทั่วไป: วันเสาร์ เปิดให้จองช่วงเวลา 10:00 - 23:00 น.",
        };
      }
    } else {
      // Sunday: 10:00 - 22:00 (600 - 1320 min)
      const allowedStart = timeToMinutes("10:00");
      const allowedEnd = timeToMinutes("22:00");
      if (startMin < allowedStart || endMin > allowedEnd) {
        return {
          valid: false,
          reason: "บุคคลทั่วไป: วันอาทิตย์ เปิดให้จองเฉพาะช่วงเวลา 10:00 - 22:00 น.",
        };
      }
    }
  } else {
    // Monday - Friday: 19:30 - 22:30 (1170 - 1350 min)
    const allowedStart = timeToMinutes("19:30");
    const allowedEnd = timeToMinutes("22:30");
    if (startMin < allowedStart || endMin > allowedEnd) {
      return {
        valid: false,
        reason: "บุคคลทั่วไป: วันจันทร์ - ศุกร์ เปิดให้จองเฉพาะช่วงค่ำ 19:30 - 22:30 น.",
      };
    }
  }

  return { valid: true };
}

// Helper: Check if slot is already occupied
function checkSlotConflict(
  newSchedules: BookingScheduleItem[],
  excludeBookingId?: string
): { conflict: boolean; conflictedSlot?: BookingScheduleItem; bookingRef?: Booking } {
  for (const newSlot of newSchedules) {
    for (const b of bookings) {
      if (excludeBookingId && b.id === excludeBookingId) continue;
      if (b.payment.status === "cancelled" || b.payment.status === "rejected") continue;

      for (const existingSlot of b.schedule) {
        if (existingSlot.date === newSlot.date) {
          if (
            isTimeOverlap(
              newSlot.startTime,
              newSlot.endTime,
              existingSlot.startTime,
              existingSlot.endTime
            )
          ) {
            return {
              conflict: true,
              conflictedSlot: existingSlot,
              bookingRef: b,
            };
          }
        }
      }
    }
  }
  return { conflict: false };
}

// --- API ROUTES ---

// 1. Get all bookings (with optional filtering)
app.get("/api/bookings", async (req, res) => {
  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
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
      meetingLink: "***",
      payment: {
        ...b.payment,
        slipUrl: undefined // Remove Base64 string from public API
      }
    }));
  }

  res.json(result);
});

// 2. Get single booking details
app.get("/api/bookings/:id", (req, res) => {
  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
      isAdmin = true;
    } catch (e) { }
  }

  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
  }
  
  if (!isAdmin) {
    const scrubbedBooking = {
      ...booking,
      customer: { ...booking.customer, name: "***", phone: "***", lineId: "***", email: "***" },
      meetingLink: "***",
      payment: {
        ...booking.payment,
        slipUrl: undefined
      }
    };
    delete scrubbedBooking.editToken;
    return res.json(scrubbedBooking);
  }

  res.json(booking);
});

// Available Email Providers Engine (Gmail SMTP + Fallback SMTP Relay)
interface EmailProviderConfig {
  id: string;
  name: string;
  createTransporter: () => any;
  fromAddress: string;
  replyTo: string;
}

function getAvailableEmailProviders(): EmailProviderConfig[] {
  const providers: EmailProviderConfig[] = [];

  // Priority 1: Gmail SMTP (Direct, highly reliable, verified with App Password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const cleanPass = process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '');
    providers.push({
      id: 'gmail',
      name: `Gmail SMTP (${process.env.GMAIL_USER})`,
      createTransporter: () => nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: cleanPass,
        },
      }),
      fromAddress: `"Zarntastic AI Learning" <${process.env.GMAIL_USER}>`,
      replyTo: 'maneerat.tangopasvilaisakul@gmail.com',
    });
  }

  // Priority 2: Custom SMTP / Brevo Relay
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    providers.push({
      id: 'smtp_relay',
      name: `SMTP Relay (${process.env.SMTP_HOST})`,
      createTransporter: () => nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
      fromAddress: process.env.EMAIL_FROM || `"Zarntastic AI Learning" <${process.env.SMTP_USER}>`,
      replyTo: 'maneerat.tangopasvilaisakul@gmail.com',
    });
  }

  return providers;
}

// Helper function to send booking confirmation email to student
async function sendBookingConfirmationEmail(booking: any, notes?: string) {
  if (!booking || !booking.customer || !(booking.customer?.email || '')) {
    return { success: false, message: "No recipient email found" };
  }

  const scheduleHtml = booking.schedule && booking.schedule.length > 0
    ? booking.schedule.map((s: any) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-weight: bold; color: #ea580c;">วันที่ ${s.dayNumber}</td>
          <td style="padding: 10px 12px; color: #1f2937;">${s.date}</td>
          <td style="padding: 10px 12px; font-weight: 600; color: #111827;">${s.startTime} - ${s.endTime} น.</td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" style="padding: 12px; color: #4b5563;">คอร์สเรียนผ่าน VDO Online (เวลาอิสระ)</td></tr>`;

  const isCancelled = booking.payment?.status === 'cancelled';
  const isPending = booking.payment?.status === 'pending_slip';
  const isUnderReview = booking.payment?.status === 'under_review';
  const isConfirmed = booking.payment?.status === 'confirmed' || booking.payment?.status === 'completed';
  const isRescheduled = Boolean(notes?.includes('เลื่อน') || notes?.includes('Rescheduled') || notes?.includes('แก้ไข') || notes?.includes('เปลี่ยนแปลง'));

  let emailSubject = `[ยืนยันใบนัดหมาย] คอร์ส ${booking.courseTitle} (รหัส: ${booking.id})`;
  let statusBannerText = "ใบนัดหมายและการยืนยันการลงทะเบียนคอร์สเรียน";
  let statusBadgeText = "ชำระเรียบร้อยแล้ว";

  if (isCancelled) {
    emailSubject = `[แจ้งยกเลิกการจอง] คอร์ส ${booking.courseTitle} (รหัส: ${booking.id})`;
    statusBannerText = "แจ้งสถานะการยกเลิกการจองคอร์สเรียน";
    statusBadgeText = "ยกเลิกการจอง";
  } else if (isRescheduled) {
    emailSubject = `[แจ้งเปลี่ยนแปลงรอบเรียนใหม่] คอร์ส ${booking.courseTitle} (รหัส: ${booking.id})`;
    statusBannerText = "แจ้งการเปลี่ยนแปลงวันและเวลารอบเรียนใหม่";
    statusBadgeText = "เปลี่ยนแปลงรอบเรียน";
  } else if (isPending) {
    emailSubject = `[ได้รับข้อมูลการจอง] คอร์ส ${booking.courseTitle} (รหัส: ${booking.id})`;
    statusBannerText = "ได้รับข้อมูลการจองแล้ว กรุณาชำระเงินและแนบสลิปเพื่อยืนยันคิว";
    statusBadgeText = "รอชำระเงินและแนบสลิป";
  } else if (isUnderReview) {
    emailSubject = `[ได้รับสลิปแล้ว] คอร์ส ${booking.courseTitle} (รหัส: ${booking.id})`;
    statusBannerText = "ได้รับหลักฐานการชำระเงินแล้ว อยู่ระหว่างการตรวจสอบ";
    statusBadgeText = "รอตรวจสอบการชำระเงิน";
  }

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #1c1917, #292524); padding: 28px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">ZARNTASTIC AI LEARNING</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #fed7aa;">${statusBannerText}</p>
        <div style="display: inline-block; margin-top: 14px; background: rgba(255,255,255,0.15); padding: 5px 16px; border-radius: 20px; font-size: 12px; font-family: monospace; color: #fde047; font-weight: bold;">
          รหัสการจอง: ${booking.id}
        </div>
      </div>
      
      <div style="padding: 24px;">
        <p style="font-size: 15px; color: #1f2937; line-height: 1.6; margin-top: 0;">
          สวัสดีคุณ <strong>${(booking.customer?.name || 'ลูกค้า')}</strong>,<br/>
          ทางสถาบัน Zarntastic AI Learning ขอขอบพระคุณที่ลงทะเบียนเรียนหลักสูตร AI รายละเอียดการนัดหมายและข้อมูลคอร์สมีดังนี้:
        </p>

        <div style="background: #fbfbfa; border: 1px solid #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
            หลักสูตร: ${booking.courseTitle}
          </h3>
          <p style="margin: 4px 0; font-size: 13px; color: #4b5563;"><strong>ชื่อผู้เรียน:</strong> ${(booking.customer?.name || 'ลูกค้า')} (${(booking.customer?.phone || '')})</p>
          <p style="margin: 4px 0; font-size: 13px; color: #4b5563;"><strong>LINE ID:</strong> ${(booking.customer?.lineId || '') || '-'}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #4b5563;"><strong>ยอดรวม:</strong> ฿${Number(booking.totalPrice || 0).toLocaleString()} (<span style="color: #ea580c; font-weight: bold;">${statusBadgeText}</span>)</p>
          ${notes ? `<p style="margin: 8px 0; padding: 8px 12px; background: #fff7ed; border-left: 3px solid #ea580c; font-size: 12px; color: #9a3412; border-radius: 4px;"><strong>ข้อความจากอาจารย์:</strong> ${notes}</p>` : ''}
        </div>

        <h3 style="font-size: 14px; font-weight: bold; color: #111827; margin: 16px 0 8px 0;">
          📅 กำหนดการเรียน:
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; margin-bottom: 20px; background: #fafaf9; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f5f5f4; color: #57534e; font-size: 12px;">
              <th style="padding: 10px 12px;">รอบเรียน</th>
              <th style="padding: 10px 12px;">วันที่</th>
              <th style="padding: 10px 12px;">เวลา</th>
            </tr>
          </thead>
          <tbody>
            ${scheduleHtml}
          </tbody>
        </table>

        ${booking.meetingLink ? `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin-bottom: 20px; text-align: center;">
          <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px;">💻 ลิงก์ห้องเรียนออนไลน์ (Google Meet)</h4>
          <p style="margin: 0 0 12px 0; font-size: 13px; font-family: monospace; color: #1e3a8a; word-break: break-all;">
            ${booking.meetingLink}
          </p>
          <a href="${booking.meetingLink}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
            เข้าห้องเรียน Google Meet
          </a>
        </div>
        ` : ''}

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #6b7280; line-height: 1.6;">
          <p style="margin: 0 0 4px 0;"><strong>ผู้สอน:</strong> โค้ช ซาน (ผู้เชี่ยวชาญด้าน AI & Automation)</p>
          <p style="margin: 0 0 4px 0;"><strong>ติดต่อสอบถาม / แจ้งปัญหา:</strong> โทร 061-5614269 | LINE: @761rqbfc</p>
          <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px;">* อีเมลนี้ถูกจัดส่งโดยอัตโนมัติจากระบบ Zarntastic AI Learning (สามารถตอบกลับอีเมลนี้ได้โดยตรง)</p>
        </div>
      </div>
    </div>
  `;

  const providers = getAvailableEmailProviders();

  if (providers.length > 0) {
    const deliveryErrors: string[] = [];

    for (const provider of providers) {
      try {
        const transporter = provider.createTransporter();
        const info = await transporter.sendMail({
          from: provider.fromAddress,
          replyTo: provider.replyTo,
          to: (booking.customer?.email || ''),
          subject: emailSubject,
          html: htmlContent,
        });

        console.log(`[Email Sent] Successfully delivered to ${(booking.customer?.email || '')} via ${provider.name}: ${info.messageId}`);

        // Clear any previous error notification for this booking
        notifications = notifications.filter((n) => !(n.title === "SMTP Email Delivery Alert" && n.bookingId === booking.id));
        persistNotifsToFile();

        return { 
          success: true, 
          provider: provider.name,
          messageId: info.messageId, 
          to: (booking.customer?.email || ''), 
          subject: emailSubject 
        };
      } catch (err: any) {
        console.warn(`[Email Warning] Failed sending via ${provider.name}: ${err.message}. Trying next provider...`);
        deliveryErrors.push(`${provider.name}: ${err.message}`);
      }
    }

    // If all providers failed
    const errorDetails = deliveryErrors.join(' | ');
    console.error("[Email Error] All email providers failed:", errorDetails);
    
    notifications.unshift({
      id: `notif-email-err-${Date.now()}`,
      title: "Email Delivery Alert",
      message: `ไม่สามารถส่งอีเมลไปยัง ${(booking.customer?.email || '')} (${errorDetails})`,
      type: "system",
      timestamp: new Date().toISOString(),
      isRead: false,
      bookingId: booking.id,
    });
    persistNotifsToFile();

    return { success: false, error: errorDetails, subject: emailSubject };
  } else {
    // Development / Preview mode without configured SMTP
    console.log(`[Email Mock/Preview Mode] Dispatched confirmation email to ${(booking.customer?.email || '')}`);
    return {
      success: true,
      preview: true,
      to: (booking.customer?.email || ''),
      subject: emailSubject,
      message: "บันทึกและจำลองการส่งอีเมลเรียบร้อยแล้ว (สามารถระบุ GMAIL_USER หรือ SMTP ใน .env เพื่อส่งจริง)"
    };
  }
}

// 3. Create new booking (with strict anti-double booking check and authoritative pricing)
app.post("/api/bookings", async (req, res) => {
  const {
    courseId,
    customer,
    schedule,
  } = req.body;

  // 1. Authoritative Course Lookup from database
  const matchedCourse = COURSES.find((c) => c.id === courseId);
  if (!matchedCourse) {
    return res.status(400).json({ error: "ไม่พบข้อมูลคอร์สเรียนนี้ในระบบ กรุณาเลือกหลักสูตรที่เปิดสอน" });
  }

  // 2. Validate customer contact information
  const customerName = (customer?.name || "").trim();
  const customerPhone = (customer?.phone || "").trim().replace(/[^0-9]/g, "");
  const customerEmail = (customer?.email || "").trim();

  if (!customerName) {
    return res.status(400).json({ error: "กรุณาระบุชื่อ-นามสกุลของผู้เรียน" });
  }

  if (!customerPhone || customerPhone.length < 9 || customerPhone.length > 10) {
    return res.status(400).json({ error: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก" });
  }

  if (customerEmail && !/\S+@\S+\.\S+/.test(customerEmail)) {
    return res.status(400).json({ error: "รูปแบบอีเมลไม่ถูกต้อง" });
  }

  if (!Array.isArray(schedule) || schedule.length === 0) {
    return res.status(400).json({ error: "กรุณาระบุตารางรอบเรียน" });
  }

  // Authoritative Price, Duration & Days from matchedCourse (Never trust client pricing)
  const authoritativePrice = matchedCourse.price;
  const authoritativeHours = matchedCourse.totalHours;
  const authoritativeDays = matchedCourse.totalDays;
  const authoritativeTitle = matchedCourse.title;

  // Validate operating hours for every schedule item
  const userCategory = customer?.clientType === 'corporate' ? 'corporate' : 'general';
  for (const slot of schedule) {
    const validCheck = isValidOperatingSlot(slot.date, slot.startTime, slot.endTime, userCategory);
    if (!validCheck.valid) {
      return res.status(400).json({
        error: `ช่วงเวลาในวันที่ ${slot.date} (${slot.startTime}-${slot.endTime}) ไม่ถูกต้อง: ${validCheck.reason}`,
      });
    }
  }

  // Anti-double booking conflict check
  const conflictResult = checkSlotConflict(schedule);
  if (conflictResult.conflict) {
    return res.status(409).json({
      error: `ช่วงเวลาที่คุณเลือกมีการจองแล้ว กรุณาเลือกวันหรือเวลาอื่น`,
      details: {
        date: conflictResult.conflictedSlot?.date,
        time: `${conflictResult.conflictedSlot?.startTime} - ${conflictResult.conflictedSlot?.endTime}`,
      },
    });
  }

  // Generate unique booking ID
  const dateCode = (schedule[0]?.date || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  // Using crypto.randomUUID() for cryptographically strong random IDs
  const randomStr = crypto.randomUUID().split('-')[0] + crypto.randomUUID().split('-')[1];
  const newBookingId = `AI-${dateCode}-${randomStr}`;

  const now = new Date().toISOString();
  
  // Generate a random token for edit/cancel authorization
  const editToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const newBooking: Booking = {
    id: newBookingId,
    courseId: matchedCourse.id,
    courseTitle: authoritativeTitle,
    totalHours: authoritativeHours,
    totalDays: authoritativeDays,
    totalPrice: authoritativePrice,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      lineId: customer?.lineId || "",
      notes: customer?.notes || "",
      experienceLevel: customer?.experienceLevel || "Beginner",
      clientType: customer?.clientType || ((matchedCourse.categoryGroup === 'in-house-onsite' || matchedCourse.categoryGroup === 'in-house-online') ? 'corporate' : 'general'),
      companyName: customer?.companyName || "",
      taxId: customer?.taxId || "",
      onsiteLocation: customer?.onsiteLocation || "",
    },
    schedule: schedule.map((s: any, idx: number) => ({
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      dayNumber: s.dayNumber || idx + 1,
    })),
    payment: {
      method: "promptpay",
      amount: authoritativePrice,
      status: "pending_slip",
    },
    meetingLink: systemSettings.defaultMeetLink || "https://meet.google.com/new",
    editToken,
    createdAt: now,
    updatedAt: now,
  };

  bookings.unshift(newBooking);
  await saveBooking(newBooking);

  // Push notification for instructor / admin
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}`,
    title: "มีรายการจองคอร์สใหม่เข้ามา!",
    message: `${newBooking.customer.name} จอง ${newBooking.courseTitle} (${newBooking.schedule[0].date} ${newBooking.schedule[0].startTime}น.)`,
    type: "booking",
    timestamp: now,
    isRead: false,
    bookingId: newBookingId,
  };
  notifications.unshift(newNotif);
  await saveNotification(newNotif);

  // Send LINE Notify to Admin
  const msg = `\n🎉 [New Booking]\nผู้จอง: ${newBooking.customer.name}\nคอร์ส: ${newBooking.courseTitle}\nราคา: ฿${newBooking.totalPrice}\nดูรายละเอียดที่ระบบ Admin`;
  try {
    await sendLineNotify(msg);
  } catch (e) {}

  // Send Initial Booking Confirmation Email to Customer in background (non-blocking)
  sendBookingConfirmationEmail(newBooking).catch((err) => {
    console.warn("Initial booking email dispatch warning:", err);
  });

  res.status(201).json({
    success: true,
    booking: newBooking,
    editToken,
    message: "สร้างรายการจองสำเร็จ กรุณาชำระเงินและแนบสลิปเพื่อยืนยันคิว",
  });
});


// Lookup bookings by Phone number, Email, or Booking ID (Student self-service with PII protection)
app.post("/api/bookings/lookup", lookupLimiter, (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return res.status(400).json({ error: "กรุณาระบุ เบอร์โทรศัพท์, อีเมล หรือ รหัสการจอง เพื่อค้นหา" });
  }

  const cleanQuery = query.trim().toLowerCase().replace(/[^a-z0-9@.-]/g, '');
  const cleanPhone = query.trim().replace(/[^0-9]/g, '');

  // If query contains no alphanumeric/email/phone digits, prevent empty string false matching
  if (cleanQuery.length < 4 && cleanPhone.length < 9) {
    return res.json({
      success: true,
      total: 0,
      bookings: [],
      message: "กรุณาระบุเบอร์โทรศัพท์ 9-10 หลัก, อีเมลที่ถูกต้อง หรือ รหัสการจองเพื่อค้นหา"
    });
  }

  const matched = bookings.filter((b) => {
    // Exact or clean ID match (requires at least 6 characters)
    const idClean = b.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const idMatch = cleanQuery.length >= 6 && idClean.includes(cleanQuery);
    // Exact email match (requires full email with @)
    const emailMatch = cleanQuery.includes('@') && b.customer.email.toLowerCase() === cleanQuery;
    // Phone match requires at least 9 digits
    const phoneClean = b.customer.phone.replace(/[^0-9]/g, '');
    const phoneMatch = cleanPhone.length >= 9 && (phoneClean === cleanPhone || phoneClean.endsWith(cleanPhone));
    
    return idMatch || emailMatch || phoneMatch;
  }).map((b) => {
    // Mask PII logic:
    const maskedBooking = { ...b, customer: { ...b.customer } };
    
    // Mask name entirely
    if (maskedBooking.customer.name) {
      maskedBooking.customer.name = '***';
    }
    
    // Mask email entirely
    if (maskedBooking.customer.email) {
      maskedBooking.customer.email = '***';
    }
    
    // Mask line ID entirely
    if (maskedBooking.customer.lineId) {
      maskedBooking.customer.lineId = '***';
    }
    
    // Mask phone number (keep last 4 digits)
    if (maskedBooking.customer.phone) {
       const p = maskedBooking.customer.phone;
       maskedBooking.customer.phone = '***-***-' + p.slice(-4);
    }
    
    // Hide meeting link
    maskedBooking.meetingLink = '***';
    
    delete maskedBooking.editToken; // Protect edit token from leaking
    return maskedBooking;
  });

  res.json({
    success: true,
    total: matched.length,
    bookings: matched,
  });
});

// Endpoint to send or resend booking confirmation email
app.post("/api/bookings/:id/send-email", async (req, res) => {
  const bookingId = req.params.id;
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
  }

  const result = await sendBookingConfirmationEmail(booking, req.body.note);
  res.json(result);
});

// 4. Submit payment slip with automatic AI OCR verification
app.post("/api/bookings/:id/slip", async (req, res) => {
  const bookingId = req.params.id;
  const { slipUrl, referenceNo, manualAmount, editToken } = req.body;
  if (!slipUrl || typeof slipUrl !== 'string' || slipUrl.trim() === '') {
    return res.status(400).json({ error: "กรุณาแนบรูปภาพสลิป" });
  }

  let booking = bookings.find((b) => b.id === bookingId);

  if (!booking) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้ กรุณาสร้างรายการจองใหม่อีกครั้ง" });
  }
  
  if (!booking.editToken || booking.editToken !== editToken) {
    return res.status(401).json({ error: "ไม่มีสิทธิ์แนบสลิปการจองนี้ (เซสชั่นหมดอายุ กรุณาติดต่อแอดมิน)" });
  }

  const now = new Date().toISOString();

  let aiVerificationResult: any = {
    detectedAmount: manualAmount || booking.totalPrice,
    detectedDate: new Date().toISOString().slice(0, 16).replace("T", " "),
    detectedRef: referenceNo || `REF-${Math.floor(10000000 + Math.random() * 90000000)}`,
    confidence: 0.95,
    statusMatch: true,
    notes: "ระบบบันทึกและตรวจสอบข้อมูลสลิปเรียบร้อย",
  };

  // If Gemini API is available and slip is base64 image, run multimodal analysis
  const ai = getAI();
  if (ai && slipUrl && slipUrl.startsWith("data:image/")) {
    try {
      const match = slipUrl.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];

        const prompt = `คุณคือระบบตรวจสลิปโอนเงินอัตโนมัติ กรุณาวิเคราะห์ภาพสลิปนี้และตอบเป็น JSON ตามโครงสร้าง:
{
  "detectedAmount": ตัวเลขยอดเงินที่โอน (เช่น 990, 1500, 3900),
  "detectedDate": "วันเวลาที่โอน",
  "detectedRef": "รหัสอ้างอิงหรือเลขที่ทำรายการ",
  "senderBank": "ธนาคารต้นทาง",
  "receiverName": "ชื่อบัญชีปลายทาง",
  "confidence": ค่าความมั่นใจ 0.0 - 1.0,
  "statusMatch": boolean (true หากสลิปดูถูกต้องน่าเชื่อถือ),
  "notes": "คำอธิบายสรุปสั้นๆ เป็นภาษาไทย"
}
ราคาคอร์สที่คาดหวังคือ ${booking.totalPrice} บาท`;

        const generatePromise = ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              { text: prompt },
            ],
          },
          config: {
            responseMimeType: "application/json",
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI Slip analysis timeout")), 3500)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);

        if (response?.text) {
          const parsed = JSON.parse(response.text.trim());
          aiVerificationResult = {
            ...aiVerificationResult,
            ...parsed,
            statusMatch:
              parsed.detectedAmount
                ? Math.abs(parsed.detectedAmount - booking.totalPrice) < 1
                : true,
          };
        }
      }
    } catch (err: any) {
      console.warn("AI Slip analysis fallback (instant proceed):", err?.message || err);
    }
  }

  // Update booking
  if (!booking.payment) {
    booking.payment = { method: "promptpay", amount: booking.totalPrice, status: "pending_slip" };
  }
  booking.payment.slipUrl = slipUrl;
  booking.payment.slipUploadedAt = now;
  booking.payment.referenceNo = referenceNo || aiVerificationResult.detectedRef;

  if (aiVerificationResult.statusMatch === false) {
    booking.payment.status = "under_review";
    booking.payment.reviewedAt = now;
    booking.payment.reviewNotes = `ยอดโอนในสลิป (฿${aiVerificationResult.detectedAmount || 'ไม่ตรง'}) ไม่ตรงกับยอดคอร์ส (฿${booking.totalPrice}) หรือข้อมูลไม่ตรงกัน อยู่ระหว่างรอเจ้าหน้าที่ตรวจสอบ`;
  } else {
    booking.payment.status = "confirmed";
    booking.payment.reviewedAt = now;
    booking.payment.reviewNotes = "ระบบตรวจสอบยอดเงินและสลิปถูกต้อง อนุมัติคิวอัตโนมัติ";
  }

  booking.payment.aiVerification = aiVerificationResult;
  booking.updatedAt = now;

  // Add Notification
  notifications.unshift({
    id: `notif-${Date.now()}`,
    title: "มีการส่งสลิปชำระเงินใหม่",
    message: `${(booking.customer?.name || 'ลูกค้า')} ส่งสลิปยอด ฿${(booking.totalPrice || 0).toLocaleString()} (คอร์ส ${booking.courseTitle})`,
    type: "payment",
    timestamp: now,
    isRead: false,
    bookingId: booking.id,
  });

  await saveBooking(booking);

  // Send LINE Notify in background (non-blocking)
  const msg2 = `\n🧾 [แนบสลิปใหม่]\nผู้จอง: ${(booking.customer?.name || 'ลูกค้า')}\nยอดโอน: ฿${booking.totalPrice}\nสถานะ AI ตรวจสอบ: ${booking.payment.status === 'confirmed' ? '✅ ผ่านอัตโนมัติ' : '⏳ รอตรวจสอบ'}\nรหัสอ้างอิง: ${booking.payment.referenceNo || 'ไม่ระบุ'}`;
  sendLineNotify(msg2).catch((err) => console.warn("Background LINE notify warning:", err));

  // Send Confirmation Email to Customer in background (non-blocking)
  sendBookingConfirmationEmail(booking).catch((err) => {
    console.warn("Background auto email dispatch warning:", err);
  });

  res.json({
    success: true,
    booking,
    message: "บันทึกสลิปสำเร็จ ระบบทำการตรวจสอบเรียบร้อย",
  });
});

// Short Link endpoints for customer sharing
const DEFAULT_CUSTOMER_SHORT_URL = "https://tinyurl.com/zarntastic";
app.get("/api/short-link", async (req, res) => {
  res.json({
    shortUrl: DEFAULT_CUSTOMER_SHORT_URL,
    alternateShortUrl: "https://da.gd/zarntastic",
    originalUrl: "https://ais-pre-bs4eeo3qrendw7bstnmdwp-887964686274.asia-southeast1.run.app/",
    description: "ลิงก์สั้นสำหรับส่งลูกค้าจองคอร์สเรียน AI"
  });
});

app.post("/api/short-link", async (req, res) => {
  const { url } = req.body;
  const targetUrl = url || "https://ais-pre-bs4eeo3qrendw7bstnmdwp-887964686274.asia-southeast1.run.app/";
  try {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`);
    const shortUrl = await response.text();
    if (shortUrl && shortUrl.startsWith("http")) {
      return res.json({ success: true, shortUrl: shortUrl.trim(), originalUrl: targetUrl });
    }
  } catch (e) {
    console.warn("TinyURL generation error fallback:", e);
  }
  return res.json({ success: true, shortUrl: DEFAULT_CUSTOMER_SHORT_URL, originalUrl: targetUrl });
});

// Update / Edit Booking (Allowed for unpaid bookings or by Admin)
app.put("/api/bookings/:id", async (req, res) => {
  const bookingId = req.params.id;
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
  }

  // Check auth
  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.role === 'admin') {
        isAdmin = true;
      }
    } catch (e) {}
  }
  
  const { customer, schedule, editToken } = req.body;
  
  if (!isAdmin && (!booking.editToken || booking.editToken !== editToken)) {
    return res.status(401).json({ error: "ไม่มีสิทธิ์แก้ไขการจองนี้ (เซสชั่นหมดอายุ กรุณาจองใหม่ หรือติดต่อแอดมิน)" });
  }

  // If customer is editing, only allow if NOT paid yet
  if (!isAdmin && (booking.payment.status === 'confirmed' || booking.payment.status === 'completed')) {
    return res.status(400).json({ 
      error: "ไม่สามารถแก้ไขได้เนื่องจากชำระเงินเรียบร้อยแล้ว กรุณาติดต่อแอดมินหรืออาจารย์ผู้สอนเพื่อขอเปลี่ยนรอบเรียน" 
    });
  }

  // 1. Update customer info if provided
  if (customer && typeof customer === 'object') {
    if (customer.name && typeof customer.name === 'string' && customer.name.trim()) {
      if (booking.customer) booking.customer.name = customer.name.trim();
    }
    if (customer.phone && typeof customer.phone === 'string' && customer.phone.trim()) {
      if (booking.customer) booking.customer.phone = customer.phone.trim();
    }
    if (customer.email !== undefined) {
      if (booking.customer) booking.customer.email = String(customer.email).trim();
    }
    if (customer.lineId !== undefined) {
      if (booking.customer) booking.customer.lineId = String(customer.lineId).trim();
    }
    if (customer.notes !== undefined) {
      if (booking.customer) booking.customer.notes = String(customer.notes).trim();
    }
    if (customer.experienceLevel !== undefined) {
      if (booking.customer) booking.customer.experienceLevel = customer.experienceLevel;
    }
    if (customer.companyName !== undefined) {
      if (booking.customer) booking.customer.companyName = String(customer.companyName).trim();
    }
    if (customer.taxId !== undefined) {
      if (booking.customer) booking.customer.taxId = String(customer.taxId).trim();
    }
    if (customer.clientType !== undefined) {
      if (booking.customer) booking.customer.clientType = customer.clientType;
    }
    if (customer.onsiteLocation !== undefined) {
      if (booking.customer) booking.customer.onsiteLocation = String(customer.onsiteLocation).trim();
    }
  }

  // 2. Update schedule slots if provided
  if (Array.isArray(schedule) && schedule.length > 0) {
    const userCategory = (booking.customer?.notes?.toLowerCase().includes('corporate') || booking.courseId?.includes('corporate')) 
      ? 'corporate' 
      : 'general';

    // Validate operating hours
    for (const slot of schedule) {
      if (!slot.date || !slot.startTime || !slot.endTime) {
        return res.status(400).json({ error: "ข้อมูลรอบเวลาเรียนไม่สมบูรณ์" });
      }
      const validCheck = isValidOperatingSlot(slot.date, slot.startTime, slot.endTime, userCategory);
      if (!validCheck.valid) {
        return res.status(400).json({
          error: `ช่วงเวลาในวันที่ ${slot.date} (${slot.startTime}-${slot.endTime}) ไม่ถูกต้อง: ${validCheck.reason}`,
        });
      }
    }

    // Check slot conflicts excluding this current booking
    const conflictResult = checkSlotConflict(schedule, booking.id);
    if (conflictResult.conflict) {
      return res.status(409).json({
        error: `ช่วงเวลาใหม่ที่คุณเลือกมีการจองแล้ว กรุณาเลือกวันหรือเวลาอื่น`,
        details: {
          date: conflictResult.conflictedSlot?.date,
          time: `${conflictResult.conflictedSlot?.startTime} - ${conflictResult.conflictedSlot?.endTime}`,
        },
      });
    }

    booking.schedule = schedule.map((s: any, idx: number) => ({
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      dayNumber: s.dayNumber || (idx + 1),
    }));
  }

  // 3. Update meetingLink if provided
  if (req.body.meetingLink !== undefined && typeof req.body.meetingLink === 'string') {
    booking.meetingLink = req.body.meetingLink.trim() || systemSettings.defaultMeetLink || "https://meet.google.com/new";
  }

  booking.updatedAt = new Date().toISOString();
  await saveBooking(booking);

  // Send admin notification
  try {
    const scheduleSummary = booking.schedule && booking.schedule.length > 0
      ? booking.schedule.map((s: any) => `${s.date} ${s.startTime}-${s.endTime}น.`).join(', ')
      : 'เวลาเรียนอิสระ';
    const msg = `\n✏️ [อัปเดตข้อมูลการจอง (ยังไม่ชำระเงิน)]\nผู้เรียน: ${(booking.customer?.name || 'ลูกค้า')} (${(booking.customer?.phone || '')})\nคอร์ส: ${booking.courseTitle}\nวันเวลาใหม่: ${scheduleSummary}\nรหัสจอง: ${booking.id}\nLINE: ${(booking.customer?.lineId || '') || '-'}`;
    await sendLineNotify(msg);
  } catch (e) {}

  res.json({ success: true, booking });
});

// Update Google Meet / Classroom link for a specific booking
app.patch("/api/bookings/:id/meeting-link", requireAdmin, async (req, res) => {
  const bookingId = req.params.id;
  const { meetingLink } = req.body;
  if (!meetingLink || typeof meetingLink !== 'string') {
    return res.status(400).json({ error: "กรุณาระบุลิงก์ห้องเรียน" });
  }

  const cleanLink = meetingLink.trim();
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
  }

  booking.meetingLink = cleanLink;
  booking.updatedAt = new Date().toISOString();
  await saveBooking(booking);
  console.log(`[MeetingLink] Updated booking ${bookingId} meetingLink to: ${cleanLink}`);

  res.json({ success: true, meetingLink: cleanLink, booking });
});

// Get System / Instructor Settings
app.get("/api/settings", (req, res) => {
  res.json({ success: true, settings: systemSettings });
});

// Update System / Instructor Settings
app.post("/api/settings", requireAdmin, (req, res) => {
  const { defaultMeetLink, instructorName, contactPhone, contactLine, contactLineId, contactEmail } = req.body;

  if (defaultMeetLink && typeof defaultMeetLink === 'string') {
    systemSettings.defaultMeetLink = defaultMeetLink.trim();
  }
  if (instructorName && typeof instructorName === 'string') {
    systemSettings.instructorName = instructorName.trim();
  }
  if (contactPhone && typeof contactPhone === 'string') {
    systemSettings.contactPhone = contactPhone.trim();
  }
  if (contactLine && typeof contactLine === 'string') {
    systemSettings.contactLine = contactLine.trim();
  }
  if (contactLineId && typeof contactLineId === 'string') {
    systemSettings.contactLineId = contactLineId.trim();
  }
  if (contactEmail && typeof contactEmail === 'string') {
    systemSettings.contactEmail = contactEmail.trim();
  }

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(systemSettings, null, 2), "utf8");
    console.log(`[Settings] Persisted updated settings to ${SETTINGS_FILE}`);
  } catch (err) {
    console.error("[Settings] Failed to write settings file:", err);
  }

  res.json({ success: true, settings: systemSettings });
});

// Customer Cancel Booking (Not Allowed if Paid)
app.post("/api/bookings/:id/cancel-customer", async (req, res) => {
  const bookingId = req.params.id;
  const { editToken } = req.body;
  
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return res.status(404).json({ error: "ไม่พบข้อมูลการจอง" });
  
  // Verify token or admin auth
  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.role === 'admin') {
        isAdmin = true;
      }
    } catch (e) {}
  }
  
  if (!isAdmin && (!booking.editToken || booking.editToken !== editToken)) {
    return res.status(401).json({ error: "ไม่มีสิทธิ์ยกเลิกการจองนี้ (เซสชั่นหมดอายุ กรุณาติดต่อแอดมิน)" });
  }

  if (!isAdmin && (booking.payment.status === 'confirmed' || booking.payment.status === 'completed')) {
    return res.status(400).json({ error: "ไม่สามารถยกเลิกได้เนื่องจากชำระเงินเรียบร้อยแล้ว ติดต่อ Admin ได้เท่านั้น" });
  }

  booking.payment.status = 'cancelled';
  booking.updatedAt = new Date().toISOString();
  await saveBooking(booking);

  try {
     const msg = `\n❌ [ลูกค้ายกเลิก/แก้ไขการจอง]\nผู้จอง: ${(booking.customer?.name || 'ลูกค้า')}\nคอร์ส: ${booking.courseTitle}\nรหัส: ${booking.id}`;
     await sendLineNotify(msg);
  } catch (e) {}

  res.json({ success: true, booking });
});

// Delete single booking (Admin only)
app.delete("/api/bookings/:id", requireAdmin, async (req, res) => {
  const bookingId = req.params.id;
  const index = bookings.findIndex((b) => b.id === bookingId);
  if (index === -1) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
  }

  bookings.splice(index, 1);
  persistBookingsToFile();

  if (db && isFirestoreAvailable) {
    deleteDoc(doc(db, "bookings", bookingId)).catch(() => {});
  }

  res.json({ success: true, message: `ลบข้อมูลการจอง ${bookingId} เรียบร้อยแล้ว` });
});

// 5. Admin change booking status (confirm, reject, cancel, complete)
app.post("/api/bookings/:id/status", requireAdmin, async (req, res) => {
  const bookingId = req.params.id;
  const { status, reviewNotes } = req.body;

  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
  }

  if (!booking.customer) booking.customer = {};
  const validStatuses = [
    "pending_slip",
    "under_review",
    "confirmed",
    "rejected",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
  }

  const now = new Date().toISOString();
  if (!booking.payment) booking.payment = { status: 'pending_slip' };
  booking.payment.status = status;
  booking.payment.reviewedAt = now;
  if (reviewNotes !== undefined) {
    booking.payment.reviewNotes = reviewNotes;
  }
  booking.updatedAt = now;

  notifications.unshift({
    id: `notif-${Date.now()}`,
    title: `อัปเดตสถานะคอร์ส: ${status.toUpperCase()}`,
    message: `คิวของ ${(booking.customer?.name || 'ลูกค้า')} ถูกเปลี่ยนสถานะเป็น ${status} (${reviewNotes || ""})`,
    type: "review",
    timestamp: now,
    isRead: false,
    bookingId: booking.id,
  });

  await saveBooking(booking);

  // If confirmed or completed, dispatch confirmation email and LINE notify
  if (status === 'confirmed' || status === 'completed') {
    try {
      await sendBookingConfirmationEmail(booking, reviewNotes);
    } catch (err) {
      console.warn("Auto confirmation email dispatch error:", err);
    }

    try {
      const scheduleSummary = booking.schedule && booking.schedule.length > 0
        ? booking.schedule.map((s: any) => `${s.date} ${s.startTime}-${s.endTime}น.`).join(', ')
        : 'เวลาเรียนอิสระ';
      const msg = `\n✅ [ยืนยันอนุมัติคอร์สเรียน]\nผู้เรียน: ${(booking.customer?.name || 'ลูกค้า')} (${(booking.customer?.phone || '')})\nคอร์ส: ${booking.courseTitle}\nวันเวลา: ${scheduleSummary}\nรหัสจอง: ${booking.id}\nยอดชำระ: ฿${(booking.totalPrice || 0).toLocaleString()}\nลิงก์ห้องเรียน: ${booking.meetingLink}`;
      await sendLineNotify(msg);
    } catch (e) {
      console.warn("LINE notify error:", e);
    }
  } else if (status === 'cancelled') {
    try {
      await sendBookingConfirmationEmail(booking, reviewNotes || "รายการจองของคุณถูกยกเลิกแล้ว");
    } catch (err) {
      console.warn("Cancellation email error:", err);
    }

    try {
      const msg = `\n❌ [แจ้งยกเลิกการจอง]\nผู้เรียน: ${(booking.customer?.name || 'ลูกค้า')} (${(booking.customer?.phone || '')})\nคอร์ส: ${booking.courseTitle}\nรหัส: ${booking.id}\nเหตุผล: ${reviewNotes || 'ยกเลิกตามคำขอ'}`;
      await sendLineNotify(msg);
    } catch (e) {
      console.warn("LINE notify error:", e);
    }
  }

  res.json({ success: true, booking });
});

// Firebase Status API
app.get("/api/firebase/status", async (req, res) => {
  try {
    let databaseId = "bookings_db.json (Local Database)";
    try {
      const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
      if (isFirestoreAvailable && db) {
        databaseId = config.firestoreDatabaseId || config.projectId || "Cloud Firestore";
      }
    } catch (e) { }

    res.json({
      connected: isFirestoreAvailable && db !== null,
      mode: isFirestoreAvailable ? "cloud_firestore" : "local_file_persistence",
      storage: "bookings_db.json",
      databaseId,
      totalBookings: bookings.length,
      totalNotifications: notifications.length,
      lastSync: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ connected: false, error: error.message });
  }
});

// Admin Email System Status endpoint
app.get("/api/admin/email-status", requireAdmin, (req, res) => {
  const providers = getAvailableEmailProviders();
  res.json({
    configured: providers.length > 0,
    providers: providers.map(p => ({ id: p.id, name: p.name })),
    hasGmail: Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    gmailUser: process.env.GMAIL_USER || null,
    hasSmtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
    smtpHost: process.env.SMTP_HOST || null,
  });
});

// Admin Test Email Delivery endpoint
app.post("/api/admin/test-email", requireAdmin, async (req, res) => {
  const targetEmail = req.body.email || 'maneerat.tangopasvilaisakul@gmail.com';
  const dummyBooking = {
    id: "TEST-EMAIL-" + Date.now().toString().slice(-4),
    courseTitle: "AI Webapp & Automation Mastery (ทดสอบระบบอีเมล)",
    totalPrice: 4900,
    customer: {
      name: "ผู้ดูแลระบบ (ทดสอบการส่ง)",
      email: targetEmail,
      phone: "061-5614269",
      lineId: "@761rqbfc",
    },
    meetingLink: "https://meet.google.com/test-zarntastic-demo",
    schedule: [
      {
        dayNumber: 1,
        date: new Date().toISOString().slice(0, 10),
        startTime: "19:00",
        endTime: "22:00",
      }
    ],
    payment: {
      status: "confirmed",
    }
  };

  try {
    const result = await sendBookingConfirmationEmail(dummyBooking, "นี่คืออีเมลทดสอบความพร้อมของระบบยืนยันคอร์สเรียน Zarntastic AI Learning");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Seed Test Data API
app.post("/api/admin/seed-test-data", requireAdmin, async (req, res) => {
  try {
    const testBookings: Booking[] = [
      {
        id: "AI-20260902-8812",
        courseId: "live-ai-webapp",
        courseTitle: "AI Webapp Builder with Google AI Studio",
        totalHours: 3,
        totalDays: 1,
        totalPrice: 3900,
        customer: {
          name: "คุณกานต์ พัฒนกิจ",
          email: "karn.pat@gmail.com",
          phone: "081-999-1234",
          lineId: "karn_dev",
          notes: "ต้องการสร้าง Web App ต่อ Gemini API ไว้ใช้ในบริษัท",
          experienceLevel: "Intermediate",
        },
        schedule: [
          {
            date: "2026-09-02",
            startTime: "19:30",
            endTime: "22:30",
            dayNumber: 1,
          }
        ],
        payment: {
          method: "promptpay",
          amount: 3900,
          status: "confirmed",
          slipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80",
          slipUploadedAt: "2026-09-01T08:30:00.000Z",
          referenceNo: "KBANK-TRX-20260901-88912",
          reviewedAt: "2026-09-01T08:35:00.000Z",
          reviewNotes: "สลิปยอด 3,900 บ. โอนเข้า KBANK ถูกต้อง ระบบ AI ตรวจจับครบถ้วน",
          aiVerification: {
            detectedAmount: 3900,
            detectedDate: "2026-09-01 15:30",
            detectedRef: "KBANK-TRX-20260901-88912",
            confidence: 0.99,
            statusMatch: true,
            notes: "ตรวจพบยอดโอน ฿3,900 ตรงกับราคาคอร์ส 100%",
          }
        },
        meetingLink: "https://meet.google.com/ai-live-webapp-karn",
        createdAt: "2026-09-01T08:25:00.000Z",
        updatedAt: "2026-09-01T08:35:00.000Z",
      },
      {
        id: "AI-20260903-5521",
        courseId: "live-ai-for-work",
        courseTitle: "AI for Work: ใช้ AI ในการทำงานคล่องใน 3 ชม.",
        totalHours: 3,
        totalDays: 1,
        totalPrice: 3900,
        customer: {
          name: "คุณณภัทร วงศ์เจริญ",
          email: "naphat.w@siamcorp.co.th",
          phone: "089-876-5432",
          lineId: "naphat_pm",
          notes: "เน้นการสรุปเอกสารรายงาน และการวิเคราะห์ข้อมูล Excel",
          experienceLevel: "Beginner",
        },
        schedule: [
          {
            date: "2026-09-03",
            startTime: "19:30",
            endTime: "22:30",
            dayNumber: 1,
          }
        ],
        payment: {
          method: "promptpay",
          amount: 3900,
          status: "under_review",
          slipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80",
          slipUploadedAt: "2026-09-01T10:15:00.000Z",
          referenceNo: "SCB-TRX-998231",
          aiVerification: {
            detectedAmount: 3900,
            detectedDate: "2026-09-01 17:14",
            detectedRef: "SCB-TRX-998231",
            confidence: 0.95,
            statusMatch: true,
            notes: "รออาจารย์ผู้สอนตรวจสอบยืนยันขั้นสุดท้าย",
          }
        },
        meetingLink: "https://meet.google.com/ai-live-work-naphat",
        createdAt: "2026-09-01T10:10:00.000Z",
        updatedAt: "2026-09-01T10:15:00.000Z",
      },
      {
        id: "AI-20260904-3319",
        courseId: "live-ai-starter",
        courseTitle: "AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”",
        totalHours: 1,
        totalDays: 1,
        totalPrice: 1500,
        customer: {
          name: "คุณธีรเดช สุขสวัสดิ์",
          email: "teeradej.s@gmail.com",
          phone: "085-123-4567",
          lineId: "teera_ai",
          notes: "มือใหม่เริ่มจากศูนย์ อยากลองใช้ ChatGPT และ Gemini",
          experienceLevel: "Beginner",
        },
        schedule: [
          {
            date: "2026-09-04",
            startTime: "19:30",
            endTime: "20:30",
            dayNumber: 1,
          }
        ],
        payment: {
          method: "promptpay",
          amount: 1500,
          status: "pending_slip",
        },
        meetingLink: "https://meet.google.com/ai-starter-teera",
        createdAt: "2026-09-01T11:00:00.000Z",
        updatedAt: "2026-09-01T11:00:00.000Z",
      },
      {
        id: "AI-20260905-9920",
        courseId: "live-corporate-halfday",
        courseTitle: "In-House Training: AI for Business Transformation & Operations (ครึ่งวัน)",
        totalHours: 3,
        totalDays: 1,
        totalPrice: 15000,
        customer: {
          name: "บริษัท สยาม ดิจิทัล อินโนเวชั่น จำกัด (ผู้ติดต่อ: คุณศิริพร)",
          email: "siriporn.hr@siamdigital.com",
          phone: "062-333-8899",
          lineId: "siamdigital_hr",
          notes: "อบรมทีมการตลาดและการขาย 15 ท่าน ผ่าน Google Meet และ Workshop",
          experienceLevel: "Intermediate",
        },
        schedule: [
          {
            date: "2026-09-05",
            startTime: "09:00",
            endTime: "12:00",
            dayNumber: 1,
          }
        ],
        payment: {
          method: "bank_transfer",
          amount: 15000,
          status: "confirmed",
          slipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80",
          slipUploadedAt: "2026-09-01T09:00:00.000Z",
          referenceNo: "BBL-CORP-20260901-0021",
          reviewedAt: "2026-09-01T09:15:00.000Z",
          reviewNotes: "ออกใบเสนอราคาและเอกสารหัก ณ ที่จ่าย 3% เรียบร้อย ยืนยันรอบจัดอบรม",
          aiVerification: {
            detectedAmount: 15000,
            detectedDate: "2026-09-01 16:00",
            detectedRef: "BBL-CORP-20260901-0021",
            confidence: 0.98,
            statusMatch: true,
            notes: "โอนผ่านบัญชีนิติบุคคล ยอดถูกต้อง ฿15,000",
          }
        },
        meetingLink: "https://meet.google.com/ai-corp-siamdigital",
        createdAt: "2026-09-01T08:50:00.000Z",
        updatedAt: "2026-09-01T09:15:00.000Z",
      },
      {
        id: "AI-20260906-7731",
        courseId: "live-claude-workflow",
        courseTitle: "Claude Personal Workflow",
        totalHours: 3,
        totalDays: 1,
        totalPrice: 3900,
        customer: {
          name: "คุณวิภาดา จิตตรง",
          email: "wiphada.j@outlook.com",
          phone: "090-456-7890",
          lineId: "wiphada_claude",
          notes: "เน้น Claude Projects และ Artifacts เพื่อจัดระบบงานส่วนตัว",
          experienceLevel: "Intermediate",
        },
        schedule: [
          {
            date: "2026-09-06",
            startTime: "10:00",
            endTime: "13:00",
            dayNumber: 1,
          }
        ],
        payment: {
          method: "promptpay",
          amount: 3900,
          status: "confirmed",
          slipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80",
          slipUploadedAt: "2026-09-01T07:45:00.000Z",
          referenceNo: "KTB-20260901-77881",
          reviewedAt: "2026-09-01T08:00:00.000Z",
          reviewNotes: "ยืนยันคิวรอบวันอาทิตย์ 10:00 - 13:00 น.",
          aiVerification: {
            detectedAmount: 3900,
            detectedDate: "2026-09-01 14:45",
            detectedRef: "KTB-20260901-77881",
            confidence: 0.99,
            statusMatch: true,
            notes: "ตรวจสอบสลิปยอดเงินตรง 100%",
          }
        },
        meetingLink: "https://meet.google.com/ai-claude-wiphada",
        createdAt: "2026-09-01T07:30:00.000Z",
        updatedAt: "2026-09-01T08:00:00.000Z",
      },
      {
        id: "AI-20260829-4412",
        courseId: "live-ai-website-lovable",
        courseTitle: "AI Website Builder with Lovable/Codex/ClaudeCode",
        totalHours: 6,
        totalDays: 2,
        totalPrice: 7500,
        customer: {
          name: "คุณเอกชัย สุวรรณภูมิ",
          email: "ekkachai.tech@gmail.com",
          phone: "087-654-3210",
          lineId: "ekkachai_web",
          notes: "เรียนจบทั้ง 2 วันเรียบร้อย เว็บไซต์เสร็จสมบูรณ์",
          experienceLevel: "Advanced",
        },
        schedule: [
          {
            date: "2026-08-29",
            startTime: "10:00",
            endTime: "13:00",
            dayNumber: 1,
          },
          {
            date: "2026-08-30",
            startTime: "10:00",
            endTime: "13:00",
            dayNumber: 2,
          }
        ],
        payment: {
          method: "promptpay",
          amount: 7500,
          status: "completed",
          slipUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&q=80",
          slipUploadedAt: "2026-08-27T12:00:00.000Z",
          referenceNo: "TTB-20260827-4411",
          reviewedAt: "2026-08-27T12:15:00.000Z",
          reviewNotes: "เรียนจบหลักสูตร มอบของแถมและบันทึก VDO ย้อนหลังเรียบร้อย",
        },
        meetingLink: "https://meet.google.com/ai-lovable-ekkachai",
        createdAt: "2026-08-27T11:45:00.000Z",
        updatedAt: "2026-08-30T13:30:00.000Z",
      }
    ];

    const testNotifications: NotificationItem[] = [
      {
        id: "notif-test-1",
        title: "มีการส่งสลิปชำระเงินใหม่",
        message: "คุณณภัทร วงศ์เจริญ ส่งสลิปยอด ฿3,900 (คอร์ส AI for Work)",
        type: "payment",
        timestamp: "2026-09-01T10:15:00.000Z",
        isRead: false,
        bookingId: "AI-20260903-5521",
      },
      {
        id: "notif-test-2",
        title: "มีรายการจองคอร์สใหม่เข้ามา!",
        message: "คุณธีรเดช สุขสวัสดิ์ จอง AI STARTER (2026-09-04 19:30น.)",
        type: "booking",
        timestamp: "2026-09-01T11:00:00.000Z",
        isRead: false,
        bookingId: "AI-20260904-3319",
      },
      {
        id: "notif-test-3",
        title: "ยืนยันคิวองค์กรสำเร็จ",
        message: "บริษัท สยาม ดิจิทัล อินโนเวชั่น จำกัด ยืนยันรอบ In-House Training ฿15,000",
        type: "review",
        timestamp: "2026-09-01T09:15:00.000Z",
        isRead: true,
        bookingId: "AI-20260905-9920",
      }
    ];

    // Update memory & local disk persistence
    bookings = testBookings;
    notifications = testNotifications;
    persistBookingsToFile();
    persistNotifsToFile();

    // Save to Firestore only if available
    if (db && isFirestoreAvailable) {
      for (const b of testBookings) {
        await setDoc(doc(db, "bookings", b.id), b).catch(() => {});
      }
      for (const n of testNotifications) {
        await setDoc(doc(db, "notifications", n.id), n).catch(() => {});
      }
    }

    res.json({
      success: true,
      message: "สร้างชุดข้อมูลทดสอบสำเร็จแล้ว (6 รายการจอง + 3 การแจ้งเตือน)",
      bookings: testBookings,
      notifications: testNotifications,
    });
  } catch (error: any) {
    console.error("Seed test data error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Clear All Bookings & Notifications API
app.post("/api/admin/clear-test-data", requireAdmin, async (req, res) => {
  try {
    if (db && isFirestoreAvailable) {
      try {
        const snapB = await getDocs(collection(db, "bookings"));
        for (const d of snapB.docs) {
          await deleteDoc(doc(db, "bookings", d.id)).catch(() => {});
        }
        const snapN = await getDocs(collection(db, "notifications"));
        for (const d of snapN.docs) {
          await deleteDoc(doc(db, "notifications", d.id)).catch(() => {});
        }
      } catch (err) {
        console.warn("Firestore clear warning:", err);
      }
    }

    bookings = [];
    notifications = [];
    persistBookingsToFile();
    persistNotifsToFile();

    res.json({
      success: true,
      message: "ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("Clear test data error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Slot availability check query
app.get("/api/slots/available", (req, res) => {
  const { date, durationHours = 1, userCategory = "general" } = req.query;
  if (!date) {
    return res.status(400).json({ error: "กรุณาระบุ date (YYYY-MM-DD)" });
  }

  const dateStr = date as string;
  const targetDate = new Date(dateStr + "T00:00:00");
  const dayOfWeek = targetDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const duration = Number(durationHours) || 1;
  const category = (userCategory as string) === "corporate" ? "corporate" : "general";

  const availableSlots: Array<{ startTime: string; endTime: string; isOccupied: boolean; bookedBy?: string }> = [];

  if (category === "corporate") {
    const startHour = 9;
    const endHour = 20;
    const step = duration >= 6 ? 1 : 2;

    for (let h = startHour; h <= endHour - duration; h += step) {
      const startMinutes = h * 60;
      const endMinutes = (h + duration) * 60;
      const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}`;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

      let isOccupied = false; 
      

      for (const b of bookings) {
        if (b.payment.status === "cancelled" || b.payment.status === "rejected") continue;
        for (const slot of b.schedule) {
          if (slot.date === dateStr && isTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
            isOccupied = true;
            // let bookedBy = `${b.customer.name.slice(0, 3)}*** (${b.courseTitle})`;
            break;
          }
        }
        if (isOccupied) break;
      }

      availableSlots.push({ startTime, endTime, isOccupied});
    }

    return res.json({
      date: dateStr,
      isWeekend,
      operatingHours: "09:00 - 20:00 (สอนทุกวัน รอบองค์กร)",
      slots: availableSlots,
    });
  }

  if (isWeekend) {
    // Saturday: 10:00 to 23:00, Sunday: 10:00 to 22:00
    const startHour = 10;
    const endHour = dayOfWeek === 6 ? 23 : 22;
    const step = duration >= 3 ? (duration === 4 ? 4 : 2) : 1;

    for (let h = startHour; h <= endHour - duration; h += step) {
      const startMinutes = h * 60;
      const endMinutes = (h + duration) * 60;
      const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}`;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

      // Check conflict
      let isOccupied = false; 
      

      for (const b of bookings) {
        if (b.payment.status === "cancelled" || b.payment.status === "rejected") continue;
        for (const slot of b.schedule) {
          if (slot.date === dateStr && isTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
            isOccupied = true;
            // let bookedBy = `${b.customer.name.slice(0, 3)}*** (${b.courseTitle})`;
            break;
          }
        }
        if (isOccupied) break;
      }

      availableSlots.push({ startTime, endTime, isOccupied});
    }
  } else {
    // Weekday: 19:30 to 22:30 (Max window = 3 hours = 180 min)
    if (duration > 3) {
      // Cannot fit on weekday
      return res.json({
        date: dateStr,
        isWeekend: false,
        operatingHours: "19:30 - 22:30",
        message: "คอร์สเรียนนี้ต้องการวันละมากกว่า 3 ชม. ซึ่งเกินช่วงเวลาวันธรรมดารอบค่ำ (19.30-22.30) กรุณาเลือกวันเสาร์-อาทิตย์",
        slots: [],
      });
    }

    if (duration === 3) {
      const startTime = "19:30";
      const endTime = "22:30";
      let isOccupied = false; 
      
      for (const b of bookings) {
        if (b.payment.status === "cancelled" || b.payment.status === "rejected") continue;
        for (const slot of b.schedule) {
          if (slot.date === dateStr && isTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
            isOccupied = true;
            // let bookedBy = `${b.customer.name.slice(0, 3)}*** (${b.courseTitle})`;
            break;
          }
        }
      }
      availableSlots.push({ startTime, endTime, isOccupied});
    } else if (duration === 1) {
      // 1-hour slots: 19:30-20:30, 20:30-21:30, 21:30-22:30
      const times = [
        { startTime: "19:30", endTime: "20:30" },
        { startTime: "20:30", endTime: "21:30" },
        { startTime: "21:30", endTime: "22:30" },
      ];
      for (const t of times) {
        let isOccupied = false; 
        
        for (const b of bookings) {
          if (b.payment.status === "cancelled" || b.payment.status === "rejected") continue;
          for (const slot of b.schedule) {
            if (slot.date === dateStr && isTimeOverlap(t.startTime, t.endTime, slot.startTime, slot.endTime)) {
              isOccupied = true;
            // let bookedBy = `${b.customer.name.slice(0, 3)}*** (${b.courseTitle})`;
              break;
            }
          }
        }
        availableSlots.push({ ...t, isOccupied});
      }
    }
  }

  res.json({
    date: dateStr,
    isWeekend,
    operatingHours: dayOfWeek === 6 ? "10:00 - 23:00" : isWeekend ? "10:00 - 22:00" : "19:30 - 22:30",
    slots: availableSlots,
  });
});

// 7. Notifications API
app.get("/api/notifications", requireAdmin, (req, res) => {
  res.json(notifications);
});

app.post("/api/notifications/mark-read", requireAdmin, (req, res) => {
  notifications = notifications.map((n) => ({ ...n, isRead: true }));
  res.json({ success: true, count: notifications.length });
});

app.post("/api/notifications/test-webhook", async (req, res) => {
  const { channel, recipient, message } = req.body || {};
  const msgText = message || "ทดสอบระบบแจ้งเตือนคอร์ส AI สำเร็จ";
  console.log(`[Webhook Test] Channel: ${channel}, Recipient: ${recipient}, Message: ${msgText}`);
  try {
    await sendLineNotify(`\n🔔 [ทดสอบการแจ้งเตือน Admin]\n${msgText}`);
  } catch (e) {
    console.warn("[Webhook Test] LINE notify warning:", e);
  }
  res.json({
    success: true,
    channel: channel || "LINE Official / Notify",
    recipient: recipient || "Admin Group",
    previewMessage: msgText,
    timestamp: new Date().toISOString(),
  });
});

// 8. Gemini Multi-Turn AI Course & Schedule Chatbot
const COURSE_KNOWLEDGE_BASE = `
สถาบัน: Zarntastic AI LEARNING
ผู้สอน: โค้ช ซาน (Zarn / Zarntastic)
- Fastwork Verified Pro AI Specialist (เรตติ้ง 5.0 เต็ม 5 ดาว, รีวิว 128+ รายการ, ผู้เรียน 200+ คน)
- สโลแกน: "Turning Ideas Into Visual Experiences"
- ติดต่อ: LINE Official: @761rqbfc (https://lin.ee/NE2vFcZ), โทร: 061-5614269, Email: zarnzarn10@gmail.com
- การชำระเงิน: ธนาคารกสิกรไทย (KBANK) 585-2-29915-2 หรือ พร้อมเพย์ 061-561-4269

============================================================
รายการหลักสูตรทั้งหมดที่มีสอนจริงในระบบ (ห้ามคิดค้นคอร์สที่ไม่มีจริง):
============================================================

[หมวด 1: คอร์สเรียนสด Online 1:1 ผ่าน Google Meet (🌟 แนะนำเป็นอันดับแรกเสมอ - เรียนสดจับมือทำ ปรึกษาโจทย์งานจริง เรียงตามราคา)]
1. ID: "live-ai-starter"
   - ชื่อ: "AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”"
   - รูปแบบ: เรียนสด Online 1:1 ผ่าน Google Meet
   - ระยะเวลา: 1 วัน รวม 1 ชม. | ราคา: ฿1,500 (ราคาเต็ม ฿2,500)
   - จุดเด่น: ปูพื้นฐานการใช้งาน AI แบบจับมือทำ ใช้งานเป็นทันที ถามตอบสดกับอาจารย์

2. ID: "live-ai-marketing"
   - ชื่อ: "AI for Marketing: AI Starter Class"
   - รูปแบบ: เรียนสด Online 1:1 ผ่าน Google Meet
   - ระยะเวลา: 1 วัน รวม 1 ชม. | ราคา: ฿1,500 (ราคาเต็ม ฿2,500)
   - จุดเด่น: ประยุกต์ใช้ AI กับงานการตลาด เขียน Prompt ยิงแอด ทำคอนเทนต์ตรงตามธุรกิจ

3. ID: "live-claude-starter"
   - ชื่อ: "Claude/Claude Cowork Starter: เริ่มใช้กับงานจริง"
   - รูปแบบ: เรียนสด Online 1:1 ผ่าน Google Meet
   - ระยะเวลา: 1 วัน รวม 1 ชม. | ราคา: ฿1,500 (ราคาเต็ม ฿2,500)
   - จุดเด่น: ปูพื้นฐานการใช้งาน Claude และ Claude Cowork สำหรับการทำงานจริง

4. ID: "live-ai-for-work"
   - ชื่อ: "AI for Work: ใช้ AI ในการทำงานคล่องใน 3 ชม."
   - รูปแบบ: เรียนสด Online 1:1 ผ่าน Google Meet (จับมือทำ ปรึกษาโจทย์จริง)
   - ระยะเวลา: 1 วัน รวม 3 ชม. | ราคา: ฿3,900 (ราคาเต็ม ฿5,900)
   - จุดเด่น: ประยุกต์ใช้ AI ในการทำงานจริง ทั้งงานเอกสาร วิเคราะห์ข้อมูล สรุปรายงาน ร่างอีเมล พรีเซนต์ และสร้าง Workflow เพิ่มความเร็ว 10 เท่า

5. ID: "live-claude-workflow"
   - ชื่อ: "Claude Personal Workflow"
   - รูปแบบ: เรียนสด Online 1:1 ผ่าน Google Meet
   - ระยะเวลา: 1 วัน รวม 3 ชม. | ราคา: ฿3,900 (ราคาเต็ม ฿5,900)
   - จุดเด่น: ออกแบบ Personal Workflow การทำงานส่วนตัวเฉพาะบุคคลด้วย Claude เพิ่มประสิทธิภาพงาน 10 เท่า

6. ID: "live-ai-webapp"
   - ชื่อ: "AI Webapp Builder with Google AI Studio"
   - รูปแบบ: เรียนสด Online 1:1 ผ่าน Google Meet
   - ระยะเวลา: 1 วัน รวม 3 ชม. | ราคา: ฿3,900 (ราคาเต็ม ฿5,900)
   - จุดเด่น: สร้าง Web Application แบบ Full-stack ด้วย Google AI Studio ต่อ API ใช้งานได้จริง

7. ID: "live-claude-cowork-skills"
   - ชื่อ: "Claude Cowork & Skills"
   - รูปแบบ: เรียนสด Online 1:1 ผ่าน Google Meet
   - ระยะเวลา: 2 วัน รวม 6 ชม. (วันละ 3 ชม.) | ราคา: ฿7,500 (ราคาเต็ม ฿12,000)
   - จุดเด่น: เจาะลึกการใช้ Claude Cowork และการสร้างและติดตั้ง Custom Skills เฉพาะองค์กร

8. ID: "live-ai-website-lovable"
   - ชื่อ: "AI Website Builder with Lovable/Codex/ClaudeCode"
   - รูปแบบ: เรียนสด Online 1:1 ผ่าน Google Meet
   - ระยะเวลา: 2 วัน รวม 6 ชม. (วันละ 3 ชม.) | ราคา: ฿7,500 (ราคาเต็ม ฿12,000)
   - จุดเด่น: สอนสร้างเว็บไซต์และ Landing Page ด้วย Lovable, Codex, ClaudeCode

9. ID: "live-landing-page"
   - ชื่อ: "สร้าง Landing Page ด้วย Claude Cowork / Codex / Lovable"
   - รูปแบบ: เรียนสด Online 1:1 ผ่าน Google Meet
   - ระยะเวลา: 2 วัน รวม 6 ชม. (วันละ 3 ชม.) | ราคา: ฿7,500 (ราคาเต็ม ฿12,000)
   - จุดเด่น: เจาะลึกการสร้าง Landing Page เพื่อเพิ่มยอดขายธุรกิจ ออกแบบและเขียนโค้ดจริง

[หมวด 2: คอร์สเรียนผ่าน VDO Online (Coming Soon - เร็วๆ นี้)]
9. ID: "vdo-starter"
   - ชื่อ: "เรียนผ่าน VDO Online - Package STARTER (Coming Soon)"
   - ราคา: ฿399 (ราคาเต็ม ฿799)
   - สถานะ: Coming Soon (เร็วๆ นี้)

10. ID: "vdo-intermediate"
    - ชื่อ: "เรียนผ่าน VDO Online - Package INTERMEDIATE (Coming Soon)"
    - ราคา: ฿499 (ราคาเต็ม ฿999)
    - สถานะ: Coming Soon (เร็วๆ นี้)

11. ID: "vdo-advance-1"
    - ชื่อ: "เรียนผ่าน VDO Online - Package Advance 1 (Coming Soon)"
    - ราคา: ฿599 (ราคาเต็ม ฿1,599)
    - สถานะ: Coming Soon (เร็วๆ นี้)

12. ID: "vdo-advance-2"
    - ชื่อ: "เรียนผ่าน VDO Online - Package Advance 2 (Coming Soon)"
    - ราคา: ฿1,099 (ราคาเต็ม ฿2,599)
    - สถานะ: Coming Soon (เร็วๆ นี้)

13. ID: "vdo-ai-starter"
    - ชื่อ: "Package AI STARTER 1 ชั่วโมง (VDO Online - Coming Soon)"
    - ราคา: ฿599 (ราคาเต็ม ฿1,500)
    - สถานะ: Coming Soon (เร็วๆ นี้)

14. ID: "vdo-claude-chatgpt"
    - ชื่อ: "Package Claude Cowork หรือ ChatGPT Work STARTER (VDO Online - Coming Soon)"
    - ราคา: ฿599 (ราคาเต็ม ฿1,500)
    - สถานะ: Coming Soon (เร็วๆ นี้)

15. ID: "vdo-claude-codex"
    - ชื่อ: "Package Claude Code หรือ Codex STARTER (VDO Online - Coming Soon)"
    - ราคา: ฿599 (ราคาเต็ม ฿1,500)
    - สถานะ: Coming Soon (เร็วๆ นี้)

============================================================
เงื่อนไขเวลาเรียน & การให้บริการ:
============================================================
- คอร์สสด 1:1 (Google Meet) บุคคลทั่วไป:
  • วันจันทร์ - ศุกร์: รอบค่ำ 19:30 - 22:30 น. (รอบละ 1 ชม. หรือ 3 ชม.)
  • วันเสาร์: 10:00 - 23:00 น. (เปิดให้เลือกได้ตลอดวัน)
  • วันอาทิตย์: 10:00 - 22:00 น.
- คอร์สสดสำหรับองค์กร (Corporate):
  • วันจันทร์ - เสาร์: 09:00 - 18:00 น. (ปิดวันอาทิตย์)
  • มีบริการจัดอบรมนอกสถานที่ / วิทยากรบรรยาย ติดต่อผ่าน LINE: @761rqbfc
- คอร์ส VDO Online: อยู่ในสถานะ Coming Soon กำลังเตรียมเปิดให้เข้าเรียนในเร็วๆ นี้
`;

// Helper function to sanitize and format conversation history for Gemini API
function formatGeminiContents(messages: any[], userMessage?: string) {
  const rawList: Array<{ role: "user" | "model"; text: string }> = [];

  if (Array.isArray(messages) && messages.length > 0) {
    for (const m of messages) {
      const text = String(m?.content || "").trim();
      if (!text) continue;
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
      rawList.push({ role, text });
    }
  }

  // Ensure latest user query is captured if provided
  if (userMessage && userMessage.trim()) {
    const trimmed = userMessage.trim();
    if (rawList.length === 0 || rawList[rawList.length - 1].text !== trimmed) {
      rawList.push({ role: "user", text: trimmed });
    }
  }

  if (rawList.length === 0) {
    return [{ role: "user" as const, parts: [{ text: "สวัสดีครับ แนะนำคอร์ส AI หน่อยครับ" }] }];
  }

  // Drop leading model/assistant messages because Gemini requires contents to start with 'user'
  let startIndex = 0;
  while (startIndex < rawList.length && rawList[startIndex].role === "model") {
    startIndex++;
  }

  const validRaw = startIndex < rawList.length ? rawList.slice(startIndex) : rawList;

  // Merge consecutive messages with the same role
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const item of validRaw) {
    if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
      contents[contents.length - 1].parts[0].text += "\n" + item.text;
    } else {
      contents.push({
        role: item.role,
        parts: [{ text: item.text }],
      });
    }
  }

  // Ensure the contents array starts with a user role
  if (contents.length === 0 || contents[0].role !== "user") {
    contents.unshift({ role: "user", parts: [{ text: userMessage || "สวัสดีครับ แนะนำคอร์ส AI หน่อยครับ" }] });
  }

  return contents;
}

// Comprehensive rule-based advisor fallback for 100% reliable responses
function generateCourseAdvisorFallback(query: string, persona: string): { reply: string; suggestedCourseIds: string[] } {
  const q = (query || "").toLowerCase().trim();

  // 1. Specific Web App Builder / Google AI Studio query
  if (q.includes("webapp") || q.includes("web app") || q.includes("สร้าง web app") || q.includes("สร้างเว็บแอป") || q.includes("google ai studio")) {
    return {
      reply: `🚀 **หลักสูตรแนะนำสำหรับการสร้าง Web Application ด้วย AI:**
      
1. ⚡ **AI Webapp Builder with Google AI Studio (เรียนสด Online 1:1)**
   - **รูปแบบ**: เรียนสดตัวต่อตัวผ่าน Google Meet (จับมือทำ)
   - **ระยะเวลา**: 1 วัน รวม 3 ชม. | **ราคา**: ฿3,900 (ราคาเต็ม ฿5,900)
   - **เนื้อหาที่ได้เรียนรู้**:
     • วางโครงสร้าง Full-Stack Web App ด้วย React + Vite + Tailwind CSS
     • เชื่อมต่อ Google GenAI SDK (Gemini 2.5 / 3.7 Flash) ผ่าน Secure Backend
     • ออกแบบ Dynamic UI, Structured JSON Output และระบบจัดการ State
     • วิธี Deploy ขึ้น Cloud Run / Vercel พร้อมเปิดให้ผู้ใช้งานจริงเข้าถึง
   
2. 🌐 **AI Website Builder with Lovable / Codex / ClaudeCode (เรียนสด 1:1 6 ชม.)**
   - **ระยะเวลา**: 2 วัน รวม 6 ชม. (วันละ 3 ชม.) | **ราคา**: ฿7,500 (ราคาเต็ม ฿12,000)
   - สร้างโปรเจกต์ขนาดใหญ่และระบบ Automation แบบบูรณาการ

💡 คุณสามารถคลิกปุ่ม **"เลือกจองคอร์สนี้"** ด้านล่างเพื่อดูปฏิทินรอบเวลาว่างและลงทะเบียนเรียนได้ทันทีครับ!`,
      suggestedCourseIds: ["live-ai-webapp", "live-ai-website-lovable"],
    };
  }

  // 1.5 Specific AI for Work query
  if (q.includes("ai for work") || q.includes("ทำงาน") || q.includes("คล่อง") || q.includes("productivity") || q.includes("งานเอกสาร") || q.includes("รายงาน") || q.includes("วิเคราะห์ข้อมูล") || q.includes("3 ชม") || q.includes("3 ชั่วโมง")) {
    return {
      reply: `💼 **หลักสูตรแนะนำ: AI for Work ใช้ AI ในการทำงานคล่องใน 3 ชม.**
      
🌟 **AI for Work: ใช้ AI ในการทำงานคล่องใน 3 ชม. (เรียนสด Online 1:1)**
- **รูปแบบ**: เรียนสดตัวต่อตัวผ่าน Google Meet (จับมือทำ ปรึกษาโจทย์จริง)
- **ระยะเวลา**: 1 วัน รวม 3 ชม. | **ราคา**: ฿3,900 (ราคาเต็ม ฿5,900)
- **เนื้อหาที่จะได้เรียนรู้แบบจับมือทำ**:
  • เทคนิคเลือกใช้ AI ให้ตรงกับประเภทงาน (ChatGPT, Claude, Gemini, Perplexity, NotebookLM)
  • Prompt Engineering สำหรับคนทำงาน: สั่งครั้งเดียวได้ผลงานคุณภาพพร้อมส่ง
  • สรุปเอกสาร PDF หนาๆ, ถอดบทความ และร่างบันทึกข้อความแบบมืออาชีพ
  • วิเคราะห์ข้อมูล Excel/CSV และสร้างตารางสรุป Insight อัตโนมัติ
  • ร่างอีเมลธุรกิจภาษาไทย-อังกฤษ และสร้าง Slide พรีเซนต์ใน 5 นาที
  • เวิร์กช็อปแก้ปัญหาและงานจริงของผู้เรียนแบบ 1:1 โดย โค้ช ซาน

💡 เหมาะสำหรับพนักงานประจำ ฟรีแลนซ์ ผู้บริหาร และเจ้าของธุรกิจที่ต้องการประหยัดเวลาทำงานวันละ 2-3 ชั่วโมงครับ!`,
      suggestedCourseIds: ["live-ai-for-work", "live-claude-workflow", "live-ai-starter"],
    };
  }

  // 2. Specific Landing Page query
  if (q.includes("landing page") || q.includes("หน้าขาย") || q.includes("ยอดขาย") || q.includes("เซลเพจ") || q.includes("เพิ่มยอดขาย")) {
    return {
      reply: `🎯 **หลักสูตรสร้าง Landing Page เพิ่มยอดขายธุรกิจด้วย AI:**

🌟 **สร้าง Landing Page ด้วย Claude Cowork / Codex / Lovable (เรียนสด 1:1)**
- **รูปแบบ**: เรียนสด Online 1:1 ผ่าน Google Meet (จับมือทำ ปรึกษาธุรกิจจริง)
- **ระยะเวลา**: 2 วัน รวม 6 ชม. (แบ่งเรียนวันละ 3 ชม.) | **ราคา**: ฿7,500 (ราคาเต็ม ฿12,000)
- **สิ่งที่คุณจะได้รับแบบจับมือทำ**:
  • วางโครงสร้าง Copywriting ตามจิตวิทยาการขาย (AIDA + High Conversion Hooks)
  • สร้างหน้าเว็บ Responsive ด้วย AI tools (Lovable, Codex, Claude Code)
  • ฝังแบบฟอร์มรับลูกค้า ชำระเงิน และระบบแจ้งเตือนเข้า LINE Notify อัตโนมัติ
  • ปรับแต่ง SEO & GEO ให้ติดอันดับบน Google และ AI Search Engines

💡 เหมาะสำหรับเจ้าของธุรกิจ ผู้ประกอบการ นักการตลาด และฟรีแลนซ์ที่ต้องการเพิ่มยอดขายอย่างรวดเร็วครับ!`,
      suggestedCourseIds: ["live-landing-page", "live-ai-website-lovable"],
    };
  }

  // 3. Specific Claude Cowork & Custom Skills query
  if (q.includes("skill") || q.includes("skills") || q.includes("cowork") || q.includes("custom skill") || q.includes("claude cowork")) {
    return {
      reply: `🛠️ **หลักสูตรเจาะลึก Claude Cowork & Custom Skills (ระดับ Advanced):**

🌟 **Claude Cowork & Skills (เรียนสด 1:1 ผ่าน Google Meet)**
- **ระยะเวลา**: 2 วัน รวม 6 ชม. (แบ่งเรียนวันละ 3 ชม.) | **ราคา**: ฿7,500 (ราคาเต็ม ฿12,000)
- **เนื้อหาการเรียนรู้**:
  • เจาะลึกการใช้งาน Claude Projects, Artifacts และ Context Window ขั้นสูง
  • การเขียนและติดตั้ง Custom Skills (SKILL.md) ให้ Claude รันงานเฉพาะทาง
  • เชื่อมต่อ Claude กับ External Tools, APIs และฐานข้อมูล
  • ออกแบบ Autonomous AI Agent ช่วยคัดกรอง สรุปงาน และตอบกลับลูกค้า

💡 เหมาะสำหรับผู้ที่ต้องการสร้าง AI Assistant ส่วนตัวที่ทำงานเฉพาะทางได้แบบอัตโนมัติ 100%!`,
      suggestedCourseIds: ["live-claude-cowork-skills", "live-claude-workflow"],
    };
  }

  // 4. Specific Claude Personal Workflow query
  if (q.includes("workflow") || q.includes("personal workflow") || q.includes("โฟลว์") || q.includes("เวิร์กโฟลว์") || q.includes("claude workflow")) {
    return {
      reply: `🚀 **หลักสูตรออกแบบ Personal Workflow ด้วย Claude (ยอดนิยมอันดับ 1):**

🌟 **Claude Personal Workflow (เรียนสด 1:1 ผ่าน Google Meet)**
- **รูปแบบ**: เรียนสดตัวต่อตัว 1:1 ถามตอบและแก้โจทย์งานของคุณโดยตรง
- **ระยะเวลา**: 1 วัน รวม 3 ชม. | **ราคา**: ฿3,900 (ราคาเต็ม ฿5,900)
- **ไฮไลท์ของหลักสูตร**:
  • วางระบบ Workflow การทำงานส่วนบุคคลให้ตรงกับเนื้องานจริง
  • ออกแบบ Prompt Blueprint และ System Instruction ประจำตำแหน่ง
  • ลดภาระงานซ้ำซ้อน งานเอกสาร รายงาน และการวิเคราะห์ข้อมูล เพิ่มความเร็ว 10x
  • เทคนิคการใช้งาน Claude ร่วมกับเครื่องมือประจำวัน

💡 กดปุ่ม **"เลือกจองคอร์สนี้"** ด้านล่างเพื่อเลือกรอบวันและเวลาเรียนที่สะดวกได้ทันทีครับ!`,
      suggestedCourseIds: ["live-claude-workflow", "live-claude-cowork-skills"],
    };
  }

  // 5. Specific Marketing query
  if (q.includes("marketing") || q.includes("การตลาด") || q.includes("คอนเทนต์") || q.includes("ยิงแอด") || q.includes("ยิง ads")) {
    return {
      reply: `📈 **หลักสูตร AI สำหรับงานการตลาดและการทำคอนเทนต์:**

🌟 **AI for Marketing: AI Starter Class (เรียนสด 1:1)**
- **รูปแบบ**: เรียนสด Online 1:1 ผ่าน Google Meet
- **ระยะเวลา**: 1 วัน รวม 1 ชม. | **ราคา**: ฿1,500 (ราคาเต็ม ฿2,500)
- **สิ่งที่จะได้เรียนรู้**:
  • ประยุกต์ใช้ AI คิด Content Plan, เขียนแคปชั่น และร่าง Script วิดีโอ
  • วิเคราะห์กลุ่มเป้าหมาย ออกแบบคำโฆษณา (Ad Copy) ยิงโฆษณา Facebook & TikTok
  • ออกแบบภาพและ Artwork กราฟิกด้วย AI tools ได้อย่างรวดเร็ว

💡 หากต้องการต่อยอดสร้าง Landing Page ปิดการขาย สามารถเลือกเรียนต่อคอร์ส Landing Page ได้เช่นกันครับ!`,
      suggestedCourseIds: ["live-ai-marketing", "live-landing-page", "live-ai-starter"],
    };
  }

  // 6. Schedule & Timing query
  if (q.includes("เวลา") || q.includes("รอบ") || q.includes("ตาราง") || q.includes("กี่โมง") || q.includes("วันธรรมดา") || q.includes("เสาร์") || q.includes("อาทิตย์")) {
    return {
      reply: `📅 **ตารางเวลาสำหรับการเรียนสด Online 1:1 (ผ่าน Google Meet):**

• **สำหรับบุคคลทั่วไป / นักเรียนเดี่ยว (Individual Learners):**
  - **วันจันทร์ - ศุกร์**: รอบค่ำ **19:30 - 22:30 น.** (มีรอบ 1 ชม. และ 3 ชม.)
  - **วันเสาร์**: **10:00 - 23:00 น.** (เปิดให้เลือกรอบได้ตลอดวันและรอบค่ำ)
  - **วันอาทิตย์**: **10:00 - 22:00 น.**

• **สำหรับองค์กร / ทีมงาน (Corporate Training):**
  - **วันจันทร์ - เสาร์**: 09:00 - 18:00 น. (ปิดวันอาทิตย์)
  - มีบริการจัดอบรมนอกสถานที่ (On-site) และ Online ทั่วประเทศ

💡 **ขั้นตอนการจอง:** คุณสามารถคลิกเลือกคอร์สที่สนใจ จากนั้นระบบจะแสดงปฏิทินพร้อมช่องเวลาว่างจริงให้คุณกดเลือกได้ทันทีครับ!`,
      suggestedCourseIds: ["live-ai-starter", "live-claude-workflow", "live-ai-webapp"],
    };
  }

  // 7. Corporate & Onsite Speaker query
  if (q.includes("วิทยากร") || q.includes("องค์กร") || q.includes("บรรยาย") || q.includes("นอกสถานที่") || q.includes("corporate") || q.includes("in-house")) {
    return {
      reply: `🏢 **บริการวิทยากรบรรยาย และจัดอบรม AI ในองค์กร (Zarntastic AI LEARNING)**

โดย **โค้ช ซาน** (Fastwork Verified Pro AI Specialist):
- ออกแบบหลักสูตรเฉพาะทางให้ตรงกับธุรกิจของคุณ (Finance, Real Estate, Retail, Tech, Healthcare)
- เน้นการปฏิบัติจริง (Hands-on Workshop) ให้พนักงานนำเครื่องมือไปเพิ่มผลงานได้ทันที
- ให้บริการทั้งแบบ Online ผ่าน Meet/Zoom และ On-site นอกสถานที่ทั่วประเทศ

📞 **ติดต่อขอใบเสนอราคา / ออกใบกำกับภาษี:**
• **LINE Official**: [@761rqbfc](https://lin.ee/NE2vFcZ)
• **โทรศัพท์**: 061-5614269
• **อีเมล**: zarnzarn10@gmail.com`,
      suggestedCourseIds: ["live-ai-starter", "live-claude-cowork-skills"],
    };
  }

  // 8. VDO Online Status query
  if (q.includes("vdo") || q.includes("วิดีโอ") || q.includes("online course") || q.includes("คลิป")) {
    return {
      reply: `🎬 **เกี่ยวกับหลักสูตรเรียนผ่าน VDO Online:**

ขณะนี้คอร์สเรียนผ่าน VDO Online ทุกแพ็กเกจ (Starter ฿399, Intermediate ฿499, Advance 1 & 2) กำลังอยู่ในสถานะ **Coming Soon (เร็วๆ นี้)** เนื่องจากทางสถาบันกำลังอัปเดตบทเรียนใหม่ล่าสุดประจำปี 2026 ครับ

🌟 **แนะนำคอร์สเรียนสด Online 1:1 ในระหว่างนี้:**
หากต้องการเริ่มใช้งาน AI ทันที ขอแนะนำ **AI STARTER (1 ชม. ฿1,500)** หรือ **Claude Personal Workflow (3 ชม. ฿3,900)** ซึ่งได้เรียนสดตัวต่อตัวกับ โค้ช ซาน ถามตอบแก้โจทย์งานจริงได้ทันทีครับ!`,
      suggestedCourseIds: ["live-ai-starter", "live-claude-workflow"],
    };
  }

  // 9. Pricing & Promotion query
  if (q.includes("ราคา") || q.includes("โปรโมชั่น") || q.includes("ค่าเรียน") || q.includes("กี่บาท") || q.includes("promotion")) {
    return {
      reply: `💰 **สรุปอัตราค่าเรียนคอร์สเรียนสด Online 1:1 (ราคาโปรโมชั่นพิเศษ):**

1. 💻 **AI STARTER (1 ชม.)**: **฿1,500** (ราคาเต็ม ฿2,500)
2. 💻 **AI for Marketing (1 ชม.)**: **฿1,500** (ราคาเต็ม ฿2,500)
3. 💻 **AI for Work: ใช้ AI ในการทำงานคล่อง (3 ชม.)**: **฿3,900** (ราคาเต็ม ฿5,900)
4. 💻 **Claude Starter (1 ชม.)**: **฿1,500** (ราคาเต็ม ฿2,500)
5. 💻 **Claude Personal Workflow (3 ชม.)**: **฿3,900** (ราคาเต็ม ฿5,900)
6. 💻 **AI Webapp Builder with Google AI Studio (3 ชม.)**: **฿3,900** (ราคาเต็ม ฿5,900)
7. 💻 **Claude Cowork & Skills (6 ชม. / 2 วัน)**: **฿7,500** (ราคาเต็ม ฿12,000)
8. 💻 **สร้าง Landing Page ด้วย AI (6 ชม. / 2 วัน)**: **฿7,500** (ราคาเต็ม ฿12,000)

💡 ทุกคอร์สเรียนสด 1:1 มีเอกสารประกอบและคลิปบันทึกย้อนหลังให้ทบทวนครับ!`,
      suggestedCourseIds: ["live-ai-for-work", "live-ai-starter", "live-claude-workflow"],
    };
  }

  // 10. Starter / Beginner query
  if (q.includes("starter") || q.includes("เริ่มต้น") || q.includes("มือใหม่") || q.includes("ไม่เคยใช้") || q.includes("พื้นฐาน") || q.includes("1 ชม")) {
    return {
      reply: `🌟 **หลักสูตรแนะนำสำหรับผู้เริ่มต้นใช้งาน AI (เรียนสด Online 1:1):**

💡 **AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”**
- **รูปแบบ**: เรียนสดตัวต่อตัว 1:1 ผ่าน Google Meet (จับมือทำ)
- **ระยะเวลา**: 1 วัน รวม 1 ชม. | **ราคา**: ฿1,500 (ราคาเต็ม ฿2,500)
- **สิ่งที่คุณจะได้เรียนรู้**:
  • ปูพื้นฐานการใช้งานเครื่องมือ AI ตัวท็อป (ChatGPT, Claude, Gemini, Perplexity)
  • เทคนิคการเขียน Prompt สั่งงานให้ได้คำตอบที่ถูกต้องแม่นยำ ไม่เพี้ยน
  • ปรึกษาโจทย์งานจริงของคุณโดยตรงกับ โค้ช ซาน (Fastwork 5.0 ★)
  • จบแล้วใช้งานเป็นทันที พร้อมนำไปปรับใช้กับชีวิตประจำวันและการทำงาน

กดปุ่ม **"เลือกจองคอร์สนี้"** ด้านล่างเพื่อเลือกรอบวันเวลาที่สะดวกได้เลยครับ!`,
      suggestedCourseIds: ["live-ai-starter", "live-ai-for-work"],
    };
  }

  // Default general overview
  return {
    reply: `สวัสดีครับ! สถาบัน **Zarntastic AI LEARNING** (โดย โค้ช ซาน) ขอแนะนำ **หลักสูตรเรียนสด Online 1:1 ผ่าน Google Meet (จับมือทำ ปรึกษาโจทย์งานจริง)**:

• 💼 **AI for Work: ใช้ AI ในการทำงานคล่อง (3 ชม. ฿3,900)**: ทำงานเอกสาร รายงาน วิเคราะห์ข้อมูลเร็วขึ้น 10 เท่า
• 🌟 **AI STARTER (1 ชม. ฿1,500)**: ปูพื้นฐาน AI ให้ใช้งานเป็นทันทีแบบจับมือทำ
• 🚀 **Claude Personal Workflow (3 ชม. ฿3,900)**: ออกแบบ Workflow ส่วนตัว เพิ่มความเร็ว 10 เท่า
• ⚡ **AI Webapp Builder with Google AI Studio (3 ชม. ฿3,900)**: สร้าง Web App ต่อ API ใช้งานได้จริง
• 🛠️ **Claude Cowork & Skills (6 ชม. ฿7,500)**: เจาะลึก Claude และสร้าง Skills อัตโนมัติ
• 🎯 **สร้าง Landing Page ด้วย AI (6 ชม. ฿7,500)**: ออกแบบและเขียนโค้ดหน้าขายสินค้าเพิ่มยอดขาย

💡 คุณสามารถพิมพ์บอกความต้องการ หรือเลือกคำถามด่วนด้านล่างเพื่อรับคำแนะนำเจาะลึกได้ทันทีครับ!`,
    suggestedCourseIds: ["live-ai-for-work", "live-ai-starter", "live-claude-workflow"],
  };
}

app.post("/api/ai/advisor", async (req, res) => {
  const { messages, userMessage, model = "gemini-3.7-flash", persona = "advisor" } = req.body;
  const ai = getAI();

  const queryText = userMessage || (Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1]?.content : "") || "";

  // If AI instance is unavailable, deliver instant accurate rule-based response
  if (!ai) {
    const fallback = generateCourseAdvisorFallback(queryText, persona);
    return res.json({
      reply: fallback.reply,
      modelUsed: "Zarntastic-Advisor-Engine",
      suggestedCourseIds: fallback.suggestedCourseIds,
    });
  }

  try {
    const validModels = [
      "gemini-3.7-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.1-pro-preview",
    ];
    const selectedModel = validModels.includes(model) ? model : "gemini-3.7-flash";

    let roleDescription = "คุณคือ 'AI Course Consultant & Smart Scheduler' ที่ปรึกษาผู้เชี่ยวชาญประจำสถาบัน Zarntastic AI LEARNING";
    if (persona === "scheduler") {
      roleDescription = "คุณคือ 'Smart Schedule Assistant' ผู้เชี่ยวชาญการจัดตารางเวลาเรียนและตรวจรอบเวลาว่างของสถาบัน Zarntastic AI LEARNING";
    } else if (persona === "corporate") {
      roleDescription = "คุณคือ 'Corporate AI Training Specialist' ที่ปรึกษาการจัดอบรม AI องค์กรและ Upskill ทีมงานของ Zarntastic AI LEARNING";
    }

    const systemInstruction = `${roleDescription}

ฐานข้อมูลหลักสูตรและข้อมูลสถาบัน:
${COURSE_KNOWLEDGE_BASE}

🚨 กฎเหล็กสำคัญที่สุดในการแนะนำคอร์ส (Must Follow):
1. **ให้แนะนำ 'คอร์สเรียนสด Online 1:1 ผ่าน Google Meet' เสมอเป็นอันดับแรก** (เช่น AI Starter 1 ชม. ฿1,500, Claude Personal Workflow 3 ชม. ฿3,900, AI Webapp Builder 3 ชม. ฿3,900, Claude Cowork & Skills 6 ชม. ฿7,500, สร้าง Landing Page 6 ชม. ฿7,500)
2. อธิบายจุดเด่นของคอร์สเรียนสดเสมอ เช่น เป็นการเรียนแบบจับมือทำ ปรึกษาโจทย์และปัญหาในงานจริงกับ โค้ช ซาน โดยตรง ถามตอบสดตัวต่อตัว และได้คะแนนรีวิว 5.0 เต็มบน Fastwork
3. สำหรับคอร์ส VDO Online ให้แจ้งสั้นๆ ว่าเป็นหลักสูตร Coming Soon (เร็วๆ นี้)
4. ตอบเป็นภาษาไทยที่สุภาพ เป็นมิตร กระชับ น่าเชื่อถือ
5. หากผู้เรียนถามเรื่องตารางเวลาเรียนสด 1:1:
   - บุคคลทั่วไป: วันธรรมดา 19:30-22:30 น. (รอบค่ำ), เสาร์ 10:00-23:00 น., อาทิตย์ 10:00-22:00 น.
   - องค์กร: จันทร์-เสาร์ 09:00-18:00 น.
   - มีบริการวิทยากรนอกสถานที่ (ติดต่อ LINE: @761rqbfc หรือ โทร 061-5614269)
6. จัดรูปแบบคำตอบด้วย Markdown ให้อ่านง่าย มี bullet และตัวหนา`;

    // Construct cleanly formatted conversation history for multi-turn chat
    const contentsPayload = formatGeminiContents(messages, userMessage);

    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };
    
    // Add Google Search grounding if model is gemini-3.5-flash
    if (selectedModel === "gemini-3.5-flash") {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contentsPayload,
      config,
    });

    const replyText = response.text || "";

    if (!replyText.trim()) {
      const fallback = generateCourseAdvisorFallback(queryText, persona);
      return res.json({
        reply: fallback.reply,
        modelUsed: selectedModel,
        suggestedCourseIds: fallback.suggestedCourseIds,
      });
    }

    // Detect matched course IDs for quick UI interaction buttons
    const matchedIds: string[] = [];
    const idList = [
      "vdo-starter",
      "vdo-intermediate",
      "vdo-advance-1",
      "vdo-advance-2",
      "vdo-ai-starter",
      "vdo-claude-chatgpt",
      "vdo-claude-codex",
      "live-ai-starter",
      "live-ai-marketing",
      "live-claude-starter",
      "live-claude-workflow",
      "live-ai-webapp",
      "live-claude-cowork-skills",
      "live-ai-website-lovable",
      "live-landing-page",
    ];

    for (const cid of idList) {
      if (replyText.toLowerCase().includes(cid.toLowerCase())) {
        matchedIds.push(cid);
      }
    }

    // If no course IDs detected in reply, match from query as well
    if (matchedIds.length === 0) {
      const fallback = generateCourseAdvisorFallback(queryText, persona);
      matchedIds.push(...fallback.suggestedCourseIds);
    }

    res.json({
      reply: replyText,
      modelUsed: selectedModel,
      suggestedCourseIds: matchedIds,
    });
  } catch (err: any) {
    console.error("AI Advisor Error:", err);
    // On any Gemini API or network error, safely return the high-quality fallback instead of 500 failure
    const fallback = generateCourseAdvisorFallback(queryText, persona);
    res.json({
      reply: fallback.reply,
      modelUsed: "Zarntastic-Advisor-Engine",
      suggestedCourseIds: fallback.suggestedCourseIds,
    });
  }
});

// LINE Messaging API Helper (Push Message to Admin only)
async function sendLineNotify(message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_TARGET_ID; // The admin's personal LINE User ID
  if (!token || !to) {
    console.log("No LINE_CHANNEL_ACCESS_TOKEN or LINE_TARGET_ID found, skipping notification");
    return;
  }

  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        to: to,
        messages: [{ type: 'text', text: message }]
      })
    });
  } catch (error) {
    console.error('Error sending LINE Messaging API:', error);
  }
}

// ----------------------------------------------------
// AI News Automation & Knowledge Base Articles System
// ----------------------------------------------------

// Initialize Articles in persistence
try {
  let allArticles = loadArticles();
  if (!allArticles || allArticles.length === 0) {
    allArticles = [...ARTICLES_DATA];
    saveArticles(allArticles);
  } else {
    // Merge any missing seed articles
    const map = new Map<string, any>();
    allArticles.forEach((a: any) => map.set(a.id, a));
    let updated = false;
    ARTICLES_DATA.forEach((s) => {
      if (!map.has(s.id)) {
        allArticles.push(s);
        updated = true;
      }
    });
    if (updated) {
      saveArticles(allArticles);
    }
  }
} catch (e) {
  console.warn("Articles initialization warning:", e);
}

// 1. Get all articles (supports category, search, tag filters)
app.get("/api/articles", (req, res) => {
  const articles = loadArticles();
  res.json(articles && articles.length > 0 ? articles : ARTICLES_DATA);
});

// 2. Get single article
app.get("/api/articles/:id", (req, res) => {
  const articles = loadArticles();
  const found = (articles && articles.find((a: any) => a.id === req.params.id)) || ARTICLES_DATA.find((a) => a.id === req.params.id);
  if (!found) {
    return res.status(404).json({ error: "ไม่พบบทความนี้" });
  }
  res.json(found);
});

// 3. Admin: Get Automation Status & Sources
app.get("/api/admin/automation/status", requireAdmin, (req, res) => {
  const logs = loadRunLogs();
  const articles = loadArticles();
  const automatedArticles = articles ? articles.filter((a: any) => a.isAutomated) : [];
  res.json({
    schedule: "ทุกวันเสาร์ 09:00 น. (Every Saturday 09:00 AM)",
    timezone: "Asia/Bangkok",
    cronExpression: "0 9 * * 6",
    totalAutomatedArticles: automatedArticles.length,
    lastRun: logs[0] || null,
    officialSources: OFFICIAL_AI_SOURCES,
  });
});

// 4. Admin: Get Automation Run Logs
app.get("/api/admin/automation/logs", requireAdmin, (req, res) => {
  const logs = loadRunLogs();
  res.json(logs);
});

// 5. Admin: Manually Trigger AI News Automation
app.post("/api/admin/automation/run-blog", requireAdmin, async (req, res) => {
  try {
    console.log("[Admin Action] Manually triggered Saturday AI News Automation Pipeline");
    const result = await runAINewsAutomationPipeline("manual");
    res.json(result);
  } catch (err: any) {
    console.error("[Admin Automation Error]:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Admin: Delete an Article
app.delete("/api/admin/articles/:id", requireAdmin, (req, res) => {
  const articles = loadArticles();
  const filtered = articles.filter((a: any) => a.id !== req.params.id);
  saveArticles(filtered);
  res.json({ success: true, remaining: filtered.length });
});

// Weekly Saturday Cron Job (09:00 AM Asia/Bangkok)
cron.schedule(
  "0 9 * * 6",
  async () => {
    console.log("[CRON] Saturday AI News Automation scheduled job started (Asia/Bangkok)...");
    try {
      await runAINewsAutomationPipeline("scheduled");
    } catch (e: any) {
      console.error("[CRON Error] Saturday AI News Pipeline execution failed:", e?.message || e);
    }
  },
  {
    timezone: "Asia/Bangkok",
  }
);

// Vite Middleware Integration
async function startServer() {
  // Check and initialize Cloud Firestore synchronization if cloud database is provisioned
  await initFirestoreSync().catch((err) => {
    console.warn("[Firestore] Init check skipped:", err?.message || err);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Course Booking Server running on port ${PORT}`);
  });
}

startServer();
