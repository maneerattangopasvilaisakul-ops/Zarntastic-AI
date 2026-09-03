const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Disable sendLineNotify inside the booking endpoint
content = content.replace(
  'await sendLineNotify(msg);',
  '// await sendLineNotify(msg); // Disabled to prevent OA broadcast panic'
);

// We can also disable it in the slip endpoint if it's there
if (content.includes('await sendLineNotify(slipMsg);')) {
  content = content.replace(
    'await sendLineNotify(slipMsg);',
    '// await sendLineNotify(slipMsg); // Disabled'
  );
}
// check for any other sendLineNotify
content = content.replace(/await sendLineNotify/g, '// await sendLineNotify');

fs.writeFileSync('server.ts', content);
console.log('Disabled sendLineNotify');

