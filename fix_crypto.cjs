const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('import crypto')) {
  content = content.replace('import fs from "fs";', 'import fs from "fs";\nimport crypto from "crypto";');
  fs.writeFileSync('server.ts', content);
  console.log("Added crypto import");
}

