import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Slip route
// Find:
//   const now = new Date().toISOString();
//   let aiVerificationResult: any = {
// Wait, actually let's just find the end of the slip route:
content = content.replace(/booking\.payment\.status = "under_review";\n\s*booking\.payment\.aiVerification = aiVerificationResult;\n\s*booking\.updatedAt = now;\n\s*notifications\.unshift\(([^)]+)\);\n\s*await saveNotification\([^)]+\);\n\s*res\.json\(\{/g, 'booking.payment.status = "under_review";\n  booking.payment.aiVerification = aiVerificationResult;\n  booking.updatedAt = now;\n  notifications.unshift($1);\n  await saveNotification($1);\n  await saveBooking(booking);\n  res.json({');

content = content.replace(/booking\.payment\.status = "pending_slip";\n\s*booking\.updatedAt = now;\n\s*res\.json\(\{/g, 'booking.payment.status = "pending_slip";\n  booking.updatedAt = now;\n  await saveBooking(booking);\n  res.json({');

// 2. Status route
content = content.replace(/booking\.payment\.status = status;\n\s*booking\.payment\.reviewedAt = now;\n\s*if \(reviewNotes\) booking\.payment\.reviewNotes = reviewNotes;\n\s*booking\.updatedAt = now;\n\s*res\.json\(\{/g, 'booking.payment.status = status;\n  booking.payment.reviewedAt = now;\n  if (reviewNotes) booking.payment.reviewNotes = reviewNotes;\n  booking.updatedAt = now;\n  await saveBooking(booking);\n  res.json({');

fs.writeFileSync('server.ts', content);
