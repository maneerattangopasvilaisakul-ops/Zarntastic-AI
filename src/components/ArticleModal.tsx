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
  Code
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
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold">
              {article.categoryLabel}
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              อ่านประมาณ {article.readTimeMinutes} นาที
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 sm:px-3 sm:py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="คัดลอกลิงก์บทความ"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-300">คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">แชร์</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="btn-close-article-modal"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 text-slate-800">
          
          {/* Article Header Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
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
                  <BookOpen className="w-12 h-12 mx-auto text-cyan-300" />
                  <h3 className="text-xl font-bold">{article.categoryLabel}</h3>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                <span className="bg-cyan-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
                  {article.type}
                </span>
                <span className="text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {article.publishedDate}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">
                {article.title}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 line-clamp-2">
                {article.tagline}
              </p>
            </div>
          </div>

          {/* Author Badge Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-12 h-12 rounded-2xl border-2 border-cyan-500 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {article.author.name}
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    {article.author.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
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
          <div className="p-4 sm:p-5 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 rounded-2xl border border-cyan-200 text-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-900 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-cyan-600" />
              <span>สรุปสาระสำคัญ (Executive Summary)</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {article.content.summary}
            </p>
          </div>

          {/* Formatted Article Content Sections */}
          <div className="space-y-8 pt-2">
            {article.content.sections.map((sec, idx) => (
              <section key={idx} className="space-y-3.5">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="w-2 h-5 bg-cyan-600 rounded-full inline-block" />
                  <span>{sec.heading}</span>
                </h2>
                
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {sec.body}
                </p>

                {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                  <ul className="space-y-2 pl-2">
                    {sec.bulletPoints.map((bp, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 mt-2 shrink-0" />
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
                  <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800 relative">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 mb-2 border-b border-slate-800">
                      <span className="flex items-center gap-1">
                        <Code className="w-3.5 h-3.5 text-cyan-400" /> Code / Schema Snippet
                      </span>
                    </div>
                    <pre>{sec.codeOrPromptSnippet}</pre>
                  </div>
                )}
              </section>
            ))}

            {/* Conclusion */}
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-800 shadow-md">
              <h3 className="font-bold text-sm text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                บทสรุปและก้าวต่อไป
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {article.content.conclusion}
              </p>
            </div>
          </div>

          {/* Related Tags */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">แท็กที่เกี่ยวข้อง:</span>
            {article.tags.map((t, idx) => (
              <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium border border-slate-200">
                #{t}
              </span>
            ))}
          </div>

          {/* Bottom Action Card */}
          {article.relatedCourseId && (
            <div className="p-6 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl border border-purple-800/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/40">
                  หลักสูตรแนะนำสำหรับบทความนี้
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  {article.relatedCourseTitle || 'เรียนสด Online 1:1 กับ อ.มณีรัตน์'}
                </h4>
                <p className="text-xs text-slate-300">
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
                  className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
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
