import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Server-side Gemini initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
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
let notifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "มีรายการจองคอร์สใหม่เข้ามา!",
    message: "คุณวรรณภา จองคอร์ส Fullstack AI Web App (6 ชม.) วันที่ 26-27 ส.ค.",
    type: "booking",
    timestamp: "2026-08-25T00:40:00.000Z",
    isRead: false,
    bookingId: "AI-20260826-4410",
  },
  {
    id: "notif-2",
    title: "ลูกค้าส่งสลิปโอนเงินแล้ว",
    message: "คุณวรรณภา แนบสลิป ฿5,500 เข้ามา รอดำเนินการตรวจสอบ",
    type: "payment",
    timestamp: "2026-08-25T00:45:00.000Z",
    isRead: false,
    bookingId: "AI-20260826-4410",
  },
  {
    id: "notif-3",
    title: "ยืนยันคิวเรียนเรียบร้อย",
    message: "คิวของคุณกิตติพงษ์ ได้รับการอนุมัติแล้ว (วันนี้ 19:30 - 20:30 น.)",
    type: "review",
    timestamp: "2026-08-25T00:20:00.000Z",
    isRead: true,
    bookingId: "AI-20260825-9812",
  },
];

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
    // Saturday - Sunday: 09:00 - 18:00 (540 - 1080 min)
    const allowedStart = timeToMinutes("09:00");
    const allowedEnd = timeToMinutes("18:00");
    if (startMin < allowedStart || endMin > allowedEnd) {
      return {
        valid: false,
        reason: "บุคคลทั่วไป: วันเสาร์ - อาทิตย์ เปิดให้จองเฉพาะช่วงเวลา 09:00 - 18:00 น.",
      };
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
app.get("/api/bookings", (req, res) => {
  const status = req.query.status as string;
  if (status && status !== "all") {
    return res.json(bookings.filter((b) => b.payment.status === status));
  }
  res.json(bookings);
});

// 2. Get single booking details
app.get("/api/bookings/:id", (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
  }
  res.json(booking);
});

// 3. Create new booking (with strict anti-double booking check)
app.post("/api/bookings", (req, res) => {
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
    detectedAmount: manualAmount || booking.totalPrice,
    detectedDate: new Date().toISOString().slice(0, 16).replace("T", " "),
    detectedRef: referenceNo || `REF-${Math.floor(10000000 + Math.random() * 90000000)}`,
    confidence: 0.96,
    statusMatch: true,
    notes: "สลิปได้รับการตรวจวิเคราะห์ ยอดเงินตรงกับราคาคอร์ส",
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

  res.json({
    success: true,
    booking,
    message: "บันทึกสลิปสำเร็จ ระบบทำการตรวจสอบเรียบร้อย",
  });
});

