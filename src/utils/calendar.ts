import { Booking } from '../types';

export const syncToGoogleCalendar = async (booking: Booking, accessToken: string) => {
  if (!booking.schedule || booking.schedule.length === 0) return false;

  const slot = booking.schedule[0];
  const dateStr = slot.date;
  
  let startDate = new Date();
  let endDate = new Date();
  
  try {
     const [year, month, day] = dateStr.split('-');
     if (year && month && day) {
        startDate = new Date(`${year}-${month}-${day}T${slot.startTime}:00+07:00`);
        endDate = new Date(`${year}-${month}-${day}T${slot.endTime}:00+07:00`);
     }
  } catch (e) {
     console.error("Date parse error", e);
  }

  const event = {
    summary: `สอนคอร์ส: ${booking.courseTitle}`,
    description: `ผู้เรียน: ${booking.customer.name}\nโทร: ${booking.customer.phone}\nLINE: ${booking.customer.lineId}\nราคา: ${booking.totalPrice} บาท\n\nลิงก์ห้องเรียน: ${booking.meetingLink || 'ยังไม่สร้าง'}`,
    start: {
      dateTime: startDate.toISOString(),
      timeZone: 'Asia/Bangkok',
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'Asia/Bangkok',
    },
    colorId: '9',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (res.ok) {
      return true;
    } else {
      const errorText = await res.text();
      console.error('Failed to create calendar event:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return false;
  }
};
