import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(
  /\{\/\* Admin View \*\/\}\s*\{currentView === 'admin' && \([\s\S]*?\}\s*\)\}/,
  ""
);
fs.writeFileSync('src/App.tsx', content);
