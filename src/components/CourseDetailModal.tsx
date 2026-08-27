import { Course } from '../types';
import { formatCurrency } from '../utils/scheduleUtils';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  BookOpen, 
  Users, 
  Calendar, 
  Award, 
  ArrowRight,
  Sparkles 
} from 'lucide-react';

interface CourseDetailModalProps {
  course: Course | null;
  onClose: () => void;
  onSelectCourse: (course: Course) => void;
}

export function CourseDetailModal({
  course,
  onClose,
  onSelectCourse,
}: CourseDetailModalProps) {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Banner */}
        <div className="bg-slate-900 text-white p-6 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            {(course.comingSoon || course.durationCategory === 'vdo') ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/50 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Coming Soon (เร็วๆ นี้) - คอร์ส VDO Online
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-bold">
                {course.totalDays && course.totalHours
                  ? course.totalDays === 1
                    ? `💻 คอร์สเรียนสด 1 วัน (${course.totalHours} ชม.)`
                    : `💻 คอร์สเรียนสด ${course.totalDays} วัน (${course.totalHours} ชม. วันละ ${course.hoursPerDay} ชม.)`
                  : '💻 คอร์สเรียนสด Online 1:1'}
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium">
              {course.level}
            </span>
            {course.fastworkRating && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold flex items-center gap-1">
                ★ {course.fastworkRating.toFixed(1)} Fastwork ({course.fastworkReviewCount || 20}+ รีวิว)
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            {course.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {course.titleEn || ''}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          
          {/* Description */}
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 text-cyan-800">
              รายละเอียดหลักสูตร
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Topics / Syllabus / VDO Lessons */}
          {course.vdoLinks && course.vdoLinks.length > 0 ? (
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5 text-indigo-700">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>บทเรียนในแพ็กเกจ VDO ({course.vdoLinks.length} หัวข้อ)</span>
              </h3>
              <div className="space-y-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                {course.vdoLinks.map((vdo, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2.5 text-xs text-slate-800 bg-white p-2.5 rounded-xl border border-indigo-50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-semibold text-slate-900">{vdo.title}</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-medium px-2 py-0.5 rounded-md bg-indigo-50">Google Drive VDO</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (course.topics && course.topics.length > 0) ? (
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-600" />
                <span>หัวข้อการเรียนรู้ (Syllabus & Workshops)</span>
              </h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {course.topics.map((topic, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : course.keyFeatures && course.keyFeatures.length > 0 ? (
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-600" />
                <span>จุดเด่นของหลักสูตร (Key Features)</span>
              </h3>
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {course.keyFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Bonus Gifts */}
          {course.bonusGifts && course.bonusGifts.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-200">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> สิ่งที่จะได้รับฟรีเพิ่มเติม (Bonus Gifts)
              </h4>
              <ul className="text-xs text-amber-800 space-y-1.5">
                {course.bonusGifts.map((bonus, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="font-medium">{bonus}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Who is this for & Prerequisites */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" /> เหมาะสำหรับ
              </h4>
              <ul className="text-xs text-slate-600 space-y-1">
                {Array.isArray(course.targetAudience) ? (
                  course.targetAudience.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))
                ) : course.whoIsThisFor && course.whoIsThisFor.length > 0 ? (
                  course.whoIsThisFor.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))
                ) : (
                  <li>• {course.targetAudience || 'ผู้ที่สนใจพัฒนาทักษะ AI ทุกระดับ'}</li>
                )}
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" /> ความรู้พื้นฐานที่ต้องมี
              </h4>
              <ul className="text-xs text-slate-600 space-y-1">
                {course.prerequisites && course.prerequisites.length > 0 ? (
                  course.prerequisites.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))
                ) : (
                  <li>• ไม่จำเป็นต้องมีความรู้พื้นฐานมาก่อน สอนตั้งแต่เริ่มต้น</li>
                )}
              </ul>
            </div>
          </div>

          {/* Instructor Bio */}
          {course.instructor && (
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
              />
              <div>
                <div className="font-bold text-slate-900 text-sm">{course.instructor.name}</div>
                <div className="text-xs text-cyan-700 font-semibold">{course.instructor.role || 'Fastwork Verified Pro AI Specialist'}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">{course.instructor.bio}</p>
              </div>
            </div>
          )}

          {/* Schedule Rules */}
          <div className="bg-cyan-50/70 p-3.5 rounded-xl border border-cyan-200 text-xs text-cyan-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-600 shrink-0" />
            <span>{course.durationCategory === 'vdo' ? 'เข้าเรียนได้ทันทีหลังชำระเงินและ Admin อนุมัติสลิป ดูย้อนหลังได้ตลอดชีพ' : (course.scheduleRuleNotice || 'บุคคลทั่วไป: จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)')}</span>
          </div>

        </div>

        {/* Footer CTA */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 font-medium">ค่าลงทะเบียนพิเศษ</div>
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(course.price)}
            </div>
          </div>

          <button
            onClick={() => {
              onSelectCourse(course);
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-cyan-600/25 transition-all cursor-pointer"
          >
            <span>จองคิวเรียนคอร์สนี้</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
