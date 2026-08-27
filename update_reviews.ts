import fs from 'fs';

let content = fs.readFileSync('src/data/courses.ts', 'utf-8');

// Replace authors with "ผู้ใช้บริการ" and remove role and company
content = content.replace(/author: '.*',/g, "author: 'ผู้ใช้บริการ (ลูกค้าจริง)',");
content = content.replace(/role: '.*',/g, "");
content = content.replace(/company: '.*',/g, "");

fs.writeFileSync('src/data/courses.ts', content);

let typesContent = fs.readFileSync('src/types.ts', 'utf-8');
typesContent = typesContent.replace(/role: string;/g, "role?: string;");
fs.writeFileSync('src/types.ts', typesContent);
