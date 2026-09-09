const fs = require('fs');
const path = 'src/data/courses.ts';
let data = fs.readFileSync(path, 'utf8');

// Replace all occurrences of "originalPrice: 1500," etc.
data = data.replace(/[ \t]*originalPrice:[ \t]*[0-9]+,\n/g, '');

fs.writeFileSync(path, data);
