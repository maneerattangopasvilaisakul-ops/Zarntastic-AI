import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');
content = content.replace(
  '<div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-2 py-3 lg:py-0 lg:h-20">',
  '<div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-2 py-3 lg:py-0 lg:h-20 pb-4 lg:pb-0">'
);
fs.writeFileSync('src/components/Header.tsx', content);
