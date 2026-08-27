import fs from 'fs';

const content = fs.readFileSync('src/data/courses.ts', 'utf-8');

const newCourses = `
  {
    id: 'vdo-starter',
    title: 'เรียนผ่าน VDO Online (เวลาอิสระ) - Package STARTER (เริ่มต้น)',
    titleEn: 'VDO Online: STARTER Package',
    tagline: 'เริ่มต้นปูพื้นฐาน AI ที่ครอบคลุมทุกเครื่องมือ',
    description: 'เรียนรู้เครื่องมือ AI ระดับเริ่มต้นยอดฮิต ช่วยเพิ่มประสิทธิภาพการทำงานแบบ 10x สำหรับคนเริ่มเรียนรู้',
    durationCategory: 'vdo',
    categoryGroup: 'starter',
    price: 399,
    originalPrice: 799,
    level: 'เริ่มต้น (Beginner)',
    instructor: INSTRUCTOR_INFO,
    isVdoCourse: true,
    coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    keyFeatures: ['เข้าเรียนได้ทุกที่ทุกเวลา', 'ดูย้อนหลังได้ตลอดชีพ', 'อัปเดตเครื่องมือ AI ตัวเริ่มต้น'],
    targetAudience: 'ผู้ที่สนใจเริ่มใช้งาน AI',
    vdoLinks: [
      { title: 'AI STARTER', url: 'https://drive.google.com/drive/folders/1mHm6QXgyjijCeFIf_b0jC9l_zC7imoox?usp=sharing' },
      { title: 'Chat GPT', url: 'https://drive.google.com/drive/folders/1knoRXK--nioyOu0auxA5ipeHte7WesAa?usp=sharing' },
      { title: 'Chat Gemini', url: 'https://drive.google.com/drive/folders/1446zRSx6NViWsXEEiLv3j5iCRYZe0DMR?usp=sharing' },
      { title: 'Claude', url: 'https://drive.google.com/drive/folders/1J3T7H0MAz3HoA12pT4yJ7FjcrWe1lX__?usp=sharing' },
      { title: 'Perplexity', url: 'https://drive.google.com/drive/folders/1Ha7RqAzdmJm1WXY_lShC9XIGkezD_hs3?usp=sharing' },
      { title: 'NotebookLM', url: 'https://drive.google.com/drive/folders/1e0vDzQsgG0OJp9z-gqlWjTJ-vUFxOoq0?usp=sharing' },
      { title: 'Gamma.app', url: 'https://drive.google.com/drive/folders/1EtePnptpoDjAd7Z39oRNdQdZWgQwD2Xx?usp=sharing' },
      { title: 'Google Workspace', url: 'https://drive.google.com/drive/folders/1bgI8y6CL_noBIXQ49ijXe9MQvg7uLFec?usp=sharing' },
      { title: 'Google Flow/Omni/Nano Banana', url: 'https://drive.google.com/drive/folders/1c1zEblABfDc60awI5xfvhsNL-zvsLFjT?usp=sharing' }
    ]
  },
  {
    id: 'vdo-intermediate',
    title: 'เรียนผ่าน VDO Online (เวลาอิสระ) - Package INTERMEDIATE (ระดับกลาง)',
    titleEn: 'VDO Online: INTERMEDIATE Package',
    tagline: 'อัปเกรดทักษะ AI เพิ่มความสามารถระดับมืออาชีพ',
    description: 'เรียนรู้ทักษะ AI เชิงลึกและการเขียนโค้ดเบื้องต้น เพื่อพัฒนา Application ระดับกลาง',
    durationCategory: 'vdo',
    categoryGroup: 'productivity',
    price: 499,
    originalPrice: 999,
    level: 'ปานกลาง (Intermediate)',
    instructor: INSTRUCTOR_INFO,
    isVdoCourse: true,
    coverImage: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    keyFeatures: ['เข้าเรียนได้ทุกที่ทุกเวลา', 'ดูย้อนหลังได้ตลอดชีพ', 'สำหรับพัฒนา Application ด้วย AI'],
    targetAudience: 'ผู้มีพื้นฐานต้องการอัปเกรดทักษะระดับกลาง',
    vdoLinks: [
      { title: 'Chat GPT Work', url: 'https://drive.google.com/drive/folders/1fxG1sP-2Ujj7Dm9B_H3Lni6FLnxgIKEr?usp=sharing' },
      { title: 'Codex', url: 'https://drive.google.com/drive/folders/1hShNxniesF4KX9cFj2AVxnR4lm1FpGT2?usp=sharing' },
      { title: 'Claude Code', url: 'https://drive.google.com/drive/folders/1H5UBvjoGvWoJpBs1Lnq7jzNtYLN7IX8v?usp=sharing' },
      { title: 'Claude Cowork', url: 'https://drive.google.com/drive/folders/1cmRTL-GL77Dtn08XhaC2ZDrRxZZ-POrc?usp=sharing' },
      { title: 'Google Antigravity', url: 'https://drive.google.com/drive/folders/19eaKNfmHJON7GH6Oo0vy1qmcZ5r2Nshg?usp=sharing' },
      { title: 'Google AI Studio', url: 'https://drive.google.com/drive/folders/1eZmQk7HjQ5U1vlkMm4fLKFwjnJvkSmSQ?usp=sharing' },
      { title: 'Loveable', url: 'https://drive.google.com/drive/folders/1k2uKD59iCV2yLQIe2VNicPxxvAT9Nv-w?usp=sharing' }
    ]
  },
  {
    id: 'vdo-advance-1',
    title: 'เรียนผ่าน VDO Online (เวลาอิสระ) - Package Advance 1 (ระดับสูง)',
    titleEn: 'VDO Online: Advance 1 Package',
    tagline: 'สร้าง Web App สมบูรณ์แบบด้วย AI',
    description: 'เรียนรู้และลงมือสร้าง Web Application รูปแบบต่างๆ ทั้งทำ Dashboard, สรุปยอดขาย, จัดการ Stock และอื่นๆ',
    durationCategory: 'vdo',
    categoryGroup: 'web',
    price: 599,
    originalPrice: 1599,
    level: 'ขั้นสูง (Advanced)',
    instructor: INSTRUCTOR_INFO,
    isVdoCourse: true,
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    keyFeatures: ['เข้าเรียนได้ทุกที่ทุกเวลา', 'ดูย้อนหลังได้ตลอดชีพ', 'ตัวอย่างและ Case Study จริง'],
    targetAudience: 'ผู้ต้องการนำ AI มาสร้างและประยุกต์ Web Application แบบจริงจัง',
    vdoLinks: [
      { title: 'สร้าง Web App และ Dashboard วิเคราะห์ข้อมูล รายรับ-รายจ่าย', url: 'https://drive.google.com/drive/folders/1t5lfJkeu8RR7y3Fi9M67n3MxvT4bfvai?usp=sharing' },
      { title: 'สร้าง Web App ทำ Dashboard สรุปยอดขาย', url: 'https://drive.google.com/drive/folders/1OXJKAW8IPsdiko-O4ulQhL1990jgKK3N?usp=sharing' },
      { title: 'สร้าง Web App ทำระบบจัดการ Stock สินค้า', url: 'https://drive.google.com/drive/folders/192PaY_DadKQ9yE4Dxv_TSXcatIHpDfjD?usp=sharing' },
      { title: 'สร้าง Web App จากข้อมูลวิจัย ให้ AI ช่วยสรุปแปลงวิจัยที่เข้าใจยาก', url: 'https://drive.google.com/drive/folders/1cPFXMMBP2iYhwQT65LspCxqm8iOO5nRL?usp=sharing' },
      { title: 'สร้าง Web App ช่วยหาข้อมูลและ เปรียบเทียบราคาสินค้า เป็น Excel', url: 'https://drive.google.com/drive/folders/12d6dR-6UsuVPhPDOztGhbDTdps0iCMrG?usp=sharing' },
      { title: 'สร้าง Web App ออกแบบระบบสร้าง Presentation สวยๆ ด้วย Skill', url: 'https://drive.google.com/drive/folders/1tAlJE2_wJeW_5Uq5brg4aqFVBX57pDcC?usp=sharing' },
      { title: 'สร้าง Web App ออกแบบระบบสรุปสลิปโอนเงิน ออกมาเป็นไฟล์ Excel', url: 'https://drive.google.com/drive/folders/1Ri47oP2J4UqRgRH68ZQ363zqhH2vmhqg?usp=sharing' }
    ]
  },
  {
    id: 'vdo-advance-2',
    title: 'เรียนผ่าน VDO Online (เวลาอิสระ) - Package Advance 2 (ระดับสูง)',
    titleEn: 'VDO Online: Advance 2 Package',
    tagline: 'สร้างสุดยอด AI Agent ครอบคลุมการตลาดยันบัญชี',
    description: 'เรียนรู้และติดตั้ง AI Agents (ทีมการตลาด, บัญชี, วิจัย) ตลอดจนการทำ Landing Page และ Website เพื่อการทำการค้าจริง',
    durationCategory: 'vdo',
    categoryGroup: 'web',
    price: 1099,
    originalPrice: 2599,
    level: 'ขั้นสูง (Advanced)',
    instructor: INSTRUCTOR_INFO,
    isVdoCourse: true,
    coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    keyFeatures: ['เข้าเรียนได้ทุกที่ทุกเวลา', 'ดูย้อนหลังได้ตลอดชีพ', 'ระบบ AI Agents ผู้ช่วยการทำงานในองค์กรจริง'],
    targetAudience: 'ผู้บริหารระดับสูง หรือผู้พัฒนาระบบ AI เพื่อองค์กร',
    vdoLinks: [
      { title: 'สร้าง Landing Page', url: 'https://drive.google.com/drive/folders/1wVoOfB_KyKCmbiYMtZ7cb1t0AGjy84-w?usp=sharing' },
      { title: 'สร้าง Website', url: 'https://drive.google.com/drive/folders/1FBhEJ2SyEZk0dQ850CZeipGIlrBKoqeN?usp=sharing' },
      { title: 'สร้างและติดตั้ง SKILL และ AI Agent ทีมการตลาด', url: 'https://drive.google.com/drive/folders/1ohcNID0xmKPvgmFp3fiq1pld7jPUSpwH?usp=sharing' },
      { title: 'สร้างและติดตั้ง SKILL และ AI Agent ทีมการบัญชี', url: 'https://drive.google.com/drive/folders/1mMa_nhj4_bkPhFE6o0utQGh1BdNrqP7O?usp=sharing' },
      { title: 'สร้างและติดตั้ง SKILL และ AI Agent ทีมวิจัย', url: 'https://drive.google.com/drive/folders/1XpxAHzgPXSccNwzQljGc3m2tdF3aLT44?usp=sharing' }
    ]
  },
`;

const updatedContent = content.replace(
  'export const COURSES: Course[] = [',
  `export const COURSES: Course[] = [${newCourses}`
);

fs.writeFileSync('src/data/courses.ts', updatedContent);
