const fs = require('fs');
let code = fs.readFileSync('src/data/courses.ts', 'utf8');

const regex = /id: '([^']+)'/g;
let match;
while ((match = regex.exec(code)) !== null) {
  const id = match[1];
  console.log('Found course:', id);
}
