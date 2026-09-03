const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

// 1. Add nodemailer import if not present
if (!serverContent.includes('import nodemailer from "nodemailer";')) {
  serverContent = 'import nodemailer from "nodemailer";\n' + serverContent;
}

// 2. Replace lines around let bookings = [...initialBookings] with persistent file-backed DB
const oldStoragePattern = `let bookings: Booking[] = [...initialBookings];
if (db) {
  onSnapshot(collection(db, "bookings"), (snapshot: any) => {
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
      await setDoc(doc(db, "bookings", booking.id), booking);
    } catch (e) {
      console.error("Failed to save booking to Firestore:", e);
    }
  }
}


const initialNotifications: NotificationItem[] = [`;

const newStorageReplacement = `// Permanent File-Backed Persistent Storage for Bookings & Notifications
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings_db.json");
const NOTIFS_FILE = path.join(DATA_DIR, "notifications_db.json");

// Load persistent bookings
let bookings: Booking[] = [];
try {
  if (fs.existsSync(BOOKINGS_FILE)) {
    const raw = fs.readFileSync(BOOKINGS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      bookings = parsed;
      console.log(\`[DB] Loaded \${bookings.length} persistent bookings from \${BOOKINGS_FILE}\`);
    } else {
      bookings = [...initialBookings];
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf8");
    }
  } else {
    bookings = [...initialBookings];
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf8");
    console.log(\`[DB] Initialized bookings_db.json with \${bookings.length} seed bookings\`);
  }
} catch (err) {
  console.error("[DB] Error reading bookings file, fallback to initialBookings:", err);
  bookings = [...initialBookings];
}

function persistBookingsToFile() {
  try {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), "utf8");
  } catch (err) {
    console.error("[DB] Failed to write bookings_db.json:", err);
  }
}

if (db) {
  try {
    onSnapshot(collection(db, "bookings"), (snapshot: any) => {
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
    });
  } catch (e) {
    console.warn("Firestore snapshot listener failed:", e);
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

  if (db) {
    setDoc(doc(db, "bookings", booking.id), booking).catch((e: any) => {
      console.warn("Firestore save warning (local file is safe):", e?.message || e);
    });
  }
}

const initialNotifications: NotificationItem[] = [`;

serverContent = serverContent.replace(oldStoragePattern, newStorageReplacement);

// 3. Replace notifications storage
const oldNotifPattern = `let notifications: NotificationItem[] = [...initialNotifications];

if (db) {
  onSnapshot(collection(db, "notifications"), (snapshot: any) => {
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
      await setDoc(doc(db, "notifications", notif.id), notif);
    } catch (e) {
      console.error("Failed to save notification:", e);
    }
  }
}`;

const newNotifReplacement = `let notifications: NotificationItem[] = [];
try {
  if (fs.existsSync(NOTIFS_FILE)) {
    const raw = fs.readFileSync(NOTIFS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      notifications = parsed;
    } else {
      notifications = [...initialNotifications];
      fs.writeFileSync(NOTIFS_FILE, JSON.stringify(notifications, null, 2), "utf8");
    }
  } else {
    notifications = [...initialNotifications];
    fs.writeFileSync(NOTIFS_FILE, JSON.stringify(notifications, null, 2), "utf8");
  }
} catch (e) {
  notifications = [...initialNotifications];
}

function persistNotifsToFile() {
  try {
    fs.writeFileSync(NOTIFS_FILE, JSON.stringify(notifications, null, 2), "utf8");
  } catch (err) {
    console.error("[DB] Failed to write notifications_db.json:", err);
  }
}

if (db) {
  try {
    onSnapshot(collection(db, "notifications"), (snapshot: any) => {
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
    });
  } catch (e) {
    console.warn("Firestore notifications snapshot warning:", e);
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

  if (db) {
    setDoc(doc(db, "notifications", notif.id), notif).catch((e: any) => {
      console.warn("Firestore save notification warning:", e?.message || e);
    });
  }
}`;

