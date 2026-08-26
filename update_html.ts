import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf-8');

const headTags = `
    <title>Zarntastic AI LEARNING - คอร์สเรียน AI และ Workflow Automation</title>
    <meta name="description" content="โรงเรียนสอน AI อันดับ 1 เรียนรู้ Chat GPT, Claude, Gemini, สร้าง Web App และ Automation Workflow เหมาะสำหรับนักเรียน นักศึกษา และคนทำงานที่ต้องการเพิ่มประสิทธิภาพด้วย AI">
    <meta name="keywords" content="เรียน AI, คอร์ส AI, สอน AI, Chat GPT, Claude, Gemini, AI Workflow, AI Starter, Zarntastic, สร้าง Web App ด้วย AI">
    <meta name="author" content="Zarntastic AI LEARNING">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://zarntastic-ai.vercel.app/">
    <meta property="og:title" content="Zarntastic AI LEARNING - คอร์สเรียน AI แบบจับมือทำ">
    <meta property="og:description" content="ปูพื้นฐาน AI จนถึงสร้างระบบ Automation เริ่มต้นเพียง 599 บาท ทั้งรูปแบบ VDO และเรียนสด 1:1">
    <meta property="og:image" content="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://zarntastic-ai.vercel.app/">
    <meta property="twitter:title" content="Zarntastic AI LEARNING - คอร์สเรียน AI แบบจับมือทำ">
    <meta property="twitter:description" content="ปูพื้นฐาน AI จนถึงสร้างระบบ Automation เริ่มต้นเพียง 599 บาท ทั้งรูปแบบ VDO และเรียนสด 1:1">
    <meta property="twitter:image" content="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80">
    
    <!-- GEO / AIO / AEO Friendly markers -->
    <meta name="geo.region" content="TH" />
    <meta name="geo.placename" content="Bangkok" />
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "Zarntastic AI LEARNING",
      "description": "โรงเรียนสอน AI และ Generative AI เพื่อการประยุกต์ใช้งานจริง",
      "url": "https://zarntastic-ai.vercel.app/",
      "founder": {
        "@type": "Person",
        "name": "Maneerat Tangopasvilaisakul"
      }
    }
    </script>
`;

html = html.replace(/<title>.*?<\/title>/, headTags);
fs.writeFileSync('index.html', html);
