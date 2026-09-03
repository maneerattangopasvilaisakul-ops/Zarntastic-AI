const fs = require('fs');

let content = fs.readFileSync('src/firebase.ts', 'utf8');

if (!content.includes('googleProvider.addScope')) {
  content = content.replace(
    'export const googleProvider = new GoogleAuthProvider();',
    `export const googleProvider = new GoogleAuthProvider();\ngoogleProvider.addScope('https://www.googleapis.com/auth/calendar.events');`
  );
  fs.writeFileSync('src/firebase.ts', content);
  console.log('Firebase scope patched');
}
