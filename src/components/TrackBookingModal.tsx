import { useState, FormEvent } from 'react';
import { Booking } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/scheduleUtils';
import { 
  Search, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  FileCheck, 
  Sparkles, 
  ExternalLink,
  Phone,
  Video,
  User,
  CalendarCheck
} from 'lucide-react';

interface TrackBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPaymentForBooking: (booking: Booking) => void;
}

export function TrackBookingModal({
  isOpen,
  onClose,
  onOpenPaymentForBooking,
}: TrackBookingModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundBooking, setFoundBooking] = useState<Booking | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setFoundBooking(null);

    try {
      // First try fetching single booking if it looks like an ID
      const query = searchQuery.trim();
      let res = await fetch(`/api/bookings`);
      if (res.ok) {
        const allBookings: Booking[] = await res.json();
        const matched = allBookings.find(
          b => b.id.toLowerCase() === query.toLowerCase() ||
               b.customer.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, '')) ||
               (b.customer.email && b.customer.email.toLowerCase() === query.toLowerCase())
        );

        if (matched) {
          setFoundBooking(matched);
        } else {
          setSearchError('ไม่พบข้อมูลการจองด้วยรหัสหรือเบอร์โทรนี้ กรุณาตรวจสอบความถูกต้อง');
        }
      } else {
        setSearchError('เกิดข้อผิดพลาดในการค้นหาข้อมูล');
      }
    } catch (err) {
      setSearchError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ยืนยันการจองเรียบร้อยแล้ว</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>แนบสลิปแล้ว กำลังรอผู้ดูแลตรวจสอบ</span>
          </span>
        );
      case 'pending_slip':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>รอการชำระเงินและแนบสลิป</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>สลิปไม่ผ่านการตรวจสอบ กรุณาแนบใหม่</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>คอร์สเรียนเสร็จสิ้นสมบูรณ์</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>ค้นหาคิวจอง / ตรวจสอบสถานะและส่งสลิป</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ระบุรหัสการจอง (Booking ID) หรือเบอร์โทรศัพท์ที่ใช้จอง
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="เช่น AI-20260825-9812 หรือ 089-123-4567"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none text-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              {isSearching ? 'กำลังค้นหา...' : 'ค้นหา'}
            </button>
          </form>

          {/* Search Error */}
          {searchError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Booking Found Card */}
          {foundBooking && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    BOOKING ID
                  </span>
                  <div className="font-mono font-black text-sm text-slate-900">
                    {foundBooking.id}
                  </div>
                </div>
                {getStatusBadge(foundBooking.payment.status)}
              </div>

              {/* Course & Schedule Details */}
              <div className="space-y-2 text-xs text-slate-700">
                <div>
                  <span className="font-bold text-slate-900 block">{foundBooking.courseTitle}</span>
                  <span className="text-[11px] text-slate-500">{foundBooking.totalDays} วัน ({foundBooking.totalHours} ชม.)</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                  <div className="font-semibold text-slate-800 text-[11px]">วันและเวลาเรียนที่จองไว้:</div>
                  {foundBooking.schedule.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-600 text-xs">
                      <CalendarCheck className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{slot.date} เวลา {slot.startTime} - {slot.endTime} น.</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">ยอดที่ต้องชำระ:</span>
                  <strong className="text-indigo-900 text-sm font-black">{formatCurrency(foundBooking.totalPrice)}</strong>
                </div>

                {foundBooking.payment.status === 'confirmed' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs">ลิงก์ Google Meet พร้อมเข้าเรียน</span>
                      </div>
                      {foundBooking.meetingLink && (
                        <a
                          href={foundBooking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>เข้าห้องเรียน</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 pt-1 border-t border-emerald-200/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>ส่งข้อความแจ้งเตือนยืนยันและลิงก์ห้องเรียนเข้า LINE เรียบร้อยแล้ว</span>
                    </div>
                  </div>
                )}

                {foundBooking.payment.reviewNotes && (
                  <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-[11px]">
                    <strong>ข้อความจากผู้ดูแล:</strong> {foundBooking.payment.reviewNotes}
                  </div>
                )}
              </div>

              {/* Action Button: Upload Slip / Re-upload */}
              {(foundBooking.payment.status === 'pending_slip' || foundBooking.payment.status === 'rejected') && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPaymentForBooking(foundBooking);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{foundBooking.payment.status === 'rejected' ? 'อัปโหลดสลิปใหม่อีกครั้ง' : 'ชำระเงินและอัปโหลดสลิปทันที'}</span>
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
