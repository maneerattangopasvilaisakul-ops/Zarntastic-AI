import fs from 'fs';
let content = fs.readFileSync('src/data/courses.ts', 'utf-8');
content = content.replace(/author: 'ผู้รีวิวจาก Fastwork',/g, "author: 'นักเรียนจาก Fastwork',");
fs.writeFileSync('src/data/courses.ts', content);
