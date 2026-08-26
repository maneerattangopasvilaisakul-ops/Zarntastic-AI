import { useState, useMemo, FormEvent } from 'react';
import { Course, CourseCategoryGroup } from '../types';
import { formatCurrency } from '../utils/scheduleUtils';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  Calendar, 
  Check, 
  X, 
  AlertCircle, 
  BookOpen, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  Layers,
  Zap,
  Tag,
  DollarSign,
  Info,
  ExternalLink
} from 'lucide-react';

interface CourseManagementTabProps {
  courses: Course[];
  onAddCourse: (courseData: Partial<Course>) => Promise<boolean>;
  onEditCourse: (courseId: string, courseData: Partial<Course>) => Promise<boolean>;
  onDeleteCourse: (courseId: string) => Promise<boolean>;
  onResetCourses: () => Promise<boolean>;
}

export function CourseManagementTab({
  courses,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onResetCourses,
}: CourseManagementTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [durationFilter, setDurationFilter] = useState<string>('all');
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryGroup, setFormCategoryGroup] = useState<CourseCategoryGroup>('starter');
  const [formDurationCategory, setFormDurationCategory] = useState<string>('live');
  const [formTotalDays, setFormTotalDays] = useState<number>(1);
  const [formTotalHours, setFormTotalHours] = useState<number>(1);
  const [formHoursPerDay, setFormHoursPerDay] = useState<number>(1);
  const [formPrice, setFormPrice] = useState<number>(1500);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(2500);
  const [formLevel, setFormLevel] = useState<string>('เริ่มต้น (Beginner)');
  const [formScheduleRuleNotice, setFormScheduleRuleNotice] = useState<string>('จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)');
  const [formTargetAudience, setFormTargetAudience] = useState<string>('ผู้เริ่มต้นและผู้ที่ต้องการใช้ AI ในการทำงาน');
  const [formKeyFeatures, setFormKeyFeatures] = useState<string>('เรียนสด Online 1:1 แบบจับมือทำ\nเอกสารและ Prompt Pack ประกอบการเรียน\nซักถามและปรึกษาได้ตลอดการสอน');
  const [formCoverImage, setFormCoverImage] = useState<string>('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80');
  const [formRecommended, setFormRecommended] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open modal to add new course
  const handleOpenAdd = () => {
    setEditingCourse(null);
    setFormTitle('');
    setFormTitleEn('');
    setFormTagline('');
    setFormDescription('');
    setFormCategoryGroup('starter');
    setFormDurationCategory('live');
    setFormTotalDays(1);
    setFormTotalHours(1);
    setFormHoursPerDay(1);
    setFormPrice(1500);
    setFormOriginalPrice(2500);
    setFormLevel('เริ่มต้น (Beginner)');
    setFormScheduleRuleNotice('จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)');
    setFormTargetAudience('ผู้เริ่มต้นและผู้ที่ต้องการใช้ AI ในการทำงาน');
    setFormKeyFeatures('เรียนสด Online 1:1 แบบจับมือทำ\nเอกสารและ Prompt Pack ประกอบการเรียน\nซักถามและปรึกษาได้ตลอดการสอน');
    setFormCoverImage('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80');
    setFormRecommended(false);
    setIsFormModalOpen(true);
  };

  // Open modal to edit existing course
  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setFormTitle(course.title);
    setFormTitleEn(course.titleEn || '');
    setFormTagline(course.tagline || '');
    setFormDescription(course.description || '');
    setFormCategoryGroup(course.categoryGroup || 'starter');
    setFormDurationCategory(course.durationCategory || 'live');
    setFormTotalDays(course.totalDays || 1);
    setFormTotalHours(course.totalHours || 1);
    setFormHoursPerDay(course.hoursPerDay || Math.ceil((course.totalHours || 1) / (course.totalDays || 1)));
    setFormPrice(course.price || 0);
    setFormOriginalPrice(course.originalPrice || (course.price || 0) * 1.5);
    setFormLevel(course.level || 'เริ่มต้น (Beginner)');
    setFormScheduleRuleNotice(course.scheduleRuleNotice || 'จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)');
    setFormTargetAudience(typeof course.targetAudience === 'string' ? course.targetAudience : Array.isArray(course.targetAudience) ? course.targetAudience.join(', ') : '');
    setFormKeyFeatures(course.keyFeatures ? course.keyFeatures.join('\n') : '');
    setFormCoverImage(course.coverImage || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80');
    setFormRecommended(Boolean(course.recommended));
    setIsFormModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('กรุณาระบุชื่อคอร์สเรียน');
      return;
    }
    if (formPrice <= 0) {
      alert('กรุณาระบุราคาคอร์สเรียนที่ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    const coursePayload: Partial<Course> = {
      title: formTitle.trim(),
      titleEn: formTitleEn.trim() || formTitle.trim(),
      tagline: formTagline.trim() || formTitle.trim(),
      description: formDescription.trim(),
      categoryGroup: formCategoryGroup,
      durationCategory: formDurationCategory,
      totalDays: Number(formTotalDays) || 1,
      totalHours: Number(formTotalHours) || 1,
      hoursPerDay: Number(formHoursPerDay) || Math.ceil((Number(formTotalHours) || 1) / (Number(formTotalDays) || 1)),
      price: Number(formPrice),
      originalPrice: Number(formOriginalPrice) || Number(formPrice) * 1.5,
      level: formLevel as any,
      scheduleRuleNotice: formScheduleRuleNotice.trim(),
      targetAudience: formTargetAudience.trim(),
      keyFeatures: formKeyFeatures.split('\n').map(s => s.trim()).filter(Boolean),
      coverImage: formCoverImage.trim(),
      recommended: formRecommended,
      isActive: true,
    };

    let success = false;
    if (editingCourse) {
      success = await onEditCourse(editingCourse.id, coursePayload);
      if (success) showToast(`อัปเดตคอร์ส "${coursePayload.title}" เรียบร้อยแล้ว`);
    } else {
      success = await onAddCourse(coursePayload);
      if (success) showToast(`เพิ่มคอร์สใหม่ "${coursePayload.title}" เรียบร้อยแล้ว`);
    }

    setIsSubmitting(false);
    if (success) {
      setIsFormModalOpen(false);
    }
  };

  // Delete course action
  const handleConfirmDelete = async () => {
    if (!deletingCourse) return;
    setIsSubmitting(true);
    const success = await onDeleteCourse(deletingCourse.id);
    setIsSubmitting(false);
    if (success) {
      showToast(`ลบคอร์ส "${deletingCourse.title}" เรียบร้อยแล้ว`);
      setDeletingCourse(null);
    }
  };

  // Reset to default action
  const handleConfirmReset = async () => {
    setIsSubmitting(true);
    const success = await onResetCourses();
    setIsSubmitting(false);
    if (success) {
      showToast('รีเซ็ตรายการคอร์สเรียน AI เป็นค่าเริ่มต้นเรียบร้อยแล้ว');
      setIsResetConfirmOpen(false);
    }
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch = 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.titleEn && c.titleEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.tagline && c.tagline.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = categoryFilter === 'all' || c.categoryGroup === categoryFilter;

      let matchDuration = true;
      if (durationFilter === '1-day') matchDuration = c.totalDays === 1;
      else if (durationFilter === '2-day') matchDuration = c.totalDays === 2;
      else if (durationFilter === '4-day') matchDuration = c.totalDays === 4;
      else if (durationFilter === 'vdo') matchDuration = c.durationCategory === 'vdo';

      return matchSearch && matchCategory && matchDuration;
    });
  }, [courses, searchTerm, categoryFilter, durationFilter]);

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-cyan-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar with Action Controls */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              จัดการคอร์สเรียน AI (Course Catalog)
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {courses.length} คอร์สทั้งหมด
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            เพิ่มคอร์สใหม่, ปรับแต่งระยะเวลาเรียน (1 วัน/2 วัน), กำหนดจำนวนชั่วโมง (1, 2, 3, 4, 6, 8, 12 ชม.), ราคา และเงื่อนไขเวลาเปิดสอน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="รีเซ็ตคอร์สกลับเป็นค่าเริ่มต้น 15 คอร์ส"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มคอร์สเรียน AI ใหม่</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col lg:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อคอร์ส, คีย์เวิร์ด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full lg:w-auto flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 text-xs">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'starter', label: 'Starter' },
            { id: 'productivity', label: 'Productivity' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'web', label: 'Web & App' },
            { id: 'claude', label: 'Claude & Skills' },
            { id: 'coaching', label: 'Coaching' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Duration Filter */}
        <div className="ml-auto w-full lg:w-auto flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap">ระยะเวลา:</span>
          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">ทุกระยะเวลา</option>
            <option value="1-day">1 วัน</option>
            <option value="2-day">2 วัน</option>
            <option value="4-day">4 วัน</option>
            <option value="vdo">VDO Online</option>
          </select>
        </div>
      </div>

      {/* Courses Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
          >
            {/* Card Header & Image */}
            <div>
              <div className="relative h-40 bg-slate-100 overflow-hidden">
                <img
                  src={course.coverImage || 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80'}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback image
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                {/* Category & Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="bg-slate-900/90 backdrop-blur-md text-cyan-300 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-cyan-500/30">
                    {course.categoryGroup || 'course'}
                  </span>
                  {course.recommended && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                      ★ BESTSELLER
                    </span>
                  )}
                </div>

                {/* Duration Tag */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{course.totalDays || 1} วัน ({course.totalHours || 1} ชม.)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>วันละ {course.hoursPerDay || 1} ชม.</span>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">
                    {course.title}
                  </h3>
                  {course.titleEn && (
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5 line-clamp-1">
                      {course.titleEn}
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {course.description || course.tagline}
                </p>

                {/* Schedule Rules Condition Notice */}
                {course.scheduleRuleNotice && (
                  <div className="bg-cyan-50/70 border border-cyan-200/80 rounded-xl p-2.5 text-[11px] text-cyan-950 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{course.scheduleRuleNotice}</span>
                  </div>
                )}

                {/* Price Display */}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 line-through mr-1.5">
                      {formatCurrency(course.originalPrice || course.price * 1.5)}
                    </span>
                    <span className="text-base font-black text-indigo-900">
                      {formatCurrency(course.price)}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {course.durationCategory === 'vdo' ? 'VDO Online' : 'Live 1:1'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 font-mono">
                ID: {course.id.slice(0, 14)}...
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(course)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  title="แก้ไขรายละเอียดคอร์สนี้"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>แก้ไข</span>
                </button>

                <button
                  onClick={() => setDeletingCourse(course)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="ลบคอร์สนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ลบ</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">ไม่พบคอร์สเรียนที่ตรงกับเงื่อนไขการค้นหา</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองหมวดหมู่และระยะเวลา
          </p>
          <button
            onClick={() => { setSearchTerm(''); setCategoryFilter('all'); setDurationFilter('all'); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      )}

      {/* --- ADD / EDIT COURSE MODAL --- */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>{editingCourse ? 'แก้ไขรายละเอียดคอร์สเรียน AI' : 'เพิ่มคอร์สเรียน AI ใหม่'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  กรอกรายละเอียดคอร์ส, ระยะเวลา, จำนวนชั่วโมง, ราคา และเงื่อนไขเวลาเปิดสอน
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Row 1: Course Title */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  ชื่อคอร์สเรียน (Course Title) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น AI Automation Workshop: สร้าง AI Workflow อัตโนมัติ"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Row 2: English Title & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ชื่อภาษาอังกฤษ (English Title)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI Automation Workshop Live (3 Hours)"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    สโลแกน / คำโปรยสั้น (Tagline)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น เรียนรู้การเชื่อมต่อ AI กับระบบทำงานจริง"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Category & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    หมวดหมู่คอร์ส (Category Group)
                  </label>
                  <select
                    value={formCategoryGroup}
                    onChange={(e) => setFormCategoryGroup(e.target.value as CourseCategoryGroup)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="starter">Starter พื้นฐาน AI</option>
                    <option value="productivity">Productivity & งานเอกสาร</option>
                    <option value="marketing">Content & การตลาด</option>
                    <option value="web">Landing Page & No-Code Web</option>
                    <option value="claude">Claude & AI Agent Skills</option>
                    <option value="coaching">Private Coaching องค์กร/ธุรกิจ</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    รูปแบบการเรียน (Course Format)
                  </label>
                  <select
                    value={formDurationCategory}
                    onChange={(e) => setFormDurationCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="live">เรียนสด Online 1:1 ผ่าน Google Meet</option>
                    <option value="vdo">VDO Online (เรียนได้ตลอด 24 ชม.)</option>
                    <option value="onsite">On-Site วิทยากรบรรยายนอกสถานที่</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Total Days, Total Hours, Hours per Day */}
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-indigo-950 mb-1">
                    จำนวนวันเรียน (Days)
                  </label>
                  <select
                    value={formTotalDays}
                    onChange={(e) => {
                      const days = Number(e.target.value);
                      setFormTotalDays(days);
                      setFormHoursPerDay(Math.ceil(formTotalHours / days));
                    }}
                    className="w-full p-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={1}>1 วัน</option>
                    <option value={2}>2 วัน</option>
                    <option value={3}>3 วัน</option>
                    <option value={4}>4 วัน</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-indigo-950 mb-1">
                    จำนวนชั่วโมงรวม (Hours)
                  </label>
                  <select
                    value={formTotalHours}
                    onChange={(e) => {
                      const hours = Number(e.target.value);
                      setFormTotalHours(hours);
                      setFormHoursPerDay(Math.ceil(hours / formTotalDays));
                    }}
                    className="w-full p-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={1}>1 ชม.</option>
                    <option value={2}>2 ชม.</option>
                    <option value={3}>3 ชม.</option>
                    <option value={4}>4 ชม.</option>
                    <option value={6}>6 ชม.</option>
                    <option value={8}>8 ชม.</option>
                    <option value={12}>12 ชม.</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-indigo-950 mb-1">
                    ชั่วโมงต่อวัน (h/Day)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={formHoursPerDay}
                    onChange={(e) => setFormHoursPerDay(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Price & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    ราคาโปรโมชั่น (บาท) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    placeholder="เช่น 1500, 3900, 7500"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ราคาปกติ (บาท - สำหรับแสดงส่วนลด)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="เช่น 2500, 5900, 12000"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 6: Schedule Conditions (เงื่อนไขเวลาเปิดสอน) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  เงื่อนไขเวลาเปิดสอน (Schedule Conditions Notice)
                </label>
                <input
                  type="text"
                  placeholder="เช่น จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00) หรือ เฉพาะเสาร์-อาทิตย์ สำหรับรอบ 4 ชม."
                  value={formScheduleRuleNotice}
                  onChange={(e) => setFormScheduleRuleNotice(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    'จันทร์-ศุกร์ (19.30-22.30) และ เสาร์-อาทิตย์ (09.00-18.00)',
                    'สำหรับบุคคลทั่วไป: ต้องเลือกเรียนวันเสาร์-อาทิตย์เท่านั้น (วันละ 4 ชม. 09.00-18.00 น.)',
                    'VDO Online เข้าเรียนได้ตลอด 24 ชม.',
                    'รอบองค์กร (Corporate): จันทร์-เสาร์ (09.00-18.00 น.)',
                  ].map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFormScheduleRuleNotice(preset)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] cursor-pointer"
                    >
                      + {preset.slice(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 7: Description */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  รายละเอียดหลักสูตร (Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="อธิบายเนื้อหาการเรียน เครื่องมือ AI ที่ใช้ และผลลัพธ์ที่จะได้รับ..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Row 8: Key Features (บรรทัดละข้อ) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  จุดเด่นของคอร์ส / สิ่งที่จะได้รับ (ใส่บรรทัดละ 1 ข้อ)
                </label>
                <textarea
                  rows={3}
                  placeholder="เรียนสด 1:1 แบบจับมือทำ&#10;Prompt Pack พร้อมใช้&#10;ปรึกษาได้ต่อเนื่อง"
                  value={formKeyFeatures}
                  onChange={(e) => setFormKeyFeatures(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Row 9: Target Audience & Cover Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    เหมาะสำหรับใคร (Target Audience)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นักการตลาด เจ้าของธุรกิจ พนักงานประจำ"
                    value={formTargetAudience}
                    onChange={(e) => setFormTargetAudience(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    URL รูปภาพหน้าปก (Cover Image)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formCoverImage}
                    onChange={(e) => setFormCoverImage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 10: Recommended Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="recommendedCheckbox"
                  checked={formRecommended}
                  onChange={(e) => setFormRecommended(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="recommendedCheckbox" className="font-bold text-slate-800 cursor-pointer">
                  ติดป้ายแนะนำ (Best Seller / Recommended)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>กำลังบันทึก...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingCourse ? 'บันทึกการแก้ไข' : 'เพิ่มคอร์สเรียน'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                ยืนยันการลบคอร์สเรียนนี้?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                คุณกำลังจะลบหลักสูตร <strong className="text-slate-900">"{deletingCourse.title}"</strong> ออกจากระบบ
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                {isSubmitting ? 'กำลังลบ...' : 'ยืนยันลบคอร์ส'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RESET TO DEFAULT CONFIRMATION MODAL --- */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                คืนค่ารายการคอร์สเป็นค่าเริ่มต้น?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                ระบบจะคืนค่ารายการคอร์สมาตรฐานทั้งหมด 15 คอร์ส การเปลี่ยนแปลงที่เพิ่มหรือแก้ไขไว้จะถูกรีเซ็ต
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmReset}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                {isSubmitting ? 'กำลังรีเซ็ต...' : 'ยืนยันคืนค่า'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
