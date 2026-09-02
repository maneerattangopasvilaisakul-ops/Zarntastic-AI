const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `  const randomStr = require('crypto').randomBytes(6).toString('hex'); // 12 chars`,
  `  const randomStr = crypto.randomUUID().split('-')[0] + crypto.randomUUID().split('-')[1];`
);

fs.writeFileSync('server.ts', code);
console.log('patched booking ID to use crypto.randomUUID');
