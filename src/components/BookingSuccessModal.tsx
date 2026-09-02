import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Booking } from '../types';
import { COURSES } from '../data/courses';
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
  FileCheck,
  PlayCircle,
  FolderOpen
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
  const isVdoCourse = (booking.courseId && booking.courseId.startsWith('vdo-')) || (booking.schedule && booking.schedule.length === 0);
  const courseData = COURSES.find(c => c.id === booking.courseId);
  
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-2xl w-full overflow-hidden">
        
        {/* Top Celebration Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-orange-600 text-white p-6 sm:p-8 text-center relative">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 ring-4 ring-white/30 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {isVdoCourse ? 'สมัครเรียนคอร์ส VDO สำเร็จแล้ว!' : 'จองคอร์สเรียนสำเร็จแล้ว!'}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            {isVdoCourse 
              ? 'ระบบได้บันทึกการสมัครและพร้อมส่งลิงก์เข้าเรียน Google Drive ให้คุณทันที'
              : 'ระบบได้บันทึกคิวและส่งข้อมูลยืนยันไปยังอีเมลและ LINE ของคุณเรียบร้อย'}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 bg-stone-900/30 px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-mono">
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
                  <span>สถานะ: {booking.payment.status === 'confirmed' ? 'อนุมัติเรียบร้อย (AI Verified)' : 'กำลังรอแอดมินยืนยัน'}</span>
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

          {isVdoCourse ? (
            /* VDO Course Box */
            <div className="bg-indigo-50/70 rounded-2xl p-5 border border-indigo-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-indigo-600" />
                  <span>คอร์สเรียน: {booking.courseTitle}</span>
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                  เรียนเวลาอิสระ
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-100 text-xs space-y-2">
                <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-indigo-600" />
                  <span>ช่องทางการรับชมบทเรียน (Google Drive VDO)</span>
                </div>
                <p className="text-stone-600">
                  คุณสามารถเข้าดูบทเรียนทั้งหมดได้ทันทีผ่านไอคอนกระดิ่ง <strong>การแจ้งเตือน</strong> หรือคลิกลิงก์ด้านล่างนี้:
                </p>

                {courseData?.vdoLinks && courseData.vdoLinks.length > 0 ? (
                  <div className="space-y-1.5 pt-2">
                    {courseData.vdoLinks.map((v, idx) => (
                      <a
                        key={idx}
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 bg-stone-50 hover:bg-indigo-50 rounded-lg border border-stone-200 hover:border-indigo-300 transition-colors group"
                      >
                        <span className="font-semibold text-stone-800 group-hover:text-indigo-700">{v.title}</span>
                        <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                          เปิดดู VDO <ExternalLink className="w-3 h-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <a
                    href={booking.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 transition-colors"
                  >
                    <span>เปิดโฟลเดอร์ Google Drive คอร์สเรียน</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* Live Course Schedule Summary Box */
            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span>กำหนดการเรียน: {booking.courseTitle}</span>
              </h3>

              <div className="space-y-2 text-xs">
                {booking.schedule.map((s) => (
                  <div key={s.dayNumber} className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-orange-800 block text-xs">วันที่ {s.dayNumber}</span>
                      <span className="text-stone-900 font-semibold text-sm">{formatThaiDate(s.date)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-stone-500 block text-[10px]">เวลาเรียน</span>
                      <span className="font-bold text-stone-800 text-sm">{s.startTime} - {s.endTime} น.</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Meeting Link */}
              <div className="bg-orange-50/80 p-3.5 rounded-xl border border-orange-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-orange-700 font-semibold uppercase">ลิงก์ห้องเรียนออนไลน์ (Google Meet)</div>
                    <div className="text-xs font-mono font-bold text-orange-950 truncate max-w-[240px] sm:max-w-xs">
                      {booking.meetingLink}
                    </div>
                  </div>
                </div>

                <a
                  href={booking.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>เข้าห้องเรียน</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

            </div>
          )}

          {/* Export to Calendar actions (only for Live courses) */}
          {!isVdoCourse && (
            <div className="flex flex-wrap gap-2">
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>เพิ่มเข้า Google Calendar</span>
              </a>
              
              <button
                onClick={handleDownloadICS}
                className="flex-1 py-2.5 px-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span>ดาวน์โหลดไฟล์ .ICS</span>
              </button>
            </div>
          )}

          {/* Line Notification / Send to Line Official Box */}
          <div className="bg-[#06C755]/10 border border-[#06C755]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#06C755] text-white flex items-center justify-center shrink-0 shadow-sm">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                  <span>แจ้งการจองผ่าน LINE</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#06C755] text-white font-bold">ID: zarn</span>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  ส่งหลักฐานการจองเพื่อให้อาจารย์ล็อกคิวและเตรียมห้องเรียนทันที
                </p>
              </div>
            </div>
            <a
              href="https://line.me/R/ti/p/@761rqbfc?ts=09011400&oat_content=url"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0"
            >
              <span>ส่งข้อมูลเข้า LINE</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-stone-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <a
              href="https://line.me/R/ti/p/@761rqbfc?ts=09011400&oat_content=url"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#06C755] hover:text-[#05b34c] font-bold flex items-center gap-1.5 cursor-pointer bg-[#06C755]/10 px-4 py-2.5 rounded-xl border border-[#06C755]/20 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>ติดต่อ Admin / อาจารย์ (LINE ID: zarn)</span>
            </a>

            <button
              id="btn-close-success-modal"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              เสร็จสิ้นและกลับหน้าหลัก
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
