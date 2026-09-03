const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(/let \/\/ bookedBy/g, '// let bookedBy');
fs.writeFileSync('server.ts', server);
console.log("Fixed let");
