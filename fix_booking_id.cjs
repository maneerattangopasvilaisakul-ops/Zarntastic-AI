const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Also make sure to add `import crypto from "crypto";` at the top if it's not there,
// but we can just use `crypto.randomUUID()` which is globally available in modern Node.js,
// or use a simple random string generator.
code = code.replace(
  `  // Generate unique booking ID\n  const dateCode = (schedule[0]?.date || new Date().toISOString().slice(0, 10)).replace(/-/g, "");\n  const randomSuffix = Math.floor(1000 + Math.random() * 9000);\n  const newBookingId = \`AI-\${dateCode}-\${randomSuffix}\`;`,
  `  // Generate unique booking ID
  const dateCode = (schedule[0]?.date || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
  // Using crypto.randomUUID() or a long random alphanumeric string for security
  const randomStr = require('crypto').randomBytes(6).toString('hex'); // 12 chars
  const newBookingId = \`AI-\${dateCode}-\${randomStr}\`;`
);

fs.writeFileSync('server.ts', code);
console.log('patched booking ID');
