const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

// replace all "var bookedBy" with nothing
server = server.replace(/var bookedBy = undefined;/g, '');
// replace "bookedBy =" with "let bookedBy ="
server = server.replace(/isOccupied = true;\n\s+bookedBy = /g, 'isOccupied = true;\n            let bookedBy = ');
// but if we do that, bookedBy won't be accessible when pushed. So we need to declare it properly outside the loop.
// Instead, let's just use `let bookedBy = undefined;` inside the loop that creates slots.
// Actually, let's just replace `availableSlots.push({ startTime, endTime, isOccupied, bookedBy });` with `availableSlots.push({ startTime, endTime, isOccupied });`
// and remove `bookedBy` entirely.
server = server.replace(/, bookedBy \}\);/g, '});');
server = server.replace(/bookedBy = \`\$\{b\.customer/g, '// bookedBy = `${b.customer');

fs.writeFileSync('server.ts', server);
console.log("Fixed bookedBy");
