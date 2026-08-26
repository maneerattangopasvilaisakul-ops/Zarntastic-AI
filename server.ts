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

// Helper: dynamic initial mock bookings
const generateInitialBookings = (): Booking[] => {
  return [];
};

const _unusedOldBookings: any[] = [];
/*
      courseId: "live-ai-starter",
      courseTitle: "AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”",
      totalHours: 1,
      totalDays: 1,
      totalPrice: 1500,
      customer: {
        name: "กิตติพงษ์ ทวีรัตน์",
        email: "kittipong.t@gmail.com",
        phone: "089-123-4567",
        lineId: "kittipong_ai",
        notes: "ต้องการเน้นเรื่อง ChatGPT และ Claude สำหรับงานประจำวัน",
        experienceLevel: "เริ่มต้น (Beginner)",
      },
      schedule: [
        {
          date: getPastDateStr(0),
          startTime: "19:30",
          endTime: "20:30",
          dayNumber: 1,
        },
      ],
      payment: {
        method: "promptpay",
        amount: 1500,
        slipUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80",
        slipUploadedAt: getPastIsoStr(0, 3),
        referenceNo: "BAY-9812401",
        status: "confirmed",
        reviewedAt: getPastIsoStr(0, 1),
        reviewNotes: "สลิปถูกต้อง ยอดเงินตรง ฿1,500 อนุมัติคิวเรียบร้อย",
        aiVerification: {
          detectedAmount: 1500,
          detectedDate: getPastDateStr(0),
          detectedRef: "BAY-9812401",
          confidence: 0.98,
          statusMatch: true,
          notes: "AI ตรวจสอบ: ยอดเงินและบัญชีปลายทางถูกต้อง 100%",
        },
      },
      meetingLink: "https://meet.google.com/zar-ntas-tic",
      createdAt: getPastIsoStr(0, 4),
      updatedAt: getPastIsoStr(0, 1),
    },
    {
      id: "AI-20260825-4410",
      courseId: "live-claude-fastwork",
      courseTitle: "Claude Cowork / ChatGPT Work Automation",
      totalHours: 6,
      totalDays: 2,
      totalPrice: 5500,
      customer: {
        name: "วรรณภา ศิริโชค",
        email: "wannapa.s@corporate.co.th",
        phone: "081-987-6543",
        lineId: "wannapa_wp",
        notes: "ต้องการสร้างระบบอัตโนมัติเชื่อมต่อ SKILL.md",
        experienceLevel: "ปานกลาง (Intermediate)",
      },
      schedule: [
        {
          date: getPastDateStr(0),
          startTime: "20:30",
          endTime: "22:30",
          dayNumber: 1,
        },
        {
          date: getPastDateStr(-1),
          startTime: "20:30",
          endTime: "22:30",
          dayNumber: 2,
        },
      ],
      payment: {
        method: "promptpay",
        amount: 5500,
        slipUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=400&q=80",
        slipUploadedAt: getPastIsoStr(0, 1),
        referenceNo: "SCB-4410291",
        status: "under_review",
        aiVerification: {
          detectedAmount: 5500,
          detectedDate: getPastDateStr(0),
          detectedRef: "SCB-4410291",
          confidence: 0.95,
          statusMatch: true,
          notes: "AI ตรวจสอบ: ยอดเงินตรง ฿5,500 รอ Admin ยืนยัน",
        },
      },
      meetingLink: "https://meet.google.com/zar-ntas-tic",
      createdAt: getPastIsoStr(0, 2),
      updatedAt: getPastIsoStr(0, 1),
    },
    {
      id: "AI-20260824-3321",
      courseId: "live-ai-marketing",
      courseTitle: "AI for Marketing: AI Starter Class",
      totalHours: 1,
      totalDays: 1,
      totalPrice: 1500,
      customer: {
        name: "ธนากร เจริญสุข",
        email: "thanakorn.mkt@gmail.com",
        phone: "086-555-1234",
        lineId: "thanakorn_mkt",
        notes: "อยากประยุกต์ใช้ AI ในการเขียน Content และยิงแอด",
      },
      schedule: [
        {
          date: getPastDateStr(1),
          startTime: "19:30",
          endTime: "20:30",
          dayNumber: 1,
        },
      ],
      payment: {
        method: "bank_transfer",
        amount: 1500,
        slipUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80",
        status: "confirmed",
        reviewedAt: getPastIsoStr(1, 1),
        reviewNotes: "สลิปเรียบร้อย",
      },
      meetingLink: "https://meet.google.com/zar-ntas-tic",
      createdAt: getPastIsoStr(1, 6),
      updatedAt: getPastIsoStr(1, 1),
    },
    {
      id: "AI-20260824-8891",
      courseId: "vdo-ai-starter",
      courseTitle: "Package AI STARTER 1 ชั่วโมง",
      totalHours: 1,
      totalDays: 1,
      totalPrice: 599,
      customer: {
        name: "ชลธิชา วงศ์สุวรรณ",
        email: "chonthicha.w@outlook.com",
        phone: "084-222-3344",
        lineId: "chonthicha_ai",
      },
      schedule: [
        {
          date: getPastDateStr(1),
          startTime: "10:00",
          endTime: "11:00",
          dayNumber: 1,
        },
      ],
      payment: {
        method: "promptpay",
        amount: 599,
        status: "confirmed",
        reviewedAt: getPastIsoStr(1, 2),
      },
      meetingLink: "https://meet.google.com/zar-ntas-tic",
      createdAt: getPastIsoStr(1, 3),
      updatedAt: getPastIsoStr(1, 2),
    },
    {
      id: "AI-20260823-1029",
      courseId: "live-claude-fastwork",
      courseTitle: "Claude Cowork / ChatGPT Work Automation",
      totalHours: 6,
      totalDays: 2,
      totalPrice: 5500,
      customer: {
        name: "ปกรณ์ จันทรา",
        email: "pakorn.j@techcorp.io",
        phone: "092-444-9988",
        lineId: "pakorn_dev",
      },
      schedule: [
        {
          date: getPastDateStr(2),
          startTime: "10:00",
          endTime: "13:00",
          dayNumber: 1,
        },
      ],
      payment: {
        method: "promptpay",
        amount: 5500,
        status: "completed",
        reviewedAt: getPastIsoStr(2, 4),
      },
      meetingLink: "https://meet.google.com/zar-ntas-tic",
      createdAt: getPastIsoStr(2, 8),
      updatedAt: getPastIsoStr(2, 4),
    },
    {
      id: "AI-20260822-7712",
      courseId: "live-ai-starter",
      courseTitle: "AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”",
      totalHours: 1,
      totalDays: 1,
      totalPrice: 1500,
      customer: {
        name: "สมศักดิ์ มหาทรัพย์",
        email: "somsak.m@gmail.com",
        phone: "083-777-6655",
        lineId: "somsak_biz",
      },
      schedule: [
        {
          date: getPastDateStr(3),
          startTime: "14:00",
          endTime: "15:00",
          dayNumber: 1,
        },
      ],
      payment: {
        method: "bank_transfer",
        amount: 1500,
        status: "confirmed",
        reviewedAt: getPastIsoStr(3, 2),
      },
      meetingLink: "https://meet.google.com/zar-ntas-tic",
      createdAt: getPastIsoStr(3, 5),
      updatedAt: getPastIsoStr(3, 2),
    },
    {
      id: "AI-20260821-6643",
      courseId: "vdo-claude-chatgpt",
      courseTitle: "Package Claude Cowork หรือ Chat GPT Work STARTER 1 ชั่วโมง",
      totalHours: 1,
      totalDays: 1,
      totalPrice: 599,
      customer: {
        name: "พิทยา ศรีทอง",
        email: "pittaya.s@gmail.com",
        phone: "089-888-2211",
        lineId: "pittaya_s",
      },
      schedule: [
        {
          date: getPastDateStr(4),
          startTime: "20:00",
          endTime: "21:00",
          dayNumber: 1,
        },
      ],
      payment: {
        method: "promptpay",
        amount: 599,
        status: "confirmed",
      },
      meetingLink: "https://meet.google.com/zar-ntas-tic",
      createdAt: getPastIsoStr(4, 9),
      updatedAt: getPastIsoStr(4, 3),
    },
    {
      id: "AI-20260820-5519",
      courseId: "live-claude-fastwork",
      courseTitle: "Claude Cowork / ChatGPT Work Automation",
      totalHours: 6,
      totalDays: 2,
      totalPrice: 5500,
      customer: {
        name: "ณัฐวุฒิ บุญมี",
        email: "nuttawut.b@startup.th",
        phone: "081-333-7744",
        lineId: "nuttawut_b",
      },
      schedule: [
        {
          date: getPastDateStr(5),
          startTime: "19:30",
          endTime: "22:30",
          dayNumber: 1,
        },
      ],
      payment: {
        method: "promptpay",
        amount: 5500,
        status: "completed",
      },
      meetingLink: "https://meet.google.com/zar-ntas-tic",
      createdAt: getPastIsoStr(5, 7),
      updatedAt: getPastIsoStr(5, 2),
    },
    {
      id: "AI-20260819-4401",
      courseId: "live-ai-starter",
      courseTitle: "AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”",
      totalHours: 1,
      totalDays: 1,
      totalPrice: 1500,
      customer: {
        name: "อภิสิทธิ์ รัตนกุล",
        email: "apisit.r@gmail.com",
        phone: "087-654-3210",
        lineId: "apisit_r",
      },
      schedule: [
        {
          date: getPastDateStr(6),
          startTime: "19:30",
          endTime: "20:30",
          dayNumber: 1,
        },
      ],
      payment: {
        method: "promptpay",
        amount: 1500,
        status: "completed",
      },
      meetingLink: "https://meet.google.com/zar-ntas-tic",
      createdAt: getPastIsoStr(6, 12),
      updatedAt: getPastIsoStr(6, 4),
    },
  ];
};
*/

