import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

const statusCode = `
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

  const oldStatus = booking.status;
  booking.status = status;
  booking.reviewNotes = reviewNotes || "";
  booking.updatedAt = new Date().toISOString();

  // If approved and it's a VDO course, send VDO links notification
  if (status === "confirmed" && booking.courseId.startsWith("vdo-") && oldStatus !== "confirmed") {
    // We add a special notification for VDO links
    const notifId = "notif-" + Date.now();
    notifications.unshift({
      id: notifId,
      title: "ชำระเงินสำเร็จ! รับลิงก์เข้าเรียน VDO ของคุณ",
      message: \`คอร์ส \${booking.courseTitle} ของคุณได้รับการอนุมัติแล้ว คุณสามารถเข้าเรียนผ่านลิงก์ VDO ที่แนบมานี้ได้ทันที\`,
      type: "success",
      timestamp: new Date().toISOString(),
      isRead: false,
      link: "/knowledge", // User can maybe see it there or we can include the links in the message, but wait, server doesn't know the links. Let's just create a generic message.
      vdoCourseId: booking.courseId // Include this to fetch links on the frontend
    });
  } else {
    // Normal notification
    const statusMap: Record<string, string> = {
      confirmed: "อนุมัติสลิปและยืนยันคิวแล้ว",
      rejected: "พบปัญหาสลิป/ไม่สามารถยืนยันคิวได้",
      completed: "คอร์สเรียนของคุณเสร็จสิ้นแล้ว",
      cancelled: "ยกเลิกคิวของคุณแล้ว",
    };
    if (statusMap[status]) {
      const typeMap: Record<string, "success"|"info"|"alert"> = {
        confirmed: "success",
        rejected: "alert",
        completed: "info",
        cancelled: "alert",
      };
      
      notifications.unshift({
        id: "notif-" + Date.now(),
        title: "อัปเดตสถานะคอร์สเรียน",
        message: \`คอร์ส \${booking.courseTitle} ของคุณได้รับการอัปเดตเป็น: \${statusMap[status]}\`,
        type: typeMap[status] || "info",
        timestamp: new Date().toISOString(),
        isRead: false,
      });
    }
  }

  res.json({ success: true, booking });
});
`;

// Replace the old block
content = content.replace(/app\.post\("\/api\/bookings\/:id\/status", \(req, res\) => \{[\s\S]*?(?=\/\/ 6\. Get notifications)/, statusCode + '\n\n');

fs.writeFileSync('server.ts', content);

let typesContent = fs.readFileSync('src/types.ts', 'utf-8');
if (!typesContent.includes('vdoCourseId')) {
  typesContent = typesContent.replace(/link\?: string;/g, "link?: string;\n  vdoCourseId?: string;");
  fs.writeFileSync('src/types.ts', typesContent);
}

