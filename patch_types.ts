import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace("role: 'admin' | 'user';", "role: 'admin' | 'user';\n  token?: string;");
fs.writeFileSync('src/types.ts', content);
