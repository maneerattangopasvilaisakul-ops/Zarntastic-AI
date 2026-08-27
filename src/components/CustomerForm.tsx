import { useState, FormEvent } from 'react';
import { Course, CustomerInfo, ScheduleSlot } from '../types';
import { formatThaiDate, formatCurrency } from '../utils/scheduleUtils';
import { 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  Target, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  CalendarCheck,
  ShieldAlert,
  Building2,
  Receipt
} from 'lucide-react';

interface CustomerFormProps {
  course: Course;
  selectedSlots: ScheduleSlot[];
  customerInfo: CustomerInfo;
  onUpdateCustomer: (info: CustomerInfo) => void;
  onBackToSlots: () => void;
  onSubmitToPayment: () => void;
  isLoading: boolean;
  errorMessage?: string;
}

export function CustomerForm({
  course,
  selectedSlots,
  customerInfo,
  onUpdateCustomer,
  onBackToSlots,
  onSubmitToPayment,
  isLoading,
  errorMessage,
}: CustomerFormProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isCorporate = customerInfo.clientType === 'corporate';

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!customerInfo.name.trim()) newErrors.name = 'กรุณาระบุชื่อ-นามสกุล';
    if (!customerInfo.email.trim()) {
      newErrors.email = 'กรุณาระบุอีเมล';
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'กรุณาระบุเบอร์โทรศัพท์';
    } else if (customerInfo.phone.replace(/[^0-9]/g, '').length < 9) {
      newErrors.phone = 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 9-10 หลัก';
    }
    if (!customerInfo.lineId.trim()) newErrors.lineId = 'กรุณาระบุ LINE ID เพื่อรับลิงก์ห้องเรียน';

    if (isCorporate && !customerInfo.companyName?.trim()) {
      newErrors.companyName = 'กรุณาระบุชื่อบริษัท / องค์กร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmitToPayment();
    }
  };

  return (
    <section className="space-y-6">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold mb-2">
            <User className="w-3.5 h-3.5 text-cyan-600" />
            <span>ขั้นตอนที่ 3: ข้อมูลผู้เรียนและยืนยันการนัดหมาย</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            กรอกข้อมูลผู้เรียน
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            ข้อมูลนี้จะใช้สำหรับการส่งลิงก์เข้าเรียน Google Meet และออกเอกสารใบเสร็จ / หนังสือรับรอง
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToSlots}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>เปลี่ยนรอบเวลา</span>
        </button>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 text-sm text-rose-800">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">เกิดข้อผิดพลาด:</strong> {errorMessage}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Client Type Toggle */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl mb-4">
            <button
              type="button"
              onClick={() => onUpdateCustomer({ ...customerInfo, clientType: 'general' })}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                !isCorporate
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-cyan-600" />
              <span>บุคคลทั่วไป</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateCustomer({ ...customerInfo, clientType: 'corporate' })}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isCorporate
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>องค์กร / นิติบุคคล</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label htmlFor="input-customer-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {isCorporate ? 'ชื่อ-นามสกุล ผู้ประสานงาน / ผู้เข้าอบรม' : 'ชื่อ-นามสกุล (ผู้เรียน)'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  id="input-customer-name"
                  placeholder="เช่น นายธนากร ใจดี"
                  value={customerInfo.name}
                  onChange={(e) => onUpdateCustomer({ ...customerInfo, name: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                    errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="input-customer-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                อีเมล (สำหรับส่งลิงก์ห้องเรียน) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  id="input-customer-email"
                  placeholder="name@company.com"
                  value={customerInfo.email}
                  onChange={(e) => onUpdateCustomer({ ...customerInfo, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                    errors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="input-customer-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  id="input-customer-phone"
                  placeholder="081-234-5678"
                  value={customerInfo.phone}
                  onChange={(e) => onUpdateCustomer({ ...customerInfo, phone: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                    errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
            </div>

            {/* LINE ID */}
            <div>
              <label htmlFor="input-customer-line" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                LINE ID (สำหรับแจ้งเตือน & เชิญเข้ากลุ่ม) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  id="input-customer-line"
                  placeholder="line_username"
                  value={customerInfo.lineId}
                  onChange={(e) => onUpdateCustomer({ ...customerInfo, lineId: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                    errors.lineId ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.lineId && <p className="text-xs text-rose-600 mt-1">{errors.lineId}</p>}
            </div>

          </div>

          {/* Corporate Specific Fields */}
          {isCorporate && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>ข้อมูลนิติบุคคลสำหรับการออกเอกสารใบเสร็จ / ใบกำกับภาษี</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-corporate-company" className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อบริษัท / องค์กร <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-corporate-company"
                    placeholder="เช่น บริษัท อินโนเวชั่น จำกัด"
                    value={customerInfo.companyName || ''}
                    onChange={(e) => onUpdateCustomer({ ...customerInfo, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {errors.companyName && <p className="text-xs text-rose-600 mt-1">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เลขประจำตัวผู้เสียภาษี (Tax ID)
                  </label>
                  <input
                    type="text"
                    id="input-corporate-taxid"
                    placeholder="เช่น 0105559012345"
                    value={customerInfo.taxId || ''}
                    onChange={(e) => onUpdateCustomer({ ...customerInfo, taxId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Experience Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ระดับความคุ้นเคยกับเครื่องมือ AI
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { label: 'ไม่เคยใช้มาก่อน / มือใหม่', value: 'Beginner' },
                { label: 'เคยใช้ ChatGPT/Gemini ทั่วไป', value: 'Intermediate' },
                { label: 'เขียนโปรแกรม / ใช้ API แล้ว', value: 'Advanced' },
              ].map((lvl) => (
                <button
                  type="button"
                  key={lvl.value}
                  onClick={() => onUpdateCustomer({ ...customerInfo, experienceLevel: lvl.value })}
                  className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                    customerInfo.experienceLevel === lvl.value
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-900 font-semibold ring-1 ring-cyan-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goal & Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              เป้าหมายที่ต้องการนำ AI ไปใช้ / ความต้องการเพิ่มเติม (ถ้ามี)
            </label>
            <div className="relative">
              <Target className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <textarea
                id="input-customer-notes"
                rows={3}
                placeholder="เช่น อยากนำไปช่วยสรุปรายงานการประชุม, อยากทำบอทตอบคำถามสินค้าอัตโนมัติ..."
                value={customerInfo.notes}
                onChange={(e) => onUpdateCustomer({ ...customerInfo, notes: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              id="btn-submit-booking-form"
              disabled={isLoading}
              className="flex items-center gap-2 px-7 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>กำลังบันทึกข้อมูล...</span>
              ) : (
                <>
                  <span>ยืนยันการจอง & ไปหน้าชำระเงิน</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

        {/* Right 1 Col: Summary Card */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>สรุปรายการนัดหมาย</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              {course.title}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {course.titleEn || ''}
            </p>

            <div className="space-y-3 border-t border-slate-800 pt-4 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">ประเภทผู้เรียน:</span>
                <span className="font-semibold text-white">
                  {isCorporate ? 'องค์กร / บริษัท' : 'บุคคลทั่วไป'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">รูปแบบหลักสูตร:</span>
                <span className="font-semibold text-white">
                  {course.durationCategory === 'vdo'
                    ? 'เรียนผ่าน VDO Online (เวลาอิสระ)'
                    : course.totalDays === 1 ? `1 วัน (${course.totalHours} ชม.)` : `2 วัน (${course.totalHours} ชม.)`}
                </span>
              </div>

              {selectedSlots && selectedSlots.length > 0 ? (
                selectedSlots.map((s) => (
                  <div key={s.dayNumber} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                    <div className="text-[11px] font-bold text-cyan-400 mb-0.5">
                      วันที่ {s.dayNumber} ของการเรียน
                    </div>
                    <div className="text-sm font-bold text-white">
                      {formatThaiDate(s.date)}
                    </div>
                    <div className="text-slate-300 font-medium text-xs mt-0.5">
                      เวลา: {s.startTime} - {s.endTime} น.
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                  <div className="text-[11px] font-bold text-cyan-400 mb-0.5">
                    กำหนดการเรียน
                  </div>
                  <div className="text-sm font-bold text-white">
                    เรียนตามเวลาที่สะดวกได้ทันที
                  </div>
                  <div className="text-slate-300 font-medium text-xs mt-0.5">
                    เข้าดูบทเรียน Google Drive VDO ได้ตลอดชีพ
                  </div>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">ผู้สอน:</span>
                <span className="font-semibold text-white">{course.instructor?.name || 'อ.มณีรัตน์ ตั้งโอภาสวิไลสกุล'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">ช่องทางเรียน:</span>
                <span className="font-semibold text-emerald-400">
                  {course.durationCategory === 'vdo' ? 'Google Drive VDO Online' : 'Google Meet (Live 1-on-1)'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm text-slate-400">ยอดชำระสุทธิ:</span>
              <span className="text-2xl font-black text-cyan-400">
                {formatCurrency(course.price)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              * จ่ายผ่านพร้อมเพย์ หรือ โอนผ่านธนาคาร และแนบสลิปเพื่อยืนยันคิวทันที
            </p>
          </div>
        </div>

      </div>

    </section>
  );
}
