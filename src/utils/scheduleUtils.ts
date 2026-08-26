import { Booking, ScheduleSlot } from '../types';

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_DAYS = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'
];

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

export function isDateWeekend(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  return day === 0 || day === 6; // Sun or Sat
}

export function getOperatingHours(dateStr: string, userCategory: 'general' | 'corporate' = 'general'): string {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay(); // 0: Sun, 6: Sat

  if (userCategory === 'corporate') {
    if (day === 0) return 'ปิดทำการ (องค์กรเปิด จันทร์-เสาร์ 09:00-18:00 น.)';
    return '09:00 - 18:00 น. (รอบองค์กร จันทร์-เสาร์)';
  }

  return (day === 0 || day === 6) ? '09:00 - 18:00 น. (เสาร์-อาทิตย์)' : '19:30 - 22:30 น. (จันทร์-ศุกร์ รอบค่ำ)';
}

export function formatThaiDate(dateStr: string, includeYear = true): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const dayName = THAI_DAYS[date.getDay()];
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  const thaiYear = date.getFullYear() + 543;
  return includeYear
    ? `${dayName}ที่ ${day} ${month} ${thaiYear}`
    : `${dayName}ที่ ${day} ${month}`;
}

export function formatThaiDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = THAI_MONTHS_SHORT[date.getMonth()];
  return `${day} ${month}`;
}

export function formatCurrency(amount: number): string {
  return `฿${amount.toLocaleString()}`;
}

export function getValidNextDates(count = 21): Array<{ dateStr: string; isWeekend: boolean; dayName: string }> {
  const dates: Array<{ dateStr: string; isWeekend: boolean; dayName: string }> = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    dates.push({
      dateStr,
      isWeekend,
      dayName: THAI_DAYS[dayOfWeek],
    });
  }
  return dates;
}

export function generateSlotsForDate(
  dateStr: string,
  durationHours: number,
  existingBookings: Booking[],
  excludeBookingId?: string,
  userCategory: 'general' | 'corporate' = 'general'
): Array<{
  startTime: string;
  endTime: string;
  isOccupied: boolean;
  bookedBy?: string;
  isAllowed: boolean;
  reasonNotAllowed?: string;
}> {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = day === 0 || day === 6;
  const slots: Array<{
    startTime: string;
    endTime: string;
    isOccupied: boolean;
    bookedBy?: string;
    isAllowed: boolean;
    reasonNotAllowed?: string;
  }> = [];

  // Corporate: Mon - Sat (09:00 - 18:00), Sun is closed
  if (userCategory === 'corporate') {
    if (day === 0) {
      return []; // Sunday closed for corporate
    }
    const startHour = 9;
    const endHour = 18;
    const step = durationHours >= 3 ? (durationHours === 4 ? 4 : 2) : 1;

    for (let h = startHour; h <= endHour - durationHours; h += step) {
      const sMin = h * 60;
      const eMin = (h + durationHours) * 60;
      const startTime = minutesToTime(sMin);
      const endTime = minutesToTime(eMin);

      let isOccupied = false;
      let bookedBy: string | undefined;

      for (const b of existingBookings) {
        if (excludeBookingId && b.id === excludeBookingId) continue;
        if (b.payment.status === 'cancelled' || b.payment.status === 'rejected') continue;
        for (const s of b.schedule) {
          if (s.date === dateStr && isTimeOverlap(startTime, endTime, s.startTime, s.endTime)) {
            isOccupied = true;
            bookedBy = `${(b.customer?.name || 'User').slice(0, 3)}*** (${b.courseTitle})`;
            break;
          }
        }
        if (isOccupied) break;
      }

      slots.push({
        startTime,
        endTime,
        isOccupied,
        bookedBy,
        isAllowed: true,
      });
    }

    return slots;
  }

  // General:
  // Weekdays: 19:30 - 22:30 (Max 3 hours window: 19:30-20:30, 20:30-21:30, 21:30-22:30 for 1h, 19:30-22:30 for 3h)
  // 4h cannot fit in weekday evening
  if (!isWeekend) {
    if (durationHours > 3) {
      return []; // Not allowed on weekday evening for 4-hour slots
    }

    if (durationHours === 1) {
      const candidates = [
        { startTime: '19:30', endTime: '20:30' },
        { startTime: '20:30', endTime: '21:30' },
        { startTime: '21:30', endTime: '22:30' },
      ];

      for (const cand of candidates) {
        let isOccupied = false;
        let bookedBy: string | undefined;

        for (const b of existingBookings) {
          if (excludeBookingId && b.id === excludeBookingId) continue;
          if (b.payment.status === 'cancelled' || b.payment.status === 'rejected') continue;
          for (const s of b.schedule) {
            if (s.date === dateStr && isTimeOverlap(cand.startTime, cand.endTime, s.startTime, s.endTime)) {
              isOccupied = true;
              bookedBy = `${(b.customer?.name || 'User').slice(0, 3)}*** (${b.courseTitle})`;
              break;
            }
          }
          if (isOccupied) break;
        }

        slots.push({
          ...cand,
          isOccupied,
          bookedBy,
          isAllowed: true,
        });
      }
    } else if (durationHours === 3) {
      const cand = { startTime: '19:30', endTime: '22:30' };
      let isOccupied = false;
      let bookedBy: string | undefined;

      for (const b of existingBookings) {
        if (excludeBookingId && b.id === excludeBookingId) continue;
        if (b.payment.status === 'cancelled' || b.payment.status === 'rejected') continue;
        for (const s of b.schedule) {
          if (s.date === dateStr && isTimeOverlap(cand.startTime, cand.endTime, s.startTime, s.endTime)) {
            isOccupied = true;
            bookedBy = `${(b.customer?.name || 'User').slice(0, 3)}*** (${b.courseTitle})`;
            break;
          }
        }
      }

      slots.push({
        ...cand,
        isOccupied,
        bookedBy,
        isAllowed: true,
      });
    }
  } else {
    // Weekend: 09:00 - 18:00 (540 to 1080 min)
    const startHour = 9;
    const endHour = 18;
    const step = durationHours >= 3 ? (durationHours === 4 ? 4 : 2) : 1;

    for (let h = startHour; h <= endHour - durationHours; h += step) {
      const sMin = h * 60;
      const eMin = (h + durationHours) * 60;
      const startTime = minutesToTime(sMin);
      const endTime = minutesToTime(eMin);

      let isOccupied = false;
      let bookedBy: string | undefined;

      for (const b of existingBookings) {
        if (excludeBookingId && b.id === excludeBookingId) continue;
        if (b.payment.status === 'cancelled' || b.payment.status === 'rejected') continue;
        for (const s of b.schedule) {
          if (s.date === dateStr && isTimeOverlap(startTime, endTime, s.startTime, s.endTime)) {
            isOccupied = true;
            bookedBy = `${(b.customer?.name || 'User').slice(0, 3)}*** (${b.courseTitle})`;
            break;
          }
        }
        if (isOccupied) break;
      }

      slots.push({
        startTime,
        endTime,
        isOccupied,
        bookedBy,
        isAllowed: true,
      });
    }
  }

  return slots;
}
