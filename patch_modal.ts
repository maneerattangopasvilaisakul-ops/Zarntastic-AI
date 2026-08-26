import fs from 'fs';
let content = fs.readFileSync('src/components/CourseDetailModal.tsx', 'utf-8');

const oldStr = `{course.totalDays === 1 
                ? \`คอร์ส 1 วัน (\${course.totalHours} ชม.)\` 
                : \`คอร์ส \${course.totalDays} วัน (\${course.totalHours} ชม. วันละ \${course.hoursPerDay} ชม.)\`}`;

const newStr = `{course.durationCategory === 'vdo'
                ? 'คอร์ส VDO Online (เวลาอิสระ)'
                : course.totalDays && course.totalHours
                ? course.totalDays === 1
                  ? \`คอร์ส 1 วัน (\${course.totalHours} ชม.)\`
                  : \`คอร์ส \${course.totalDays} วัน (\${course.totalHours} ชม. วันละ \${course.hoursPerDay} ชม.)\`
                : 'คอร์สเรียน (เวลาจัดสรรตามความเหมาะสม)'}`;

content = content.replace(oldStr, newStr);
fs.writeFileSync('src/components/CourseDetailModal.tsx', content);