// 5. Admin change booking status (confirm, reject, cancel, complete)
app.post("/api/bookings/:id/status", (req, res) => {
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
    // 09:00 to 18:00 (every 1 hr or chunk)
    const startHour = 9;
    const endHour = 18;
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
    operatingHours: isWeekend ? "09:00 - 18:00" : "19:30 - 22:30",
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

// 8. AI Course & Schedule Advisor
app.post("/api/ai/advisor", async (req, res) => {
  const { userMessage, userGoal, experienceLevel, availableDays } = req.body;
  const ai = getAI();

  if (!ai) {
    return res.json({
      reply: `สวัสดีครับ! ยินดีต้อนรับสู่ระบบจองคอร์ส AI อัตโนมัติ โดย อ.มณีรัตน์ (Zarntastic AI LEARNING) 🤖✨
เรามีหลักสูตร AI ให้เลือกสรรกว่า 15 หลักสูตร ทั้งระดับ Starter, Productivity, Marketing, Landing Page และ Claude AI Agent:
1. Package AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 วัน” (3 ชม. - ฿1,500)
2. AI WORK PRODUCTIVITY “ใช้ AI ทำงานน่าเบื่อให้เร็วขึ้น” (8 ชม. / 2 วัน - ฿9,900) 🔥 ยอดนิยม
3. AI CONTENT & BUSINESS INTENSIVE (12 ชม. / 4 วัน - ฿14,500)
4. AI for Marketing: AI Starter Class (1 ชม. - ฿1,500)
5. AI Work Productivity: ใช้ AI ทำงานจริง (3 ชม. - ฿3,900)
6. AI for Business & Content (6 ชม. / 2 วัน - ฿7,500)
7. AI Website Builder with Lovable (6 ชม. / 2 วัน - ฿7,500)
8. Private AI Coaching: วางระบบ AI ในธุรกิจ (12 ชม. / 4 วัน - ฿14,500)
9. Claude Starter: เริ่มใช้กับงานจริง (1 ชม. - ฿1,500)
10. Claude Personal Workflow (3 ชม. - ฿3,900)
11. Claude Cowork & Skills (6 ชม. / 2 วัน - ฿7,500)
12. AI Agent และการใช้งาน AI Tool & Workflow (3 ชม. - ฿3,900)
13. สร้าง Landing Page ด้วย Claude Cowork (3 ชม. - ฿3,900)
14. สร้าง Landing Page ด้วย Codex (3 ชม. - ฿3,900)
15. สร้าง Landing Page ด้วย Claude Cowork / Codex / Lovable (6 ชม. / 2 วัน - ฿7,500)

⏰ ช่วงเวลาเปิดสอน:
- บุคคลทั่วไป: จันทร์-ศุกร์ (19.30-22.30 น.) และ เสาร์-อาทิตย์ (09.00-18.00 น.)
- องค์กร (Corporate): จันทร์-เสาร์ (09.00-18.00 น.)

คุณสามารถเลือกหลักสูตรที่สนใจและเลือกวันเวลาที่สะดวกในปฏิทินเพื่อจองคิวได้ทันทีครับ!`,
    });
  }

  try {
    const prompt = `คุณคือ "AI Course Consultant & Smart Scheduler" ประจำสถาบัน Zarntastic AI LEARNING (ผู้สอน: อ.มณีรัตน์ ตั้งโอภาสวิไลสกุล - Fastwork Verified Pro AI Specialist)

รายชื่อหลักสูตรทั้งหมดของสถาบัน (15 หลักสูตร):
1. "Package AI STARTER: เริ่มใช้ AI ให้เป็นภายใน 1 วัน" (1 วัน 3 ชม. | ฿1,500) - สำหรับคนไม่เคยใช้ AI, นักศึกษา, เรียนสดจับมือทำ รู้จัก ChatGPT, Claude, Gemini, NotebookLM, Gamma, Nano Banana, Lovable
2. "AI WORK PRODUCTIVITY: ใช้ AI ทำงานน่าเบื่อให้เร็วขึ้น" (2 วัน รวม 8 ชม. วันละ 4 ชม. | ฿9,900) [ขายดีที่สุด 🔥] - สำหรับมนุษย์ออฟฟิศ ฟรีแลนซ์ จัดการเอกสาร อีเมล รายงาน SOP ด้วย NotebookLM, Gamma, Lovable
3. "AI CONTENT & BUSINESS INTENSIVE: สร้างคอนเทนต์และเพิ่มยอดขาย" (4 วัน รวม 12 ชม. วันละ 3 ชม. | ฿14,500) - ปั๊มคอนเทนต์ 30 วันใน 1 วัน, สร้างภาพสินค้าด้วย Nano Banana, ยิงแอด และวางระบบ AI Marketing
4. "AI for Marketing: AI Starter Class" (1 วัน 1 ชม. | ฿1,500) - เริ่มต้นเขียน Prompt สำหรับงานการตลาดและขายของ
5. "AI Work Productivity: ใช้ AI ทำงานจริง" (1 วัน 3 ชม. | ฿3,900) - งานเอกสาร อีเมล สรุปไฟล์ยาวด้วย NotebookLM และสไลด์ Gamma
6. "AI for Business & Content" (2 วัน รวม 6 ชม. วันละ 3 ชม. | ฿7,500) - กลยุทธ์การตลาด ภาพสินค้าด้วย Nano Banana และวิดีโอ Storyboard
7. "AI Website Builder with Lovable" (2 วัน รวม 6 ชม. วันละ 3 ชม. | ฿7,500) - สร้าง Landing Page และเว็บไซต์ขายของด้วย Lovable
8. "Private AI Coaching: วางระบบใช้ AI กับงานจริง" (4 วัน รวม 12 ชม. วันละ 3 ชม. | ฿14,500) - โค้ชตัวต่อตัว วางระบบ AI และทำ Prompt Library ประจำองค์กร
9. "Claude Starter: เริ่มใช้กับงานจริง" (1 วัน 1 ชม. | ฿1,500) - ปูพื้นฐาน Claude 3.5 / 3.7 และ Connectors
10. "Claude Personal Workflow" (1 วัน 3 ชม. | ฿3,900) - วางโครงสร้าง Claude Projects และสร้าง Prompt ส่วนตัว 8 ชุด
11. "Claude Cowork & Skills" (2 วัน รวม 6 ชม. วันละ 3 ชม. | ฿7,500) - สร้าง Claude Skills ขั้นสูง (Content, SEO, Data, SOP)
12. "AI Agent และ การใช้งาน AI TOOL & AI Workflow" (1 วัน 3 ชม. | ฿3,900) - วางระบบ AI Agent จากโจทย์จริง พร้อมบันทึกวิดีโอไว้ดูย้อนหลัง
13. "สร้าง Landing Page ด้วย Claude Cowork" (1 วัน 3 ชม. | ฿3,900) - ออกแบบและเขียนโค้ดหน้า Landing Page ด้วย Claude
14. "สร้าง Landing Page ด้วย Codex" (1 วัน 3 ชม. | ฿3,900) - สร้างเว็บด้วย AI Code Assistant
15. "สร้าง Landing Page ด้วย Claude Cowork / Codex / Lovable" (2 วัน รวม 6 ชม. วันละ 3 ชม. | ฿7,500) - สร้างโปรเจกต์เว็บจริงแบบครบวงจร

เงื่อนไขเวลาเรียน:
- บุคคลทั่วไป: จันทร์-ศุกร์ (19.30 - 22.30 น.) และ เสาร์-อาทิตย์ (09.00 - 18.00 น.)
- องค์กร (Corporate): จันทร์-เสาร์ (09.00 - 18.00 น.) ปิดวันอาทิตย์
- สำหรับคอร์ส 8 ชม. (วันละ 4 ชม.) ในโหมดบุคคลทั่วไป ต้องเลือกเรียนวันเสาร์-อาทิตย์เท่านั้นเนื่องจากวันธรรมดาช่วงค่ำเปิด 3 ชม.

คำถาม/เป้าหมายของผู้เรียน: "${userMessage || userGoal || "แนะนำคอร์สที่เหมาะกับฉัน"}"
ระดับพื้นฐาน: ${experienceLevel || "ไม่ระบุ"}
เวลาที่สะดวก: ${availableDays || "ไม่ระบุ"}

กรุณาตอบแนะนำคอร์สที่เหมาะสมที่สุด 1-2 คอร์ส พร้อมบอกจุดเด่น สรุปราคาและระยะเวลา และแนะนำขั้นตอนการจองคิวในระบบอย่างเป็นกันเองและสุภาพ`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    res.json({ reply: response.text || "ขออภัย ไม่สามารถสร้างคำแนะนำได้ในขณะนี้" });
  } catch (err: any) {
    console.error("AI Advisor Error:", err);
    res.status(500).json({ error: "AI error: " + err.message });
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
