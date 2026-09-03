import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Booking } from '../types';
import { ACADEMY_PAYMENT_INFO } from '../utils/promptpay';
import { formatCurrency, formatThaiDate } from '../utils/scheduleUtils';
import { QRCodeSVG } from 'qrcode.react';
import generatePayload from 'promptpay-qr';
import { 
  Copy, 
  Check, 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Loader2, 
  FileCheck,
  MessageCircle,
  Pencil,
  Calendar,
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { EditBookingModal } from './EditBookingModal';

interface PaymentModalProps {
  booking: Booking;
  existingBookings?: Booking[];
  onUploadSlip: (slipUrl: string, refNo?: string, manualAmount?: number) => Promise<void>;
  onClose: () => void;
  onCancelBooking: () => void;
  onUpdateBooking?: (updated: Booking) => void;
}

export function PaymentModal({
  booking: initialBooking,
  existingBookings = [],
  onUploadSlip,
  onClose,
  onCancelBooking,
  onUpdateBooking,
}: PaymentModalProps) {
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setBooking(initialBooking);
  }, [initialBooking]);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [slipFileName, setSlipFileName] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [manualRef, setManualRef] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 minutes timer
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 15 min countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let fileToProcess = file;
      
      // Auto compress if image is large (e.g. > 1MB)
      if (file.size > 1024 * 1024) {
        toast.loading('กำลังปรับขนาดรูปภาพอัตโนมัติ...', { id: 'compressing' });
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          fileToProcess = await imageCompression(file, options);
          toast.success('ปรับขนาดรูปภาพสำเร็จ', { id: 'compressing' });
        } catch (error) {
          console.error('Error compressing image:', error);
          toast.dismiss('compressing');
          toast.error('ไม่สามารถปรับขนาดรูปภาพได้ จะใช้ไฟล์ต้นฉบับ');
        }
      }

      if (fileToProcess.size > 5 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ยังคงใหญ่เกินไป กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 5MB');
        return;
      }
      
      // We will now use fileToProcess instead of file for the rest of the flow
      setSlipFileName(fileToProcess.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress and convert to base64 for preview
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setSlipImage(compressedDataUrl);
          } else {
            setSlipImage(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(fileToProcess);
    }
  };

  // Sample mock slips generator for fast testing
  const handleLoadSampleSlip = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 400, 600);

      // Header Banner
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(0, 0, 400, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('โอนเงินสำเร็จ (Transfer Slip)', 20, 45);
      ctx.font = '14px sans-serif';
      ctx.fillText(`ธนาคารกสิกรไทย (K PLUS)`, 20, 75);

      // Amount
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(`฿ ${booking.totalPrice.toLocaleString()}.00`, 20, 160);

      // Details
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('จาก: ' + (booking.customer?.name || 'ผู้เรียน AI Course'), 20, 210);
      ctx.fillText('ถึง: มณีรัตน์ ตั้งโอภาสวิไลสกุล', 20, 240);
      ctx.fillText('พร้อมเพย์: 061-561-4269 (KBANK: 585-2-29915-2)', 20, 270);
      ctx.fillText(`วันเวลา: 2026-08-25 08:30 น.`, 20, 300);
      
      const sampleRef = `KBANK${Date.now().toString().slice(-8)}`;
      ctx.fillText(`รหัสอ้างอิง: ${sampleRef}`, 20, 330);
      setManualRef(sampleRef);

      // Footer
      ctx.fillStyle = '#10b981';
      ctx.fillRect(20, 370, 360, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('✓ ตรวจสอบข้อมูลแล้ว ถูกต้องสมบูรณ์', 60, 395);

      const dataUrl = canvas.toDataURL('image/png');
      setSlipImage(dataUrl);
      setSlipFileName('sample_kbank_slip.png');
    }
  };

  const handleSubmitSlip = async () => {
    if (!slipImage) return;
    setIsVerifying(true);
    try {
      await onUploadSlip(
        slipImage,
        manualRef.trim() || `REF-${Date.now().toString().slice(-6)}`,
        booking.totalPrice
      );
    } catch (error) {
      console.error('Submit slip error:', error);
      toast.error('อัปโหลดสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsVerifying(false);
    }
  };

  // Generate PromptPay Payload
  const promptpayPayload = generatePayload(ACADEMY_PAYMENT_INFO.promptPayId, { amount: booking.totalPrice });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-950 text-orange-400 border border-orange-800 text-[11px] font-bold">
                รหัสการจอง: {booking.id}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/80">
                <Clock className="w-3.5 h-3.5" />
                <span>เวลาล็อกคิว: {formatTimer(timeLeft)}</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5">
              ชำระเงินและแนบสลิปเพื่อยืนยันคิวเรียน
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Booking Summary Banner with Edit Button */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50/60 border border-orange-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-stone-900 text-sm sm:text-base">
                  {booking.courseTitle}
                </span>
                <span className="text-xs bg-orange-200 text-orange-950 font-black px-2.5 py-0.5 rounded-lg border border-orange-300">
                  {formatCurrency(booking.totalPrice)}
                </span>
              </div>
              <div className="text-xs text-stone-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5 text-stone-500" />
                  {booking.customer.name} ({booking.customer.phone})
                </span>
                {booking.customer.lineId && (
                  <span className="text-stone-500 font-medium">
                    LINE: <strong className="text-stone-700">{booking.customer.lineId}</strong>
                  </span>
                )}
                {booking.schedule?.length > 0 && (
                  <span className="flex items-center gap-1 text-indigo-900 font-medium bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                    <Calendar className="w-3 h-3 text-indigo-600" />
                    {booking.schedule.map(s => `${formatThaiDate(s.date, false)} ${s.startTime}-${s.endTime}น.`).join(' | ')}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="shrink-0 px-3.5 py-2 bg-white hover:bg-orange-100 text-orange-800 border border-orange-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:shadow-sm"
              title="แก้ไขข้อมูลชื่อ เบอร์โทร หรือเปลี่ยนวันเวลาเรียน"
            >
              <Pencil className="w-3.5 h-3.5 text-orange-600" />
              <span>แก้ไขข้อมูล / เปลี่ยนวันเวลา</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Col: PromptPay QR & Bank Info */}
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 flex flex-col items-center text-center">
              
              {/* PromptPay Header */}
              <div className="w-full bg-[#113566] text-white py-2 rounded-t-xl text-center text-xs font-bold uppercase tracking-wider mb-3">
                Thai QR Payment / PromptPay
              </div>

              {/* Dynamic QR Box */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm inline-block my-1">
                <div className="flex justify-center mb-3">
                  <QRCodeSVG 
                    value={promptpayPayload} 
                    size={200}
                    level={"H"}
                    includeMargin={true}
                    className="w-44 h-44 sm:w-48 sm:h-48 mx-auto border border-stone-100 rounded-lg shadow-sm"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-semibold text-stone-500">
                    สแกน QR เพื่อโอนเงิน
                  </span>
                  <div className="text-xl font-black text-stone-900">
                    {formatCurrency(booking.totalPrice)}
                  </div>
                </div>
              </div>

              {/* Trust Factor & Security Badges */}
              <div className="flex items-center justify-center gap-4 mt-3 text-stone-400">
                <div className="flex items-center gap-1 text-[10px] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Secure Transfer</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-medium">
                  <Check className="w-3.5 h-3.5 text-orange-500" />
                  <span>Verified PromptPay</span>
                </div>
              </div>

              {/* Account Details & Fast Copy */}
              <div className="w-full space-y-2 mt-4 text-xs text-left">
                
                {/* PromptPay ID */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200">
                  <div>
                    <span className="text-[10px] text-stone-500 font-semibold uppercase block">เบอร์พร้อมเพย์</span>
                    <span className="font-bold text-stone-900 text-sm">{ACADEMY_PAYMENT_INFO.phoneNumber}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(ACADEMY_PAYMENT_INFO.promptPayId, 'promptpay')}
                    className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedField === 'promptpay' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'promptpay' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>

                {/* Bank Account */}
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200">
                  <div>
                    <span className="text-[10px] text-stone-500 font-semibold uppercase block">{ACADEMY_PAYMENT_INFO.bankName}</span>
                    <span className="font-bold text-stone-900 text-sm">{ACADEMY_PAYMENT_INFO.accountNumber}</span>
                    <span className="text-[10px] text-stone-400 block">{ACADEMY_PAYMENT_INFO.accountName}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(ACADEMY_PAYMENT_INFO.accountNumber.replace(/-/g, ''), 'bank')}
                    className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedField === 'bank' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'bank' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Right Col: Slip Upload & OCR */}
            <div className="space-y-4 flex flex-col justify-between">
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-orange-600" />
                    <span>แนบสลิปหลักฐานการโอนเงิน</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSampleSlip}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 underline cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ใช้สลิปจำลองตัวอย่าง</span>
                  </button>
                </div>

                {/* Upload Area / Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                    slipImage
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : 'border-stone-300 hover:border-orange-500 bg-stone-50/50 hover:bg-orange-50/20'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {slipImage ? (
                    <div className="space-y-3 w-full">
                      <img
                        src={slipImage}
                        alt="สลิปโอนเงิน"
                        className="max-h-48 mx-auto rounded-xl shadow-sm border border-stone-200 object-contain"
                      />
                      <div className="text-xs text-stone-600 font-medium flex items-center justify-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span>แนบไฟล์: {slipFileName || 'สลิปพร้อมตรวจสอบ'}</span>
                      </div>
                      <p className="text-[11px] text-orange-700 underline font-medium">คลิกเพื่อเปลี่ยนรูปสลิป</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-stone-800">
                        คลิกเพื่ออัปโหลดสลิป หรือ ลากไฟล์มาวางที่นี่
                      </div>
                      <p className="text-xs text-stone-500">
                        รองรับไฟล์รูปภาพ PNG, JPG, JPEG (ไม่เกิน 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Reference Number input optional */}
                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    รหัสอ้างอิงสลิป / หมายเลขอ้างอิงธนาคาร (ระบบจะตรวจให้อัตโนมัติ):
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น KBANK12345678"
                    value={manualRef}
                    onChange={(e) => setManualRef(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* AI Slip Engine Badge */}
                <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-start gap-2.5 text-xs text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <strong className="font-semibold">ระบบ AI Slip OCR อัตโนมัติ:</strong> เมื่อแนบสลิป AI จะช่วยตรวจสอบความถูกต้องของยอดเงิน วันเวลา และรหัสอ้างอิงทันที เพื่อยืนยันคิวโดยไม่ต้องรอนาน
                  </div>
                </div>
              </div>

                            {/* Submit CTA */}
              <div className="pt-2">
                <button
                  id="btn-confirm-upload-slip"
                  disabled={!slipImage || isVerifying}
                  onClick={handleSubmitSlip}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                    slipImage && !isVerifying
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังส่งสลิปและให้ AI ตรวจสอบ...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>ยืนยันการชำระเงินและส่งสลิป</span>
                    </>
                  )}
                </button>
                <div className="mt-3 flex items-center justify-center">
                   <button
                     onClick={onCancelBooking}
                     className="text-xs font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                   >
                     ยกเลิกการจองนี้
                   </button>
                </div>
                <div className="mt-2 text-center text-[10px] text-stone-500 font-medium">
                  * ไม่มีการคืนเงินทุกกรณี หลังชำระเงินเรียบร้อยแล้ว<br/>
                  * หากชำระแล้วจะไม่สามารถยกเลิกหรือแก้ไขได้ (ต้องติดต่อ Admin เท่านั้น)
                </div>
                <div className="mt-4 flex flex-col items-center gap-2 text-center">
                  <a 
                    href="https://line.me/ti/p/N9UPH4OL4L" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#06C755]/10 hover:bg-[#06C755]/20 text-[#06C755] border border-[#06C755]/30 rounded-xl text-xs font-bold transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>แจ้งชำระเงินหรือส่งสลิปผ่าน LINE ส่วนตัว</span>
                  </a>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Edit Booking Modal */}
      {isEditModalOpen && (
        <EditBookingModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          booking={booking}
          existingBookings={existingBookings}
          onSuccess={(updated) => {
            setBooking(updated);
            onUpdateBooking?.(updated);
          }}
        />
      )}

    </div>
  );
}
