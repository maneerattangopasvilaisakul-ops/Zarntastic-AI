const fs = require('fs');
let envExample = fs.readFileSync('.env.example', 'utf8');

if (!envExample.includes('LINE_NOTIFY_TOKEN')) {
  envExample += '\n# LINE Notify API Token (generate from notify-bot.line.me)\nLINE_NOTIFY_TOKEN=\n';
  fs.writeFileSync('.env.example', envExample);
  console.log('Added LINE_NOTIFY_TOKEN to .env.example');
}
