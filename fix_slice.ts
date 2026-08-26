import fs from 'fs';

// fix scheduleUtils.ts
let content = fs.readFileSync('src/utils/scheduleUtils.ts', 'utf-8');
content = content.replace(/b\.customer\.name\.slice/g, "(b.customer?.name || 'User').slice");
fs.writeFileSync('src/utils/scheduleUtils.ts', content);

// fix CourseSelector.tsx
let content2 = fs.readFileSync('src/components/CourseSelector.tsx', 'utf-8');
content2 = content2.replace(/course\.topics\.slice/g, "(course.topics || []).slice");
fs.writeFileSync('src/components/CourseSelector.tsx', content2);

// fix App.tsx to ensure all components import correctly and are wrapped
let appContent = fs.readFileSync('src/App.tsx', 'utf-8');
if (!appContent.includes("KnowledgeBase")) {
  console.log("No KnowledgeBase found in App.tsx");
}
