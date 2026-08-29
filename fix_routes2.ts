import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('message: "บันทึกสลิปสำเร็จ ระบบทำการตรวจสอบเรียบร้อย"')) {
    lines.splice(i - 3, 0, '  await saveBooking(booking);');
    i++;
  } else if (lines[i].includes('message: `เปลี่ยนสถานะเป็น ${status} สำเร็จ`')) {
    lines.splice(i - 3, 0, '  await saveBooking(booking);');
    i++;
  }
}

fs.writeFileSync('server.ts', lines.join('\n'));
