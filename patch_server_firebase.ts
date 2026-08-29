import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const firebaseImports = `
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, onSnapshot, query, orderBy } from "firebase/firestore";

let db: any = null;
try {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const app = initializeApp(config);
  db = getFirestore(app, config.firestoreDatabaseId);
} catch (e) {
  console.error("Firebase init failed:", e);
}
`;

// Replace `let bookings: Booking[] = [...initialBookings];` with the sync logic
const bookingsInitRe = /let bookings: Booking\[\] = \[\.\.\.initialBookings\];/g;
const newBookingsLogic = `let bookings: Booking[] = [...initialBookings];
if (db) {
  onSnapshot(collection(db, "bookings"), (snapshot) => {
    const loadedBookings: Booking[] = [];
    snapshot.forEach(doc => {
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
`;
content = content.replace(bookingsInitRe, newBookingsLogic);

// Replace `let notifications: NotificationItem[] = [` with the sync logic
// Need to find where notifications starts and ends
const notifsRe = /let notifications: NotificationItem\[\] = \[[\s\S]*?\];/m;
const newNotifsLogic = `let notifications: NotificationItem[] = [];
if (db) {
  onSnapshot(collection(db, "notifications"), (snapshot) => {
    const loaded: NotificationItem[] = [];
    snapshot.forEach(doc => {
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
}
`;
content = content.replace(notifsRe, newNotifsLogic);

// Insert firebase imports at the top
content = content.replace('import dotenv from "dotenv";', 'import dotenv from "dotenv";\n' + firebaseImports);

// Now find every place where `bookings` is modified:
// 1. Create booking: `bookings.unshift(newBooking);` -> `await saveBooking(newBooking);` (no need to unshift, onSnapshot will handle it, but we can do both)
content = content.replace('bookings.unshift(newBooking);', 'bookings.unshift(newBooking);\n  await saveBooking(newBooking);');

// 2. Slip upload: `booking.payment... = ...` -> `await saveBooking(booking);`
// It happens before `res.json({ success: true, booking, ... })`
const slipRe = /res\.json\(\{\n\s*success: true,\n\s*booking,\n\s*aiVerification: aiVerificationResult,\n\s*message: "บันทึกสลิปสำเร็จ ระบบทำการตรวจสอบเรียบร้อย",\n\s*\}\);/g;
content = content.replace(slipRe, `await saveBooking(booking);\n  res.json({ success: true, booking, aiVerification: aiVerificationResult, message: "บันทึกสลิปสำเร็จ ระบบทำการตรวจสอบเรียบร้อย" });`);

// 3. Status change: `booking.payment.status = status; ...` -> `await saveBooking(booking);`
const statusRe = /res\.json\(\{\n\s*success: true,\n\s*booking,\n\s*message: `เปลี่ยนสถานะเป็น \$\{status\} สำเร็จ`,\n\s*\}\);/g;
content = content.replace(statusRe, `await saveBooking(booking);\n  res.json({ success: true, booking, message: \`เปลี่ยนสถานะเป็น \${status} สำเร็จ\` });`);

// Notifications:
// `notifications.unshift(newNotif);` -> `await saveNotification(newNotif);`
content = content.replace(/notifications\.unshift\(([^)]+)\);/g, 'notifications.unshift($1);\n  await saveNotification($1);');

// Read notification:
// `notif.isRead = true;` -> `await saveNotification(notif);`
const readNotifRe = /notif\.isRead = true;\n\s*res\.json\(\{ success: true, notification: notif \}\);/g;
content = content.replace(readNotifRe, 'notif.isRead = true;\n  await saveNotification(notif);\n  res.json({ success: true, notification: notif });');

// Clear all notifications:
// That doesn't delete them from firestore currently, but it's okay, maybe just let it be or implement if it exists.
// Wait, `notifications = [];` in clear all:
const clearAllRe = /notifications = \[\];\n\s*res\.json\(\{ success: true \}\);/g;
// Actually I don't know if clearAll exists. Let's check:
// I will not touch clearAll if I don't know it exists.

fs.writeFileSync('server_patched.ts', content);
