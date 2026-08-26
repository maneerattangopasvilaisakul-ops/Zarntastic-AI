import { useState, useMemo } from 'react';
import { Course, CourseCategoryGroup } from '../types';
import { COURSES, INSTRUCTOR_INFO } from '../data/courses';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Zap, 
  Cpu, 
  Bot, 
  Layers, 
  ShieldCheck, 
  Terminal, 
  Info,
  Users,
  Search,
  ExternalLink,
  Gift,
  Star,
  Target,
  FileText,
  Palette,
  Globe,
  Crown,
  Layout,
  Code,
  TrendingUp,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/scheduleUtils';

interface CourseSelectorProps {
  courses?: Course[];
  selectedCourse: Course | null;
  onSelectCourse: (course: Course) => void;
  onOpenDetails: (course: Course) => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (query: string) => void;
}

export function CourseSelector({
  courses = COURSES,
  selectedCourse,
  onSelectCourse,
  onOpenDetails,
  globalSearchQuery = '',
  onGlobalSearchChange,
}: CourseSelectorProps) {
  const [selectedDuration, setSelectedDuration] = useState<'all' | '1h' | '3h' | '6h'>('all');
  const [localSearchQuery, setLocalSearchQuery] = useState<string>('');
  const searchQuery = globalSearchQuery || localSearchQuery;
  const setSearchQuery = onGlobalSearchChange || setLocalSearchQuery;

  // Filter Tabs by Hours
  const filterTabs: Array<{ id: 'all' | '1h' | '3h' | '6h'; label: string; count: number }> = [
    { id: 'all', label: 'ทั้งหมด', count: courses.length },
    { id: '1h', label: 'คอร์ส 1 ชั่วโมง', count: courses.filter(c => c.totalHours === 1).length },
    { id: '3h', label: 'คอร์ส 3 ชั่วโมง', count: courses.filter(c => c.totalHours === 3).length },
    { id: '6h', label: 'คอร์ส 6 ชั่วโมง', count: courses.filter(c => c.totalHours === 6).length },
  ];

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Duration / Hours Filter
      if (selectedDuration === '1h' && c.totalHours !== 1) return false;
      if (selectedDuration === '3h' && c.totalHours !== 3) return false;
      if (selectedDuration === '6h' && c.totalHours !== 6) return false;

      // Search query Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = c.title.toLowerCase().includes(q) || (c.titleEn || '').toLowerCase().includes(q);
        const inDesc = (c.description || '').toLowerCase().includes(q) || (c.tagline || '').toLowerCase().includes(q);
        const inTopics = (c.topics || []).some(t => t.toLowerCase().includes(q));
        const inFeatures = (c.keyFeatures || []).some(f => f.toLowerCase().includes(q));
        const inBonus = (c.bonusGifts || []).some(b => b.toLowerCase().includes(q));
        return inTitle || inDesc || inTopics || inFeatures || inBonus;
      }

      return true;
    });
  }, [courses, selectedDuration, searchQuery]);

  const getCourseIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Bot': return <Bot className="w-5 h-5" />;
      case 'Layers': return <Layers className="w-5 h-5" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5" />;
      case 'Terminal': return <Terminal className="w-5 h-5" />;
      case 'Target': return <Target className="w-5 h-5" />;
      case 'FileText': return <FileText className="w-5 h-5" />;
      case 'Palette': return <Palette className="w-5 h-5" />;
      case 'Globe': return <Globe className="w-5 h-5" />;
      case 'Crown': return <Crown className="w-5 h-5" />;
      case 'Layout': return <Layout className="w-5 h-5" />;
      case 'Code': return <Code className="w-5 h-5" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <section className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>ขั้นตอนที่ 1: เลือกคอร์สเรียน AI ที่ต้องการ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>คอร์สเรียน AI คุณภาพสูง ({COURSES.length} หลักสูตร)</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            สอนสดออนไลน์แบบจับมือทำ (Google Meet) โดยอาจารย์ผู้เชี่ยวชาญระดับ Verified Pro บน Fastwork
          </p>
        </div>

        {/* Verified Instructor Badge */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <img
            src={INSTRUCTOR_INFO.avatar}
            alt={INSTRUCTOR_INFO.name}
            className="w-11 h-11 rounded-full object-cover border-2 border-cyan-500 shrink-0"
          />
          <div className="text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1">
              <span>{INSTRUCTOR_INFO.brand}</span>
              <span className="inline-flex items-center text-amber-500 font-extrabold text-[11px]">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 5.0
              </span>
            </div>
            <div className="text-slate-500 text-[11px] truncate max-w-[200px]">{INSTRUCTOR_INFO.name}</div>
            <a 
              href={INSTRUCTOR_INFO.fastworkProfileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-700 hover:text-cyan-800 font-semibold text-[10px] flex items-center gap-0.5 mt-0.5 underline"
            >
              ดูประวัติบน Fastwork <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="course-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อคอร์ส, เครื่องมือ AI (เช่น Lovable, Claude, ChatGPT, Antigravity, Gamma, NotebookLM, Prompt)..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills Strip by Duration */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100 scrollbar-thin">
          {filterTabs.map((tab) => {
            const isActive = selectedDuration === tab.id;
            return (
              <button
                key={tab.id}
                id={`duration-tab-${tab.id}`}
                onClick={() => setSelectedDuration(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Results Count & Current filter status */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          พบ <strong>{filteredCourses.length}</strong> หลักสูตร {searchQuery && `(ค้นหา "${searchQuery}")`}
        </span>
        {(searchQuery || selectedDuration !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDuration('all');
            }}
            className="text-cyan-700 hover:underline font-medium"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">ไม่พบคอร์สเรียนที่ตรงกับเงื่อนไข</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            ลองค้นหาด้วยคำสำคัญอื่น หรือเลือกดูหมวดหมู่ "ทั้งหมด" เพื่อดูหลักสูตรทั้งหมด
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDuration('all');
            }}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
          >
            แสดงคอร์สทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isSelected = selectedCourse?.id === course.id;

            return (
              <div
                key={course.id}
                id={`course-card-${course.id}`}
                className={`relative rounded-3xl transition-all duration-200 flex flex-col justify-between bg-white border ${
                  isSelected
                    ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-xl'
                    : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Featured / Best Seller Badge */}
                {course.featured && (
                  <div className="absolute -top-3 left-6 z-10">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                      <Sparkles className="w-3 h-3 fill-white" /> แนะนำยอดนิยม 🔥
                    </span>
                  </div>
                )}

                {/* Top Section */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3 mt-1">
                    
                    {/* Category Duration Pill */}
                    
                    {course.durationCategory === 'vdo' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        เรียนผ่าน VDO Online (เวลาอิสระ)
                      </span>
                    ) : course.totalDays && course.totalHours ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                        course.totalDays === 1
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : course.totalDays === 2
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {course.totalDays === 1
                          ? `เรียน 1 วัน (${course.totalHours} ชม.)`
                          : `เรียน ${course.totalDays} วัน (${course.totalHours} ชม. วันละ ${course.hoursPerDay} ชม.)`}
                      </span>
                    ) : null}

                    {/* Fastwork Rating */}
                    {course.fastworkRating && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {course.fastworkRating.toFixed(1)} ({course.fastworkReviewCount || 20}+)
                      </span>
                    )}
                  </div>

                  {/* Title and Tagline */}
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${
                      course.badgeColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                      course.badgeColor === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                      course.badgeColor === 'purple' ? 'bg-purple-500/10 text-purple-600' :
                      course.badgeColor === 'violet' ? 'bg-violet-500/10 text-violet-600' :
                      course.badgeColor === 'indigo' ? 'bg-indigo-500/10 text-indigo-600' :
                      course.badgeColor === 'cyan' ? 'bg-cyan-500/10 text-cyan-600' :
                      course.badgeColor === 'rose' ? 'bg-rose-500/10 text-rose-600' :
                      'bg-amber-500/10 text-amber-600'
                    }`}>
                      {getCourseIcon(course.iconName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                        {course.titleEn || ''}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-3.5 line-clamp-2">
                    {course.tagline}
                  </p>

                  {/* Quick Topics preview */}
                  <div className="space-y-1.5 mb-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-cyan-600" /> เนื้อหา & Workshop:
                    </p>
                    <ul className="text-[11px] text-slate-600 space-y-1 pl-0.5">
                      {(course.topics || []).slice(0, 2).map((t, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bonus Gifts Preview */}
                  {course.bonusGifts && course.bonusGifts.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50/70 px-2.5 py-1.5 rounded-xl border border-amber-100 mb-2">
                      <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate font-medium">แถมฟรี: {course.bonusGifts[0]}</span>
                    </div>
                  )}

                  {/* Schedule Notice */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-100/70 px-2.5 py-1.5 rounded-xl">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{course.scheduleRuleNotice || 'ไม่มีข้อมูล'}</span>
                  </div>
                </div>

                {/* Bottom Footer: Price & Action */}
                <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-slate-900">
                        {formatCurrency(course.price)}
                      </span>
                      {course.originalPrice > course.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(course.originalPrice)}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      รวมเอกสาร & ใบ Certificate
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-details-${course.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetails(course);
                      }}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="ดูรายละเอียดคอร์สเต็ม"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    <button
                      id={`btn-select-course-${course.id}`}
                      onClick={() => onSelectCourse(course)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>เลือกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <span>เลือกคอร์สนี้</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}
