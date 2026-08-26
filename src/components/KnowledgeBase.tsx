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
  Share2, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  X, 
  GraduationCap, 
  Tag, 
  Eye, 
  ThumbsUp, 
  Flame,
  ExternalLink,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { KNOWLEDGE_ARTICLES } from '../data/knowledgeArticles';
import { COURSES } from '../data/courses';
import { KnowledgeArticle, Course } from '../types';

interface KnowledgeBaseProps {
  onSelectCourse?: (course: Course) => void;
}

export function KnowledgeBase({ onSelectCourse }: KnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<KnowledgeArticle | null>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [likedArticles, setLikedArticles] = useState<Record<string | number, boolean>>({});

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'prompt', label: 'Prompt Engineering' },
    { id: 'geo_seo', label: 'SEO / GEO / AEO' },
    { id: 'marketing', label: 'AI Marketing' },
    { id: 'models', label: 'AI Models (Claude/GPT)' },
    { id: 'automation', label: 'Workflow Automation' },
    { id: 'agents', label: 'AI Agents' },
    { id: 'studio', label: 'Google AI Studio' },
  ];

  // Filter articles based on category, type, and search query
  const filteredArticles = useMemo(() => {
    return KNOWLEDGE_ARTICLES.filter((article) => {
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const matchesType = selectedType === 'all' || article.type === selectedType;
      
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory && matchesType;

      const matchesSearch = 
        article.title.toLowerCase().includes(query) ||
        article.desc.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query)) ||
        article.metaDescription.toLowerCase().includes(query);

      return matchesCategory && matchesType && matchesSearch;
    });
  }, [searchQuery, selectedCategory, selectedType]);

  const handleCopyPrompt = (promptText: string, index: number) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  const handleShareArticle = (article: KnowledgeArticle) => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${url}#article-${article.slug}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleToggleLike = (articleId: string | number) => {
    setLikedArticles(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

  const getRelatedCourse = (courseId?: string): Course | undefined => {
    if (!courseId) return undefined;
    return COURSES.find(c => c.id === courseId);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>คลังความรู้ AI คุณภาพระดับสากล (SEO • GEO • AIO • AEO Masterclass)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            คลังความรู้ AI &amp; กลยุทธ์การตลาดยุคใหม่
          </h1>
          
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            เจาะลึกเทคนิค <strong>Prompt Engineering</strong>, กลยุทธ์ติดอันดับ <strong>GEO (Generative Engine Optimization)</strong>, 
            การตอบโจทย์ <strong>AEO (Answer Engine Optimization)</strong> และการสร้างระบบ <strong>AI Workflow Automation</strong> สำหรับธุรกิจ
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาบทความ เช่น Prompt Engineering, GEO, Claude, Make, AI Agent..." 
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({KNOWLEDGE_ARTICLES.length})
            </button>
            <button
              onClick={() => setSelectedType('article')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'article' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>บทความ</span>
            </button>
            <button
              onClick={() => setSelectedType('video')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedType === 'video' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>วิดีโอ &amp; ไกด์</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300/50'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">ไม่พบบทความที่ตรงกับเงื่อนไขการค้นหา</h3>
          <p className="text-xs text-slate-500">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อค้นหาบทความที่คุณสนใจ</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedType('all'); }}
            className="mt-2 px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs hover:bg-indigo-100 transition-colors"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => {
            const isLiked = likedArticles[article.id];

            return (
              <div 
                key={article.id} 
                onClick={() => setActiveArticle(article)}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-indigo-300 transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col justify-between"
              >
                {/* Thumbnail Header */}
                <div>
                  <div className="h-52 overflow-hidden relative">
                    <img 
                      src={article.image} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                    
                    {/* Badge Type */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs text-slate-800 flex items-center gap-1.5 text-[11px] font-bold">
                      {article.type === 'video' ? (
                        <><PlayCircle className="w-3.5 h-3.5 text-red-500" /> VIDEO GUIDE</>
                      ) : (
                        <><FileText className="w-3.5 h-3.5 text-cyan-600" /> ARTICLE</>
                      )}
                    </div>

                    {/* Category Tag */}
                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-cyan-300 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-700">
                      {article.categoryLabel}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {article.readTime}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {article.publishedAt}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h2>

                    <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {article.desc}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {article.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-5 sm:px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <img 
                      src={article.author.avatar} 
                      alt={article.author.name} 
                      className="w-6 h-6 rounded-full border border-slate-200" 
                    />
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                      {article.author.name.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-indigo-600 font-bold text-xs group-hover:text-indigo-700">
                    <span>อ่านเนื้อหาฉบับเต็ม</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Full Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div 
            className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col relative my-auto animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 sm:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">
                  {activeArticle.categoryLabel}
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  • เวลาอ่าน {activeArticle.readTime}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareArticle(activeArticle)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="คัดลอกลิงก์บทความ"
                >
                  {copiedLink ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-600" /> <span>คัดลอกแล้ว!</span></>
                  ) : (
                    <><Share2 className="w-3.5 h-3.5" /> <span>แชร์บทความ</span></>
                  )}
                </button>

                <button
                  onClick={() => setActiveArticle(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="ปิดหน้าต่าง"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Article Body */}
            <div className="overflow-y-auto p-5 sm:p-8 space-y-8 text-slate-800">
              
              {/* Article Hero Section */}
              <div className="space-y-4">
                <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {activeArticle.title}
                </h1>

                {/* Author Info & Date */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <img 
                      src={activeArticle.author.avatar} 
                      alt={activeArticle.author.name} 
                      className="w-11 h-11 rounded-full border-2 border-cyan-500 shadow-xs" 
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                        <span>{activeArticle.author.name}</span>
                        <span className="text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded font-bold">Verified Author</span>
                      </div>
                      <div className="text-xs text-slate-500">{activeArticle.author.role}</div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-0.5 text-right">
                    <div>เผยแพร่: <strong>{activeArticle.publishedAt}</strong></div>
                    <div>อัปเดตล่าสุด: <strong>{activeArticle.updatedAt}</strong></div>
                  </div>
                </div>

                {/* Article Cover Image */}
                <div className="rounded-2xl overflow-hidden shadow-md max-h-96 border border-slate-200">
                  <img 
                    src={activeArticle.image} 
                    alt={activeArticle.title} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>

              {/* Key Takeaways Box (GEO / AEO Friendly Summary) */}
              <div className="bg-gradient-to-br from-indigo-50 via-cyan-50 to-blue-50 p-5 sm:p-6 rounded-2xl border border-indigo-200/80 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm sm:text-base">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>สาระสำคัญสรุปโดยย่อ (Key Takeaways &amp; Executive Summary)</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  {activeArticle.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Article Main HTML Content */}
              <div 
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-4 text-sm sm:text-base [&>h2]:text-lg sm:[&>h2]:text-2xl [&>h2]:font-extrabold [&>h2]:text-slate-900 [&>h2]:mt-8 [&>h2]:mb-3 [&>h3]:text-base sm:[&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-slate-800 [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2 [&>p]:mb-4"
                dangerouslySetInnerHTML={{ __html: activeArticle.contentHtml }}
              />

              {/* Master Prompt Templates if available */}
              {activeArticle.promptExamples && activeArticle.promptExamples.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <span>ตัวอย่าง Master Prompt ที่ใช้งานได้จริง (Copy &amp; Paste Ready)</span>
                  </div>

                  {activeArticle.promptExamples.map((item, idx) => (
                    <div key={idx} className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800">
                            {item.role}
                          </span>
                          <h4 className="font-bold text-sm text-white mt-1.5">{item.title}</h4>
                        </div>

                        <button
                          onClick={() => handleCopyPrompt(item.prompt, idx)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          {copiedPromptIndex === idx ? (
                            <><Check className="w-3.5 h-3.5 text-emerald-300" /> <span>คัดลอกสำเร็จ!</span></>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> <span>Copy Prompt</span></>
                          )}
                        </button>
                      </div>

                      <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap text-slate-200 leading-relaxed border border-slate-800/80 overflow-x-auto">
                        {item.prompt}
                      </pre>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>{item.explanation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AEO-Optimized FAQ Section */}
              {activeArticle.faqs && activeArticle.faqs.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                    <HelpCircle className="w-5 h-5 text-cyan-600" />
                    <span>คำถามที่พบบ่อย (AEO &amp; Search FAQ Schema)</span>
                  </div>

                  <div className="space-y-2">
                    {activeArticle.faqs.map((faq, idx) => {
                      const isExpanded = expandedFaqIndex === idx;

                      return (
                        <div 
                          key={idx} 
                          className="border border-slate-200 rounded-xl overflow-hidden transition-all bg-slate-50/50"
                        >
                          <button
                            onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                            className="w-full p-4 text-left font-bold text-slate-800 text-xs sm:text-sm flex items-center justify-between gap-3 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <span>{faq.question}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Related Course CTA Banner */}
              {activeArticle.relatedCourseId && (
                (() => {
                  const course = getRelatedCourse(activeArticle.relatedCourseId);
                  if (!course) return null;

                  return (
                    <div className="mt-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white border border-indigo-700/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="space-y-2 max-w-xl text-center sm:text-left">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>ต่อยอดสู่การปฏิบัติจริงกับผู้สอนแบบตัวต่อตัว</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-white">
                          {course.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-center sm:text-right space-y-2">
                        <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
                          ฿{course.price.toLocaleString()}
                        </div>
                        <button
                          onClick={() => {
                            if (onSelectCourse) {
                              onSelectCourse(course);
                              setActiveArticle(null);
                            }
                          }}
                          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>สมัครเรียนคอร์สนี้ทันที</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}

            </div>

            {/* Modal Bottom Sticky Bar */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-8 py-3.5 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleLike(activeArticle.id)}
                  className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                    likedArticles[activeArticle.id] ? 'text-rose-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${likedArticles[activeArticle.id] ? 'fill-rose-600 text-rose-600' : ''}`} />
                  <span>มีประโยชน์ ({((activeArticle.likes || 0) + (likedArticles[activeArticle.id] ? 1 : 0))})</span>
                </button>
              </div>

              <button
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
