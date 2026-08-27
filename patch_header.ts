import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf-8');
content = content.replace(
  '          </div>\n          {/* Contact & Hours Badges */}\n          <div className="hidden xl:flex items-center gap-3">',
  `          </div>
          
          {/* Global Search */}
          <div className="hidden md:flex items-center ml-auto mr-4 xl:mr-0 z-10 relative">
            <div className="relative w-48 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange?.(e.target.value);
                  if (currentView !== 'student') {
                    onViewChange('student');
                  }
                }}
                placeholder="ค้นหาหลักสูตร..."
                className="w-full pl-9 pr-8 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Contact & Hours Badges */}
          <div className="hidden xl:flex items-center gap-3 xl:ml-4">`
);
fs.writeFileSync('src/components/Header.tsx', content);
