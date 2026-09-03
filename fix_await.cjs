const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(/await saveBooking/g, 'saveBooking');
server = server.replace(/await saveNotification/g, 'saveNotification');
fs.writeFileSync('server.ts', server);

console.log("Removed awaits");
