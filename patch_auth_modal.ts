import fs from 'fs';
let content = fs.readFileSync('src/components/AuthModal.tsx', 'utf-8');
content = content.replace(
  /<div className="text-center text-xs text-slate-500 mt-4">/,
  `<div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-center">
    <strong>Demo Admin Access:</strong><br />
    Email: admin@zarntastic.com<br />
    Pass: admin1234
  </div>
  <div className="text-center text-xs text-slate-500 mt-4">`
);
fs.writeFileSync('src/components/AuthModal.tsx', content);
