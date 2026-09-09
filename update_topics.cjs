const fs = require('fs');
let code = fs.readFileSync('src/data/courses.ts', 'utf8');

const replacementMap = {
  'live-ai-starter': `    topics: ['ทำความรู้จักเครื่องมือ AI ยอดนิยม (ChatGPT, Claude, Gemini)', 'โครงสร้าง Prompt ที่ดี (Prompt Framework)', 'การประยุกต์ใช้ AI กับงานประจำวัน', 'Workshop: ลองเขียน Prompt เพื่อสั่งงานจริง'],`,
  'live-ai-marketing': `    topics: ['เจาะลึก AI สำหรับนักการตลาด', 'ใช้ AI ช่วยเขียน Copywriting แบบดึงดูด', 'ใช้ AI สร้างรูปภาพประกอบ (Midjourney/DALL-E)', 'วิเคราะห์คู่แข่งด้วย AI', 'Workshop: สร้างแผนการตลาดด้วย AI'],`,
  'live-claude-starter': `    topics: ['จุดเด่นของ Claude AI และฟีเจอร์ Artifacts', 'วิธีการสั่งให้ Claude เขียนโค้ดและสร้างหน้าเว็บ', 'เคล็ดลับ Prompt สำหรับงานที่ต้องการเหตุผล', 'Workshop: สร้าง Web App เบื้องต้นด้วย Claude'],`,
  'live-claude-workflow': `    topics: ['ออกแบบ Workflow อัตโนมัติด้วย Claude', 'การสร้าง Custom Instructions', 'ทำงานร่วมกับข้อมูลจำนวนมาก', 'Workshop: สร้างระบบสรุปข้อมูลออโต้'],`,
  'live-ai-webapp': `    topics: ['พื้นฐานการพัฒนา Web App แบบ No-code/Low-code', 'สั่ง AI ให้เขียนโค้ดและดีบัก', 'เชื่อมต่อ API และฐานข้อมูล', 'Workshop: ทำ Web App พร้อมใช้งาน 1 ระบบ'],`,
  'live-claude-cowork-skills': `    topics: ['การใช้ AI เป็นผู้ช่วยส่วนตัวในที่ทำงาน', 'เขียนอีเมลและการสื่อสารภายในองค์กร', 'สรุปเนื้อหาการประชุมอัตโนมัติ', 'Workshop: บทบาทสมมุติในการเจรจาต่อรองด้วย AI'],`,
  'live-ai-website-lovable': `    topics: ['ทำความรู้จักแพลตฟอร์ม Lovable', 'การออกแบบ UI/UX ด้วย AI', 'สั่งสร้างเว็บไซต์ตั้งแต่หน้าแรกจนถึงระบบหลังบ้าน', 'Workshop: ปล่อยเว็บไซต์จริงภายในคอร์ส'],`,
  'live-landing-page': `    topics: ['จิตวิทยาการสร้าง Landing Page ที่เพิ่มยอดขาย', 'ใช้ AI ร่างโครงสร้างและ Copywriting', 'ใช้ AI ช่วยออกแบบและเขียนโค้ด Landing Page', 'Workshop: สร้างหน้าขายของจริง 1 หน้า'],`,
  'vdo-starter': `    topics: ['บทนำ: AI คืออะไร และทำงานอย่างไร', 'สมัครและใช้งาน ChatGPT/Claude', 'รวม Prompt พื้นฐานที่ใช้ได้ทันที', 'แจก Workflow พื้นฐาน'],`,
  'vdo-intermediate': `    topics: ['Prompt Engineering ระดับกลาง', 'การใช้ฟีเจอร์ Advanced Data Analysis', 'จัดการไฟล์เอกสาร PDF/Excel ด้วย AI', 'กรณีศึกษาในสายงานต่างๆ'],`,
  'vdo-advance-1': `    topics: ['รวมเคล็ดลับการใช้งาน AI ขั้นสูง', 'Automated Workflow พื้นฐาน', 'การใช้ API เบื้องต้น', 'รวมตัวอย่างที่นำไปใช้ได้จริง'],`,
  'vdo-advance-2': `    topics: ['ออกแบบระบบ AI Agents', 'ทำงานร่วมกับระบบหลายๆ ระบบ (Make/Zapier)', 'เคล็ดลับลดข้อผิดพลาด (Hallucination)', 'โปรเจกต์ตัวอย่างแบบเต็มระบบ'],`,
  'vdo-ai-starter': `    topics: ['ปูพื้นฐาน AI ให้แน่นภายใน 1 ชั่วโมง', 'สรุปความต่างของแต่ละค่าย AI', 'วิธีเริ่มต้นใช้อย่างปลอดภัยและคุ้มค่า', 'เทคนิคที่มือใหม่ควรรู้'],`,
  'vdo-claude-chatgpt': `    topics: ['เปรียบเทียบเชิงลึก Claude vs ChatGPT', 'วิธีเลือกใช้ AI ให้เหมาะกับงาน', 'ตัวอย่างการประยุกต์ใช้พร้อมกัน', 'เคล็ดลับปลดล็อคข้อจำกัด'],`,
  'vdo-claude-codex': `    topics: ['ใช้ Claude ช่วยเขียนโค้ดสำหรับผู้เริ่มต้น', 'อ่านและแก้ไขบั๊กด้วย Claude', 'สร้างโครงสร้างโปรเจกต์อัตโนมัติ', 'แนะนำเครื่องมือทำงานร่วมกับ Claude'],`
};

for (const [id, newTopics] of Object.entries(replacementMap)) {
  const genericStr = "topics: ['พื้นฐานการทำงานของ AI', 'Prompt Engineering ขั้นสูง', 'Workshop ประยุกต์ใช้งานจริง'],";
  
  // Find index of the id
  const idIndex = code.indexOf(`id: '${id}'`);
  if (idIndex !== -1) {
    const nextTopicIndex = code.indexOf(genericStr, idIndex);
    if (nextTopicIndex !== -1 && nextTopicIndex - idIndex < 1000) {
      code = code.substring(0, nextTopicIndex) + newTopics + code.substring(nextTopicIndex + genericStr.length);
    }
  }
}

fs.writeFileSync('src/data/courses.ts', code);
