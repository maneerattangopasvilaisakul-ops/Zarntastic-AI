import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Update type of currentView to include 'knowledge'
content = content.replace(
  /const \[currentView, setCurrentView\] = useState<'student' \| 'admin'>\('student'\);/,
  "const [currentView, setCurrentView] = useState<'student' | 'admin' | 'knowledge'>('student');"
);

// Import KnowledgeBase if not imported
if (!content.includes('KnowledgeBase')) {
  content = content.replace(
    "import { FastworkReviews } from './components/FastworkReviews';",
    "import { FastworkReviews } from './components/FastworkReviews';\nimport { KnowledgeBase } from './components/KnowledgeBase';"
  );
}

// Render KnowledgeBase conditionally
const knowledgeViewCode = `
      {/* Knowledge Base View */}
      {currentView === 'knowledge' && (
        <main className="flex-1 w-full bg-slate-50/50">
          <KnowledgeBase />
        </main>
      )}
`;

if (!content.includes('Knowledge Base View')) {
  content = content.replace(
    /(<main className="flex-1 w-full relative">)/,
    knowledgeViewCode + '\n      {/* Student View */}\n      {currentView === \'student\' && $1'
  );
  
  // Close the Student view condition block
  content = content.replace(
    /(<FastworkReviews \/>\s*<\/main>)/,
    '$1\n      )}'
  );
}

fs.writeFileSync('src/App.tsx', content);
