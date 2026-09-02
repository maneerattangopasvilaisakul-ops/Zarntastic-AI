import React, { useState, useMemo } from 'react';
import { Booking, BookingStatus, ScheduleSlot } from '../types';
import { COURSES } from '../data/courses';
import { 
  formatThaiDate, 
  formatThaiDateShort, 
  formatCurrency,
  THAI_DAYS, 
  THAI_MONTHS_SHORT,
  isDateWeekend,
  getOperatingHours
} from '../utils/scheduleUtils';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Video, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Filter, 
  Sparkles, 
  Layers, 
  CalendarDays, 
  LayoutGrid, 
  Info,
  Building2,
  Phone,
  MessageSquare
} from 'lucide-react';

interface AdminCalendarViewProps {
  bookings: Booking[];
  onInspectBooking: (booking: Booking) => void;
}

interface CalendarDayEvent {
  booking: Booking;
  slot: ScheduleSlot;
}

export function AdminCalendarView({
  bookings,
  onInspectBooking,
}: AdminCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'under_review'>('all');
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Extract all calendar events from bookings
  const allEvents = useMemo<CalendarDayEvent[]>(() => {
    const events: CalendarDayEvent[] = [];
    bookings.forEach((b) => {
      // Filter out rejected or cancelled bookings
      if (b.payment.status === 'cancelled' || b.payment.status === 'rejected') return;

      if (statusFilter === 'confirmed' && b.payment.status !== 'confirmed' && b.payment.status !== 'completed') {
        return;
      }
      if (statusFilter === 'under_review' && b.payment.status !== 'under_review' && b.payment.status !== 'pending_slip') {
        return;
      }

      b.schedule.forEach((slot) => {
        events.push({
          booking: b,
          slot,
        });
      });
    });

    // Sort by startTime
    return events.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));
  }, [bookings, statusFilter]);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarDayEvent[]>();
    allEvents.forEach((ev) => {
      const dateStr = ev.slot.date;
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(ev);
    });
    return map;
  }, [allEvents]);

  // Current Year & Month
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setSelectedDayStr(`${y}-${m}-${d}`);
  };

  // Week navigation
  const handlePrevWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() - 7);
    setCurrentDate(next);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  // Month Grid Calculation
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 6 = Sat
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      events: CalendarDayEvent[];
      totalBookedHours: number;
    }> = [];

    const todayStr = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })();

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const d = new Date(dateStr + 'T00:00:00');
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const evs = eventsByDate.get(dateStr) || [];
      const totalBookedHours = evs.reduce((acc, ev) => {
        const [sh, sm] = ev.slot.startTime.split(':').map(Number);
        const [eh, em] = ev.slot.endTime.split(':').map(Number);
        return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      }, 0);

      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend,
        events: evs,
        totalBookedHours,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const d = new Date(dateStr + 'T00:00:00');
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const evs = eventsByDate.get(dateStr) || [];
      const totalBookedHours = evs.reduce((acc, ev) => {
        const [sh, sm] = ev.slot.startTime.split(':').map(Number);
        const [eh, em] = ev.slot.endTime.split(':').map(Number);
        return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      }, 0);

      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend,
        events: evs,
        totalBookedHours,
      });
    }

    // Next month padding (make up to 35 or 42 grid cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const d = new Date(dateStr + 'T00:00:00');
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const evs = eventsByDate.get(dateStr) || [];
      const totalBookedHours = evs.reduce((acc, ev) => {
        const [sh, sm] = ev.slot.startTime.split(':').map(Number);
        const [eh, em] = ev.slot.endTime.split(':').map(Number);
        return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      }, 0);

      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend,
        events: evs,
        totalBookedHours,
      });
    }

    return days;
  }, [currentYear, currentMonth, eventsByDate]);

  // Week View Calculation
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 = Sun
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek); // Go to Sunday

    const todayStr = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      dayName: string;
      isToday: boolean;
      isWeekend: boolean;
      events: CalendarDayEvent[];
      totalBookedHours: number;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const evs = eventsByDate.get(dateStr) || [];
      const totalBookedHours = evs.reduce((acc, ev) => {
        const [sh, sm] = ev.slot.startTime.split(':').map(Number);
        const [eh, em] = ev.slot.endTime.split(':').map(Number);
        return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      }, 0);

      days.push({
        dateStr,
        dayNumber: d.getDate(),
        dayName: THAI_DAYS[d.getDay()],
        isToday: dateStr === todayStr,
        isWeekend,
        events: evs,
        totalBookedHours,
      });
    }

    return days;
  }, [currentDate, eventsByDate]);

  // Selected Day Details
  const selectedDayEvents = useMemo(() => {
    if (!selectedDayStr) return [];
    return eventsByDate.get(selectedDayStr) || [];
  }, [selectedDayStr, eventsByDate]);

  // Overall Month Statistics
  const monthStats = useMemo(() => {
    let confirmedCount = 0;
    let underReviewCount = 0;
    let totalTeachingHours = 0;

    monthDays.filter(d => d.isCurrentMonth).forEach(d => {
      d.events.forEach(ev => {
        if (ev.booking.payment.status === 'confirmed' || ev.booking.payment.status === 'completed') {
          confirmedCount++;
        } else if (ev.booking.payment.status === 'under_review' || ev.booking.payment.status === 'pending_slip') {
          underReviewCount++;
        }
        const [sh, sm] = ev.slot.startTime.split(':').map(Number);
        const [eh, em] = ev.slot.endTime.split(':').map(Number);
        totalTeachingHours += ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      });
    });

    return {
      confirmedCount,
      underReviewCount,
      totalTeachingHours,
      totalSessions: confirmedCount + underReviewCount,
    };
  }, [monthDays]);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'under_review':
      case 'pending_slip':
        return 'bg-amber-500 text-white border-amber-600';
      default:
        return 'bg-stone-500 text-white border-stone-600';
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold"><CheckCircle2 className="w-3 h-3" /> ยืนยันแล้ว</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">เรียนเสร็จสิ้น</span>;
      case 'under_review':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse"><Clock className="w-3 h-3" /> รอตรวจสลิป</span>;
      case 'pending_slip':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold">รอลูกค้าแนบ</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Calendar Header & Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Title & Month Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-stone-900">
                {viewType === 'month' 
                  ? `${THAI_MONTHS_SHORT[currentMonth]} ${currentYear + 543} (ค.ศ. ${currentYear})`
                  : `สัปดาห์ของ ${formatThaiDateShort(weekDays[0]?.dateStr)} - ${formatThaiDateShort(weekDays[6]?.dateStr)}`
                }
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              ปฏิทินตารางสอนจริง • แสดงคิวที่จองแล้วและรอบเวลาว่างของอาจารย์
            </p>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ทั้งหมด ({allEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('confirmed')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'confirmed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              เฉพาะยืนยันแล้ว
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('under_review')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === 'under_review'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              รอตรวจสลิป
            </button>
          </div>

          {/* Month / Week View Mode Toggle */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setViewType('month')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewType === 'month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>รายเดือน</span>
            </button>
            <button
              type="button"
              onClick={() => setViewType('week')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewType === 'week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>รายสัปดาห์</span>
            </button>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={viewType === 'month' ? handlePrevMonth : handlePrevWeek}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer"
              title="ก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              วันนี้
            </button>

            <button
              type="button"
              onClick={viewType === 'month' ? handleNextMonth : handleNextWeek}
              className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors cursor-pointer"
              title="ถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Month Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            รอบสอนในเดือนนี้
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-0.5">
            {monthStats.totalSessions} <span className="text-xs font-medium text-stone-500">รอบ</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันคิวแล้ว
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-900 mt-0.5">
            {monthStats.confirmedCount} <span className="text-xs font-medium text-emerald-700">รอบ</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> รอตรวจสลิป
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-900 mt-0.5">
            {monthStats.underReviewCount} <span className="text-xs font-medium text-amber-700">รอบ</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> รวมชั่วโมงสอน
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-indigo-900 mt-0.5">
            {monthStats.totalTeachingHours} <span className="text-xs font-medium text-indigo-700">ชั่วโมง</span>
          </div>
        </div>
      </div>

      {/* Main Calendar Layout (Grid + Day Inspector Drawer) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Calendar Grid View (Left 2 cols on XL) */}
        <div className="xl:col-span-2 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 bg-stone-900 text-white text-center py-2.5 text-xs font-bold border-b border-stone-800">
            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((d, i) => (
              <div key={d} className={i === 0 || i === 6 ? 'text-rose-400' : 'text-stone-200'}>
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{d.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* MONTH VIEW GRID */}
          {viewType === 'month' && (
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-stone-100 bg-stone-100">
              {monthDays.map((day) => {
                const isSelected = selectedDayStr === day.dateStr;
                const hasEvents = day.events.length > 0;

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDayStr(day.dateStr)}
                    className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 transition-all flex flex-col justify-between cursor-pointer group ${
                      !day.isCurrentMonth
                        ? 'bg-stone-50/70 text-stone-400 opacity-60'
                        : isSelected
                        ? 'bg-indigo-50/80 ring-2 ring-indigo-500 ring-inset z-10'
                        : day.isToday
                        ? 'bg-amber-50/40 hover:bg-amber-50/80'
                        : 'bg-white hover:bg-stone-50'
                    }`}
                  >
                    {/* Top Row: Date Number & Capacity Indicator */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          day.isToday
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : isSelected
                            ? 'bg-stone-900 text-white'
                            : day.isWeekend
                            ? 'text-rose-600'
                            : 'text-stone-800'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {/* Total booked hours tag */}
                      {day.totalBookedHours > 0 && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-indigo-100 text-indigo-800 hidden sm:inline">
                          {day.totalBookedHours}h
                        </span>
                      )}
                    </div>

                    {/* Middle: Events List / Badges */}
                    <div className="space-y-1 my-1 overflow-hidden">
                      {day.events.slice(0, 2).map((ev, idx) => (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayStr(day.dateStr);
                            onInspectBooking(ev.booking);
                          }}
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate border flex items-center gap-1 shadow-2xs ${
                            ev.booking.payment.status === 'confirmed' || ev.booking.payment.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          }`}
                          title={`${ev.slot.startTime}-${ev.slot.endTime} น. | ${ev.booking.customer.name} (${ev.booking.courseTitle})`}
                        >
                          <span className="font-bold shrink-0">{ev.slot.startTime}</span>
                          <span className="truncate">{ev.booking.customer.name}</span>
                        </div>
                      ))}

                      {day.events.length > 2 && (
                        <div className="text-[9px] font-bold text-indigo-700 text-center bg-indigo-50 rounded py-0.5">
                          +{day.events.length - 2} คิวเพิ่มเติม
                        </div>
                      )}
                    </div>

                    {/* Bottom: Availability Label */}
                    <div className="text-[9px] text-stone-400 font-medium truncate pt-1 border-t border-stone-100/60 flex items-center justify-between">
                       <span className="truncate">
                        {new Date(day.dateStr + 'T00:00:00').getDay() === 6 ? '10:00-23:00' : day.isWeekend ? '09:00-18:00' : '19:30-22:30'}
                      </span>
                      {hasEvents && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* WEEK VIEW GRID */}
          {viewType === 'week' && (
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-stone-200 bg-white min-h-[480px]">
              {weekDays.map((day) => {
                const isSelected = selectedDayStr === day.dateStr;

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDayStr(day.dateStr)}
                    className={`p-2 flex flex-col transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 ring-2 ring-indigo-500 ring-inset'
                        : day.isToday
                        ? 'bg-amber-50/30 hover:bg-stone-50'
                        : 'hover:bg-stone-50'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div className="text-center pb-2 border-b border-stone-200 mb-2">
                      <div className={`text-xs font-bold ${day.isWeekend ? 'text-rose-600' : 'text-stone-600'}`}>
                        {day.dayName.replace('วัน', '')}
                      </div>
                      <div
                        className={`text-sm font-extrabold w-7 h-7 rounded-full mx-auto flex items-center justify-center mt-1 ${
                          day.isToday
                            ? 'bg-indigo-600 text-white'
                            : isSelected
                            ? 'bg-stone-900 text-white'
                            : 'text-stone-900'
                        }`}
                      >
                        {day.dayNumber}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(day.dateStr + 'T00:00:00').getDay() === 6 ? '10:00-23:00' : day.isWeekend ? '09:00-18:00' : '19:30-22:30'}
                      </div>
                    </div>

                    {/* Day Events Stack */}
                    <div className="space-y-2 flex-1">
                      {day.events.length === 0 ? (
                        <div className="text-center py-8 text-[11px] text-stone-400">
                          ว่างทั้งวัน
                        </div>
                      ) : (
                        day.events.map((ev, i) => (
                          <div
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDayStr(day.dateStr);
                              onInspectBooking(ev.booking);
                            }}
                            className={`p-2 rounded-xl border text-xs shadow-xs transition-transform hover:scale-[1.02] cursor-pointer ${
                              ev.booking.payment.status === 'confirmed' || ev.booking.payment.status === 'completed'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                : 'bg-amber-50 border-amber-200 text-amber-950'
                            }`}
                          >
                            <div className="font-bold text-[11px] flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-indigo-600" />
                                {ev.slot.startTime} - {ev.slot.endTime} น.
                              </span>
                            </div>
                            <div className="font-semibold text-stone-900 text-xs mt-1 truncate">
                              {ev.booking.customer.name}
                            </div>
                            <div className="text-[10px] text-stone-600 line-clamp-1 mt-0.5">
                              {ev.booking.courseTitle.split('(')[0]}
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              {getStatusBadge(ev.booking.payment.status)}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer total */}
                    {day.totalBookedHours > 0 && (
                      <div className="mt-2 pt-1 border-t border-stone-200 text-[10px] font-bold text-stone-600 text-center">
                        สอนรวม {day.totalBookedHours} ชม.
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* Calendar Bottom Legend */}
          <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span>ยืนยันคิวแล้ว (พร้อมสอน)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span>รอตรวจสลิป</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-stone-300 inline-block" />
                <span>วันว่าง / ไม่มีคิว</span>
              </div>
            </div>

            <div className="text-[11px] text-stone-500 font-medium">
              💡 คลิกที่วันเพื่อดูรายละเอียด หรือคลิกที่รายการเพื่อดูสลิป
            </div>
          </div>

        </div>

        {/* Selected Day Inspector Panel (Right 1 col on XL) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          
          <div>
            {/* Day Header */}
            <div className="border-b border-stone-200 pb-3 mb-4">
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                ตารางสอนประจำวัน
              </span>
              <h4 className="text-base sm:text-lg font-extrabold text-stone-900 mt-0.5">
                {selectedDayStr ? formatThaiDate(selectedDayStr) : 'กรุณาเลือกวันที่ต้องการ'}
              </h4>
              <div className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  เวลาทำการ: {selectedDayStr ? getOperatingHours(selectedDayStr) : '-'}
                </span>
              </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-stone-200 rounded-2xl">
                  <CalendarIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <div className="text-sm font-bold text-stone-700">ไม่มีนัดหมายในวันนี้</div>
                  <p className="text-xs text-stone-400 mt-1">
                    ตารางเวลาว่างสำหรับเปิดรับคิวใหม่
                  </p>
                </div>
              ) : (
                selectedDayEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/80 hover:bg-stone-50 transition-all space-y-2.5 shadow-2xs"
                  >
                    {/* Time & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 bg-indigo-100/70 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{ev.slot.startTime} - {ev.slot.endTime} น.</span>
                      </div>
                      {getStatusBadge(ev.booking.payment.status)}
                    </div>

                    {/* Course Title */}
                    <div>
                      <div className="text-xs font-bold text-stone-900 line-clamp-1">
                        {ev.booking.courseTitle}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        วันที่ {ev.slot.dayNumber} จาก {ev.booking.totalDays} วัน ({ev.booking.totalHours} ชม.)
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="p-2 bg-white rounded-xl border border-stone-200/80 text-xs space-y-1">
                      <div className="font-bold text-stone-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        <span>{ev.booking.customer.name}</span>
                      </div>
                      <div className="text-stone-600 flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{ev.booking.customer.phone}</span>
                        {ev.booking.customer.lineId && (
                          <span className="text-stone-500 ml-2">LINE: {ev.booking.customer.lineId}</span>
                        )}
                      </div>
                      {ev.booking.customer.notes && (
                        <div className="text-[10px] text-stone-500 bg-stone-50 p-1.5 rounded border border-stone-100">
                          <strong>โน้ต:</strong> {ev.booking.customer.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onInspectBooking(ev.booking)}
                        className="flex-1 py-1.5 px-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูสลิป / จัดการ</span>
                      </button>

                      {ev.booking.meetingLink && (
                        <a
                          href={ev.booking.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Meet</span>
                        </a>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-2xl text-purple-950 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>ระบบป้องกันเวลาชนกัน:</strong> เมื่อมีคิวที่ได้รับการอนุมัติแล้ว ช่วงเวลานั้นจะถูกล็อคโดยอัตโนมัติ ไม่ให้ผู้เรียนคนอื่นจองซ้ำ
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
