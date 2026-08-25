import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Booking } from '../types';
import { formatThaiDate, formatCurrency } from '../utils/scheduleUtils';
import { 
  CheckCircle2, 
  Calendar, 
  Video, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Copy, 
  MessageSquare, 
  Clock, 
  Share2,
  FileCheck
} from 'lucide-react';

interface BookingSuccessModalProps {
  booking: Booking;
  onClose: () => void;
  onViewAdmin: () => void;
}

export function BookingSuccessModal({
  booking,
  onClose,
  onViewAdmin,
}: BookingSuccessModalProps) {
  
  useEffect(() => {
    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleDownloadICS = () => {
    // Generate .ics calendar file
    const slot = booking.schedule[0];
    if (!slot) return;

    const startDateTime = `${slot.date.replace(/-/g, '')}T${slot.startTime.replace(':', '')}00`;
    const endDateTime = `${slot.date.replace(/-/g, '')}T${slot.endTime.replace(':', '')}00`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Academy Thailand//AI Course Booking//TH
BEGIN:VEVENT
UID:${booking.id}@aiacademy.th
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:เรียน ${booking.courseTitle}
DESCRIPTION:นัดหมายเรียนคอร์ส AI ตัวต่อตัว/กลุ่มสด ลิงก์เข้าเรียน: ${booking.meetingLink}
LOCATION:Google Meet (${booking.meetingLink})
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI-Course-${booking.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGoogleCalendarUrl = () => {
    const slot = booking.schedule[0];
    if (!slot) return '#';
    const startStr = `${slot.date.replace(/-/g, '')}T${slot.startTime.replace(':', '')}00`;
    const endStr = `${slot.date.replace(/-/g, '')}T${slot.endTime.replace(':', '')}00`;
    const title = encodeURIComponent(`เรียน ${booking.courseTitle}`);
    const details = encodeURIComponent(`นัดหมายเรียนคอร์ส AI อัตโนมัติ รหัสการจอง: ${booking.id}\nลิงก์เข้าเรียน: ${booking.meetingLink}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${encodeURIComponent(booking.meetingLink)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
        
        {/* Top Celebration Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-6 sm:p-8 text-center relative">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 ring-4 ring-white/30 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            จองคอร์สเรียนสำเร็จแล้ว!
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            ระบบได้บันทึกคิวและส่งข้อมูลยืนยันไปยังอีเมลและ LINE ของคุณเรียบร้อย
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-slate-900/30 px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-mono">
            <span>รหัสการจอง:</span>
            <strong className="text-yellow-300 font-bold">{booking.id}</strong>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* AI Verification Status pill */}
          {booking.payment.aiVerification && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <span>สถานะ: {booking.payment.status === 'confirmed' ? 'อนุมัติคิวทันที (AI Verified)' : 'กำลังรอแอดมินยืนยัน'}</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-800 text-[10px] font-bold">
                    ความแม่นยำ {(booking.payment.aiVerification.confidence ? booking.payment.aiVerification.confidence * 100 : 98).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-1 text-emerald-800">
                  {booking.payment.aiVerification.notes || 'ตรวจพบสลิปถูกต้อง ยอดเงินตรงกับราคาคอร์ส'}
                </p>
              </div>
            </div>
          )}

          {/* Schedule Summary Box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              <span>กำหนดการเรียน: {booking.courseTitle}</span>
            </h3>

            <div className="space-y-2 text-xs">
              {booking.schedule.map((s) => (
                <div key={s.dayNumber} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-cyan-800 block text-xs">วันที่ {s.dayNumber}</span>
                    <span className="text-slate-900 font-semibold text-sm">{formatThaiDate(s.date)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">เวลาเรียน</span>
                    <span className="font-bold text-slate-800 text-sm">{s.startTime} - {s.endTime} น.</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Meeting Link */}
            <div className="bg-cyan-50/80 p-3.5 rounded-xl border border-cyan-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-cyan-700 font-semibold uppercase">ลิงก์ห้องเรียนออนไลน์ (Google Meet)</div>
                  <div className="text-xs font-mono font-bold text-cyan-950 truncate max-w-[240px] sm:max-w-xs">
                    {booking.meetingLink}
                  </div>
                </div>
              </div>

              <a
                href={booking.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                <span>เข้าห้องเรียน</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>

          {/* Export to Calendar actions */}
          <div className="flex flex-wrap gap-2">
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>เพิ่มเข้า Google Calendar</span>
            </a>
            
            <button
              onClick={handleDownloadICS}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>ดาวน์โหลดไฟล์ .ICS</span>
            </button>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <a
              href="https://lin.ee/Sy3xOAP"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-green-600 hover:text-green-800 font-semibold flex items-center gap-1.5 cursor-pointer bg-green-50 px-4 py-2.5 rounded-xl border border-green-200 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>ติดต่อ Admin (LINE)</span>
            </a>

            <button
              id="btn-close-success-modal"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              เสร็จสิ้นและกลับหน้าหลัก
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
