import fs from 'fs';

let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');

// Ensure props include 'knowledge'
content = content.replace(
  /currentView: 'student' \| 'admin';/,
  "currentView: 'student' | 'admin' | 'knowledge';"
);
content = content.replace(
  /onViewChange: \(view: 'student' \| 'admin'\) => void;/,
  "onViewChange: (view: 'student' | 'admin' | 'knowledge') => void;"
);

// We should inject navigation links into the header
const navLinksCode = `
          {/* Main Navigation */}
          <div className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <button 
              onClick={() => onViewChange('student')}
              className={\`text-sm font-semibold transition-colors \${currentView === 'student' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'}\`}
            >
              หน้าแรก
            </button>
            <button 
              onClick={() => onViewChange('knowledge')}
              className={\`text-sm font-semibold transition-colors \${currentView === 'knowledge' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'}\`}
            >
              คลังความรู้
            </button>
          </div>
`;

if (!content.includes('Main Navigation')) {
  content = content.replace(
    /(\{\/\* Contact & Hours Badges \*\/})/,
    navLinksCode + '\n          $1'
  );
}

fs.writeFileSync('src/components/Header.tsx', content);
