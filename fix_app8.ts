import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = '<main className="flex-1 w-full relative">';
if (content.includes(targetStr) && !content.includes("{currentView === 'knowledge'")) {
    content = content.replace(targetStr, "{currentView === 'knowledge' && (<main className=\"flex-1 w-full bg-slate-50/50\"><KnowledgeBase /></main>)}\n      {currentView === 'student' && (<main className=\"flex-1 w-full relative\">");
    
    // Check if we need to close the view
    if (!content.includes('FastworkReviews />\n        </main>\n      )')) {
        const regex2 = /<FastworkReviews \/>\s*<\/main>/;
        content = content.replace(regex2, "<FastworkReviews />\n        </main>\n      )}");
    }
}

fs.writeFileSync('src/App.tsx', content);
