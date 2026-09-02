const fs = require('fs');

let code = fs.readFileSync('src/components/KnowledgeBase.tsx', 'utf8');

const faqSchema = `
  const faqSchemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "เรียน AI เครื่องมือไหนดี สำหรับปี 2026?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ในปี 2026 เครื่องมือ AI ที่แนะนำให้เริ่มต้นเรียนรู้คือ 1. Google Gemini สำหรับงานเขียนโปรแกรมและข้อมูลเรียลไทม์ (gemini.google.com) 2. ChatGPT (OpenAI) สำหรับงานเชิงวิเคราะห์และแชทบอท และ 3. Perplexity AI สำหรับการค้นหาข้อมูลแบบเจาะลึก (AI Search Engine)"
        }
      },
      {
        "@type": "Question",
        "name": "Generative Engine Optimization (GEO) คืออะไร?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "GEO หรือ Generative Engine Optimization คือการปรับแต่งเนื้อหาบนเว็บไซต์เพื่อให้ AI Search Engines (เช่น Google AI Overviews, ChatGPT Search, Perplexity) เข้าใจเนื้อหาและนำไปตอบคำถามผู้ใช้งานได้อย่างถูกต้อง"
        }
      },
      {
        "@type": "Question",
        "name": "คอร์สเรียน AI ของ Zarntastic เหมาะกับใคร?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "เหมาะกับผู้เริ่มต้นจนถึงระดับกลาง (Beginner to Intermediate) ที่ต้องการประยุกต์ใช้ AI ในการทำงานจริง เช่น การเขียนโปรแกรม (AI Web App), ทำงานเอกสาร, วิเคราะห์ข้อมูล, หรือเปิดร้านค้าอัตโนมัติ"
        }
      }
    ]
  };
`;

code = code.replace(
  "return (",
  faqSchema + "\n\n  return (\n    <>\n      <script type=\"application/ld+json\" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }} />"
);
code = code.replace(
  "    </section>\n  );",
  "    </section>\n    </>\n  );"
);

fs.writeFileSync('src/components/KnowledgeBase.tsx', code);
console.log("Added FAQ Schema");
