import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Ensure knowledge base import
if (!content.includes('KnowledgeBase')) {
  content = content.replace(
    "import { FastworkReviews } from './components/FastworkReviews';",
    "import { FastworkReviews } from './components/FastworkReviews';\nimport { KnowledgeBase } from './components/KnowledgeBase';"
  );
}

// Add the view definition properly if missing
if (!content.includes('currentView === \'knowledge\'')) {
  content = content.replace(
    /\{currentView === 'student' && \(/g,
    "{currentView === 'knowledge' && (<main className=\"flex-1 w-full bg-slate-50/50\"><KnowledgeBase /></main>)}\n      {currentView === 'student' && ("
  );
}

fs.writeFileSync('src/App.tsx', content);