serverContent = serverContent.replace(oldNotifPattern, newNotifReplacement);

// 4. Add Email confirmation functions and endpoints
const emailHelperCode = `
// Email Confirmation Service with Nodemailer
let mailTransporter: any = null;
function getMailTransporter() {
  if (mailTransporter) return mailTransporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    mailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return mailTransporter;
}

function formatThaiDateHelper(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10) + 543;
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      return \`\${d} \${thaiMonths[m - 1]} \${y}\`;
    }
  } catch (e) {}
  return dateStr;
}

async function sendBookingConfirmationEmail(booking: Booking, customNote?: string): Promise<{ success: boolean; mode: string; message: string }> {
  const customerEmail = booking.customer.email;
  if (!customerEmail || !customerEmail.includes('@')) {
    return { success: false, mode: 'none', message: 'อีเมลผู้เรียนไม่ถูกต้อง' };
  }

  const isConfirmed = booking.payment.status === 'confirmed' || booking.payment.status === 'completed';
  const statusText = isConfirmed ? '✅ ยืนยันคิวเรียนเรียบร้อย (อนุมัติแล้ว)' : '⏳ ได้รับการจองและแนบสลิปเรียบร้อย (รอตรวจสอบ)';

  const scheduleListHtml = booking.schedule && booking.schedule.length > 0
    ? booking.schedule.map(s => \`
        <div style="background:#ffffff; padding:14px 18px; border-radius:10px; margin-bottom:10px; border:1px solid #e2e8f0; border-left:5px solid #ea580c;">
          <div style="font-size:12px; font-weight:bold; color:#ea580c; text-transform:uppercase;">วันที่ \${s.dayNumber} ของการเรียน</div>
          <div style="font-size:16px; font-weight:bold; color:#0f172a; margin:4px 0 2px;">📅 \${formatThaiDateHelper(s.date)}</div>
          <div style="color:#64748b; font-size:14px;">⏰ เวลาเรียน: <strong>\${s.startTime} - \${s.endTime} น.</strong></div>
        </div>
      \`).join('')
    : \`<div style="background:#ffffff; padding:14px 18px; border-radius:10px; border:1px solid #e2e8f0; border-left:5px solid #6366f1;">
         <strong style="color:#4338ca;">คอร์สเรียนผ่าน VDO Online:</strong> เรียนตามเวลาที่สะดวก เข้าชมบทเรียนได้ตลอดชีพ
       </div>\`;

  const html = \`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#f8fafc; padding:24px 12px; color:#1e293b; margin:0;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.07); border:1px solid #e2e8f0;">
    
    <!-- Top Header Banner -->
    <div style="background: linear-gradient(135deg, #ea580c 0%, #9a3412 100%); color:#ffffff; padding:32px 24px; text-align:center;">
      <div style="font-size:13px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; color:#fed7aa;">ZARNTASTIC AI LEARNING</div>
      <h1 style="margin:8px 0 0; font-size:24px; font-weight:800; color:#ffffff;">ใบนัดหมายและยืนยันการลงทะเบียน</h1>
      <p style="margin:6px 0 0; font-size:14px; color:#ffedd5;">สถาบันการเรียนรู้ AI แบบตัวต่อตัวและหลักสูตรองค์กร</p>
      <div style="margin-top:16px; display:inline-block; background:rgba(0,0,0,0.3); padding:6px 16px; border-radius:20px; font-size:13px; font-family:monospace; border:1px solid rgba(255,255,255,0.25);">
        รหัสการจอง: <strong style="color:#fde047;">\${booking.id}</strong>
      </div>
    </div>

    <!-- Body Container -->
    <div style="padding:28px 24px;">
      <p style="font-size:16px; margin-top:0; color:#0f172a;">เรียน คุณ <strong>\${booking.customer.name}</strong>,</p>
      <p style="font-size:14px; color:#475569; line-height:1.6;">
        ขอขอบคุณที่เลือกเรียนกับ Zarntastic ระบบได้รับข้อมูลและบันทึกการนัดหมายของคุณเรียบร้อยแล้ว โดยมีรายละเอียดวันเวลาและห้องเรียนออนไลน์ดังนี้:
      </p>

      <!-- Course Info Card -->
      <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:14px; padding:18px 20px; margin:20px 0;">
        <div style="font-size:12px; font-weight:bold; color:#c2410c; text-transform:uppercase;">หลักสูตรที่ลงทะเบียน</div>
        <div style="font-size:18px; font-weight:800; color:#7c2d12; margin-top:4px;">\${booking.courseTitle}</div>
        <div style="font-size:14px; color:#9a3412; margin-top:4px;">
          ยอดชำระ: <strong style="font-size:16px; color:#c2410c;">฿\${booking.totalPrice.toLocaleString()}</strong> 
          <span style="display:inline-block; margin-left:8px; padding:2px 8px; border-radius:6px; background:#ffedd5; font-size:12px; font-weight:bold;">\${statusText}</span>
        </div>
      </div>

      <!-- Schedule Section -->
      <div style="margin-bottom:24px;">
        <h3 style="font-size:15px; font-weight:bold; color:#0f172a; margin:0 0 12px; display:flex; align-items:center;">
          📅 กำหนดการเรียน (วันและเวลา):
        </h3>
        \${scheduleListHtml}
      </div>

      <!-- Google Meet Box -->
      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:14px; padding:20px; margin-bottom:24px; text-align:center;">
        <div style="font-size:12px; font-weight:bold; color:#1e40af; text-transform:uppercase; letter-spacing:0.5px;">ห้องเรียนออนไลน์ (Google Meet)</div>
        <div style="font-size:15px; font-weight:bold; color:#172554; margin:8px 0; word-break:break-all;">
          \${booking.meetingLink}
        </div>
        <a href="\${booking.meetingLink}" style="display:inline-block; background:#2563eb; color:#ffffff; font-weight:bold; font-size:14px; text-decoration:none; padding:11px 24px; border-radius:10px; margin-top:8px;">
          เข้าห้องเรียน Google Meet
        </a>
      </div>

      \${customNote ? \`<div style="background:#f1f5f9; padding:14px 18px; border-radius:10px; font-size:13px; color:#334155; margin-bottom:20px; border-left:4px solid #64748b;"><strong>ข้อความจากอาจารย์ผู้สอน:</strong> \${customNote}</div>\` : ''}

      <!-- Customer Summary -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:24px; font-size:13px; color:#475569;">
        <div style="font-weight:bold; color:#1e293b; margin-bottom:8px;">ข้อมูลผู้เรียนที่บันทึกไว้ในระบบ:</div>
        <div>• <strong>ชื่อผู้เรียน:</strong> \${booking.customer.name}</div>
        <div>• <strong>อีเมล:</strong> \${booking.customer.email}</div>
        <div>• <strong>เบอร์โทร:</strong> \${booking.customer.phone}</div>
        <div>• <strong>LINE ID:</strong> \${booking.customer.lineId}</div>
      </div>

      <!-- Contact Instructor -->
      <div style="border-top:1px solid #e2e8f0; padding-top:20px; font-size:13px; color:#475569; line-height:1.7;">
        <strong style="color:#0f172a;">ช่องทางติดต่อสถาบัน & อาจารย์ผู้สอน:</strong><br/>
        • <strong>อาจารย์มณีรัตน์ ตั้งโอภาสวิไลสกุล (Zarntastic AI)</strong><br/>
        • โทรด่วน: <a href="tel:0615614269" style="color:#ea580c; font-weight:bold; text-decoration:none;">061-5614269</a><br/>
        • LINE ส่วนตัว/Official: <a href="https://line.me/ti/p/N9UPH4OL4L" style="color:#059669; font-weight:bold; text-decoration:none;">คลิกแอด LINE: @zarntastic</a><br/>
        • อีเมล: zarnzarn10@gmail.com
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc; padding:18px 24px; text-align:center; font-size:12px; color:#94a3b8; border-top:1px solid #e2e8f0;">
      © Zarntastic AI Learning. ระบบบันทึกและส่งอีเมลยืนยันการจองคอร์สเรียนอัตโนมัติ
    </div>

  </div>
</body>
</html>
  \`;

  const transporter = getMailTransporter();
  if (transporter) {
    try {
      const fromAddr = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'Zarntastic AI <noreply@zarntastic.com>';
      await transporter.sendMail({
        from: fromAddr,
        to: customerEmail,
        subject: \`🎓 ยืนยันการจองคอร์สเรียน: \${booking.courseTitle} (รหัส \${booking.id})\`,
        html: html,
      });
      console.log(\`[EMAIL] Dispatched confirmation email to \${customerEmail}\`);
      return { success: true, mode: 'smtp_sent', message: \`ส่งอีเมลยืนยันไปยัง \${customerEmail} เรียบร้อยแล้ว\` };
    } catch (err: any) {
      console.error(\`[EMAIL ERROR]\`, err?.message || err);
      return { success: false, mode: 'smtp_error', message: \`เกิดข้อผิดพลาดในการส่งอีเมล: \${err?.message || 'SMTP Error'}\` };
    }
  } else {
    console.log(\`[EMAIL LOGGED] Ready to send to \${customerEmail} for booking \${booking.id}\`);
    return { success: true, mode: 'logged', message: \`จัดเตรียมอีเมลยืนยันไปยัง \${customerEmail} เรียบร้อย\` };
  }
}
`;

