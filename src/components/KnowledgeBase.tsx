import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  ArrowRight, 
  PlayCircle, 
  FileText, 
  Sparkles, 
  Clock, 
  Calendar, 
  Star, 
  Filter, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import { ARTICLES_DATA, Article } from '../data/articles';
import { ArticleModal } from './ArticleModal';

interface KnowledgeBaseProps {
  onSelectCourseById?: (courseId: string) => void;
}

export function KnowledgeBase({ onSelectCourseById }: KnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const categories = [
    { id: 'all', label: 'ทั้งหมด (All Articles)' },
    { id: 'geo-aeo', label: 'GEO & AEO (SEO ยุค AI)' },
    { id: 'prompt', label: 'Prompt Engineering' },
    { id: 'workflow', label: 'AI Workflow Automation' },
    { id: 'comparison', label: 'AI Comparison & Tools' },
    { id: 'webapp', label: 'AI Agent & Web App' },
    { id: 'marketing', label: 'AI Marketing' },
  ];

  const filteredArticles = useMemo(() => {
    return ARTICLES_DATA.filter((art) => {
      const matchCat = selectedCategory === 'all' || art.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.desc.toLowerCase().includes(q) ||
        art.tagline.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 animate-in fade-in duration-200">
      
      {/* Knowledge Base Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-10 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Zarntastic AI Knowledge Hub 2026</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            คลังความรู้ AI, <span className="text-cyan-400">GEO & AEO</span> และ Workflow Automation
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            เจาะลึกเทคนิคการใช้งาน AI ระดับมืออาชีพ ปรับแต่งเว็บไซต์ให้ติดอันดับบน AI Search Engine (Perplexity, ChatGPT, Google SGE) และคู่มือการสร้าง AI Web App ใช้งานได้จริง โดย <strong className="text-white font-semibold">อ.มณีรัตน์ ตั้งโอภาสวิไลสกุล</strong> (Fastwork 5.0 ★)
          </p>

          {/* Quick Search in Banner */}
          <div className="pt-2">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                id="input-search-knowledge"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาเทคนิค GEO, AEO, Prompt Engineering, Claude..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-700 rounded-2xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-slate-900 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-lg bg-slate-800"
                >
                  ล้างคำค้นหา
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5 text-cyan-600" />
          หมวดหมู่:
        </span>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-cyan-400 shadow-sm border border-slate-700'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>พบ {filteredArticles.length} บทความ</span>
        {searchQuery && (
          <span>ผลการค้นหาสำหรับ "{searchQuery}"</span>
        )}
      </div>

      {/* Article Cards Grid */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">ไม่พบบทความที่ตรงกับเงื่อนไข</h3>
          <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกดูหมวดหมู่ทั้งหมด</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            ดูบทความทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col hover:-translate-y-1"
            >
              {/* Card Image Banner */}
              <div className="h-52 overflow-hidden relative bg-slate-900">
                <img
                  src={article.image}
                  alt={article.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  onError={(e) => {
                    // Safe SVG gradient fallback if image url gets blocked
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                
                {/* Badges */}
                <div className="absolute top-3.5 left-3.5">
                  <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    {article.categoryLabel}
                  </span>
                </div>

                <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm text-slate-800 flex items-center gap-1 text-[10px] font-extrabold">
                  {article.type === 'video' ? (
                    <><PlayCircle className="w-3 h-3 text-rose-600" /> VIDEO</>
                  ) : (
                    <><FileText className="w-3 h-3 text-cyan-700" /> GUIDE</>
                  )}
                </div>

                <div className="absolute bottom-3 left-3.5 text-white text-[11px] flex items-center gap-1.5 drop-shadow-md">
                  <Clock className="w-3 h-3 text-cyan-300" />
                  <span>อ่าน {article.readTimeMinutes} นาที</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>{article.publishedDate}</span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2.5 line-clamp-2 leading-snug group-hover:text-cyan-700 transition-colors">
                  {article.title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-sm mb-4 line-clamp-3 leading-relaxed flex-1">
                  {article.desc}
                </p>

                {/* Card Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {article.tags.slice(0, 3).map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-700">อ.มณีรัตน์</span>
                    <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <Star className="w-2 h-2 fill-amber-500 text-amber-500" /> 5.0
                    </span>
                  </div>

                  <div className="flex items-center text-cyan-700 font-bold text-xs group-hover:text-cyan-800 transition-colors">
                    <span>คลิกเพื่ออ่านบทความ</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Knowledge Callout Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 text-white rounded-3xl border border-purple-800/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            ปรึกษาโจทย์เฉพาะทางกับผู้เชี่ยวชาญ
          </span>
          <h3 className="text-lg sm:text-2xl font-bold text-white">
            ต้องการวางระบบ AI หรือเรียนสด 1:1 แบบจับมือทำ?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            สถาบัน Zarntastic เปิดสอนหลักสูตรสด Online 1:1 ผ่าน Google Meet ปรึกษาและแก้โจทย์งานจริงกับ อ.มณีรัตน์ โดยตรง พร้อมระบบจองคิวอัตโนมัติ
          </p>
        </div>

        {onSelectCourseById && (
          <button
            type="button"
            id="btn-knowledge-book-starter"
            onClick={() => onSelectCourseById('live-ai-starter')}
            className="px-6 py-3.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl transition-all cursor-pointer shrink-0 flex items-center gap-2"
          >
            <span>ดูคอร์สเรียนสด 1:1 ทั้งหมด</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Article Reader Modal */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onSelectCourseById={onSelectCourseById}
      />

    </div>
  );
}
