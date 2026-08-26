import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes("{currentView === 'knowledge' && (")) {
  content = content.replace(
    /\{currentView === 'student' && \(/g,
    "{currentView === 'knowledge' && (<main className=\"flex-1 w-full bg-slate-50/50\"><KnowledgeBase /></main>)}\n      {currentView === 'student' && ("
  );
}

fs.writeFileSync('src/App.tsx', content);
