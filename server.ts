import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';



import jwt from "jsonwebtoken";

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
try {
  initializeApp({ credential: applicationDefault() });
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  db = getFirestore(config.firestoreDatabaseId);
} catch (e) {
  console.error("Firebase init failed:", e);
}

const app = express();


const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();
  
  const expectedEmail = (process.env.ADMIN_EMAIL || "admin@zarntastic.com").trim().toLowerCase();
  const expectedPass = (process.env.ADMIN_PASSWORD || "admin123").trim();

  if (cleanEmail === expectedEmail && cleanPass === expectedPass) {
    const token = jwt.sign({ role: 'admin', email: cleanEmail }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
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

// Initial Mock Bookings containing existing blocked dates requested
const initialBookings: Booking[] = [];

let bookings: Booking[] = [...initialBookings];
if (db) {
  db.collection("bookings").onSnapshot((snapshot: any) => {
    const loadedBookings: Booking[] = [];
    snapshot.forEach((doc: any) => {
      loadedBookings.push(doc.data() as Booking);
    });
    bookings = loadedBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
}

// Helper to save a single booking to Firestore
async function saveBooking(booking: Booking) {
  if (db) {
    try {
      await db.collection("bookings").doc(booking.id).set(booking);
    } catch (e) {
      console.error("Failed to save booking to Firestore:", e);
    }
  }
}

let notifications: NotificationItem[] = [];
if (db) {
  db.collection("notifications").onSnapshot((snapshot: any) => {
    const loaded: NotificationItem[] = [];
    snapshot.forEach((doc: any) => {
      loaded.push(doc.data() as NotificationItem);
    });
    notifications = loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });
}

async function saveNotification(notif: NotificationItem) {
  if (db) {
    try {
      await db.collection("notifications").doc(notif.id).set(notif);
    } catch (e) {
      console.error("Failed to save notification:", e);
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

  if (startMin >= endMin) {
    return { valid: false, reason: "เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด" };
  }

  // Corporate: Mon - Sat 09:00 - 18:00 (Sun closed)
  if (userCategory === 'corporate') {
    if (dayOfWeek === 0) {
      return {
        valid: false,
        reason: "รอบสำหรับองค์กรเปิดให้บริการวันจันทร์ - เสาร์ (ปิดวันอาทิตย์)",
      };
    }
    const allowedStart = timeToMinutes("09:00");
    const allowedEnd = timeToMinutes("18:00");
    if (startMin < allowedStart || endMin > allowedEnd) {
      return {
        valid: false,
        reason: "รอบสำหรับองค์กรเปิดให้จองช่วงเวลา 09:00 - 18:00 น. (จันทร์ - เสาร์)",
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
      // Sunday: 09:00 - 18:00 (540 - 1080 min)
      const allowedStart = timeToMinutes("09:00");
      const allowedEnd = timeToMinutes("18:00");
      if (startMin < allowedStart || endMin > allowedEnd) {
        return {
          valid: false,
          reason: "บุคคลทั่วไป: วันอาทิตย์ เปิดให้จองเฉพาะช่วงเวลา 09:00 - 18:00 น.",
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
    return res.json(scrubbedBooking);
  }

  res.json(booking);
});

// 3. Create new booking (with strict anti-double booking check)
app.post("/api/bookings", async (req, res) => {
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
  }

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
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newBookingId = `AI-${dateCode}-${randomSuffix}`;

  const now = new Date().toISOString();
  const newBooking: Booking = {
    id: newBookingId,
    courseId,
    courseTitle,
    totalHours: Number(totalHours) || 1,
    totalDays: Number(totalDays) || 1,
    totalPrice: Number(totalPrice) || 0,
    customer: {
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone,
      lineId: customer.lineId || "",
      notes: customer.notes || "",
      experienceLevel: customer.experienceLevel || "Beginner",
    },
    schedule: schedule.map((s: any, idx: number) => ({
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      dayNumber: s.dayNumber || idx + 1,
    })),
    payment: {
      method: "promptpay",
      amount: Number(totalPrice) || 0,
      status: "pending_slip",
    },
    meetingLink: `https://meet.google.com/ai-${newBookingId.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
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

  res.status(201).json({
    success: true,
    booking: newBooking,
    message: "สร้างรายการจองสำเร็จ กรุณาชำระเงินและแนบสลิปเพื่อยืนยันคิว",
  });
});

// 4. Submit payment slip with automatic AI OCR verification
app.post("/api/bookings/:id/slip", async (req, res) => {
  const bookingId = req.params.id;
  const { slipUrl, referenceNo, manualAmount } = req.body;

  const bookingIndex = bookings.findIndex((b) => b.id === bookingId);
  if (bookingIndex === -1) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
  }

  const booking = bookings[bookingIndex];
  const now = new Date().toISOString();

  let aiVerificationResult: any = {
    detectedAmount: manualAmount || 0,
    detectedDate: new Date().toISOString().slice(0, 16).replace("T", " "),
    detectedRef: referenceNo || `REF-${Math.floor(10000000 + Math.random() * 90000000)}`,
    confidence: 0,
    statusMatch: false,
    notes: "รอการตรวจสอบสลิปโดยผู้ดูแลระบบ (Manual Verification)",
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
  "detectedAmount": ตัวเลขยอดเงินที่โอน (เช่น 990, 5500),
  "detectedDate": "วันเวลาที่โอน เช่น 2026-08-25 14:30",
  "detectedRef": "รหัสอ้างอิงหรือเลขที่ทำรายการ",
  "senderBank": "ธนาคารต้นทาง",
  "receiverName": "ชื่อบัญชีปลายทาง",
  "confidence": ค่าความมั่นใจ 0.0 - 1.0,
  "statusMatch": boolean (true หากสลิปดูถูกต้องน่าเชื่อถือ),
  "notes": "คำอธิบายสรุปสั้นๆ เป็นภาษาไทย"
}
ราคาคอร์สที่คาดหวังคือ ${booking.totalPrice} บาท`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
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

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          aiVerificationResult = {
            ...aiVerificationResult,
            ...parsed,
            statusMatch:
              Math.abs((parsed.detectedAmount || 0) - booking.totalPrice) < 1,
          };
        }
      }
    } catch (err) {
      console.warn("AI Slip analysis error fallback:", err);
    }
  }

  // Update booking
  booking.payment.slipUrl = slipUrl;
  booking.payment.slipUploadedAt = now;
  booking.payment.referenceNo = referenceNo || aiVerificationResult.detectedRef;
  booking.payment.status = "under_review";
  booking.payment.aiVerification = aiVerificationResult;
  booking.updatedAt = now;

  // Auto-confirm if confidence is high and amount matches, or mark under_review
  if (aiVerificationResult.statusMatch && aiVerificationResult.confidence >= 0.9) {
    // We keep it as under_review or confirmed
    booking.payment.status = "confirmed";
    booking.payment.reviewedAt = now;
    booking.payment.reviewNotes = "ระบบ AI ตรวจสอบยอดเงินถูกต้อง อนุมัติคิวอัตโนมัติ";
  }

  // Add Notification
  notifications.unshift({
    id: `notif-${Date.now()}`,
    title: "มีการส่งสลิปชำระเงินใหม่",
    message: `${booking.customer.name} ส่งสลิปยอด ฿${booking.totalPrice.toLocaleString()} (คอร์ส ${booking.courseTitle})`,
    type: "payment",
    timestamp: now,
    isRead: false,
    bookingId: booking.id,
  });

  await saveBooking(booking);
  res.json({
    success: true,
    booking,
    message: "บันทึกสลิปสำเร็จ ระบบทำการตรวจสอบเรียบร้อย",
  });
});

// 5. Admin change booking status (confirm, reject, cancel, complete)
app.post("/api/bookings/:id/status", requireAdmin, async (req, res) => {
  const bookingId = req.params.id;
  const { status, reviewNotes } = req.body;

  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
  }

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
  booking.payment.status = status;
  booking.payment.reviewedAt = now;
  if (reviewNotes !== undefined) {
    booking.payment.reviewNotes = reviewNotes;
  }
  booking.updatedAt = now;

  notifications.unshift({
    id: `notif-${Date.now()}`,
    title: `อัปเดตสถานะคอร์ส: ${status.toUpperCase()}`,
    message: `คิวของ ${booking.customer.name} ถูกเปลี่ยนสถานะเป็น ${status} (${reviewNotes || ""})`,
    type: "review",
    timestamp: now,
    isRead: false,
    bookingId: booking.id,
  });

  await saveBooking(booking);

  res.json({ success: true, booking });
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
    if (dayOfWeek === 0) {
      return res.json({
        date: dateStr,
        isWeekend: true,
        operatingHours: "ปิดทำการ",
        message: "รอบองค์กรเปิดให้บริการวันจันทร์ - เสาร์ (09:00 - 18:00 น.) ปิดวันอาทิตย์",
        slots: [],
      });
    }

    const startHour = 9;
    const endHour = 18;
    const step = duration >= 3 ? (duration === 4 ? 4 : 2) : 1;

    for (let h = startHour; h <= endHour - duration; h += step) {
      const startMinutes = h * 60;
      const endMinutes = (h + duration) * 60;
      const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}`;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

      let isOccupied = false;
      let bookedBy: string | undefined;

      for (const b of bookings) {
        if (b.payment.status === "cancelled" || b.payment.status === "rejected") continue;
        for (const slot of b.schedule) {
          if (slot.date === dateStr && isTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
            isOccupied = true;
            bookedBy = `${b.customer.name.slice(0, 3)}*** (${b.courseTitle})`;
            break;
          }
        }
        if (isOccupied) break;
      }

      availableSlots.push({ startTime, endTime, isOccupied, bookedBy });
    }

    return res.json({
      date: dateStr,
      isWeekend,
      operatingHours: "09:00 - 18:00 (จันทร์-เสาร์ รอบองค์กร)",
      slots: availableSlots,
    });
  }

  if (isWeekend) {
    // Saturday: 10:00 to 23:00, Sunday: 09:00 to 18:00
    const startHour = dayOfWeek === 6 ? 10 : 9;
    const endHour = dayOfWeek === 6 ? 23 : 18;
    const step = duration >= 3 ? (duration === 4 ? 4 : 2) : 1;

    for (let h = startHour; h <= endHour - duration; h += step) {
      const startMinutes = h * 60;
      const endMinutes = (h + duration) * 60;
      const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}`;
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

      // Check conflict
      let isOccupied = false;
      let bookedBy: string | undefined;

      for (const b of bookings) {
        if (b.payment.status === "cancelled" || b.payment.status === "rejected") continue;
        for (const slot of b.schedule) {
          if (slot.date === dateStr && isTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
            isOccupied = true;
            bookedBy = `${b.customer.name.slice(0, 3)}*** (${b.courseTitle})`;
            break;
          }
        }
        if (isOccupied) break;
      }

      availableSlots.push({ startTime, endTime, isOccupied, bookedBy });
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
      let bookedBy: string | undefined;
      for (const b of bookings) {
        if (b.payment.status === "cancelled" || b.payment.status === "rejected") continue;
        for (const slot of b.schedule) {
          if (slot.date === dateStr && isTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
            isOccupied = true;
            bookedBy = `${b.customer.name.slice(0, 3)}*** (${b.courseTitle})`;
            break;
          }
        }
      }
      availableSlots.push({ startTime, endTime, isOccupied, bookedBy });
    } else if (duration === 1) {
      // 1-hour slots: 19:30-20:30, 20:30-21:30, 21:30-22:30
      const times = [
        { startTime: "19:30", endTime: "20:30" },
        { startTime: "20:30", endTime: "21:30" },
        { startTime: "21:30", endTime: "22:30" },
      ];
      for (const t of times) {
        let isOccupied = false;
        let bookedBy: string | undefined;
        for (const b of bookings) {
          if (b.payment.status === "cancelled" || b.payment.status === "rejected") continue;
          for (const slot of b.schedule) {
            if (slot.date === dateStr && isTimeOverlap(t.startTime, t.endTime, slot.startTime, slot.endTime)) {
              isOccupied = true;
              bookedBy = `${b.customer.name.slice(0, 3)}*** (${b.courseTitle})`;
              break;
            }
          }
        }
        availableSlots.push({ ...t, isOccupied, bookedBy });
      }
    }
  }

  res.json({
    date: dateStr,
    isWeekend,
    operatingHours: dayOfWeek === 6 ? "10:00 - 23:00" : isWeekend ? "09:00 - 18:00" : "19:30 - 22:30",
    slots: availableSlots,
  });
});

// 7. Notifications API
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

app.post("/api/notifications/mark-read", (req, res) => {
  notifications = notifications.map((n) => ({ ...n, isRead: true }));
  res.json({ success: true, count: notifications.length });
});

// 8. Gemini Multi-Turn AI Course & Schedule Chatbot
const COURSE_KNOWLEDGE_BASE = `
สถาบัน: Zarntastic AI LEARNING
ผู้สอน: อ.มณีรัตน์ ตั้งโอภาสวิไลสกุล (Zarn / Zarntastic)
- Fastwork Verified Pro AI Specialist (เรตติ้ง 5.0 เต็ม 5 ดาว, รีวิว 128+ รายการ, ผู้เรียน 200+ คน)
- สโลแกน: "Turning Ideas Into Visual Experiences"
- ติดต่อ: LINE Official: @zarntastic (https://lin.ee/NE2vFcZ), โทร: 061-5614269, Email: zarnzarn10@gmail.com
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
  • วันอาทิตย์: 09:00 - 18:00 น.
- คอร์สสดสำหรับองค์กร (Corporate):
  • วันจันทร์ - เสาร์: 09:00 - 18:00 น. (ปิดวันอาทิตย์)
  • มีบริการจัดอบรมนอกสถานที่ / วิทยากรบรรยาย ติดต่อผ่าน LINE: @zarntastic
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
  • เวิร์กช็อปแก้ปัญหาและงานจริงของผู้เรียนแบบ 1:1 กับ อ.มณีรัตน์

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
  - **วันอาทิตย์**: **09:00 - 18:00 น.**

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

โดย **อ.มณีรัตน์ ตั้งโอภาสวิไลสกุล** (Fastwork Verified Pro AI Specialist):
- ออกแบบหลักสูตรเฉพาะทางให้ตรงกับธุรกิจของคุณ (Finance, Real Estate, Retail, Tech, Healthcare)
- เน้นการปฏิบัติจริง (Hands-on Workshop) ให้พนักงานนำเครื่องมือไปเพิ่มผลงานได้ทันที
- ให้บริการทั้งแบบ Online ผ่าน Meet/Zoom และ On-site นอกสถานที่ทั่วประเทศ

📞 **ติดต่อขอใบเสนอราคา / ออกใบกำกับภาษี:**
• **LINE Official**: [@zarntastic](https://lin.ee/NE2vFcZ)
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
หากต้องการเริ่มใช้งาน AI ทันที ขอแนะนำ **AI STARTER (1 ชม. ฿1,500)** หรือ **Claude Personal Workflow (3 ชม. ฿3,900)** ซึ่งได้เรียนสดตัวต่อตัวกับ อ.มณีรัตน์ ถามตอบแก้โจทย์งานจริงได้ทันทีครับ!`,
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
  • ปรึกษาโจทย์งานจริงของคุณโดยตรงกับ อ.มณีรัตน์ (Fastwork 5.0 ★)
  • จบแล้วใช้งานเป็นทันที พร้อมนำไปปรับใช้กับชีวิตประจำวันและการทำงาน

กดปุ่ม **"เลือกจองคอร์สนี้"** ด้านล่างเพื่อเลือกรอบวันเวลาที่สะดวกได้เลยครับ!`,
      suggestedCourseIds: ["live-ai-starter", "live-ai-for-work"],
    };
  }

  // Default general overview
  return {
    reply: `สวัสดีครับ! สถาบัน **Zarntastic AI LEARNING** (โดย อ.มณีรัตน์ ตั้งโอภาสวิไลสกุล) ขอแนะนำ **หลักสูตรเรียนสด Online 1:1 ผ่าน Google Meet (จับมือทำ ปรึกษาโจทย์งานจริง)**:

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
2. อธิบายจุดเด่นของคอร์สเรียนสดเสมอ เช่น เป็นการเรียนแบบจับมือทำ ปรึกษาโจทย์และปัญหาในงานจริงกับ อ.มณีรัตน์ โดยตรง ถามตอบสดตัวต่อตัว และได้คะแนนรีวิว 5.0 เต็มบน Fastwork
3. สำหรับคอร์ส VDO Online ให้แจ้งสั้นๆ ว่าเป็นหลักสูตร Coming Soon (เร็วๆ นี้)
4. ตอบเป็นภาษาไทยที่สุภาพ เป็นมิตร กระชับ น่าเชื่อถือ
5. หากผู้เรียนถามเรื่องตารางเวลาเรียนสด 1:1:
   - บุคคลทั่วไป: วันธรรมดา 19:30-22:30 น. (รอบค่ำ), เสาร์ 10:00-23:00 น., อาทิตย์ 09:00-18:00 น.
   - องค์กร: จันทร์-เสาร์ 09:00-18:00 น.
   - มีบริการวิทยากรนอกสถานที่ (ติดต่อ LINE: @zarntastic หรือ โทร 061-5614269)
6. จัดรูปแบบคำตอบด้วย Markdown ให้อ่านง่าย มี bullet และตัวหนา`;

    // Construct cleanly formatted conversation history for multi-turn chat
    const contentsPayload = formatGeminiContents(messages, userMessage);

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: contentsPayload,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
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

// 9. Simulated Webhook / Line Notification Test
app.post("/api/notifications/test-webhook", (req, res) => {
  const { channel, recipient, message } = req.body;
  res.json({
    success: true,
    sentAt: new Date().toISOString(),
    channel: channel || "LINE Notify",
    recipient: recipient || "Admin Channel",
    previewMessage: `[🔔 แจ้งเตือนคิวนัดหมาย AI Course] ${message || "มีการจองคอร์สใหม่ในระบบ"}`,
  });
});

// Vite Middleware Integration
async function startServer() {
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
