const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Replace the disabled sendLineNotify function with one that uses LINE Notify API
const newLineNotifyFn = `async function sendLineNotify(message: string) {
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

content = content.replace(/async function sendLineNotify\([\s\S]*?\}\n/m, newLineNotifyFn + '\\n');

// Restore the commented out sendLineNotify calls
content = content.replace(/\/\/ await sendLineNotify/g, 'await sendLineNotify');
content = content.replace(/ \/\/ Disabled to prevent OA broadcast panic/g, '');
content = content.replace(/ \/\/ Disabled/g, '');

fs.writeFileSync('server.ts', content);
console.log('LINE Notify patched in server.ts');
