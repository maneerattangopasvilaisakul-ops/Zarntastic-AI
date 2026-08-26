import fs from 'fs';

let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');

// Add import for useAuth and AuthModal
if (!content.includes('useAuth')) {
  content = content.replace(
    "import { NotificationItem } from '../types';", 
    "import { NotificationItem } from '../types';\nimport { useAuth } from '../contexts/AuthContext';\nimport { AuthModal } from './AuthModal';"
  );
}

// Add state for auth modal
const authStateCode = `  const [logoError, setLogoError] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);`;

content = content.replace(/const \[logoError, setLogoError\] = useState\(false\);/, authStateCode);

// Add the auth modal to the return statement
content = content.replace(
  /(\s*)(<\/header>)/, 
  `$1  {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}\n$1$2`
);

// Replace the View Mode Switcher block with user dropdown/login logic
const viewModeRegex = /\{\/\* View Mode Switcher \(Student vs Admin\) \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*\{\/\* Mobile Header)/;

const newHeaderControls = `{/* Auth & View Controls */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              {user ? (
                <div className="flex items-center">
                  {isAdmin && (
                    <button
                      onClick={() => onViewChange(currentView === 'admin' ? 'student' : 'admin')}
                      className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all \${
                        currentView === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }\`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{currentView === 'admin' ? 'กลับหน้าแรก' : 'จัดการระบบ'}</span>
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 transition-all ml-1"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ออกจากระบบ</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              )}
            </div>`;

content = content.replace(viewModeRegex, newHeaderControls);

fs.writeFileSync('src/components/Header.tsx', content);
