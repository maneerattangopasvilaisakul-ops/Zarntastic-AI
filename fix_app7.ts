import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /\{currentView === 'student' && \(/g;
if (!content.includes("{currentView === 'knowledge'")) {
    content = content.replace(regex, "{currentView === 'knowledge' && (<main className=\"flex-1 w-full bg-slate-50/50\"><KnowledgeBase /></main>)}\n      {currentView === 'student' && (");
    const regex2 = /<FastworkReviews \/>\s*<\/main>/;
    content = content.replace(regex2, "<FastworkReviews />\n        </main>\n      )}");
}

fs.writeFileSync('src/App.tsx', content);
