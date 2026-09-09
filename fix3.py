with open('src/components/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if '<div className="flex flex-wrap items-center gap-2">' in line:
        skip = True
        new_lines.append(line)
        new_lines.append('''
          <button
            onClick={logout}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ
          </button>
          
          <button
            onClick={handleTestEmail}
            disabled={isTestingEmail}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isTestingEmail ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังส่งทดสอบ...</span>
              </>
            ) : (
              <>
                <Mail className="w-3.5 h-3.5" />
                <span>✉️ ทดสอบส่งอีเมล (Gmail)</span>
              </>
            )}
          </button>
        </div>
      </div>
''')
    elif '{emailTestResult && (' in line:
        skip = False
        new_lines.append(line)
    elif not skip:
        new_lines.append(line)

with open('src/components/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
