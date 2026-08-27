import fs from 'fs';

let content = fs.readFileSync('src/components/NotificationDrawer.tsx', 'utf-8');

// Import COURSES
if (!content.includes('import { COURSES }')) {
  content = content.replace("import { NotificationItem } from '../types';", "import { NotificationItem } from '../types';\nimport { COURSES } from '../data/courses';");
}

const vdoLinkDisplay = `
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {notif.message}
                </p>
                
                {notif.vdoCourseId && COURSES.find(c => c.id === notif.vdoCourseId)?.vdoLinks && (
                  <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm space-y-2">
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      ลิงก์เข้าเรียน VDO Online ของคุณ
                    </div>
                    <ul className="space-y-1.5">
                      {COURSES.find(c => c.id === notif.vdoCourseId)?.vdoLinks?.map((link, idx) => (
                        <li key={idx}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex flex-col p-2 bg-slate-50 hover:bg-cyan-50 rounded border border-slate-100 hover:border-cyan-200 transition-colors group">
                             <span className="text-xs font-semibold text-slate-800 group-hover:text-cyan-700">{link.title}</span>
                             <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{link.url}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
`;

content = content.replace(
  /<p className="text-xs text-slate-600 mt-1 leading-relaxed">[\s\S]*?<\/p>/,
  vdoLinkDisplay
);

fs.writeFileSync('src/components/NotificationDrawer.tsx', content);

