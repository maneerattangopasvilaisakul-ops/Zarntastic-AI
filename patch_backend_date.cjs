const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');
const target = "  const endMin = timeToMinutes(endTime);\n\n  if (startMin >= endMin) {";
const replacement = `  const endMin = timeToMinutes(endTime);

  // Prevent past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return { valid: false, reason: "ไม่สามารถจองเวลาย้อนหลังได้" };
  }

  if (startMin >= endMin) {`;

if (code.includes("const endMin = timeToMinutes(endTime);")) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched past dates");
}
