import React, { useState, useMemo } from 'react';
import { Booking, ScheduleSlot } from '../types';
import { 
  getValidNextDates, 
  generateSlotsForDate, 
  formatThaiDate, 
  formatThaiDateShort,
  formatCurrency,
  getOperatingHours
} from '../utils/scheduleUtils';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Clock, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  existingBookings?: Booking[];
  onSuccess: (updatedBooking: Booking) => void;
  isAdminMode?: boolean;
}

export function EditBookingModal({
  isOpen,
  onClose,
  booking,
  existingBookings = [],
  onSuccess,
  isAdminMode = false,
}: EditBookingModalProps) {
  if (!isOpen || !booking) return null;

  const [activeTab, setActiveTab] = useState<'contact' | 'schedule'>('contact');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State - Contact
  const [name, setName] = useState(booking.customer.name || '');
  const [phone, setPhone] = useState(booking.customer.phone || '');
  const [email, setEmail] = useState(booking.customer.email || '');
  const [lineId, setLineId] = useState(booking.customer.lineId || '');
  const [notes, setNotes] = useState(booking.customer.notes || '');
  const [experienceLevel, setExperienceLevel] = useState(booking.customer.experienceLevel || 'Beginner');

  // Form State - Schedule
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(() => {
    return booking.schedule ? JSON.parse(JSON.stringify(booking.schedule)) : [];
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Calculate hours per day
  const hoursPerDay = useMemo(() => {
    if (booking.schedule && booking.schedule.length > 0) {
      const slot = booking.schedule[0];
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      return Math.max(1, Math.round(diff / 60));
    }
    return Math.round((booking.totalHours || 3) / (booking.totalDays || 1));
  }, [booking]);

  const dates = useMemo(() => getValidNextDates(30), []);

  const currentSlotToEdit = schedule[selectedDayIndex];
  const userCategory = (booking.customer?.notes?.toLowerCase().includes('corporate') || booking.courseId?.includes('corporate'))
    ? 'corporate'
    : 'general';

  // Available slots for the current slot's date
  const availableSlotsForDate = useMemo(() => {
    if (!currentSlotToEdit?.date) return [];
    return generateSlotsForDate(
      currentSlotToEdit.date,
      hoursPerDay,
      existingBookings,
      booking.id,
      userCategory
    );
  }, [currentSlotToEdit?.date, hoursPerDay, existingBookings, booking.id, userCategory]);

  const handleUpdateSlotDate = (newDateStr: string) => {
    setSchedule(prev => {
      const copy = [...prev];
      if (copy[selectedDayIndex]) {
        copy[selectedDayIndex] = {
          ...copy[selectedDayIndex],
          date: newDateStr,
        };
      }
      return copy;
    });
  };

  const handleUpdateSlotTime = (startTime: string, endTime: string) => {
    setSchedule(prev => {
      const copy = [...prev];
      if (copy[selectedDayIndex]) {
        copy[selectedDayIndex] = {
          ...copy[selectedDayIndex],
          startTime,
          endTime,
        };
      }
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('กรุณาระบุชื่อ-นามสกุล');
      return;
    }
    if (!phone.trim()) {
      toast.error('กรุณาระบุเบอร์โทรศัพท์');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const token = localStorage.getItem('token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            lineId: lineId.trim(),
            notes: notes.trim(),
            experienceLevel,
          },
          schedule: schedule.length > 0 ? schedule : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถบันทึกข้อมูลการแก้ไขได้');
      }

      toast.success('บันทึกการแก้ไขข้อมูลการจองสำเร็จ!');
      onSuccess(data.booking);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      toast.error(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-orange-600/20 text-orange-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </span>
              <h3 className="font-extrabold text-lg sm:text-xl text-white">
                แก้ไขข้อมูลการจอง
              </h3>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              รหัสการจอง: <strong className="font-mono text-orange-300">{booking.id}</strong> | {booking.courseTitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'contact'
                ? 'border-orange-600 text-orange-600 bg-white rounded-t-xl'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. ข้อมูลผู้เรียน & ข้อมูลติดต่อ</span>
          </button>

          {schedule.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'border-orange-600 text-orange-600 bg-white rounded-t-xl'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>2. ปรับเปลี่ยนวันเวลาเรียน ({schedule.length} วัน)</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-5 sm:p-6 flex-1 space-y-5">
          
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  คุณสามารถแก้ไขชื่อ เบอร์โทร อีเมลสำหรับรับใบนัดหมาย และ LINE ID ได้ก่อนชำระเงิน
                </span>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  ชื่อ-นามสกุล ผู้เรียน <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
                    placeholder="เช่น สมชาย ใจดี"
                  />
                </div>
              </div>

              {/* Phone & LINE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    เบอร์โทรศัพท์ติดต่อ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
                      placeholder="เช่น 0812345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    LINE ID (สำหรับส่งใบนัดหมาย)
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-[#06C755]" />
                    <input
                      type="text"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
                      placeholder="เช่น @zarntastic หรือไอดีไลน์"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  อีเมล (สำหรับรับใบนัดหมายและลิงก์ Google Meet)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
                    placeholder="เช่น yourname@gmail.com"
                  />
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  ระดับพื้นฐานความรู้
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium"
                >
                  <option value="Beginner">เริ่มต้นใหม่ ไม่มีพื้นฐาน (Beginner)</option>
                  <option value="Intermediate">พอมีพื้นฐานบ้าง เคยลองใช้ AI ทั่วไป (Intermediate)</option>
                  <option value="Advanced">มีประสบการณ์ ใช้งานจริงจัง ต้องการ Advance (Advanced)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  โจทย์งานจริง หรือเรื่องที่อยากให้อาจารย์เน้นเป็นพิเศษ
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white font-medium resize-none"
                  placeholder="เช่น อยากเน้นทำ Webapp ขายของ, อยากทำระบบอัตโนมัติเชื่อม Google Sheets และ LINE เป็นต้น"
                />
              </div>

            </div>
          )}

          {activeTab === 'schedule' && schedule.length > 0 && (
            <div className="space-y-4">
              
              {/* Day selection tabs if multiple days */}
              {schedule.length > 1 && (
                <div className="flex gap-2">
                  {schedule.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        selectedDayIndex === idx
                          ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                          : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      วันที่ {s.dayNumber || idx + 1}: {formatThaiDateShort(s.date)}
                    </button>
                  ))}
                </div>
              )}

              {/* Current slot info badge */}
              {currentSlotToEdit && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-indigo-900">รอบเรียนปัจจุบันวันที่ {currentSlotToEdit.dayNumber || selectedDayIndex + 1}: </span>
                    <span className="text-indigo-800 font-semibold">{formatThaiDate(currentSlotToEdit.date)}</span>
                  </div>
                  <div className="px-2.5 py-1 bg-white font-mono font-bold text-indigo-950 rounded-lg border border-indigo-200">
                    {currentSlotToEdit.startTime} - {currentSlotToEdit.endTime} น.
                  </div>
                </div>
              )}

              {/* Operating hours info */}
              {currentSlotToEdit?.date && (
                <div className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>
                    เวลาทำการสำหรับวันที่เลือก: <strong>{getOperatingHours(currentSlotToEdit.date, userCategory)}</strong>
                  </span>
                </div>
              )}

              {/* Date selection list */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  เลือกวันที่ต้องการเรียนใหม่ (30 วันล่วงหน้า)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-stone-200 rounded-xl bg-stone-50">
                  {dates.map((d) => {
                    const isSelected = currentSlotToEdit?.date === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        onClick={() => handleUpdateSlotDate(d.dateStr)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                            : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-100 font-medium'
                        }`}
                      >
                        <div className="text-[10px] opacity-80">{d.dayName}</div>
                        <div>{formatThaiDateShort(d.dateStr)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slot selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                  เลือกรอบเวลาเรียนใหม่ ({hoursPerDay} ชั่วโมง)
                </label>

                {availableSlotsForDate.length === 0 ? (
                  <div className="p-4 bg-stone-100 rounded-xl text-center text-xs text-stone-500">
                    ไม่มีรอบเวลาว่างสำหรับวันที่เลือก หรือเป็นช่วงเวลาปิดทำการ กรุณาเลือกวันอื่น
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                    {availableSlotsForDate.map((slot, sIdx) => {
                      const isCurrent = currentSlotToEdit?.startTime === slot.startTime && currentSlotToEdit?.endTime === slot.endTime;
                      const isOccupied = slot.isOccupied;

                      return (
                        <button
                          key={sIdx}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => handleUpdateSlotTime(slot.startTime, slot.endTime)}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all text-xs cursor-pointer ${
                            isOccupied
                              ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
                              : isCurrent
                                ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-2 ring-orange-400/40'
                                : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className={`w-3.5 h-3.5 ${isCurrent ? 'text-orange-600' : 'text-stone-400'}`} />
                            <span className="font-mono">{slot.startTime} - {slot.endTime} น.</span>
                          </div>

                          {isOccupied ? (
                            <span className="text-[10px] text-stone-400">จองแล้ว</span>
                          ) : isCurrent ? (
                            <span className="text-[10px] text-orange-600 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> เลือกอยู่
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold">ว่าง</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกการแก้ไข</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
