const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// replace let isOccupied = false; with let isOccupied = false; let bookedBy = undefined;
content = content.replace(/let isOccupied = false;/g, 'let isOccupied = false;\n      let bookedBy: string | undefined = undefined;');
// replace the availableSlots.push to actually include bookedBy
content = content.replace(/availableSlots\.push\(\{ startTime, endTime, isOccupied \}\);/g, 'availableSlots.push({ startTime, endTime, isOccupied, bookedBy });');
content = content.replace(/availableSlots\.push\(\{ \.\.\.t, isOccupied \}\);/g, 'availableSlots.push({ ...t, isOccupied, bookedBy });');

fs.writeFileSync('server.ts', content);
