import { useState, useMemo, useEffect } from 'react';
import { Course, Booking, ScheduleSlot, UserCategory } from '../types';
import { 
  getValidNextDates, 
  generateSlotsForDate, 
  formatThaiDate, 
  formatThaiDateShort,
  isDateWeekend,
  getOperatingHours
} from '../utils/scheduleUtils';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  Info, 
  CalendarCheck, 
  Building2, 
  User, 
  ChevronRight, 
  RefreshCw 
} from 'lucide-react';

interface SlotSchedulerProps {
  course: Course;
  bookings: Booking[];
  selectedSlots: ScheduleSlot[];
  onSelectSlots: (slots: ScheduleSlot[]) => void;
  onProceedToForm: () => void;
  userCategory?: UserCategory;
  onUserCategoryChange?: (category: UserCategory) => void;
}

export function SlotScheduler({
  course,
  bookings,
  selectedSlots,
  onSelectSlots,
  onProceedToForm,
  userCategory = 'general',
  onUserCategoryChange,
}: SlotSchedulerProps) {
  const currentCategory: UserCategory = (course.categoryGroup === 'in-house-onsite' || course.categoryGroup === 'in-house-online') ? "corporate" : "general";
  useEffect(() => {
    if (onUserCategoryChange && userCategory !== currentCategory) {
      onUserCategoryChange(currentCategory);
    }
  }, [course.categoryGroup, onUserCategoryChange, userCategory, currentCategory]);
  


  const dates = useMemo(() => getValidNextDates(30), []);
  const [activeDayNumber, setActiveDayNumber] = useState<number>(1);

  // 4-hour daily course check
  const is4HourCourse = course.hoursPerDay === 4;

  // Track dates selected for each day (day 1, day 2, day 3, day 4...)
  const [chosenDatesByDay, setChosenDatesByDay] = useState<Record<number, string>>(() => {
    const initDate = dates.find((d) => {
      if (currentCategory === 'corporate') {
        return true; // Everyday (Mon - Sun)
      }
      return is4HourCourse ? d.isWeekend : true;
    })?.dateStr || dates[0].dateStr;
    return { 1: initDate };
  });

  // Re-initialize default date when category changes or course changes
  useEffect(() => {
    const initDate = dates.find((d) => {
      if (currentCategory === 'corporate') {
        return true; // Everyday (Mon - Sun)
      }
      return is4HourCourse ? d.isWeekend : true;
    })?.dateStr || dates[0].dateStr;

    setChosenDatesByDay({ 1: initDate });
    setActiveDayNumber(1);
  }, [currentCategory, course.id, dates, is4HourCourse]);

  // Current active date viewing in picker
  const activeViewingDate = chosenDatesByDay[activeDayNumber] || dates[0].dateStr;

  // Slots for the active viewing date
  const activeSlots = useMemo(() => {
    return generateSlotsForDate(activeViewingDate, course.hoursPerDay, bookings, undefined, currentCategory);
  }, [activeViewingDate, course.hoursPerDay, bookings, currentCategory]);

  // Slot selected for current active day
  const currentDaySlot = selectedSlots.find((s) => s.dayNumber === activeDayNumber);

  // Handle slot pick
  const handleSlotPick = (startTime: string, endTime: string) => {
    const newSlot: ScheduleSlot = {
      date: activeViewingDate,
      startTime,
      endTime,
      dayNumber: activeDayNumber,
    };

    // Filter out existing slot for this dayNumber and add new one
    const updated = selectedSlots.filter((s) => s.dayNumber !== activeDayNumber).concat(newSlot);
    // Sort by dayNumber
    updated.sort((a, b) => (a.dayNumber || 1) - (b.dayNumber || 1));
    onSelectSlots(updated);

    // If there are more days remaining and the next day hasn't been set yet, auto-advance
    if (activeDayNumber < course.totalDays) {
      const nextDay = activeDayNumber + 1;
      // Auto-suggest next date if not set
      if (!chosenDatesByDay[nextDay]) {
        const nextDateCandidate = dates.find((d) => {
          if (d.dateStr <= activeViewingDate) return false;
          if (currentCategory === 'corporate') {
            return true;
          }
          return is4HourCourse ? d.isWeekend : true;
        });

        if (nextDateCandidate) {
          setChosenDatesByDay((prev) => ({
            ...prev,
            [nextDay]: nextDateCandidate.dateStr,
          }));
        }
      }
      setActiveDayNumber(nextDay);
    }
  };

  
  const isScheduleComplete = selectedSlots.length >= course.totalDays && 
    Array.from({ length: course.totalDays }, (_, i) => i + 1).every((dNum) => 
      selectedSlots.some((s) => s.dayNumber === dNum)
    );

  if (course.durationCategory === 'vdo') {
    return (
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>ขั้นตอนที่ 2: เตรียมพร้อมเรียนคอร์ส VDO</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <span>{course.title}</span>
            </h2>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-indigo-900">คอร์สเรียนนี้เป็นรูปแบบ VDO Online</h3>
          <p className="text-indigo-700/80 max-w-md mx-auto">
            เรียนได้ทุกวันทุกเวลา หลังชำระเงินเรียบร้อยแล้ว Admin จะทำการตรวจสอบและลูกค้าจะได้สิทธิ์เข้าสู่ link VDO เพื่อเริ่มเรียนได้ทันที
          </p>
          
          <button
            onClick={() => {
              // Create a mock slot for VDO to pass validation
              onSelectSlots([{
                date: new Date().toISOString().slice(0, 10),
                startTime: '00:00',
                endTime: '23:59',
                dayNumber: 1
              }]);
              onProceedToForm();
            }}
            className="mt-6 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 mx-auto"
          >
            ไปที่ขั้นตอนถัดไป (กรอกข้อมูล) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    );
  }

  return (

    <section className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold mb-2">
            <CalendarCheck className="w-3.5 h-3.5 text-orange-600" />
            <span>ขั้นตอนที่ 2: เลือกวันและเวลาเรียน (ระบบล็อกเวลาอัตโนมัติ)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <span>ตารางจองคิว: {course.title}</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span className="text-sm text-stone-600">
              {course.totalDays === 1 
                ? `คอร์สเรียน 1 วัน (${course.totalHours} ชั่วโมง)` 
                : `คอร์สเรียน ${course.totalDays} วัน (รวม ${course.totalHours} ชั่วโมง • แบ่งเรียนวันละ ${course.hoursPerDay} ชั่วโมง)`}
            </span>
            {course.trainingMode === 'onsite' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 shadow-2xs">
                🏢 จัดอบรม Onsite ณ หน่วยงาน (เขต กทม.)
              </span>
            ) : (course.categoryGroup === 'in-house-onsite' || course.categoryGroup === 'in-house-online') ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 shadow-2xs">
                🌐 เรียนสด Online ผ่าน Google Meet
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                💻 เรียนสด 1:1 ผ่าน Google Meet
              </span>
            )}
          </div>
        </div>

        {/* Operating Hours Banner */}
        <div className="bg-stone-900 text-stone-100 px-4 py-3 rounded-2xl border border-stone-800 text-xs self-start sm:self-auto shadow-xs space-y-1">
          <div className="font-semibold text-orange-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> ช่วงเวลาทำการเปิดสอน
          </div>
          <div className="text-stone-300 space-y-0.5">
            <div className={currentCategory === 'general' ? 'text-white font-medium' : 'text-stone-400'}>
              • บุคคลทั่วไป: <strong className="text-orange-300">จ.-ศ. 19:30-22:30</strong> | <strong className="text-orange-300">เสาร์ 10:00-23:00</strong> | <strong className="text-orange-300">อาทิตย์ 10:00-22:00</strong>
            </div>
            <div className={currentCategory === 'corporate' ? 'text-white font-medium' : 'text-stone-400'}>
              • องค์กร (Corporate): <strong className="text-amber-300">09:00-20:00</strong> (เปิดสอนทุกวัน จันทร์-อาทิตย์)
            </div>
          </div>
        </div>
      </div>

      {/* Target Audience / Category Switcher */}
      <div className="bg-stone-100 p-2 rounded-2xl border border-stone-200">
        <div className="text-xs font-bold text-stone-600 uppercase tracking-wider px-2 py-1 mb-1">
          ประเภทผู้ลงทะเบียนเรียน:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            id="cat-btn-general"
            
            className={`p-3.5 rounded-xl text-left transition-all flex items-center justify-between cursor-default  ${
              currentCategory === 'general'
                ? 'bg-white text-stone-900 shadow-sm border border-orange-500/40 ring-2 ring-orange-500/20'
                : "bg-stone-200/60 text-stone-600 opacity-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                currentCategory === 'general' ? 'bg-orange-600 text-white' : 'bg-stone-300 text-stone-600'
              }`}>
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">บุคคลทั่วไป (รอบค่ำ & วันหยุด)</div>
                <div className="text-xs text-stone-500">จ.-ศ. 19:30-22:30 น. / ส. 10:00-23:00 น. / อา. 10:00-22:00 น.</div>
              </div>
            </div>
            {currentCategory === 'general' && <CheckCircle2 className="w-5 h-5 text-orange-600" />}
          </button>

          <button
            type="button"
            id="cat-btn-corporate"
            
            className={`p-3.5 rounded-xl text-left transition-all flex items-center justify-between cursor-default  ${
              currentCategory === 'corporate'
                ? 'bg-white text-stone-900 shadow-sm border border-amber-500/40 ring-2 ring-amber-500/20'
                : "bg-stone-200/60 text-stone-600 opacity-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                currentCategory === 'corporate' ? 'bg-amber-500 text-white' : 'bg-stone-300 text-stone-600'
              }`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm">องค์กร / บริษัท (In-House Training)</div>
                <div className="text-xs text-stone-500">เปิดรอบ 09:00-20:00 น. ทุกวัน (จันทร์-อาทิตย์)</div>
              </div>
            </div>
            {currentCategory === 'corporate' && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
          </button>
        </div>
      </div>

      {/* Multi-Day Step Navigator (If course has > 1 days) */}
      {course.totalDays > 1 && (
        <div className={`grid grid-cols-1 sm:grid-cols-${Math.min(course.totalDays, 4)} gap-2.5 p-2 bg-stone-100 rounded-2xl border border-stone-200`}>
          {Array.from({ length: course.totalDays }, (_, i) => i + 1).map((dayNum) => {
            const isDayActive = activeDayNumber === dayNum;
            const slotForDay = selectedSlots.find((s) => s.dayNumber === dayNum);

            return (
              <button
                key={dayNum}
                id={`tab-select-day${dayNum}`}
                onClick={() => {
                  if (!chosenDatesByDay[dayNum]) {
                    // find a default next date
                    const prevDate = chosenDatesByDay[dayNum - 1] || dates[0].dateStr;
                    const nextDate = dates.find((d) => {
                      if (d.dateStr <= prevDate) return false;
                      if (currentCategory === 'corporate') {
                        return true;
                      }
                      return is4HourCourse ? d.isWeekend : true;
                    })?.dateStr;
                    if (nextDate) {
                      setChosenDatesByDay((prev) => ({ ...prev, [dayNum]: nextDate }));
                    }
                  }
                  setActiveDayNumber(dayNum);
                }}
                className={`p-3 rounded-xl text-left transition-all flex items-center justify-between cursor-default  ${
                  isDayActive
                    ? 'bg-white shadow-sm border border-orange-500/40 ring-2 ring-orange-500/10'
                    : 'hover:bg-stone-200/60'
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    วันที่ {dayNum} (เรียน {course.hoursPerDay} ชม.)
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-stone-900 mt-0.5">
                    {slotForDay ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {formatThaiDateShort(slotForDay.date)} ({slotForDay.startTime}-{slotForDay.endTime}น.)
                      </span>
                    ) : (
                      <span className="text-stone-600">คลิกเพื่อเลือกรอบเรียน</span>
                    )}
                  </div>
                </div>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  slotForDay ? 'bg-emerald-100 text-emerald-700' : isDayActive ? 'bg-orange-600 text-white' : 'bg-stone-200 text-stone-600'
                }`}>
                  {slotForDay ? <CheckCircle2 className="w-4 h-4" /> : dayNum}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4-Hour Course Restriction Note for General */}
      {is4HourCourse && currentCategory === 'general' && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">ข้อกำหนดคอร์ส 8 ชั่วโมง (บุคคลทั่วไป - วันละ 4 ชม.):</strong> เนื่องจากวันธรรมดามีช่วงเวลาสอนรอบค่ำ 19:30-22:30 น. (3 ชม.) ซึ่งไม่เพียงพอต่อเนื้อหา 4 ชม./วัน ระบบจึงเปิดให้ลงทะเบียนเฉพาะ <strong className="underline">วันเสาร์ (10:00 - 23:00 น.) และวันอาทิตย์ (10:00 - 22:00 น.)</strong>
          </div>
        </div>
      )}

      {/* Date Picker Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-orange-600" />
            <span>เลือกวันที่สำหรับ {course.totalDays > 1 ? `วันที่ ${activeDayNumber}` : 'การเรียน'}:</span>
          </label>
          <span className="text-xs text-stone-500 font-medium">
            กำลังแสดงคิวของ: <strong className="text-stone-800">{formatThaiDate(activeViewingDate)}</strong>
          </span>
        </div>

        {/* Scrollable Horizontal Date Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {dates.map((d) => {
            const isWeekend = d.isWeekend;
            const dayOfWeek = new Date(d.dateStr + 'T00:00:00').getDay();
            const isSunday = dayOfWeek === 0;

            let disabled = false;
            let reasonText = '';

            if (currentCategory === 'corporate') {
              // Corporate can book any day 09:00 - 20:00
            } else {
              // General
              if (is4HourCourse && !isWeekend) {
                disabled = true;
                reasonText = 'เฉพาะ ส.-อา.';
              }
            }

            // Check if date is before previous day's chosen date
            if (activeDayNumber > 1) {
              const prevDate = chosenDatesByDay[activeDayNumber - 1];
              if (prevDate && d.dateStr <= prevDate) {
                disabled = true;
                reasonText = 'ก่อนวันก่อนหน้า';
              }
            }

            const isSelected = activeViewingDate === d.dateStr;

            return (
              <button
                key={d.dateStr}
                id={`date-chip-${d.dateStr}`}
                disabled={disabled}
                onClick={() => {
                  setChosenDatesByDay((prev) => ({
                    ...prev,
                    [activeDayNumber]: d.dateStr,
                  }));
                  // If date changed, remove existing slot for this dayNumber
                  if (currentDaySlot && currentDaySlot.date !== d.dateStr) {
                    onSelectSlots(selectedSlots.filter((s) => s.dayNumber !== activeDayNumber));
                  }
                }}
                className={`flex-shrink-0 w-24 py-3 px-2 rounded-2xl text-center border transition-all cursor-default  ${
                  disabled
                    ? 'opacity-40 bg-stone-100 border-stone-200 cursor-not-allowed text-stone-400'
                    : isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-orange-500/30'
                    : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800 hover:border-stone-300'
                }`}
              >
                <div className={`text-[11px] font-bold ${
                  isSelected ? 'text-orange-400' : isWeekend ? 'text-rose-600' : 'text-stone-600'
                }`}>
                  {d.dayName.replace('วัน', '')}
                </div>
                <div className="text-base font-extrabold my-0.5">
                  {formatThaiDateShort(d.dateStr)}
                </div>
                <div className={`text-[10px] ${
                  isSelected ? 'text-stone-300' : 'text-stone-500'
                }`}>
                  {reasonText ? reasonText : isWeekend ? 'ส.-อา.' : 'จ.-ศ.'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Available Time Slots Grid */}
      <div className="bg-stone-50 rounded-3xl p-5 sm:p-6 border border-stone-200 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>เลือกรอบเวลา ({formatThaiDate(activeViewingDate)})</span>
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              เวลาทำการ: {getOperatingHours(activeViewingDate, currentCategory)} (ความยาวรอบเรียน: {course.hoursPerDay} ชั่วโมง)
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-stone-600">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span>ว่างให้จอง</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
              <span>มีผู้จองแล้ว (ล็อก)</span>
            </div>
          </div>
        </div>

        {/* Slot Buttons */}
        {activeSlots.length === 0 ? (
          <div className="text-center py-10 text-stone-500 text-sm">
            ไม่มีรอบเวลาที่เปิดสอนในวันที่เลือก กรุณาเลือกวันอื่น
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeSlots.map((slot) => {
              const currentChosen = currentDaySlot?.date === activeViewingDate && currentDaySlot?.startTime === slot.startTime;

              return (
                <button
                  key={`${slot.startTime}-${slot.endTime}`}
                  id={`slot-btn-${slot.startTime.replace(':', '')}`}
                  disabled={slot.isOccupied}
                  onClick={() => handleSlotPick(slot.startTime, slot.endTime)}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    slot.isOccupied
                      ? 'bg-rose-50/70 border-rose-200 text-rose-800 opacity-80 cursor-not-allowed'
                      : currentChosen
                      ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-400/30'
                      : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-orange-400 text-stone-800 cursor-pointer shadow-xs'
                  }`}
                >
                  {/* Status Tag */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-extrabold tracking-tight">
                      {slot.startTime} - {slot.endTime} น.
                    </span>
                    {slot.isOccupied ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold">
                        <Lock className="w-3 h-3" /> จองแล้ว
                      </span>
                    ) : currentChosen ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> รอบที่เลือก
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        ว่าง {course.hoursPerDay} ชม.
                      </span>
                    )}
                  </div>

                  <div className={`text-xs ${currentChosen ? 'text-orange-100' : 'text-stone-500'}`}>
                    {slot.isOccupied ? (
                      <span className="text-rose-600 font-medium truncate block">
                        จองแล้ว ({slot.bookedBy || 'ติดคิวผู้เรียนอื่น'})
                      </span>
                    ) : (
                      <span>
                        {course.trainingMode === 'onsite'
                          ? '🏢 คลาสสด Onsite (เขต กทม.)'
                          : (course.categoryGroup === 'in-house-onsite' || course.categoryGroup === 'in-house-online')
                          ? '🌐 คลาสสดออนไลน์องค์กร (Google Meet)'
                          : '💻 คลาสสดออนไลน์ (Google Meet)'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* Bottom Summary Bar & Proceed CTA */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            สรุปเวลานัดหมาย ({currentCategory === 'corporate' ? 'รอบองค์กร' : 'รอบบุคคลทั่วไป'}) • ครบ {selectedSlots.length}/{course.totalDays} วัน
          </div>
          <div className="text-sm font-bold text-stone-900 mt-1 space-y-1">
            {Array.from({ length: course.totalDays }, (_, i) => i + 1).map((dNum) => {
              const s = selectedSlots.find((slot) => slot.dayNumber === dNum);
              return s ? (
                <div key={dNum} className="text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>วันที่ {dNum}: {formatThaiDate(s.date)} ({s.startTime} - {s.endTime} น.)</span>
                </div>
              ) : (
                <div key={dNum} className="text-stone-400">
                  • กรุณาเลือกรอบเวลาเรียนวันที่ {dNum}
                </div>
              );
            })}
          </div>
        </div>

        <button
          id="btn-proceed-to-form"
          disabled={!isScheduleComplete}
          onClick={onProceedToForm}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md ${
            isScheduleComplete
              ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30 cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>กรอกข้อมูลผู้เรียนและชำระเงิน</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </section>
  );
}
