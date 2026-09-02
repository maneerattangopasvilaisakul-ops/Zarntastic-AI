const fs = require('fs');
let code = fs.readFileSync('src/utils/scheduleUtils.ts', 'utf8');

// The bug is that we are generating overlapping slots if step is 1
// For durationHours === 3, if step is 1, it will generate 09:00-12:00, 10:00-13:00, 11:00-14:00 etc.
// We should use step = durationHours or specify specific start times.

code = code.replace(/const step = durationHours >= 3 \? \(durationHours === 4 \? 4 : 2\) : 1;/g, 'const step = durationHours;');

fs.writeFileSync('src/utils/scheduleUtils.ts', code);
