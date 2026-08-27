import fs from 'fs';

let content = fs.readFileSync('src/data/courses.ts', 'utf-8');
content = content.replace(/author: 'ผู้ใช้บริการ \(ลูกค้าจริง\)',/g, "author: 'ผู้รีวิวจาก Fastwork',");
fs.writeFileSync('src/data/courses.ts', content);
