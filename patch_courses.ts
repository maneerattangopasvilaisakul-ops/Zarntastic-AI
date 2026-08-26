import fs from 'fs';
let content = fs.readFileSync('src/data/courses.ts', 'utf-8');
content = content.replace(
  /'เรียนผ่าน VDO Online ดูย้อนหลังได้ตลอด'/g,
  "'เรียนผ่าน VDO Online เรียนได้ทุกวันทุกเวลา หลังชำระเงินเรียบร้อย Admin จะทำการส่งสิทธิ์เข้า Link VDO ให้ทันที'"
);
fs.writeFileSync('src/data/courses.ts', content);
