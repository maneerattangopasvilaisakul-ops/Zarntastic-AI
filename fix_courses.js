const fs = require('fs');
let code = fs.readFileSync('src/data/courses.ts', 'utf8');
code = code.replace(/  },\nexport const FASTWORK_REVIEWS/, '  },\n];\nexport const FASTWORK_REVIEWS');
fs.writeFileSync('src/data/courses.ts', code);