interface CourseItem {
  id: string;
  title: string;
  titleEn?: string;
  tagline?: string;
  description: string;
  durationCategory?: string;
  categoryGroup?: string;
  totalHours: number;
  totalDays: number;
  hoursPerDay?: number;
  price: number;
  originalPrice?: number;
  level?: string;
  coverImage?: string;
  keyFeatures?: string[];
  targetAudience?: string | string[];
  scheduleRuleNotice?: string;
  recommended?: boolean;
  isActive?: boolean;
}

const defaultCourses: CourseItem[] = [
  {
    id: 'vdo-ai-starter',
    title: 'Package AI STARTER 1 ชั่วโมง',
    titleEn: 'AI Starter VDO Course (1 Hour)',
    tagline: 'เริ่มใช้ AI ให้เป็นภายใน 1 ชั่วโมง',
    description: '“เริ่มใช้ AI ให้เป็นภายใน 1 ชั่วโมง” สำหรับ Chat GPT, Claude, Gemini, NotebookLM, Perplexity, Gamma',
    durationCategory: 'vdo',
    categoryGroup: 'starter',
    totalHours: 1,
    totalDays: 1,
    hoursPerDay: 1,
    price: 599,
    originalPrice: 1500,
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เหมาะกับนักเรียน นักศึกษา พนักงานรัฐและเอกชนที่ต้องการใช้ AI ช่วยให้ทำงานได้เร็วขึ้นและถูกต้อง',
      'เรียนรู้ Chat GPT, Claude, Gemini, NotebookLM, Perplexity, Gamma',
      'เรียนผ่าน VDO Online เรียนได้ทุกวันทุกเวลา'
    ],
    targetAudience: 'นักเรียน นักศึกษา พนักงานรัฐและเอกชน',
    scheduleRuleNotice: 'VDO Online เข้าเรียนได้ตลอด 24 ชม.',
    recommended: true,
    isActive: true,
  },
  {
    id: 'vdo-claude-chatgpt',
    title: 'Package Claude Cowork หรือ Chat GPT Work STARTER 1 ชั่วโมง',
    titleEn: 'Claude Cowork or Chat GPT Work Starter VDO (1 Hour)',
    tagline: 'เริ่มใช้ Claude Cowork หรือ Chat GPT Work',
    description: 'เริ่มใช้ Claude Cowork หรือ Chat GPT Work (เลือก 1 AI) ให้เป็นภายใน 1 ชั่วโมง สำหรับ การสั่งงานอัตโนมัติ การสร้าง ติดตั้ง SKILL.MD, connector, plug in, สร้างระบบ automation',
    durationCategory: 'vdo',
    categoryGroup: 'claude',
    totalHours: 1,
    totalDays: 1,
    hoursPerDay: 1,
    price: 599,
    originalPrice: 1500,
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เหมาะกับนักเรียน นักศึกษา พนักงานรัฐและเอกชนที่ต้องการใช้ Claude Cowork หรือ Chat GPT Work ช่วยสร้างระบบ automation workflow',
      'การสั่งงานอัตโนมัติ การสร้าง ติดตั้ง SKILL.MD, connector, plug in',
      'เรียนผ่าน VDO Online'
    ],
    targetAudience: 'ผู้ต้องการสร้างระบบ automation workflow',
    scheduleRuleNotice: 'VDO Online เข้าเรียนได้ตลอด 24 ชม.',
    isActive: true,
  },
  {
    id: 'vdo-claude-codex',
    title: 'Package Claude Code หรือ Codex STARTER 1 ชั่วโมง',
    titleEn: 'Claude Code or Codex Starter VDO (1 Hour)',
    tagline: 'เริ่มใช้ Claude Code หรือ Codex',
    description: 'เริ่มใช้ Claude Code หรือ codex ให้เป็นภายใน 1 ชั่วโมง สำหรับ การสั่งงานอัตโนมัติ การสร้าง ติดตั้ง SKILL.MD, connector, plug in, สร้างระบบ web app',
    durationCategory: 'vdo',
    categoryGroup: 'web',
    totalHours: 1,
    totalDays: 1,
    hoursPerDay: 1,
    price: 599,
    originalPrice: 1500,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เหมาะกับนักเรียน นักศึกษา พนักงานรัฐและเอกชนที่ต้องการใช้ Claude Code หรือ Codex ช่วยสร้างระบบ web app',
      'การสั่งงานอัตโนมัติ การสร้าง ติดตั้ง SKILL.MD, connector, plug in',
      'เรียนผ่าน VDO Online'
    ],
    targetAudience: 'ผู้ต้องการสร้างระบบ web app',
    scheduleRuleNotice: 'VDO Online เข้าเรียนได้ตลอด 24 ชม.',
    isActive: true,
  },
  {
    id: 'live-ai-starter',
    title: 'AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”',
    titleEn: 'AI Starter Live 1:1 (1 Hour)',
    tagline: 'เริ่มใช้ AI ให้เป็นภายใน 1 ชม.',
    description: 'เรียนสด Online 1:1 ปูพื้นฐานการใช้งาน AI เบื้องต้นให้ใช้งานเป็นทันที (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: 'live',
    categoryGroup: 'starter',
    totalHours: 1,
    totalDays: 1,
    hoursPerDay: 1,
    price: 1500,
    originalPrice: 2500,
    coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 แบบจับมือทำ',
      'ปูพื้นฐานการใช้งาน AI เบื้องต้นให้ใช้งานเป็นทันที',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'ผู้เริ่มต้นใช้งาน AI',
    scheduleRuleNotice: 'จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)',
    recommended: true,
    isActive: true,
  },
  {
    id: 'live-ai-marketing',
    title: 'AI for Marketing: AI Starter Class',
    titleEn: 'AI for Marketing Live 1:1 (1 Hour)',
    tagline: 'เรียนรู้ AI เพื่องานการตลาด',
    description: 'เรียนสด Online 1:1 เน้นการใช้งาน AI สำหรับสายงานการตลาด (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: 'live',
    categoryGroup: 'marketing',
    totalHours: 1,
    totalDays: 1,
    hoursPerDay: 1,
    price: 1500,
    originalPrice: 2500,
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1',
      'ประยุกต์ใช้ AI กับงานการตลาด',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'นักการตลาดและเจ้าของธุรกิจ',
    scheduleRuleNotice: 'จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)',
    isActive: true,
  },
  {
    id: 'live-claude-starter',
    title: 'Claude/Claude Cowork Starter: เริ่มใช้กับงานจริง',
    titleEn: 'Claude/Claude Cowork Starter Live 1:1 (1 Hour)',
    tagline: 'เริ่มใช้กับงานจริง',
    description: 'เรียนสด Online 1:1 ปูพื้นฐานการใช้งาน Claude และ Claude Cowork สำหรับการทำงานจริง (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: '1-day-1h',
    categoryGroup: 'claude',
    totalHours: 1,
    totalDays: 1,
    hoursPerDay: 1,
    price: 1500,
    originalPrice: 2500,
    coverImage: 'https://images.unsplash.com/photo-1684369527664-d450893046f5?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1',
      'โฟกัสที่การใช้งาน Claude และ Claude Cowork',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'ผู้ต้องการใช้ Claude ในการทำงาน',
    scheduleRuleNotice: 'จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)',
    isActive: true,
  },
  {
    id: 'live-ai-productivity',
    title: 'AI WORK PRODUCTIVITY “ใช้ AI ทำงานน่าเบื่อให้เร็วขึ้น”',
    titleEn: 'AI Work Productivity Live 1:1 (3 Hours)',
    tagline: 'ลดงานซ้ำซ้อน เพิ่มผลลัพธ์ด้วย AI',
    description: 'เรียนสด Online 1:1 ระยะเวลา 3 ชั่วโมง ลดงานซ้ำซ้อน เพิ่มผลลัพธ์ด้วย AI ใช้ AI ทำงานน่าเบื่อให้เร็วขึ้น (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: '1-day-3h',
    categoryGroup: 'productivity',
    totalHours: 3,
    totalDays: 1,
    hoursPerDay: 3,
    price: 3900,
    originalPrice: 5900,
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 ระยะเวลา 3 ชั่วโมง',
      'ลดงานซ้ำซ้อน เพิ่มผลลัพธ์ด้วย AI',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'พนักงานออฟฟิศ ผู้บริหาร และผู้ที่ต้องการเพิ่ม Productivity ในการทำงาน',
    scheduleRuleNotice: 'จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)',
    recommended: true,
    isActive: true,
  },
  {
    id: 'live-ai-webapp-antigravity',
    title: 'AI Webapp Builder with Google Antigravity',
    titleEn: 'AI Webapp Builder Live 1:1 (3 Hours)',
    tagline: 'สร้าง Web App ด้วย Google Antigravity',
    description: 'เรียนสด Online 1:1 ระยะเวลา 3 ชั่วโมง สอนสร้าง Web App ด้วย Google Antigravity (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: '1-day-3h',
    categoryGroup: 'web',
    totalHours: 3,
    totalDays: 1,
    hoursPerDay: 3,
    price: 3900,
    originalPrice: 5900,
    coverImage: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 ระยะเวลา 3 ชั่วโมง',
      'สร้าง Web App ด้วย Google Antigravity',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'นักพัฒนาหรือผู้สนใจสร้าง Web Application ด้วย AI',
    scheduleRuleNotice: 'จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)',
    isActive: true,
  },
  {
    id: 'live-claude-cowork-code-agents',
    title: 'Claude Cowork, Claude Code: AI Agents & Skills',
    titleEn: 'Claude Cowork, Claude Code: AI Agents & Skills Live 1:1 (6 Hours / 2 Days)',
    tagline: 'เจาะลึกการใช้ Claude Cowork, Claude Code',
    description: 'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (แบ่ง 2 วัน วันละ 3 ชม.) เจาะลึกการใช้ Claude Cowork, Claude Code, AI Agents & Skills (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: '2-day-6h',
    categoryGroup: 'claude',
    totalHours: 6,
    totalDays: 2,
    hoursPerDay: 3,
    price: 7500,
    originalPrice: 12000,
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (2 วัน วันละ 3 ชม.)',
      'เจาะลึกการใช้ Claude Cowork, Claude Code',
      'สร้าง AI Agents และติดตั้ง Skills',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'ผู้ที่ต้องการใช้งาน Claude และ AI Agents ขั้นสูง',
    scheduleRuleNotice: '2 วัน (วันละ 3 ชม.) จันทร์-ศุกร์ (19.30-22.30) หรือ เสาร์-อาทิตย์ (09.00-18.00)',
    recommended: true,
    isActive: true,
  },
  {
    id: 'live-chatgpt-work-codex-agents',
    title: 'Chat GPT Work & Codex : AI Agents & Skills',
    titleEn: 'Chat GPT Work & Codex : AI Agents & Skills Live 1:1 (6 Hours / 2 Days)',
    tagline: 'เจาะลึกการใช้ Chat GPT Work & Codex',
    description: 'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (แบ่ง 2 วัน วันละ 3 ชม.) เจาะลึกการใช้ Chat GPT Work & Codex, AI Agents & Skills (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: '2-day-6h',
    categoryGroup: 'claude',
    totalHours: 6,
    totalDays: 2,
    hoursPerDay: 3,
    price: 7500,
    originalPrice: 12000,
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (2 วัน วันละ 3 ชม.)',
      'เจาะลึกการใช้ Chat GPT Work & Codex',
      'สร้าง AI Agents & Skills สำหรับระบบงาน',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'ผู้ที่ต้องการนำ ChatGPT Work และ OpenAI Codex มาประยุกต์ใช้ในการทำงานระดับสูง',
    scheduleRuleNotice: '2 วัน (วันละ 3 ชม.) จันทร์-ศุกร์ (19.30-22.30) หรือ เสาร์-อาทิตย์ (09.00-18.00)',
    isActive: true,
  },
  {
    id: 'live-ai-website-lovable',
    title: 'AI Website Builder with Lovable/Codex/ClaudeCode',
    titleEn: 'AI Website Builder Live 1:1 (6 Hours / 2 Days)',
    tagline: 'สร้างเว็บไซต์ด้วย Lovable, Codex, ClaudeCode',
    description: 'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (แบ่ง 2 วัน วันละ 3 ชม.) สอนสร้างเว็บไซต์ด้วยเครื่องมือ AI เช่น Lovable, Codex, ClaudeCode (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: '2-day-6h',
    categoryGroup: 'web',
    totalHours: 6,
    totalDays: 2,
    hoursPerDay: 3,
    price: 7500,
    originalPrice: 12000,
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (2 วัน)',
      'สร้างเว็บด้วย Lovable / Codex / ClaudeCode',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'ผู้ต้องการสร้างเว็บไซต์ด้วย AI',
    scheduleRuleNotice: '2 วัน (วันละ 3 ชม.) จันทร์-ศุกร์ (19.30-22.30) หรือ เสาร์-อาทิตย์ (09.00-18.00)',
    isActive: true,
  },
];

