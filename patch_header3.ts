import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');
content = content.replace(
  '          {/* Main Navigation */}\n          <div className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">',
  '          {/* Main Navigation */}\n          <div className="hidden lg:flex items-center gap-6 ml-8 mr-auto">'
);
fs.writeFileSync('src/components/Header.tsx', content);
