import { useState } from 'react';
import { FASTWORK_REVIEWS, INSTRUCTOR_INFO } from '../data/courses';
import { 
  Star, 
  CheckCircle2, 
  ExternalLink, 
  Award, 
  ThumbsUp, 
  ShieldCheck, 
  MessageSquareQuote,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export function FastworkReviews() {
  const [filterCourse, setFilterCourse] = useState<string>('all');

  const filteredReviews = filterCourse === 'all'
    ? FASTWORK_REVIEWS
    : FASTWORK_REVIEWS.filter(r => r.courseTitle.includes(filterCourse));

  return (
    <section id="reviews-section" className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-stone-800 shadow-2xl relative overflow-hidden">
      
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-stone-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/80 border border-orange-700/60 text-orange-300 text-xs font-bold mb-3">
              <Award className="w-3.5 h-3.5 text-orange-400" />
              <span>Fastwork Verified Top AI Specialist</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>รีวิวและความประทับใจจากผู้เรียนจริง</span>
            </h2>
            <p className="text-sm text-stone-400 mt-1 max-w-2xl">
              การันตีคุณภาพการสอนและให้คำปรึกษาด้วยคะแนนรีวิว 5.0 เต็ม 5 ดาว บนแพลตฟอร์ม Fastwork จากผู้บริหาร เจ้าของธุรกิจ และนักพัฒนา
            </p>
          </div>

          {/* Fastwork Profile Badge CTA */}
          <a
            href={INSTRUCTOR_INFO.fastworkProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-orange-400 hover:text-orange-300 rounded-2xl text-xs font-bold transition-all shrink-0 self-start lg:self-auto shadow-md"
          >
            <span>ดูโปรไฟล์ทั้งหมดบน Fastwork</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Trust Badges & Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-stone-800/60 border border-stone-700/80 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-400 font-black text-2xl sm:text-3xl">
              <span>5.0</span>
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div className="text-xs text-stone-400 mt-1 font-medium">คะแนนความพึงพอใจเฉลี่ย</div>
          </div>

          <div className="bg-stone-800/60 border border-stone-700/80 rounded-2xl p-4 text-center">
            <div className="text-white font-black text-2xl sm:text-3xl">
              120+
            </div>
            <div className="text-xs text-stone-400 mt-1 font-medium">รีวิวจากลูกค้าและผู้เรียน</div>
          </div>

          <div className="bg-stone-800/60 border border-stone-700/80 rounded-2xl p-4 text-center">
            <div className="text-emerald-400 font-black text-2xl sm:text-3xl">
              100%
            </div>
            <div className="text-xs text-stone-400 mt-1 font-medium">อัตราส่งมอบงานสำเร็จ</div>
          </div>

          <div className="bg-stone-800/60 border border-stone-700/80 rounded-2xl p-4 text-center">
            <div className="text-orange-400 font-black text-2xl sm:text-3xl">
              200+
            </div>
            <div className="text-xs text-stone-400 mt-1 font-medium">ผู้ผ่านการอบรมจริง</div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-stone-800/50 hover:bg-stone-800/80 border border-stone-700/70 hover:border-stone-600 rounded-2xl p-5 flex flex-col justify-between transition-all space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header Rating & Verified Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/70 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Review</span>
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed italic">
                  "{review.comment}"
                </p>
              </div>

              {/* Author & Course Details */}
              <div className="pt-3 border-t border-stone-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white group-hover:text-orange-300 transition-colors flex items-center gap-1.5">
                    {review.author || 'ผู้เรียนผ่าน Fastwork'}
                    {review.reviewUrl && (
                      <a href={review.reviewUrl} target="_blank" rel="noopener noreferrer" className="inline-block p-1 bg-stone-800 hover:bg-stone-700 rounded-full transition-colors text-orange-400 hover:text-orange-300" title="ดูรีวิวฉบับเต็มบน Fastwork">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {review.role && (
                    <div className="text-[11px] text-stone-400">
                      {review.role} {review.company && `• ${review.company}`}
                    </div>
                  )}
                  <div className="text-[10px] text-orange-400/90 font-medium mt-0.5">
                    คอร์ส: {review.courseTitle}
                  </div>
                </div>

                <div className="text-[10px] text-stone-500 font-mono">
                  {review.date}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="bg-stone-800/40 p-4 rounded-2xl border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ทุกคอร์สสอนสดแบบ 1-on-1 หรือกลุ่ม In-House ปรับเนื้อหาตามความต้องการและหน้างานจริงของคุณ</span>
          </div>

          <a
            href="https://line.me/ti/p/N9UPH4OL4L"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 font-bold underline shrink-0 cursor-pointer"
          >
            สอบถามรายละเอียดทาง LINE ID: zarn
          </a>
        </div>

      </div>

    </section>
  );
}
