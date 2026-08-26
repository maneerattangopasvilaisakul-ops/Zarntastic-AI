/**
 * Zarntastic AI Smart Course & Schedule Advisory Engine
 * Provides instant, highly accurate recommendations tailored to student goals,
 * experience levels, and availability schedules.
 */

export interface CourseRecommendation {
  courseId: string;
  courseTitle: string;
  price: number;
  duration: string;
  type: 'Live 1:1';
  summary: string;
  highlight: string;
}

export function generateAdvisorResponse(userQuery: string): string {
  const text = userQuery.toLowerCase();

  // 1. Beginner / Non-coder / Just starting
  if (
    text.includes('มือใหม่') ||
    text.includes('ไม่เคยเขียนโค้ด') ||
    text.includes('ไม่มีพื้นฐาน') ||
    text.includes('เริ่มต้น') ||
    text.includes('beginner') ||
    text.includes('start') ||
    text.includes('ปูพื้นฐาน')
  ) {
    return `สวัสดีครับสำหรับผู้เรียนระดับ**มือใหม่ หรือไม่เคยเขียนโค้ดมาก่อน** แนะนำเริ่มต้นด้วยหลักสูตรนี้ครับ:

🎯 **AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.” (Live 1:1)**
- **รูปแบบ:** เรียนสดออนไลน์ตัวต่อตัว 1 ชั่วโมงเต็ม (สอนแบบจับมือทำ)
- **ราคา:** ฿1,500 (จากปกติ ฿2,500)
- **สิ่งที่จะได้:** ปูพื้นฐานการสั่งงาน Prompt Engineering, วิธีใช้ ChatGPT, Claude, Gemini ในชีวิตประจำวันและงานออฟฟิศให้เห็นผลทันที
- **เหมาะสำหรับ:** ผู้ที่ต้องการมีผู้สอนคอยตอบข้อสงสัยแบบ Real-time และตรวจเช็คการทำงานสดๆ

⏰ **ช่วงเวลาเรียน Live 1:1:**
- วันธรรมดา (จันทร์-ศุกร์): 19:30 - 20:30, 20:30 - 21:30 หรือ 21:30 - 22:30 น.
- วันหยุด (เสาร์-อาทิตย์): 09:00 - 18:00 น.

👉 *คุณสามารถเลือกหลักสูตรที่ต้องการด้านล่าง แล้วคลิกเลือกวัน-เวลาในปฏิทินเพื่อจองคิวเรียนได้ทันทีครับ!*`;
  }

  // 2. Marketing / Content / Advertising / Business
  if (
    text.includes('marketing') ||
    text.includes('การตลาด') ||
    text.includes('ยิงแอด') ||
    text.includes('content') ||
    text.includes('คอนเทนต์') ||
    text.includes('ขายของ') ||
    text.includes('ธุรกิจ')
  ) {
    return `สำหรับสายงาน **การตลาด, ยิงแอด และคอนเทนต์ครีเอเตอร์** แนะนำหลักสูตรนี้ครับ:

🎯 **AI for Marketing: AI Starter Class (Live 1:1)**
- **รูปแบบ:** เรียนสดตัวต่อตัว Online 1 ชั่วโมง
- **ราคา:** ฿1,500 (จากปกติ ฿2,500)
- **เนื้อหาไฮไลต์:**
  • การใช้ AI คิดกลยุทธ์ Content Marketing & คอนเซปต์โฆษณา
  • เทคนิค Prompt สำหรับเขียน Copywriting ดึงดูดลูกค้าและปิดการขาย
  • การวิเคราะห์กลุ่มเป้าหมาย (Customer Persona) และเทรนด์ตลาดด้วย AI Search
  • เวิร์กโฟลว์สร้างรูปภาพและกราฟิกโปรโมตด้วย AI รวดเร็ว

⏰ **รอบเวลาเรียนสด:**
- จันทร์ - ศุกร์: 19:30 - 22:30 น. (รอบละ 1 ชม.)
- เสาร์ - อาทิตย์: 09:00 - 18:00 น.

👉 *สนใจจองรอบเรียน สามารถคลิกเลือกหลักสูตร "AI for Marketing" ในหน้าเว็บ แล้วเลือกรอบเวลาที่สะดวกได้เลยครับ!*`;
  }

  // 3. Claude / Claude Cowork / Automation / SKILL.md
  if (
    text.includes('claude') ||
    text.includes('cowork') ||
    text.includes('automation') ||
    text.includes('อัตโนมัติ') ||
    text.includes('skill.md') ||
    text.includes('skill') ||
    text.includes('agent')
  ) {
    return `สำหรับการใช้งาน **Claude, Claude Cowork และการสร้าง AI Automation / AI Agents**:

🚀 **1. Claude Cowork, Claude Code: AI Agents & Skills (คอร์สยอดนิยม!)**
- **รูปแบบ:** เรียนสด Online 1:1 รวม 6 ชั่วโมง (แบ่งเรียน 2 วัน วันละ 3 ชม.)
- **ราคา:** ฿7,500 (จากปกติ ฿12,000)
- **เนื้อหาเจาะลึก:**
  • ติดตั้งและตั้งค่า Claude Cowork / Claude Code
  • การเขียนและประยุกต์ใช้ \`SKILL.md\` เพื่อสร้างคำสั่งเฉพาะทาง
  • เชื่อมต่อ API, Connector และ Webhook เพื่อสั่งงานอัตโนมัติแบบไร้รอยต่อ
  • สร้าง AI Agent ที่ช่วยทำงานซ้ำซ้อนแทนคุณแบบ 24/7

⚡ **2. Claude/Claude Cowork Starter: เริ่มใช้กับงานจริง (1 ชม.)**
- **รูปแบบ:** เรียนสด 1:1 (1 ชม.)
- **ราคา:** ฿1,500 (จากปกติ ฿2,500)
- **เหมาะสำหรับ:** ผู้ที่ต้องการเริ่มต้นจับกระแส Claude ให้คล่องอย่างรวดเร็ว

⏰ **รอบเวลาเรียน (สำหรับคอร์ส 6 ชม. / 2 วัน):**
- วันธรรมดา: เรียนรอบค่ำ 19:30 - 22:30 น. (จำนวน 2 วัน)
- วันเสาร์-อาทิตย์: เลือกรอบเช้า (09:00-12:00 น.) หรือรอบบ่าย (13:00-16:00, 14:00-17:00, 15:00-18:00 น.)

👉 *สามารถเลือกวันเรียนทั้ง 2 วันในระบบนัดหมายได้ทันทีครับ!*`;
  }

  // 4. ChatGPT / OpenAI / Codex
  if (
    text.includes('chatgpt') ||
    text.includes('chat gpt') ||
    text.includes('gpt') ||
    text.includes('codex') ||
    text.includes('openai')
  ) {
    return `สำหรับผู้ที่ต้องการเชี่ยวชาญ **ChatGPT Work & OpenAI Codex**:

🌟 **Chat GPT Work & Codex : AI Agents & Skills (Live 1:1)**
- **รูปแบบ:** เรียนสด Online 1:1 รวม 6 ชั่วโมง (แบ่งเรียน 2 วัน วันละ 3 ชม.)
- **ราคา:** ฿7,500 (จากปกติ ฿12,000)
- **เนื้อหาเด่น:**
  • การประยุกต์ใช้ Custom GPTs และ ChatGPT Work ในองค์กร
  • การใช้งาน OpenAI Codex สำหรับช่วยเขียนโค้ดและจัดการระบบ
  • การสร้าง Action / Function Calling เชื่อมต่อระบบภายนอก
  • สร้าง Automation Workflow ขั้นสูง

👉 *ระบบรองรับการจองคิว 2 วันแบบอัตโนมัติ สามารถกดเลือกคอร์สเพื่อเลือกวันเวลาได้เลยครับ!*`;
  }

  // 5. Web App / Website / Antigravity / Lovable / Coding
  if (
    text.includes('web') ||
    text.includes('เว็บ') ||
    text.includes('website') ||
    text.includes('antigravity') ||
    text.includes('lovable') ||
    text.includes('สร้างแอป') ||
    text.includes('สร้างเว็บ')
  ) {
    return `สำหรับการสร้าง **Web Application และ Website ด้วยพลัง AI**:

🌐 **1. AI Webapp Builder with Google Antigravity (Live 1:1 - 3 ชั่วโมง)**
- **รูปแบบ:** เรียนสด Online 1:1 วันเดียวจบ (3 ชั่วโมง)
- **ราคา:** ฿3,900 (จากปกติ ฿5,900)
- **สิ่งที่จะได้:** วิธีสร้าง Full-stack Web Application ผ่าน Google AI Studio / Antigravity โดยสั่งงานด้วย Natural Language แบบไม่ต้องเขียนโค้ดเองทั้งหมด

🚀 **2. AI Website Builder with Lovable/Codex/ClaudeCode (Live 1:1 - 6 ชั่วโมง / 2 วัน)**
- **รูปแบบ:** เรียนสด Online 1:1 รวม 6 ชั่วโมง (แบ่ง 2 วัน วันละ 3 ชม.)
- **ราคา:** ฿7,500 (จากปกติ ฿12,000)
- **สิ่งที่จะได้:** สร้างเว็บไซต์และ Web App แบบ Full Production ด้วย Lovable, Codex และ Claude Code พร้อม Deploy ขึ้นระบบจริง (Vercel, Cloud Run)

⏰ **รอบเวลาเรียน:**
- จันทร์ - ศุกร์: 19:30 - 22:30 น.
- เสาร์ - อาทิตย์: 09:00 - 18:00 น. (เลือกรอบได้ตามสะดวก)`;
  }

  // 6. Productivity / Office work / Automation
  if (
    text.includes('productivity') ||
    text.includes('เร็วขึ้น') ||
    text.includes('น่าเบื่อ') ||
    text.includes('งานประจำ') ||
    text.includes('ออฟฟิศ') ||
    text.includes('เอกสาร') ||
    text.includes('สรุป')
  ) {
    return `สำหรับพนักงานออฟฟิศ ผู้บริหาร และผู้ที่ต้องการ **ทำงานเร็วขึ้น 10 เท่า ลดงานน่าเบื่อซ้ำซาก**:

⚡ **AI WORK PRODUCTIVITY “ใช้ AI ทำงานน่าเบื่อให้เร็วขึ้น” (Live 1:1)**
- **รูปแบบ:** เรียนสด Online 1:1 ระยะเวลา 3 ชั่วโมง (วันเดียวจบ)
- **ราคา:** ฿3,900 (จากปกติ ฿5,900)
- **เนื้อหาครอบคลุม:**
  • สรุปเอกสาร รายงาน ประชุม บันทึกย่อ ด้วย NotebookLM & Claude
  • สร้าง Presentation สวยหรูภายใน 3 นาทีด้วย Gamma AI
  • วิเคราะห์ข้อมูล Excel, สรุปตาราง และสร้าง Data Visualization ด้วย AI
  • การจัดระเบียบงานและ Workflow ลดเวลาทำงานรายวันลง 50-80%

👉 *คอร์ส 3 ชั่วโมงเหมาะมากสำหรับการเรียนช่วงค่ำวันธรรมดา (19:30-22:30 น.) หรือเลือกช่วงวันหยุดเสาร์-อาทิตย์ได้เลยครับ!*`;
  }

  // 7. Schedule / Available Times / Hours
  if (
    text.includes('เวลา') ||
    text.includes('รอบ') ||
    text.includes('ตาราง') ||
    text.includes('ว่าง') ||
    text.includes('วันธรรมดา') ||
    text.includes('เสาร์') ||
    text.includes('อาทิตย์') ||
    text.includes('ชั่วโมง') ||
    text.includes('กี่โมง')
  ) {
    return `🗓️ **ตารางและเงื่อนไขเวลาเปิดสอนสด (Live 1:1):**

👥 **สำหรับบุคคลทั่วไป (General Public):**
- **วันจันทร์ - ศุกร์ (รอบค่ำ):** 19:30 - 22:30 น.
  • คอร์ส 1 ชม.: เลือกรอบ 19:30-20:30, 20:30-21:30 หรือ 21:30-22:30 น.
  • คอร์ส 3 ชม.: เลือกรอบ 19:30 - 22:30 น.
  • คอร์ส 6 ชม. (2 วัน): เลือกวันธรรมดา 2 วัน (วันละ 19:30-22:30 น.) หรือผสมกับเสาร์-อาทิตย์
- **วันเสาร์ - อาทิตย์ (ทั้งวัน):** 09:00 - 18:00 น. (เลือกรอบเวลาใดก็ได้ตามสะดวก)

🏢 **สำหรับองค์กร (Corporate Group / In-House):**
- วันจันทร์ - เสาร์: 09:00 - 18:00 น. (ปิดวันอาทิตย์)
- ติดต่อประสานงานวิทยากรนอกสถานที่ Line: @zarntastic หรือโทร 061-5614269`;
  }

  // 8. Price / Cost / Promotion
  if (
    text.includes('ราคา') ||
    text.includes('เท่าไหร่') ||
    text.includes('ค่าเรียน') ||
    text.includes('โปร') ||
    text.includes('promotion') ||
    text.includes('price')
  ) {
    return `💰 **สรุปราคาค่าเรียนสด Live Online 1:1 (เรียนตัวต่อตัวแบบจับมือทำ):**

🎓 **หลักสูตรทั้งหมดของ Zarntastic AI:**
• คอร์สเริ่มต้น 1 ชั่วโมง (AI Starter / Marketing / Claude) ➡️ **฿1,500** (ปกติ ฿2,500)
• คอร์สเพิ่มประสิทธิภาพ 3 ชั่วโมง (AI Productivity / Web App Antigravity) ➡️ **฿3,900** (ปกติ ฿5,900)
• คอร์สเข้มข้น 6 ชั่วโมง / 2 วัน (Claude Code Agents / ChatGPT Codex / AI Website) ➡️ **฿7,500** (ปกติ ฿12,000)

💳 **ช่องทางชำระเงิน:** พร้อมเพย์ QR Code หรือ โอนผ่านธนาคารไทยพาณิชย์ (SCB) ตรวจสอบสลิปผ่านระบบอัตโนมัติ`;
  }

  // 9. Default Comprehensive Overview
  return `สวัสดีครับ! ผมคือ **AI Course Advisor** ประจำสถาบัน Zarntastic AI LEARNING โดย อ.มณีรัตน์ ยินดีแนะนำคอร์สที่ตรงกับเป้าหมายของคุณครับ 🤖✨

หลักสูตรของเราออกแบบมาเพื่อตอบโจทย์ทุกระดับ:

1. **ระดับเริ่มต้น / มือใหม่ (1 วัน 1 ชม. - ฿1,500):**
   • *AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”*
   • *AI for Marketing (เพื่องานการตลาด)*
   • *Claude Starter (เริ่มใช้ Claude ในงานจริง)*

2. **ระดับประยุกต์ใช้งาน / Productivity (1 วัน 3 ชม. - ฿3,900):**
   • *AI WORK PRODUCTIVITY “ใช้ AI ทำงานน่าเบื่อให้เร็วขึ้น”*
   • *AI Webapp Builder with Google Antigravity*

3. **ระดับสูง & Automation Agents (2 วัน รวม 6 ชม. - ฿7,500):**
   • *Claude Cowork, Claude Code: AI Agents & Skills*
   • *Chat GPT Work & Codex : AI Agents & Skills*
   • *AI Website Builder with Lovable/Codex/ClaudeCode*

💡 *คุณสามารถบอกเป้าหมายการใช้งานของคุณ (เช่น อยากประหยัดเวลาทำงาน, อยากสร้างแอป, หรืออยากทำการตลาด) เพื่อให้ผมแนะนำคอร์สที่ตรงจุดที่สุดได้เลยครับ!*`;
}
