import fs from 'fs';

const content = `import React from 'react';
import { BookOpen, Search, ArrowRight, PlayCircle, FileText } from 'lucide-react';

export function KnowledgeBase() {
  const articles = [
    {
      id: 1,
      type: 'video',
      title: 'Prompt Engineering คืออะไร? เทคนิคเขียน Prompt สั่ง AI ให้ได้ผลลัพธ์แบบมือโปร (2026)',
      desc: 'เรียนรู้วิธีเขียน Prompt (Prompt Engineering) ให้ ChatGPT และ Claude เข้าใจลึกซึ้ง เพิ่มประสิทธิภาพการทำงาน 10x พร้อมโครงสร้าง Prompt ที่ใช้งานได้จริง',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 2,
      type: 'article',
      title: 'Generative Engine Optimization (GEO) คืออะไร? ปรับ SEO ยุค AI ให้ติดอันดับ',
      desc: 'เจาะลึกเทคนิค GEO และ AEO (Answer Engine Optimization) ปรับแต่งเนื้อหาเว็บไซต์ของคุณให้ตอบโจทย์ AI Search อย่าง Perplexity และ Google SGE',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 3,
      type: 'article',
      title: '10 สุดยอดเครื่องมือ AI สำหรับ Marketing เพิ่มยอดขาย ลดเวลาทำงาน (อัปเดตล่าสุด)',
      desc: 'รวมเครื่องมือ AI Marketing ยอดฮิต ช่วยนักการตลาดสร้าง Content, เขียน SEO Blog, วิเคราะห์ Data, และทำการตลาดอัตโนมัติอย่างมีประสิทธิภาพ',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 4,
      type: 'article',
      title: 'เปรียบเทียบ Claude 3.5 vs ChatGPT-4o: เลือก AI ตัวไหนดีสำหรับคนทำงาน?',
      desc: 'วิเคราะห์เจาะลึกจุดเด่นของ AI ตัวท็อป ทดสอบความแม่นยำในการเขียนโค้ด วิเคราะห์ข้อมูล สรุปเอกสารภาษาไทย เพื่อเลือกใช้ให้เหมาะกับธุรกิจของคุณ',
      image: 'https://images.unsplash.com/photo-1684369527664-d450893046f5?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 5,
      type: 'video',
      title: 'AI Workflow Automation: เชื่อมต่อระบบอัตโนมัติด้วย Make & Zapier',
      desc: 'คู่มือสร้าง AI Workflow เปลี่ยนงาน Routine ซ้ำซ้อนให้เป็นระบบอัตโนมัติ รันธุรกิจของคุณตลอด 24 ชั่วโมงแบบไม่มีวันหยุด เพิ่ม Productivity ขีดสุด',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 6,
      type: 'article',
      title: 'AI Agent คืออะไร? เทรนด์ธุรกิจอนาคต สร้างพนักงาน AI ส่วนตัวช่วยทำงาน',
      desc: 'ทำความรู้จัก AI Agent (Autonomous AI) ที่สามารถคิด วิเคราะห์ และตัดสินใจทำงานแทนมนุษย์ พร้อมวิธีประยุกต์ใช้เพื่อลดต้นทุนและขยายสเกลธุรกิจ',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <BookOpen className="w-8 h-8 text-cyan-600" />
            คลังความรู้ AI (Knowledge Base)
          </h2>
          <p className="text-slate-600 mt-2 font-medium max-w-2xl">
            รวบรวมเทคนิค SEO, GEO (Generative Engine Optimization), AIO และ AEO แบบเจาะลึก อัปเดตเทรนด์ AI ล่าสุด เพื่อปรับตัวให้ทันโลกธุรกิจยุคใหม่
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหาบทความ AI, เทคนิค SEO..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map(article => (
          <div key={article.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col">
            <div className="h-52 overflow-hidden relative">
              <img 
                src={article.image} 
                alt={article.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-cyan-700 flex items-center gap-1.5 text-xs font-bold tracking-wide">
                {article.type === 'video' ? (
                  <><PlayCircle className="w-4 h-4" /> VIDEO</>
                ) : (
                  <><FileText className="w-4 h-4" /> ARTICLE</>
                )}
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2 leading-snug group-hover:text-cyan-700 transition-colors">
                {article.title}
              </h3>
              <p className="text-slate-600 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                {article.desc}
              </p>
              <div className="flex items-center text-cyan-600 font-bold text-sm group-hover:text-cyan-700 mt-auto">
                อ่านบทความนี้ <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/KnowledgeBase.tsx', content);
