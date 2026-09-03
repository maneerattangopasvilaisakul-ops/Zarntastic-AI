import { useState, useEffect } from 'react';
import { Booking } from '../types';
import { formatThaiDate, formatCurrency } from '../utils/scheduleUtils';
import { 
  X, 
  Search, 
  Calendar, 
  Video, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  MessageSquare, 
  ExternalLink,
  Copy,
  Check,
  CreditCard,
  Ban,
  Pencil
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { EditBookingModal } from './EditBookingModal';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBooking: Booking | null;
  existingBookings?: Booking[];
  onSelectBookingForPayment: (booking: Booking) => void;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onUpdateBooking?: (updated: Booking) => void;
  defaultPhoneOrEmail?: string;
}

export function MyBookingsModal({
  isOpen,
  onClose,
  activeBooking,
  existingBookings = [],
  onSelectBookingForPayment,
  onCancelBooking,
  onUpdateBooking,
  defaultPhoneOrEmail = '',
}: MyBookingsModalProps) {
  const [searchQuery, setSearchQuery] = useState(defaultPhoneOrEmail);
  const [isSearching, setIsSearching] = useState(false);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Auto-search if default phone/email is provided or populate activeBooking
  useEffect(() => {
    if (isOpen) {
      if (activeBooking) {
        setBookingsList([activeBooking]);
        if (!searchQuery && activeBooking.customer.phone) {
          setSearchQuery(activeBooking.customer.phone);
        }
      } else if (defaultPhoneOrEmail && defaultPhoneOrEmail.length >= 8) {
        handleSearch(defaultPhoneOrEmail);
      }
    }
  }, [isOpen, activeBooking, defaultPhoneOrEmail]);

  if (!isOpen) return null;

  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!q || q.length < 3) {
      toast.error('กรุณาระบุเบอร์โทรศัพท์, อีเมล หรือรหัสการจองเพื่อค้นหา');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (res.ok && data.bookings) {
        setBookingsList(data.bookings);
        if (data.bookings.length === 0) {
          toast('ไม่พบข้อมูลการจองที่ตรงกับการค้นหา', { icon: 'ℹ️' });
        } else {
          toast.success(`พบข้อมูลการจอง ${data.bookings.length} รายการ`);
        }
      } else {
        toast.error(data.error || 'ค้นหาไม่สำเร็จ');
      }
    } catch (err) {
      toast.error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResendEmail = async (booking: Booking) => {
    setSendingEmailId(booking.id);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`ส่งอีเมลยืนยันไปยัง ${booking.customer.email} เรียบร้อยแล้ว!`);
      } else {
        toast.error(data.message || 'ส่งอีเมลไม่สำเร็จ');
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการส่งอีเมล');
    } finally {
      setSendingEmailId(null);
    }
  };

  const generateLineMessage = (booking: Booking) => {
    const scheduleStr = booking.schedule && booking.schedule.length > 0
      ? booking.schedule.map(s => `• วันที่ ${s.dayNumber}: ${formatThaiDate(s.date)} เวลา ${s.startTime}-${s.endTime} น.`).join('\n')
      : '• คอร์สเรียนผ่าน VDO Online (เวลาอิสระ)';

    const isConfirmed = booking.payment.status === 'confirmed' || booking.payment.status === 'completed';
    const statusStr = isConfirmed ? '✅ ชำระเงินและอนุมัติแล้ว' : '⏳ รอตรวจสอบชำระเงิน';

    return `[ใบนัดหมายคอร์สเรียน Zarntastic AI]
รหัสการจอง: ${booking.id}
ชื่อผู้เรียน: ${booking.customer.name} (${booking.customer.phone})
คอร์สเรียน: ${booking.courseTitle}
${scheduleStr}
ลิงก์ Google Meet: ${booking.meetingLink}
ยอดชำระ: ฿${booking.totalPrice.toLocaleString()} (${statusStr})
ติดต่อผู้สอน: 061-5614269 | LINE: @zarntastic`;
  };

  const handleShareLine = (booking: Booking) => {
    const text = generateLineMessage(booking);
    navigator.clipboard.writeText(text);
    setCopiedId(booking.id);
    toast.success('คัดลอกข้อความใบนัดหมายเรียบร้อย กำลังเปิด LINE...');
    setTimeout(() => {
      setCopiedId(null);
      // Open LINE chat with instructor or line share
      window.open('https://line.me/ti/p/N9UPH4OL4L', '_blank');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-lg sm:text-xl text-white">ตรวจสอบสถานะการจอง & ใบนัดหมาย</h3>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              ค้นหาด้วยเบอร์โทรศัพท์, อีเมล หรือรหัสการจอง เพื่อดูวันเวลาเรียน ลิงก์ Google Meet และรับอีเมลยืนยัน
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 bg-stone-50 border-b border-stone-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ระบุเบอร์โทรศัพท์ (เช่น 0812345678), อีเมล หรือรหัสการจอง..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
            >
              {isSearching ? <span>กำลังค้นหา...</span> : <span>ค้นหาข้อมูล</span>}
            </button>
          </form>
        </div>

        {/* Bookings List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {bookingsList.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-orange-600">
                <Search className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-stone-800 text-base">
                {hasSearched ? 'ไม่พบข้อมูลการจอง' : 'กรอกเบอร์โทรศัพท์เพื่อค้นหาประวัติการจอง'}
              </h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {hasSearched
                  ? 'กรุณาตรวจสอบความถูกต้องของเบอร์โทรศัพท์ หรือติดต่ออาจารย์ผู้สอนผ่าน LINE @zarntastic'
                  : 'ระบบจะแสดงรายการนัดหมาย วันเวลาเรียนทั้งหมด พร้อมลิงก์เข้าห้องเรียน Google Meet และปุ่มส่งอีเมลยืนยัน'}
              </p>
            </div>
          ) : (
            bookingsList.map((booking) => {
              const isPaid = booking.payment.status === 'confirmed' || booking.payment.status === 'completed';
              const isUnderReview = booking.payment.status === 'under_review';
              const isPendingSlip = booking.payment.status === 'pending_slip';
              const isCancelled = booking.payment.status === 'cancelled';

              return (
                <div
                  key={booking.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isPaid 
                      ? 'bg-emerald-50/40 border-emerald-200' 
                      : isUnderReview
                        ? 'bg-blue-50/40 border-blue-200'
                        : isCancelled
                          ? 'bg-stone-50 border-stone-200 opacity-70'
                          : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  {/* Card Top Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-600 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                        {booking.id}
                      </span>
                      <span className="text-xs text-stone-500">
                        ผู้เรียน: <strong className="text-stone-800">{booking.customer.name}</strong>
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {isPaid && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>อนุมัติคิวเรียบร้อย</span>
                        </span>
                      )}
                      {isUnderReview && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-800 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>รอแอดมินตรวจสลิป</span>
                        </span>
                      )}
                      {isPendingSlip && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>รอชำระเงิน / แนบสลิป</span>
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold">
                          <Ban className="w-3.5 h-3.5" />
                          <span>ยกเลิกแล้ว</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Course Title & Price */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                    <h4 className="font-extrabold text-base sm:text-lg text-stone-900">
                      {booking.courseTitle}
                    </h4>
                    <div className="text-sm font-bold text-orange-600">
                      ฿{booking.totalPrice.toLocaleString()}
                    </div>
                  </div>

                  {/* Schedule Details */}
                  <div className="bg-white p-3.5 rounded-xl border border-stone-200/80 mb-3.5 space-y-2">
                    <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-600" />
                      <span>ตารางวันและเวลาเรียน:</span>
                    </div>

                    {booking.schedule && booking.schedule.length > 0 ? (
                      booking.schedule.map((slot) => (
                        <div key={slot.dayNumber} className="flex items-center justify-between text-xs bg-stone-50 p-2 rounded-lg">
                          <div>
                            <span className="font-bold text-orange-700 mr-2">วันที่ {slot.dayNumber}:</span>
                            <span className="font-semibold text-stone-900">{formatThaiDate(slot.date)}</span>
                          </div>
                          <div className="font-bold text-stone-700">
                            {slot.startTime} - {slot.endTime} น.
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-stone-600 bg-stone-50 p-2 rounded-lg">
                        เรียนผ่าน Google Drive VDO Online สามารถเข้าดูบทเรียนได้ตลอดชีพ
                      </div>
                    )}

                    {/* Google Meet Link (if paid/active) */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 truncate">
                        <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-mono text-stone-800 truncate">{booking.meetingLink}</span>
                      </div>
                      <a
                        href={booking.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
                      >
                        <span>เข้าห้องเรียน</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200/60">
                    
                    {/* Resend Email Button */}
                    <button
                      type="button"
                      disabled={sendingEmailId === booking.id}
                      onClick={() => handleResendEmail(booking)}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="ส่งอีเมลยืนยันวันเวลาเรียนไปยังอีเมลของคุณ"
                    >
                      <Send className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{sendingEmailId === booking.id ? 'กำลังส่งอีเมล...' : 'ส่งอีเมลยืนยันอีกครั้ง'}</span>
                    </button>

                    {/* Share to LINE button */}
                    <button
                      type="button"
                      onClick={() => handleShareLine(booking)}
                      className="px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="ส่งใบนัดหมายเข้า LINE อาจารย์"
                    >
                      {copiedId === booking.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>คัดลอกแล้ว!</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>ส่งใบนัดหมายเข้า LINE</span>
                        </>
                      )}
                    </button>

                    {/* Edit Booking Button (Allowed only if NOT paid / pending_slip or under_review) */}
                    {!isPaid && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => setEditingBooking(booking)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="แก้ไขข้อมูลผู้เรียน หรือปรับเปลี่ยนวันเวลาเรียน"
                      >
                        <Pencil className="w-3.5 h-3.5 text-amber-600" />
                        <span>แก้ไขข้อมูล / วันเวลา</span>
                      </button>
                    )}

                    {/* Pay / Upload Slip Button if pending */}
                    {isPendingSlip && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectBookingForPayment(booking);
                        }}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>ชำระเงิน & แนบสลิป</span>
                      </button>
                    )}

                    {/* Cancel Booking (Allowed only if NOT paid) */}
                    {!isPaid && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`คุณต้องการยกเลิกการจองรหัส ${booking.id} ใช่หรือไม่?`)) {
                            onCancelBooking(booking.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                      >
                        <Ban className="w-3 h-3" />
                        <span>ยกเลิกการจอง</span>
                      </button>
                    )}

                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
          <div>
            สอบถามข้อมูลเพิ่มเติม: โทร <strong>061-5614269</strong> | LINE: <strong>@zarntastic</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          booking={editingBooking}
          existingBookings={existingBookings}
          onSuccess={(updated) => {
            setBookingsList(prev => prev.map(b => b.id === updated.id ? updated : b));
            onUpdateBooking?.(updated);
          }}
        />
      )}

    </div>
  );
}
