const fs = require('fs');
let code = fs.readFileSync('src/utils/scheduleUtils.ts', 'utf8');
code = code.replace(/return Math.max\(s1, s2\) < Math.min\(e1, e2\);/, 'return Math.max(s1, s2) < Math.min(e1, e2);');
fs.writeFileSync('src/utils/scheduleUtils.ts', code);
