import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');
if (content.includes("import { KnowledgeBase } from './components/KnowledgeBase';") === false) {
  content = content.replace(
    "import { FastworkReviews } from './components/FastworkReviews';",
    "import { FastworkReviews } from './components/FastworkReviews';\nimport { KnowledgeBase } from './components/KnowledgeBase';"
  );
  fs.writeFileSync('src/App.tsx', content);
}
