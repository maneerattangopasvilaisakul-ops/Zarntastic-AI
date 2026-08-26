import fs from 'fs';

let content = fs.readFileSync('src/components/KnowledgeBase.tsx', 'utf-8');
content = content.replace(/export function KnowledgeBase\(\)/, 'export function KnowledgeBase()');
fs.writeFileSync('src/components/KnowledgeBase.tsx', content);
