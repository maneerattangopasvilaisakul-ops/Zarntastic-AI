import fs from 'fs';

function safeReplace(file: string, regex: RegExp, replacement: string) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
}

// Fix titleEn undefined
safeReplace('src/components/CourseSelector.tsx', /c\.titleEn\.toLowerCase\(\)/g, "(c.titleEn || '').toLowerCase()");
safeReplace('src/components/CourseSelector.tsx', /\{course\.titleEn\}/g, "{course.titleEn || ''}");
safeReplace('src/components/CourseDetailModal.tsx', /\{course\.titleEn\}/g, "{course.titleEn || ''}");
safeReplace('src/components/CustomerForm.tsx', /\{course\.titleEn\}/g, "{course.titleEn || ''}");

// Fix schedule rule notice undefined
safeReplace('src/components/CourseDetailModal.tsx', /\{course\.scheduleRuleNotice\}/g, "{course.scheduleRuleNotice || 'ไม่มีข้อมูล'}");
safeReplace('src/components/CourseSelector.tsx', /\{course\.scheduleRuleNotice\}/g, "{course.scheduleRuleNotice || 'ไม่มีข้อมูล'}");