// Insert emailHelperCode right before // 1. Get all bookings
serverContent = serverContent.replace(
  '// 1. Get all bookings (with optional status filter)',
  emailHelperCode + '\n// 1. Get all bookings (with optional status filter)'
);

// Add lookup endpoint & send-email endpoint
const additionalEndpoints = `
// Lookup bookings by Phone number, Email, or Booking ID (Student self-service)
app.post("/api/bookings/lookup", (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length < 3) {
    return res.status(400).json({ error: "กรุณาระบุ เบอร์โทรศัพท์, อีเมล หรือ รหัสการจอง เพื่อค้นหา" });
  }

  const cleanQuery = query.trim().toLowerCase().replace(/[^a-z0-9@.-]/g, '');
  const cleanPhone = query.trim().replace(/[^0-9]/g, '');

  const matched = bookings.filter((b) => {
    const idMatch = b.id.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanQuery);
    const emailMatch = b.customer.email.toLowerCase().includes(cleanQuery);
    const phoneClean = b.customer.phone.replace(/[^0-9]/g, '');
    const phoneMatch = cleanPhone.length >= 8 && (phoneClean.includes(cleanPhone) || cleanPhone.includes(phoneClean));
    const nameMatch = b.customer.name.toLowerCase().includes(query.trim().toLowerCase());
    return idMatch || emailMatch || phoneMatch || nameMatch;
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
`;

serverContent = serverContent.replace(
  '// 4. Submit payment slip with automatic AI OCR verification',
  additionalEndpoints + '\n// 4. Submit payment slip with automatic AI OCR verification'
);

// Trigger email when slip is uploaded
serverContent = serverContent.replace(
  'await sendLineNotify(msg2);',
  `await sendLineNotify(msg2);
  // Send Confirmation Email to Customer
  try {
    await sendBookingConfirmationEmail(booking);
  } catch (err) {
    console.warn("Auto email dispatch error:", err);
  }`
);

// Trigger email when admin confirms or updates status
serverContent = serverContent.replace(
  'await sendLineNotify(msg);',
  `await sendLineNotify(msg);
  if (status === 'confirmed' || status === 'completed') {
    try {
      await sendBookingConfirmationEmail(booking, reviewNotes);
    } catch (err) {
      console.warn("Auto confirmation email dispatch error:", err);
    }
  }`
);

fs.writeFileSync('server.ts', serverContent, 'utf8');
console.log("Successfully updated server.ts with persistent file-backed DB and Email confirmation service!");