let coursesCatalog: CourseItem[] = [...defaultCourses];

// Initial Mock Bookings containing existing blocked dates requested
const initialBookings: Booking[] = generateInitialBookings();

let bookings: Booking[] = [];
let notifications: NotificationItem[] = [];

interface LineNotificationLog {
  id: string;
  bookingId?: string;
  recipientName: string;
  recipientLineId?: string;
  targetLineUserId?: string;
  eventType: 'booking_created' | 'slip_uploaded' | 'payment_confirmed' | 'status_changed' | 'reminder' | 'test';
  message: string;
  status: 'sent' | 'failed' | 'simulated';
  deliveryMode: 'push' | 'broadcast' | 'simulated';
  timestamp: string;
  details?: {
    courseTitle?: string;
    totalPrice?: number;
    scheduleText?: string;
    meetingLink?: string;
    reviewNotes?: string;
    tokenSource?: 'environment' | 'custom' | 'sandbox';
    flexMessageUsed?: boolean;
    botName?: string;
  };
}

let lineMessagingSettings = {
  enabled: true,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
  adminLineUserId: process.env.LINE_ADMIN_USER_ID || "",
  defaultDeliveryMode: 'auto' as 'auto' | 'push' | 'broadcast',
  useFlexMessage: true,
  notifyOnBookingCreated: true,
  notifyOnSlipUploaded: true,
  notifyOnPaymentConfirmed: true,
  notifyOnStatusChanged: true,
  includeMeetingLink: true,
  botInfo: undefined as any,
};

