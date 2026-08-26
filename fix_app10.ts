import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// I need to add the KnowledgeBase conditionally rendered based on currentView == 'knowledge'
// We replace the student view wrapper completely

const targetViewBlock = `<main className="flex-1 w-full relative">`;
if (content.includes(targetViewBlock) && !content.includes("{currentView === 'knowledge'")) {
    const replaceWith = `
      {currentView === 'knowledge' && (
        <main className="flex-1 w-full bg-slate-50/50">
          <KnowledgeBase />
        </main>
      )}
      
      {currentView === 'student' && (
        <main className="flex-1 w-full relative">`;
    
    content = content.replace(targetViewBlock, replaceWith);
    
    const endBlockRegex = /(<FastworkReviews \/>\s*<\/main>)/;
    content = content.replace(endBlockRegex, "$1\n      )}");
}

fs.writeFileSync('src/App.tsx', content);
