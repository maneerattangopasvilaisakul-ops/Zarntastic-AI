const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// replace let bookedBy = ... with nothing, or just find "let bookedBy = false;" and "isOccupied = false"
content = content.replace(/let isOccupied = false;/g, 'let isOccupied = false;\n      let bookedBy: string | undefined = undefined;');
content = content.replace(/let bookedBy = \`\$\{b.customer.name/g, 'bookedBy = \`\$\{b.customer.name');

fs.writeFileSync('server.ts', content);
