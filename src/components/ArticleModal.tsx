import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Star, 
  Share2, 
  Check, 
  BookOpen, 
  ArrowRight, 
  Sparkles,
  Award,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  Code,
  ShieldCheck
} from 'lucide-react';
import { Article } from '../data/articles';

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  onSelectCourseById?: (courseId: string) => void;
}

export function ArticleModal({ article, onClose, onSelectCourseById }: ArticleModalProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!article) return null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div 
      id="article-reader-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="bg-stone-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] font-bold">
              {article.categoryLabel}
            </span>
            <span className="text-stone-400 text-xs hidden sm:inline flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              อ่านประมาณ {article.readTimeMinutes} นาที
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 sm:px-3 sm:py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="คัดลอกลิงก์บทความ"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-300">คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">แชร์</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-close-article-modal"
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 text-stone-800">
          
          {/* Article Header Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-900">
            {!imageError ? (
              <img
                src={article.image}
                alt={article.title}
                onError={() => setImageError(true)}
                className="w-full h-56 sm:h-72 object-cover opacity-90 hover:opacity-100 transition-opacity"
              />
            ) : (
              <div className={`w-full h-56 sm:h-72 bg-gradient-to-r ${article.fallbackGradient} flex items-center justify-center p-6 text-white text-center`}>
                <div className="space-y-2">
                  <BookOpen className="w-12 h-12 mx-auto text-orange-300" />
                  <h3 className="text-xl font-bold">{article.categoryLabel}</h3>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                <span className="bg-orange-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
                  {article.type}
                </span>
                <span className="text-stone-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {article.publishedDate}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">
                {article.title}
              </h2>
              <p className="text-stone-300 text-xs sm:text-sm mt-1 line-clamp-2">
                {article.tagline}
              </p>
            </div>
          </div>

          {/* Author Badge Card */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-12 h-12 rounded-2xl border-2 border-orange-500 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-stone-900 text-sm">
                    {article.author.name}
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    {article.author.badge}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  {article.author.role}
                </p>
              </div>
            </div>

            {article.relatedCourseId && onSelectCourseById && (
              <button
                type="button"
                onClick={() => {
                  onSelectCourseById(article.relatedCourseId!);
                  onClose();
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>สมัครเรียนคอร์สที่เกี่ยวข้อง</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Executive Summary Box */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-50 via-blue-50 to-indigo-50 rounded-2xl border border-orange-200 text-stone-800 space-y-2">
            <div className="flex items-center gap-2 text-orange-900 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-orange-600" />
              <span>สรุปสาระสำคัญ (Executive Summary)</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
              {article.content.summary}
            </p>
          </div>

          {/* Formatted Article Content Sections */}
          <div className="space-y-8 pt-2">
            {article.content.sections.map((sec, idx) => (
              <section key={idx} className="space-y-3.5">
                <h2 className="text-base sm:text-xl font-bold text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-2">
                  <span className="w-2 h-5 bg-orange-600 rounded-full inline-block" />
                  <span>{sec.heading}</span>
                </h2>
                
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  {sec.body}
                </p>

                {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                  <ul className="space-y-2 pl-2">
                    {sec.bulletPoints.map((bp, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 shrink-0" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {sec.highlightBox && (
                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
                    sec.highlightBox.type === 'warning'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                  }`}>
                    <div className="font-bold mb-1.5 flex items-center gap-1.5">
                      {sec.highlightBox.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Award className="w-4 h-4 text-indigo-600" />
                      )}
                      <span>{sec.highlightBox.title}</span>
                    </div>
                    <pre className="font-sans whitespace-pre-wrap font-medium">
                      {sec.highlightBox.text}
                    </pre>
                  </div>
                )}

                {sec.codeOrPromptSnippet && (
                  <div className="bg-stone-950 text-stone-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-stone-800 relative">
                    <div className="flex items-center justify-between text-[11px] text-stone-400 pb-2 mb-2 border-b border-stone-800">
                      <span className="flex items-center gap-1">
                        <Code className="w-3.5 h-3.5 text-orange-400" /> Code / Schema Snippet
                      </span>
                    </div>
                    <pre>{sec.codeOrPromptSnippet}</pre>
                  </div>
                )}
              </section>
            ))}

            {/* Conclusion */}
            <div className="p-5 bg-stone-900 text-white rounded-2xl space-y-2 border border-stone-800 shadow-md">
              <h3 className="font-bold text-sm text-orange-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                บทสรุปและก้าวต่อไป
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {article.content.conclusion}
              </p>
            </div>

            {/* Verified Sources Reference List (Anti-Hallucination Guardrail) */}
            {article.sources && article.sources.length > 0 && (
              <div className="p-5 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>แหล่งข้อมูลอ้างอิงทางการที่ผ่านการตรวจสอบจริง 100% (Verified Sources):</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Official Tier 1 & Tier 2 Verified
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  ทุกข้อมูลและข้อเท็จจริงในบทความนี้อ้างอิงตรงจากประกาศและเอกสารเผยแพร่ทางการต้นฉบับ ปราศจากการคาดเดาหรือแต่งข้อมูล
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {article.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-emerald-500/60 text-xs text-stone-200 hover:text-emerald-300 transition-all flex items-center justify-between group shadow-xs"
                    >
                      <div className="truncate pr-2 space-y-0.5">
                        <div className="font-bold text-white truncate group-hover:text-emerald-300">
                          {src.name}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono truncate">
                          {src.url}
                        </div>
                        {src.tier && (
                          <span className="inline-block text-[9px] font-bold text-emerald-400">
                            ✓ {src.tier}
                          </span>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-stone-500 group-hover:text-emerald-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related Tags */}
          <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-stone-500 mr-1">แท็กที่เกี่ยวข้อง:</span>
            {article.tags.map((t, idx) => (
              <span key={idx} className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full font-medium border border-stone-200">
                #{t}
              </span>
            ))}
          </div>

          {/* Bottom Action Card */}
          {article.relatedCourseId && (
            <div className="p-6 bg-gradient-to-r from-purple-950 via-indigo-950 to-stone-900 text-white rounded-3xl border border-purple-800/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/40">
                  หลักสูตรแนะนำสำหรับบทความนี้
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  {article.relatedCourseTitle || 'เรียนสด Online 1:1 กับ อ.มณีรัตน์'}
                </h4>
                <p className="text-xs text-stone-300">
                  เรียนสดตัวต่อตัวผ่าน Google Meet จับมือทำพร้อมโค้ชชิ่งโจทย์งานจริง
                </p>
              </div>

              {onSelectCourseById && (
                <button
                  type="button"
                  id="btn-article-book-course"
                  onClick={() => {
                    onSelectCourseById(article.relatedCourseId!);
                    onClose();
                  }}
                  className="px-5 py-3 bg-gradient-to-r from-orange-500 to-blue-500 hover:from-orange-400 hover:to-blue-400 text-stone-950 font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <span>จองคอร์สเรียนสดนี้</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