let lineNotificationLogs: LineNotificationLog[] = [];

// Helper: Build LINE Messaging API Flex Message Bubble
function createBookingFlexBubble(params: {
  booking: Booking;
  eventType: 'booking_created' | 'slip_uploaded' | 'payment_confirmed' | 'status_changed' | 'reminder' | 'test';
  customMessage?: string;
}) {
  const { booking, eventType, customMessage } = params;

  let headerTitle = "แจ้งเตือนคอร์สเรียน AI";
  let headerColor = "#0F172A";
  let badgeText = "Zarntastic AI";

  switch (eventType) {
    case "payment_confirmed":
      headerTitle = "✅ ยืนยันการชำระเงิน & นัดหมาย";
      headerColor = "#059669"; // Emerald Green
      badgeText = "อนุมัติแล้ว";
      break;
    case "slip_uploaded":
      headerTitle = "💸 ได้รับสลิปโอนเงินใหม่";
      headerColor = "#7C3AED"; // Purple
      badgeText = "รอตรวจสอบ";
      break;
    case "booking_created":
      headerTitle = "📝 จองคอร์สเรียน AI สำเร็จ";
      headerColor = "#0284C7"; // Sky Blue
      badgeText = "จองคิวใหม่";
      break;
    case "status_changed":
      headerTitle = `🔄 อัปเดตสถานะ: ${booking.payment.status.toUpperCase()}`;
      headerColor = "#334155";
      badgeText = "สถานะคิว";
      break;
    case "test":
      headerTitle = "🧪 ทดสอบระบบ LINE Messaging API";
      headerColor = "#D97706"; // Amber
      badgeText = "System Test";
      break;
  }

  const scheduleSummary = booking.schedule
    .map((s, idx) => `วันที่ ${idx + 1}: ${s.date} (${s.startTime} - ${s.endTime} น.)`)
    .join("\n");

  const statusLabel =
    booking.payment.status === "confirmed" ? "ชำระเงินสำเร็จ (ยืนยันคิวแล้ว)" :
    booking.payment.status === "under_review" ? "แนบสลิปแล้ว กำลังรอตรวจสอบ" :
    booking.payment.status === "pending_slip" ? "รอชำระเงินและแนบสลิป" :
    booking.payment.status === "rejected" ? "สลิปไม่ผ่านการตรวจสอบ" :
    booking.payment.status === "completed" ? "เรียนจบหลักสูตรแล้ว" : booking.payment.status;

  const flexBubble: any = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: headerColor,
      paddingTop: "16px",
      paddingBottom: "16px",
      paddingStart: "20px",
      paddingEnd: "20px",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: badgeText,
              color: "#FFFFFF",
              size: "xxs",
              weight: "bold",
              flex: 0,
            },
            {
              type: "text",
              text: "Zarntastic AI LEARNING",
              color: "#FFFFFF88",
              size: "xxs",
              align: "end",
            },
          ],
        },
        {
          type: "text",
          text: headerTitle,
          weight: "bold",
          color: "#FFFFFF",
          size: "md",
          margin: "sm",
          wrap: true,
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      paddingAll: "20px",
      contents: [
        {
          type: "text",
          text: booking.courseTitle,
          weight: "bold",
          size: "sm",
          color: "#1E293B",
          wrap: true,
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "รหัสการจอง", size: "xs", color: "#64748B", flex: 3 },
                { type: "text", text: booking.id, size: "xs", color: "#0F172A", weight: "bold", flex: 7 },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "ผู้เรียน", size: "xs", color: "#64748B", flex: 3 },
                { type: "text", text: `คุณ${booking.customer.name}`, size: "xs", color: "#0F172A", weight: "bold", flex: 7 },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "ยอดเงิน", size: "xs", color: "#64748B", flex: 3 },
                { type: "text", text: `฿${booking.totalPrice.toLocaleString()}`, size: "xs", color: "#059669", weight: "bold", flex: 7 },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "สถานะ", size: "xs", color: "#64748B", flex: 3 },
                { type: "text", text: statusLabel, size: "xs", color: "#0F172A", wrap: true, flex: 7 },
              ],
            },
          ],
        },
        {
          type: "separator",
          margin: "md",
        },
        {
          type: "box",
          layout: "vertical",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "🗓️ วันและเวลานัดหมายเรียนสด:",
              size: "xs",
              color: "#334155",
              weight: "bold",
            },
            {
              type: "text",
              text: scheduleSummary,
              size: "xs",
              color: "#475569",
              wrap: true,
              margin: "xs",
            },
          ],
        },
      ],
    },
  };

  // Optional Note from instructor
  if (booking.payment.reviewNotes || customMessage) {
    flexBubble.body.contents.push({
      type: "box",
      layout: "vertical",
      margin: "md",
      backgroundColor: "#F8FAFC",
      paddingAll: "10px",
      cornerRadius: "8px",
      contents: [
        {
          type: "text",
          text: `💬 ข้อความ: ${customMessage || booking.payment.reviewNotes}`,
          size: "xxs",
          color: "#475569",
          wrap: true,
        },
      ],
    });
  }

  // Footer Buttons
  const footerButtons: any[] = [];

  if (booking.payment.status === "confirmed" && booking.meetingLink && lineMessagingSettings.includeMeetingLink) {
    footerButtons.push({
      type: "button",
      style: "primary",
      color: "#059669",
      height: "sm",
      action: {
        type: "uri",
        label: "🎥 เข้าห้องเรียน Google Meet",
        uri: booking.meetingLink,
      },
    });
  }

  footerButtons.push({
    type: "button",
    style: "secondary",
    height: "sm",
    margin: "sm",
    action: {
      type: "uri",
      label: "💬 สอบถามอาจารย์ผู้สอน",
      uri: "https://line.me/R/ti/p/@zarntastic",
    },
  });

  flexBubble.footer = {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    paddingAll: "16px",
    contents: footerButtons,
  };

  return flexBubble;
}

