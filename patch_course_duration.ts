import fs from 'fs';
let content = fs.readFileSync('src/components/CourseSelector.tsx', 'utf-8');

const oldPill = `<span className={\`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold \${
                      course.totalDays === 1
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : course.totalDays === 2
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }\`}>
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {course.totalDays === 1
                        ? \`เรียน 1 วัน (\${course.totalHours} ชม.)\`
                        : \`เรียน \${course.totalDays} วัน (\${course.totalHours} ชม. วันละ \${course.hoursPerDay} ชม.)\`}
                    </span>`;

const newPill = `
                    {course.durationCategory === 'vdo' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        เรียนผ่าน VDO Online (เวลาอิสระ)
                      </span>
                    ) : course.totalDays && course.totalHours ? (
                      <span className={\`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold \${
                        course.totalDays === 1
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : course.totalDays === 2
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }\`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {course.totalDays === 1
                          ? \`เรียน 1 วัน (\${course.totalHours} ชม.)\`
                          : \`เรียน \${course.totalDays} วัน (\${course.totalHours} ชม. วันละ \${course.hoursPerDay} ชม.)\`}
                      </span>
                    ) : null}`;

content = content.replace(oldPill, newPill);
fs.writeFileSync('src/components/CourseSelector.tsx', content);
