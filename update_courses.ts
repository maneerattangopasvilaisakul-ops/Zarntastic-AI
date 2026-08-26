import fs from 'fs';

const coursesCode = `export const COURSES: Course[] = [
  // --- VDO Online Courses ---
  {
    id: 'vdo-ai-starter',
    title: 'Package AI STARTER 1 ชั่วโมง',
    titleEn: 'AI Starter VDO Course (1 Hour)',
    tagline: 'เริ่มใช้ AI ให้เป็นภายใน 1 ชั่วโมง',
    description: '“เริ่มใช้ AI ให้เป็นภายใน 1 ชั่วโมง” สำหรับ Chat GPT, Claude, Gemini, NotebookLM, Perplexity, Gamma',
    durationCategory: 'vdo',
    categoryGroup: 'starter',
    price: 599,
    originalPrice: 1500,
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เหมาะกับนักเรียน นักศึกษา พนักงานรัฐและเอกชนที่ต้องการใช้ AI ช่วยให้ทำงานได้เร็วขึ้นและถูกต้อง',
      'เรียนรู้ Chat GPT, Claude, Gemini, NotebookLM, Perplexity, Gamma',
      'เรียนผ่าน VDO Online ดูย้อนหลังได้ตลอด'
    ],
    targetAudience: 'นักเรียน นักศึกษา พนักงานรัฐและเอกชน',
    recommended: true,
  },
  {
    id: 'vdo-claude-chatgpt',
    title: 'Package Claude Cowork หรือ Chat GPT Work STARTER 1 ชั่วโมง',
    titleEn: 'Claude Cowork or Chat GPT Work Starter VDO (1 Hour)',
    tagline: 'เริ่มใช้ Claude Cowork หรือ Chat GPT Work',
    description: 'เริ่มใช้ Claude Cowork หรือ Chat GPT Work (เลือก 1 AI) ให้เป็นภายใน 1 ชั่วโมง สำหรับ การสั่งงานอัตโนมัติ การสร้าง ติดตั้ง SKILL.MD, connector, plug in, สร้างระบบ automation',
    durationCategory: 'vdo',
    categoryGroup: 'claude',
    price: 599,
    originalPrice: 1500,
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เหมาะกับนักเรียน นักศึกษา พนักงานรัฐและเอกชนที่ต้องการใช้ Claude Cowork หรือ Chat GPT Work ช่วยสร้างระบบ automation workflow',
      'การสั่งงานอัตโนมัติ การสร้าง ติดตั้ง SKILL.MD, connector, plug in',
      'เรียนผ่าน VDO Online'
    ],
    targetAudience: 'ผู้ต้องการสร้างระบบ automation workflow',
  },
  {
    id: 'vdo-claude-codex',
    title: 'Package Claude Code หรือ Codex STARTER 1 ชั่วโมง',
    titleEn: 'Claude Code or Codex Starter VDO (1 Hour)',
    tagline: 'เริ่มใช้ Claude Code หรือ Codex',
    description: 'เริ่มใช้ Claude Code หรือ codex ให้เป็นภายใน 1 ชั่วโมง สำหรับ การสั่งงานอัตโนมัติ การสร้าง ติดตั้ง SKILL.MD, connector, plug in, สร้างระบบ web app',
    durationCategory: 'vdo',
    categoryGroup: 'web',
    price: 599,
    originalPrice: 1500,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เหมาะกับนักเรียน นักศึกษา พนักงานรัฐและเอกชนที่ต้องการใช้ Claude Code หรือ Codex ช่วยสร้างระบบ web app',
      'การสั่งงานอัตโนมัติ การสร้าง ติดตั้ง SKILL.MD, connector, plug in',
      'เรียนผ่าน VDO Online'
    ],
    targetAudience: 'ผู้ต้องการสร้างระบบ web app',
  },

  // --- Live Online 1:1 Courses ---
  {
    id: 'live-ai-starter',
    title: 'AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”',
    titleEn: 'AI Starter Live 1:1 (1 Hour)',
    tagline: 'เริ่มใช้ AI ให้เป็นภายใน 1 ชม.',
    description: 'เรียนสด Online 1:1 ปูพื้นฐานการใช้งาน AI เบื้องต้นให้ใช้งานเป็นทันที (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: 'live',
    categoryGroup: 'starter',
    price: 1500,
    originalPrice: 2500,
    coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 แบบจับมือทำ',
      'ปูพื้นฐานการใช้งาน AI เบื้องต้นให้ใช้งานเป็นทันที',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'ผู้เริ่มต้นใช้งาน AI',
    recommended: true,
  },
  {
    id: 'live-ai-marketing',
    title: 'AI for Marketing: AI Starter Class',
    titleEn: 'AI for Marketing Live 1:1 (1 Hour)',
    tagline: 'เรียนรู้ AI เพื่องานการตลาด',
    description: 'เรียนสด Online 1:1 เน้นการใช้งาน AI สำหรับสายงานการตลาด (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: 'live',
    categoryGroup: 'marketing',
    price: 1500,
    originalPrice: 2500,
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1',
      'ประยุกต์ใช้ AI กับงานการตลาด',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'นักการตลาดและเจ้าของธุรกิจ',
  },
  {
    id: 'live-claude-starter',
    title: 'Claude/Claude Cowork Starter: เริ่มใช้กับงานจริง',
    titleEn: 'Claude/Claude Cowork Starter Live 1:1 (1 Hour)',
    tagline: 'เริ่มใช้กับงานจริง',
    description: 'เรียนสด Online 1:1 ปูพื้นฐานการใช้งาน Claude และ Claude Cowork สำหรับการทำงานจริง (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: 'live',
    categoryGroup: 'claude',
    price: 1500,
    originalPrice: 2500,
    coverImage: 'https://images.unsplash.com/photo-1684369527664-d450893046f5?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1',
      'โฟกัสที่การใช้งาน Claude และ Claude Cowork',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'ผู้ต้องการใช้ Claude ในการทำงาน',
  },
  {
    id: 'live-claude-workflow',
    title: 'Claude Personal Workflow',
    titleEn: 'Claude Personal Workflow Live 1:1 (3 Hours)',
    tagline: 'ออกแบบ Workflow ส่วนตัวด้วย Claude',
    description: 'เรียนสด Online 1:1 เวลา 3 ชั่วโมง สอนการสร้าง Workflow การทำงานส่วนตัวให้มีประสิทธิภาพด้วย Claude (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: 'live',
    categoryGroup: 'claude',
    price: 3900,
    originalPrice: 5900,
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 ระยะเวลา 3 ชั่วโมง',
      'การออกแบบ Personal Workflow',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'ผู้ที่ต้องการเพิ่มประสิทธิภาพการทำงาน',
  },
  {
    id: 'live-ai-webapp',
    title: 'AI Webapp Builder with Google AI Studio',
    titleEn: 'AI Webapp Builder Live 1:1 (3 Hours)',
    tagline: 'สร้าง Web App ด้วย Google AI Studio',
    description: 'เรียนสด Online 1:1 เวลา 3 ชั่วโมง สอนสร้าง Web Application ด้วย Google AI Studio (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: 'live',
    categoryGroup: 'web',
    price: 3900,
    originalPrice: 5900,
    coverImage: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 ระยะเวลา 3 ชั่วโมง',
      'สร้าง Web App ด้วย Google AI Studio',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'นักพัฒนาหรือผู้สนใจสร้าง Web Application',
  },
  {
    id: 'live-claude-cowork-skills',
    title: 'Claude Cowork & Skills',
    titleEn: 'Claude Cowork & Skills Live 1:1 (6 Hours / 2 Days)',
    tagline: 'เจาะลึกการใช้ Claude Cowork และ Skills',
    description: 'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (แบ่ง 2 วัน) เจาะลึกการใช้งาน Claude Cowork และการสร้าง Skills (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: 'live',
    categoryGroup: 'claude',
    price: 7500,
    originalPrice: 12000,
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (2 วัน)',
      'เจาะลึก Claude Cowork & Skills',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'ผู้ที่ต้องการใช้งาน Claude ขั้นสูง',
  },
  {
    id: 'live-ai-website-lovable',
    title: 'AI Website Builder with Lovable/Codex/ClaudeCode',
    titleEn: 'AI Website Builder Live 1:1 (6 Hours / 2 Days)',
    tagline: 'สร้างเว็บไซต์ด้วย Lovable, Codex, ClaudeCode',
    description: 'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (แบ่ง 2 วัน) สอนสร้างเว็บไซต์ด้วยเครื่องมือ AI เช่น Lovable, Codex, ClaudeCode (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: 'live',
    categoryGroup: 'web',
    price: 7500,
    originalPrice: 12000,
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (2 วัน)',
      'สร้างเว็บด้วย Lovable / Codex / ClaudeCode',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'ผู้ต้องการสร้างเว็บไซต์ด้วย AI',
  },
  {
    id: 'live-landing-page',
    title: 'สร้าง Landing Page ด้วย Claude Cowork / Codex / Lovable',
    titleEn: 'Build Landing Page with AI Live 1:1 (6 Hours / 2 Days)',
    tagline: 'เจาะลึกการสร้าง Landing Page เพื่อธุรกิจ',
    description: 'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (แบ่ง 2 วัน) สอนสร้าง Landing Page แบบมืออาชีพด้วย Claude Cowork / Codex / Lovable (ราคาสำหรับ วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269)',
    durationCategory: 'live',
    categoryGroup: 'web',
    price: 7500,
    originalPrice: 12000,
    coverImage: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=600&q=80',
    keyFeatures: [
      'เรียนสด Online 1:1 ระยะเวลา 6 ชั่วโมง (2 วัน)',
      'ออกแบบและสร้าง Landing Page แบบมืออาชีพ',
      'วิทยากรนอกสถานที่ ติดต่อ Line:zarn หรือ 061-5614269'
    ],
    targetAudience: 'นักการตลาด ผู้ประกอบการ ที่ต้องการสร้างยอดขายผ่าน Landing Page',
  },
];
`;

let content = fs.readFileSync('src/data/courses.ts', 'utf-8');
content = content.replace(/export const COURSES: Course\[\] = \[[\s\S]*?\];/m, coursesCode);
fs.writeFileSync('src/data/courses.ts', content);
