const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

// replace LINE Notify implementation with Messaging API
const oldFn = `// LINE Messaging API Helper
async function sendLineNotify(message: string) {
  const token = process.env.LINE_NOTIFY_TOKEN;
  if (!token) {
    console.log("No LINE_NOTIFY_TOKEN found, skipping notification");
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('message', message);
    await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': \`Bearer \${token}\`
      },
      body: params
    });
  } catch (error) {
    console.error('Error sending LINE Notify:', error);
  }
}`;

const newFn = `// LINE Messaging API Helper (Push Message to Admin only)
async function sendLineNotify(message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_TARGET_ID; // The admin's personal LINE User ID
  if (!token || !to) {
    console.log("No LINE_CHANNEL_ACCESS_TOKEN or LINE_TARGET_ID found, skipping notification");
    return;
  }

  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({
        to: to,
        messages: [{ type: 'text', text: message }]
      })
    });
  } catch (error) {
    console.error('Error sending LINE Messaging API:', error);
  }
}`;

server = server.replace(oldFn, newFn);
fs.writeFileSync('server.ts', server);

// Also remove LINE_NOTIFY_TOKEN from .env.example
let env = fs.readFileSync('.env.example', 'utf8');
env = env.replace(/# LINE Notify API Token[\s\S]*?LINE_NOTIFY_TOKEN=\n/, '');
if (!env.includes('LINE_CHANNEL_ACCESS_TOKEN')) {
  env += '\n# LINE Messaging API (Push to Admin)\nLINE_CHANNEL_ACCESS_TOKEN=\nLINE_TARGET_ID=\n';
}
fs.writeFileSync('.env.example', env);

console.log("Switched to Messaging API");