async function dispatchLineNotification(params: {
  booking: Booking;
  eventType: 'booking_created' | 'slip_uploaded' | 'payment_confirmed' | 'status_changed' | 'reminder' | 'test';
  customMessage?: string;
  targetUserId?: string;
}): Promise<LineNotificationLog> {
  const { booking, eventType, customMessage, targetUserId } = params;

  let eventHeader = '';
  switch (eventType) {
    case 'booking_created':
      eventHeader = '📝 [LINE Official] มีการจองคอร์สเรียน AI เข้ามาใหม่';
      break;
    case 'slip_uploaded':
      eventHeader = '💸 [LINE Official] ลูกค้าอัปโหลดสลิปชำระเงินแล้ว (รอตรวจสอบ)';
      break;
    case 'payment_confirmed':
      eventHeader = '✅ [LINE Official] ยืนยันการชำระเงินและคิวนัดหมายสำเร็จ!';
      break;
    case 'status_changed':
      eventHeader = `🔄 [LINE Official] การจองคอร์สเรียน (${booking.payment.status.toUpperCase()})`;
      break;
    case 'test':
      eventHeader = '🧪 [LINE Messaging API] ทดสอบส่งข้อความแจ้งเตือนสำเร็จ';
      break;
    default:
      eventHeader = '📢 [Zarntastic AI Notification]';
  }

  const scheduleLines = booking.schedule.map(s => `• วันที่ ${s.date} เวลา ${s.startTime} - ${s.endTime} น.`).join('\n');
  
  const statusLabel = 
    booking.payment.status === 'confirmed' ? '✅ ยืนยันคิวแล้ว' :
    booking.payment.status === 'under_review' ? '⏳ แนบสลิปแล้ว กำลังรอตรวจสอบ' :
    booking.payment.status === 'pending_slip' ? '⚠️ รอชำระเงินและแนบสลิป' :
    booking.payment.status === 'rejected' ? '❌ สลิปไม่ผ่านการตรวจสอบ' :
    booking.payment.status === 'completed' ? '🎓 เรียนจบหลักสูตรแล้ว' : booking.payment.status;

  let fallbackText = `
${eventHeader}
----------------------------------
📌 รหัสการจอง: ${booking.id}
👤 ชื่อผู้เรียน: คุณ${booking.customer.name}
📱 เบอร์โทร: ${booking.customer.phone || '-'}
💬 LINE ID: ${booking.customer.lineId || '-'}
📚 คอร์ส: ${booking.courseTitle}
⏱️ ระยะเวลา: ${booking.totalDays} วัน (${booking.totalHours} ชั่วโมง)
💰 ยอดชำระ: ฿${booking.totalPrice.toLocaleString()} (${booking.payment.method === 'promptpay' ? 'พร้อมเพย์' : 'โอนผ่านธนาคาร'})
📊 สถานะ: ${statusLabel}
----------------------------------
🗓️ ตารางนัดหมายเรียนสด:
${scheduleLines}`;

  if (booking.payment.status === 'confirmed' && booking.meetingLink && lineMessagingSettings.includeMeetingLink) {
    fallbackText += `\n\n🎥 ลิงก์ห้องเรียน Google Meet:\n${booking.meetingLink}`;
  }

  if (booking.payment.reviewNotes) {
    fallbackText += `\n💬 หมายเหตุจากผู้สอน: ${booking.payment.reviewNotes}`;
  }

  if (customMessage) {
    fallbackText += `\n\n📢 ข้อความเพิ่มเติม:\n${customMessage}`;
  }

  fallbackText += `\n\n🌟 Zarntastic AI LEARNING - อาจารย์มณีรัตน์\nสอบถามเพิ่มเติม LINE: @zarntastic`;

  const activeToken = (lineMessagingSettings.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim();
  const destinationUser = (targetUserId || lineMessagingSettings.adminLineUserId || process.env.LINE_ADMIN_USER_ID || '').trim();
  
  let status: 'sent' | 'failed' | 'simulated' = 'simulated';
  let deliveryMode: 'push' | 'broadcast' | 'simulated' = 'simulated';
  let tokenSource: 'environment' | 'custom' | 'sandbox' = 'sandbox';

  if (activeToken && lineMessagingSettings.enabled) {
    tokenSource = lineMessagingSettings.channelAccessToken ? 'custom' : 'environment';
    
    // Construct LINE Messaging API Messages payload
    const messagesPayload: any[] = [];

    if (lineMessagingSettings.useFlexMessage) {
      const flexBubble = createBookingFlexBubble({ booking, eventType, customMessage });
      messagesPayload.push({
        type: "flex",
        altText: `${eventHeader} - ${booking.courseTitle} (${booking.customer.name})`,
        contents: flexBubble,
      });
    } else {
      messagesPayload.push({
        type: "text",
        text: fallbackText.trim(),
      });
    }

    try {
      let endpoint = 'https://api.line.me/v2/bot/message/broadcast';
      let requestBody: any = { messages: messagesPayload };

      // Check delivery strategy: Push vs Broadcast
      if (destinationUser && (lineMessagingSettings.defaultDeliveryMode === 'push' || lineMessagingSettings.defaultDeliveryMode === 'auto')) {
        endpoint = 'https://api.line.me/v2/bot/message/push';
        requestBody = {
          to: destinationUser,
          messages: messagesPayload,
        };
        deliveryMode = 'push';
      } else {
        endpoint = 'https://api.line.me/v2/bot/message/broadcast';
        requestBody = {
          messages: messagesPayload,
        };
        deliveryMode = 'broadcast';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        status = 'sent';
      } else {
        const errorText = await response.text();
        console.warn('LINE Messaging API Error:', errorText);
        // If push failed due to user ID format, attempt fallback to broadcast or record failure
        status = 'failed';
      }
    } catch (err) {
      console.warn('Failed to call LINE Messaging API:', err);
      status = 'failed';
    }
  }

  const logEntry: LineNotificationLog = {
    id: `line-msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    bookingId: booking.id,
    recipientName: booking.customer.name,
    recipientLineId: booking.customer.lineId,
    targetLineUserId: destinationUser || undefined,
    eventType,
    message: fallbackText.trim(),
    status,
    deliveryMode,
    timestamp: new Date().toISOString(),
    details: {
      courseTitle: booking.courseTitle,
      totalPrice: booking.totalPrice,
      scheduleText: scheduleLines,
      meetingLink: booking.meetingLink,
      reviewNotes: booking.payment.reviewNotes,
      tokenSource,
      flexMessageUsed: lineMessagingSettings.useFlexMessage,
      botName: lineMessagingSettings.botInfo?.displayName || "Zarntastic Bot",
    },
  };

  lineNotificationLogs.unshift(logEntry);
  if (lineNotificationLogs.length > 80) {
    lineNotificationLogs.pop();
  }

  return logEntry;
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

// --- 0. AI Courses Management APIs (CRUD) ---
// Get all active / all courses
app.get("/api/courses", (req, res) => {
  res.json(coursesCatalog);
});

// Add new AI Course
app.post("/api/courses", (req, res) => {
  const {
    title,
    titleEn,
    tagline,
    description,
    durationCategory,
    categoryGroup,
    totalHours,
    totalDays,
    hoursPerDay,
    price,
    originalPrice,
    level,
    coverImage,
    keyFeatures,
    targetAudience,
    scheduleRuleNotice,
    recommended,
  } = req.body;

  if (!title || !description || !totalHours || !totalDays || !price) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลคอร์สที่จำเป็นให้ครบถ้วน (ชื่อ, รายละเอียด, จำนวนวัน, ชั่วโมง, ราคา)" });
  }

  // Generate clean unique ID
  const cleanId = `course-${Date.now().toString().slice(-6)}-${(titleEn || title).toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`;

  const newCourse: CourseItem = {
    id: cleanId,
    title: title.trim(),
    titleEn: titleEn?.trim() || title.trim(),
    tagline: tagline?.trim() || title.trim(),
    description: description.trim(),
    durationCategory: durationCategory || (totalDays === 1 ? '1-day' : '2-day'),
    categoryGroup: categoryGroup || 'starter',
    totalHours: Number(totalHours) || 1,
    totalDays: Number(totalDays) || 1,
    hoursPerDay: Number(hoursPerDay) || Math.ceil((Number(totalHours) || 1) / (Number(totalDays) || 1)),
    price: Number(price) || 0,
    originalPrice: Number(originalPrice) || Number(price) * 1.5,
    level: level || 'เริ่มต้น (Beginner)',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
    keyFeatures: Array.isArray(keyFeatures) ? keyFeatures : [
      `เรียนสด Online 1:1 แบบจับมือทำ (${totalDays} วัน รวม ${totalHours} ชม.)`,
      'เอกสารประกอบการเรียนและ Prompt Template ครบชุด',
      'ปรึกษาและซักถามได้ตลอดการเรียน'
    ],
    targetAudience: targetAudience || 'ผู้ที่ต้องการเรียนรู้และประยุกต์ใช้ AI ในการทำงาน',
    scheduleRuleNotice: scheduleRuleNotice || (Number(totalHours) / Number(totalDays) > 3 
      ? 'สำหรับบุคคลทั่วไป: ต้องเลือกเรียนวันเสาร์-อาทิตย์เท่านั้น (09.00-18.00 น.)' 
      : 'จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)'),
    recommended: Boolean(recommended),
    isActive: true,
  };

  coursesCatalog.unshift(newCourse);

  // Push notification about new course created
  const now = new Date().toISOString();
  notifications.unshift({
    id: `notif-${Date.now()}`,
    title: "✨ เพิ่มคอร์สเรียน AI ใหม่แล้ว",
    message: `หลักสูตร "${newCourse.title}" (${newCourse.totalDays} วัน ${newCourse.totalHours} ชม. | ฿${newCourse.price.toLocaleString()}) ถูกเพิ่มเข้าสู่ระบบแล้ว`,
    type: "system",
    timestamp: now,
    isRead: false,
  });

  res.status(201).json({
    success: true,
    course: newCourse,
    message: "เพิ่มคอร์สเรียน AI ใหม่เรียบร้อยแล้ว",
  });
});

// Edit existing AI Course
app.put("/api/courses/:id", (req, res) => {
  const courseId = req.params.id;
  const courseIndex = coursesCatalog.findIndex((c) => c.id === courseId);

  if (courseIndex === -1) {
    return res.status(404).json({ error: "ไม่พบคอร์สเรียนนี้ในระบบ" });
  }

  const existing = coursesCatalog[courseIndex];
  const {
    title,
    titleEn,
    tagline,
    description,
    durationCategory,
    categoryGroup,
    totalHours,
    totalDays,
    hoursPerDay,
    price,
    originalPrice,
    level,
    coverImage,
    keyFeatures,
    targetAudience,
    scheduleRuleNotice,
    recommended,
    isActive,
  } = req.body;

  const updatedCourse: CourseItem = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    titleEn: titleEn !== undefined ? titleEn.trim() : existing.titleEn,
    tagline: tagline !== undefined ? tagline.trim() : existing.tagline,
    description: description !== undefined ? description.trim() : existing.description,
    durationCategory: durationCategory || existing.durationCategory,
    categoryGroup: categoryGroup || existing.categoryGroup,
    totalHours: totalHours !== undefined ? Number(totalHours) : existing.totalHours,
    totalDays: totalDays !== undefined ? Number(totalDays) : existing.totalDays,
    hoursPerDay: hoursPerDay !== undefined ? Number(hoursPerDay) : existing.hoursPerDay,
    price: price !== undefined ? Number(price) : existing.price,
    originalPrice: originalPrice !== undefined ? Number(originalPrice) : existing.originalPrice,
    level: level || existing.level,
    coverImage: coverImage || existing.coverImage,
    keyFeatures: Array.isArray(keyFeatures) ? keyFeatures : existing.keyFeatures,
    targetAudience: targetAudience || existing.targetAudience,
    scheduleRuleNotice: scheduleRuleNotice || existing.scheduleRuleNotice,
    recommended: recommended !== undefined ? Boolean(recommended) : existing.recommended,
    isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
  };

  coursesCatalog[courseIndex] = updatedCourse;

  // Add system notification
  const now = new Date().toISOString();
  notifications.unshift({
    id: `notif-${Date.now()}`,
    title: "✏️ อัปเดตรายละเอียดคอร์สเรียน",
    message: `ปรับปรุงข้อมูลหลักสูตร "${updatedCourse.title}" เรียบร้อยแล้ว`,
    type: "system",
    timestamp: now,
    isRead: false,
  });

  res.json({
    success: true,
    course: updatedCourse,
    message: "บันทึกการแก้ไขคอร์สเรียนเรียบร้อยแล้ว",
  });
});

// Delete AI Course
app.delete("/api/courses/:id", (req, res) => {
  const courseId = req.params.id;
  const courseIndex = coursesCatalog.findIndex((c) => c.id === courseId);

  if (courseIndex === -1) {
    return res.status(404).json({ error: "ไม่พบคอร์สเรียนนี้ในระบบ" });
  }

  const deleted = coursesCatalog.splice(courseIndex, 1)[0];

  const now = new Date().toISOString();
  notifications.unshift({
    id: `notif-${Date.now()}`,
    title: "🗑️ ลบคอร์สเรียนออกจากระบบ",
    message: `ลบหลักสูตร "${deleted.title}" ออกจากระบบเรียบร้อยแล้ว`,
    type: "system",
    timestamp: now,
    isRead: false,
  });

  res.json({
    success: true,
    deletedId: courseId,
    message: `ลบหลักสูตร "${deleted.title}" สำเร็จ`,
  });
});

// Reset courses catalog to default
app.post("/api/courses/reset", (req, res) => {
  coursesCatalog = [...defaultCourses];
  res.json({
    success: true,
    courses: coursesCatalog,
    message: "รีเซ็ตรายการคอร์สเรียน AI เป็นค่าเริ่มต้นเรียบร้อยแล้ว",
  });
});

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

  // Push detailed notification for instructor / admin
  const scheduleFormatted = newBooking.schedule.map(s => `วันที่ ${s.date} เวลา ${s.startTime}-${s.endTime} น.`).join(', ');
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}`,
    title: "🔔 มีการจองคิวเรียนคอร์ส AI ใหม่เข้ามา!",
    message: `คุณ${newBooking.customer.name} (โทร: ${newBooking.customer.phone || '-'}, LINE: ${newBooking.customer.lineId || '-'}) ได้ทำการจองคอร์ส "${newBooking.courseTitle}" [${newBooking.totalDays} วัน ${newBooking.totalHours} ชม.] | รอบเรียน: ${scheduleFormatted} | ยอดชำระ ฿${newBooking.totalPrice.toLocaleString()}`,
    type: "booking",
    timestamp: now,
    isRead: false,
    bookingId: newBookingId,
  };
  notifications.unshift(newNotif);

  // Auto-dispatch LINE Messaging API alert
  if (lineMessagingSettings.enabled && lineMessagingSettings.notifyOnBookingCreated) {
    dispatchLineNotification({
      booking: newBooking,
      eventType: 'booking_created',
    }).catch(e => console.warn('Line messaging async dispatch error:', e));
  }

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
  const isAutoConfirmed = aiVerificationResult.statusMatch && aiVerificationResult.confidence >= 0.9;
  if (isAutoConfirmed) {
    booking.payment.status = "confirmed";
    booking.payment.reviewedAt = now;
    booking.payment.reviewNotes = "ระบบ AI ตรวจสอบยอดเงินถูกต้อง อนุมัติคิวอัตโนมัติ";
  }

  // Add Notification
  notifications.unshift({
    id: `notif-${Date.now()}`,
    title: isAutoConfirmed ? "✅ อนุมัติสลิปและยืนยันคิวแล้ว (AI Auto-Confirm)" : "มีการส่งสลิปชำระเงินใหม่",
    message: `${booking.customer.name} ส่งสลิปยอด ฿${booking.totalPrice.toLocaleString()} (คอร์ส ${booking.courseTitle})`,
    type: "payment",
    timestamp: now,
    isRead: false,
    bookingId: booking.id,
  });

  // Auto-dispatch LINE Messaging API
  if (lineMessagingSettings.enabled) {
    if (isAutoConfirmed && lineMessagingSettings.notifyOnPaymentConfirmed) {
      dispatchLineNotification({
        booking,
        eventType: 'payment_confirmed',
      }).catch(e => console.warn('Line messaging error:', e));
    } else if (lineMessagingSettings.notifyOnSlipUploaded) {
      dispatchLineNotification({
        booking,
        eventType: 'slip_uploaded',
      }).catch(e => console.warn('Line messaging error:', e));
    }
  }

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

  // Send LINE Messaging API Notification on status change or payment confirmation
  if (lineMessagingSettings.enabled) {
    if (status === 'confirmed' && lineMessagingSettings.notifyOnPaymentConfirmed) {
      dispatchLineNotification({
        booking,
        eventType: 'payment_confirmed',
      }).catch(e => console.warn('Line messaging error:', e));
    } else if (lineMessagingSettings.notifyOnStatusChanged) {
      dispatchLineNotification({
        booking,
        eventType: 'status_changed',
      }).catch(e => console.warn('Line messaging error:', e));
    }
  }

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
  const rawQuery = (userMessage || userGoal || "แนะนำคอร์สที่เหมาะกับฉัน").trim();
  const ai = getAI();

  if (ai) {
    try {
      const prompt = `คุณคือ "AI Course Consultant & Smart Scheduler" ประจำสถาบัน Zarntastic AI LEARNING (ผู้สอน: อ.มณีรัตน์ ตั้งโอภาสวิไลสกุล - Fastwork Verified Pro AI Specialist)

รายชื่อหลักสูตรทั้งหมดของสถาบัน:
[VDO Courses]
1. "Package AI STARTER 1 ชั่วโมง" (1 ชม. | ฿599) - ปูพื้นฐาน ChatGPT, Claude, Gemini, NotebookLM, Perplexity, Gamma
2. "Package Claude Cowork หรือ Chat GPT Work STARTER 1 ชั่วโมง" (1 ชม. | ฿599) - สร้างระบบ Automation & SKILL.MD
3. "Package Claude Code หรือ Codex STARTER 1 ชั่วโมง" (1 ชม. | ฿599) - สร้างระบบ Web App ด้วย AI

[Live 1:1 Courses]
4. "AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”" (1 วัน 1 ชม. | ฿1,500) - เรียนสดจับมือทำ ปูพื้นฐานเริ่มต้น
5. "AI for Marketing: AI Starter Class" (1 วัน 1 ชม. | ฿1,500) - เริ่มต้นประยุกต์ใช้ AI กับงานการตลาด
6. "Claude/Claude Cowork Starter: เริ่มใช้กับงานจริง" (1 วัน 1 ชม. | ฿1,500) - เริ่มต้นใช้ Claude ในการทำงาน
7. "AI WORK PRODUCTIVITY “ใช้ AI ทำงานน่าเบื่อให้เร็วขึ้น”" (1 วัน 3 ชม. | ฿3,900) - ลดงานซ้ำซ้อน เพิ่มผลลัพธ์ด้วย AI
8. "AI Webapp Builder with Google Antigravity" (1 วัน 3 ชม. | ฿3,900) - สร้าง Web App ด้วย Google Antigravity
9. "Claude Cowork, Claude Code: AI Agents & Skills" (2 วัน รวม 6 ชม. วันละ 3 ชม. | ฿7,500) - เจาะลึกการใช้ Claude Cowork, Claude Code, AI Agents & Skills
10. "Chat GPT Work & Codex : AI Agents & Skills" (2 วัน รวม 6 ชม. วันละ 3 ชม. | ฿7,500) - เจาะลึกการใช้ Chat GPT Work & Codex, AI Agents & Skills
11. "AI Website Builder with Lovable/Codex/ClaudeCode" (2 วัน รวม 6 ชม. วันละ 3 ชม. | ฿7,500) - สร้างเว็บไซต์ด้วย AI Tools

เงื่อนไขเวลาเรียน:
- บุคคลทั่วไป: จันทร์-ศุกร์ (19.30 - 22.30 น.) และ เสาร์-อาทิตย์ (09.00 - 18.00 น.)
- องค์กร (Corporate): จันทร์-เสาร์ (09.00 - 18.00 น.) ปิดวันอาทิตย์

คำถาม/เป้าหมายของผู้เรียน: "${rawQuery}"
ระดับพื้นฐาน: ${experienceLevel || "ไม่ระบุ"}
เวลาที่สะดวก: ${availableDays || "ไม่ระบุ"}

กรุณาตอบแนะนำคอร์สที่เหมาะสมที่สุด 1-2 คอร์ส พร้อมบอกจุดเด่น สรุปราคาและระยะเวลา และแนะนำขั้นตอนการจองคิวในระบบอย่างเป็นกันเองและสุภาพ`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      if (response.text && response.text.trim()) {
        return res.json({ reply: response.text.trim() });
      }
    } catch (err: any) {
      console.warn("AI Advisor Gemini API fallback triggered:", err.message);
    }
  }

  // Resilient fallback logic when Gemini is offline, key is missing, or rate limited
  const { generateAdvisorResponse } = await import("./src/utils/aiAdvisorEngine.js").catch(() => 
    import("./src/utils/aiAdvisorEngine")
  );
  const fallbackReply = generateAdvisorResponse(rawQuery);
  res.json({ reply: fallbackReply });
});

// 9. LINE Messaging API Suite (LINE Official Account)
// 9.1 Get LINE Messaging logs
app.get("/api/line/logs", (req, res) => {
  res.json({
    success: true,
    logs: lineNotificationLogs,
    settings: {
      ...lineMessagingSettings,
      hasEnvToken: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
      tokenConfigured: Boolean((lineMessagingSettings.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim()),
    },
  });
});

// 9.2 Clear LINE Messaging logs
app.post("/api/line/logs/clear", (req, res) => {
  lineNotificationLogs = [];
  res.json({ success: true, message: "ล้างประวัติการแจ้งเตือน LINE Messaging API เรียบร้อยแล้ว" });
});

// 9.3 Get current LINE Messaging settings & verify bot
app.get("/api/line/settings", async (req, res) => {
  const activeToken = (lineMessagingSettings.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();
  
  if (activeToken && !lineMessagingSettings.botInfo) {
    try {
      const botRes = await fetch("https://api.line.me/v2/bot/info", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (botRes.ok) {
        lineMessagingSettings.botInfo = await botRes.json();
      }
    } catch (e) {
      console.warn("Failed to fetch LINE Bot info:", e);
    }
  }

  res.json({
    success: true,
    settings: {
      ...lineMessagingSettings,
      hasEnvToken: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
      tokenConfigured: Boolean(activeToken),
    },
  });
});

// 9.4 Update LINE Messaging settings
app.post("/api/line/settings", async (req, res) => {
  const {
    enabled,
    channelAccessToken,
    channelSecret,
    adminLineUserId,
    defaultDeliveryMode,
    useFlexMessage,
    notifyOnBookingCreated,
    notifyOnSlipUploaded,
    notifyOnPaymentConfirmed,
    notifyOnStatusChanged,
    includeMeetingLink,
  } = req.body;

  if (typeof enabled === 'boolean') lineMessagingSettings.enabled = enabled;
  if (typeof channelAccessToken === 'string') lineMessagingSettings.channelAccessToken = channelAccessToken.trim();
  if (typeof channelSecret === 'string') lineMessagingSettings.channelSecret = channelSecret.trim();
  if (typeof adminLineUserId === 'string') lineMessagingSettings.adminLineUserId = adminLineUserId.trim();
  if (defaultDeliveryMode && ['auto', 'push', 'broadcast'].includes(defaultDeliveryMode)) {
    lineMessagingSettings.defaultDeliveryMode = defaultDeliveryMode;
  }
  if (typeof useFlexMessage === 'boolean') lineMessagingSettings.useFlexMessage = useFlexMessage;
  if (typeof notifyOnBookingCreated === 'boolean') lineMessagingSettings.notifyOnBookingCreated = notifyOnBookingCreated;
  if (typeof notifyOnSlipUploaded === 'boolean') lineMessagingSettings.notifyOnSlipUploaded = notifyOnSlipUploaded;
  if (typeof notifyOnPaymentConfirmed === 'boolean') lineMessagingSettings.notifyOnPaymentConfirmed = notifyOnPaymentConfirmed;
  if (typeof notifyOnStatusChanged === 'boolean') lineMessagingSettings.notifyOnStatusChanged = notifyOnStatusChanged;
  if (typeof includeMeetingLink === 'boolean') lineMessagingSettings.includeMeetingLink = includeMeetingLink;

  // Attempt to refresh bot info if token is provided
  const activeToken = (lineMessagingSettings.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();
  if (activeToken) {
    try {
      const botRes = await fetch("https://api.line.me/v2/bot/info", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (botRes.ok) {
        lineMessagingSettings.botInfo = await botRes.json();
      }
    } catch (e) {
      console.warn("Could not verify LINE Bot info:", e);
    }
  }

  res.json({
    success: true,
    settings: {
      ...lineMessagingSettings,
      hasEnvToken: Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN),
      tokenConfigured: Boolean(activeToken),
    },
    message: "บันทึกการตั้งค่า LINE Messaging API สำเร็จ",
  });
});

// 9.5 Get LINE Bot info directly
app.get("/api/line/bot-info", async (req, res) => {
  const activeToken = (lineMessagingSettings.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();
  if (!activeToken) {
    return res.status(400).json({ error: "ยังไม่ได้ระบุ Channel Access Token" });
  }

  try {
    const botRes = await fetch("https://api.line.me/v2/bot/info", {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    if (!botRes.ok) {
      const err = await botRes.text();
      return res.status(botRes.status).json({ error: "LINE API Error: " + err });
    }
    const data = await botRes.json();
    lineMessagingSettings.botInfo = data;
    res.json({ success: true, bot: data });
  } catch (err: any) {
    res.status(500).json({ error: "ไม่สามารถเชื่อมต่อ LINE API: " + err.message });
  }
});

// 9.6 Manually trigger LINE Messaging notification for a booking
app.post("/api/line/notify", async (req, res) => {
  const { bookingId, eventType = "payment_confirmed", customMessage, targetUserId } = req.body;

  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
  }

  try {
    const log = await dispatchLineNotification({
      booking,
      eventType: eventType as any,
      customMessage,
      targetUserId,
    });

    res.json({
      success: true,
      log,
      message: `ส่งข้อความแจ้งเตือนสถานะ (${eventType}) ผ่าน LINE Messaging API สำเร็จ`,
    });
  } catch (err: any) {
    console.error("Line Messaging API manual trigger error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการส่ง LINE Message: " + err.message });
  }
});

// 9.7 Send Test LINE Message
app.post("/api/line/test", async (req, res) => {
  const { testToken, testTargetUserId, message, deliveryMode } = req.body;

  const tokenToUse = (testToken || lineMessagingSettings.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || '').trim();
  const targetUserToUse = (testTargetUserId || lineMessagingSettings.adminLineUserId || process.env.LINE_ADMIN_USER_ID || '').trim();
  
  const sampleBooking: Booking = bookings[0] || {
    id: "AI-TEST-2026",
    courseId: "live-ai-starter",
    courseTitle: "AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”",
    totalHours: 1,
    totalDays: 1,
    totalPrice: 1500,
    customer: {
      name: "ผู้เรียนทดสอบระบบ",
      email: "test@ai-academy.com",
      phone: "089-999-8888",
      lineId: "test_student",
    },
    schedule: [
      {
        date: new Date().toISOString().slice(0, 10),
        startTime: "19:30",
        endTime: "20:30",
        dayNumber: 1,
      },
    ],
    payment: {
      method: "promptpay",
      amount: 1500,
      status: "confirmed",
      reviewNotes: "ทดสอบการเชื่อมต่อ LINE Messaging API (Flex Message)",
    },
    meetingLink: "https://meet.google.com/zar-ntas-tic",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const log = await dispatchLineNotification({
      booking: sampleBooking,
      eventType: "test",
      customMessage: message || "ทดสอบการส่งการแจ้งเตือนรูปแบบ Flex Message ผ่าน LINE Messaging API",
      targetUserId: targetUserToUse || undefined,
    });

    res.json({
      success: true,
      log,
      tokenUsed: Boolean(tokenToUse),
      status: log.status,
      deliveryMode: log.deliveryMode,
      message: log.status === 'sent' 
        ? `ส่งข้อความผ่าน LINE Messaging API สำเร็จ (${log.deliveryMode === 'push' ? 'Push Message ไปยัง ' + (targetUserToUse || 'User') : 'Broadcast Message'})!`
        : log.status === 'simulated'
        ? "บันทึกในระบบจำลองการส่ง LINE Messaging API เรียบร้อย (ใส่ Channel Access Token เพื่อส่งเข้า LINE OA จริง)"
        : "ส่งข้อความไม่สำเร็จ กรุณาตรวจสอบ Channel Access Token หรือ Target User ID",
    });
  } catch (err: any) {
    res.status(500).json({ error: "Test error: " + err.message });
  }
});

// 9.8 LINE Official Account Webhook Endpoint
app.post("/api/line/webhook", async (req, res) => {
  const events = req.body.events || [];
  console.log(`[LINE Webhook] Received ${events.length} event(s)`);

  const activeToken = (lineMessagingSettings.channelAccessToken || process.env.LINE_CHANNEL_ACCESS_TOKEN || "").trim();

  for (const event of events) {
    if (event.type === "message" && event.message?.type === "text" && event.replyToken && activeToken) {
      const userText = (event.message.text || "").trim();
      const replyToken = event.replyToken;

      let replyMessage: any = {
        type: "text",
        text: `สวัสดีครับ! ยินดีต้อนรับสู่สถาบันสอน AI คุณสามารถตรวจสอบคิวเรียนหรือจองคอร์ส AI ได้ผ่านระบบเว็บไซต์ของเราได้ตลอด 24 ชม. ครับ 😊`,
      };

      // If user is inquiring about booking code (e.g., AI-2026...)
      const matchBooking = userText.match(/AI-\d+-\d+/i);
      if (matchBooking) {
        const found = bookings.find(b => b.id.toLowerCase() === matchBooking[0].toLowerCase());
        if (found) {
          replyMessage = {
            type: "flex",
            altText: `ผลการค้นหาการจอง: ${found.id}`,
            contents: createBookingFlexBubble({
              booking: found,
              eventType: found.payment.status === 'confirmed' ? 'payment_confirmed' : 'status_changed',
              customMessage: "ค้นหาข้อมูลการจองผ่าน LINE Official Account สำเร็จ",
            }),
          };
        }
      }

      try {
        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${activeToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            replyToken,
            messages: [replyMessage],
          }),
        });
      } catch (err) {
        console.warn("LINE webhook reply error:", err);
      }
    }
  }

  res.status(200).send("OK");
});

// 10. Simulated Webhook / General Test
app.post("/api/notifications/test-webhook", (req, res) => {
  const { channel, recipient, message } = req.body;
  res.json({
    success: true,
    sentAt: new Date().toISOString(),
    channel: channel || "LINE Messaging API",
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
