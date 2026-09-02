const fs = require('fs');
let code = fs.readFileSync('src/data/courses.ts.bak', 'utf8');
fs.writeFileSync('src/data/courses.ts', code);
