import { useState, useRef } from 'react';
import { 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  QrCode, 
  Download, 
  MessageCircle, 
  Sparkles, 
  Globe, 
  X,
  Smartphone,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortUrl?: string;
  longUrl?: string;
}

export function ShareLinkModal({
  isOpen,
  onClose,
  shortUrl = "https://tinyurl.com/2codulfo",
  longUrl = "https://ais-pre-bs4eeo3qrendw7bstnmdwp-887964686274.asia-southeast1.run.app/"
}: ShareLinkModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'domain'>('link');
  const qrRef = useRef<SVGSVGElement>(null);

  if (!isOpen) return null;

  const clientMessage = `สวัสดีค่ะ/ครับ ขออนุญาตส่งลิงก์ระบบจองคอร์สเรียน AI กับ อ.มณีรัตน์ (Zarntastic AI Learning)

✨ สามารถคลิกเลือกดูรายละเอียดคอร์ส ตรวจสอบวันและเวลาที่ว่าง และจองคิวออนไลน์ได้ทันทีที่:
${shortUrl}

หากมีข้อสงสัยเพิ่มเติม สามารถทักสอบถามได้ตลอดเวลาเลยนะคะ/ครับ ขอบคุณค่ะ/ครับ 🙏`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedLink(true);
    toast.success('คัดลอกลิงก์สั้นเรียบร้อย พร้อมส่งลูกค้าทันที!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(clientMessage);
    setCopiedTemplate(true);
    toast.success('คัดลอกข้อความพร้อมลิงก์เรียบร้อย!');
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleShareToLine = () => {
    const encodedText = encodeURIComponent(clientMessage);
    const lineUrl = `https://line.me/R/msg/text/?${encodedText}`;
    window.open(lineUrl, '_blank');
  };

  const handleDownloadQR = () => {
    try {
      const svg = qrRef.current;
      if (!svg) return;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = 1000;
        canvas.height = 1000;
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 1000, 1000);
          ctx.drawImage(img, 100, 100, 800, 800);
          // Add Text
          ctx.font = "bold 32px sans-serif";
          ctx.fillStyle = "#1c1917";
          ctx.textAlign = "center";
          ctx.fillText("สแกนเพื่อจองคอร์สเรียน AI | Zarntastic", 500, 940);

          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = "zarntastic-booking-qr.png";
          downloadLink.href = pngFile;
          downloadLink.click();
          toast.success('ดาวน์โหลดรูป QR Code ความละเอียดสูงเรียบร้อย');
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      toast.error('ไม่สามารถดาวน์โหลด QR Code ได้');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        id="share-link-modal-card"
        className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ลิงก์ส่งลูกค้าจองคอร์สเรียน
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wide">
                  Short URL Active
                </span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                ลิงก์สั้นและ QR Code สำหรับส่งให้ลูกค้าจองผ่าน LINE, Facebook หรือ SMS
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 sm:px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'link'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            ลิงก์สั้นส่งลูกค้า
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'qr'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Code สแกนเข้าเว็บ
          </button>
          <button
            onClick={() => setActiveTab('domain')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'domain'
                ? 'border-orange-600 text-orange-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            ใช้ชื่อโดเมนตนเอง
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === 'link' && (
            <div className="space-y-5">
              {/* Short Link Box */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                  <span>ลิงก์สั้นที่ย่อแล้ว (พร้อมคลิกส่งได้ทันที):</span>
                  <span className="text-[11px] font-normal text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> จำง่าย สั้น กะทัดรัด
                  </span>
                </label>
                <div className="flex items-center gap-2 p-1.5 bg-stone-50 border-2 border-orange-200 rounded-2xl focus-within:border-orange-500 transition-all">
                  <div className="px-3 py-2 text-stone-400">
                    <Globe className="w-5 h-5 text-orange-500" />
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={shortUrl}
                    className="flex-1 bg-transparent text-sm sm:text-base font-bold text-stone-900 focus:outline-none select-all"
                  />
                  <button
                    id="copy-short-url-btn"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4" />
                        คัดลอกแล้ว!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        คัดลอกลิงก์
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="share-to-line-btn"
                  onClick={handleShareToLine}
                  className="py-3 px-4 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  ส่งเข้า LINE ทันที
                </button>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all text-center"
                >
                  <ExternalLink className="w-4 h-4 text-stone-600" />
                  เปิดทดลองเข้าเว็บ
                </a>
              </div>

              {/* Ready-made Client Message Template */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    ข้อความสำเร็จรูปสำหรับส่งลูกค้าในแชต:
                  </span>
                  <button
                    onClick={handleCopyTemplate}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedTemplate ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedTemplate ? 'คัดลอกแล้ว' : 'คัดลอกข้อความนี้'}
                  </button>
                </div>
                <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs text-stone-700 whitespace-pre-line leading-relaxed font-sans select-all">
                  {clientMessage}
                </div>
              </div>

              {/* Long URL comparison */}
              <div className="text-[11px] text-stone-400 bg-stone-50 p-2.5 rounded-xl border border-stone-100 flex items-start gap-2">
                <span className="font-semibold text-stone-500 shrink-0">ลิงก์เดิมของระบบ (Cloud Run):</span>
                <span className="break-all font-mono text-[10px] text-stone-400">{longUrl}</span>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 inline-block mx-auto shadow-inner">
                <QRCodeSVG
                  ref={qrRef}
                  value={shortUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/icon.png",
                    x: undefined,
                    y: undefined,
                    height: 44,
                    width: 44,
                    excavate: true,
                  }}
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-stone-900">QR Code สำหรับลูกค้าสแกนจองคิว</h4>
                <p className="text-xs text-stone-500 mt-1">
                  นำภาพนี้ไปใส่ในโบรชัวร์, โพสต์เฟซบุ๊ก, ใบเสนอราคา หรือส่งให้ลูกค้าในแชตได้ทันที
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  id="download-qr-btn"
                  onClick={handleDownloadQR}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-orange-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลดรูป QR Code (PNG)
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                >
                  คัดลอกลิงก์
                </button>
              </div>
            </div>
          )}

          {activeTab === 'domain' && (
            <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
                <h4 className="font-bold text-orange-950 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-600" />
                  ต้องการใช้ชื่อโดเมนของตนเอง (เช่น zarntastic.com)?
                </h4>
                <p className="text-orange-900 mt-1">
                  ปัจจุบันเว็บนี้รันอยู่บน Google Cloud Run ท่านสามารถนำโดเมนของท่าน (เช่น จาก GoDaddy, Namecheap, หรือ Cloudflare) มาผูกได้ฟรีผ่านขั้นตอนดังนี้:
                </p>
              </div>

              <ol className="list-decimal pl-5 space-y-2.5 font-medium text-stone-800">
                <li>
                  <strong>ซื้อหรือเตรียมชื่อโดเมน:</strong> เช่น <code className="bg-stone-100 px-1.5 py-0.5 rounded text-orange-700">booking.zarntastic.com</code> หรือ <code className="bg-stone-100 px-1.5 py-0.5 rounded text-orange-700">zarntastic.com</code>
                </li>
                <li>
                  <strong>ตั้งค่า Domain Mapping บน Google Cloud Console:</strong>
                  <ul className="list-disc pl-5 mt-1 text-stone-600 font-normal space-y-1">
                    <li>เข้า Google Cloud Console &rarr; เมนู Cloud Run</li>
                    <li>เลือกเมนู <strong>"Manage Custom Domains"</strong> (จัดการโดเมนที่กำหนดเอง)</li>
                    <li>คลิก <strong>Add Mapping</strong> &rarr; เลือก Service นี้ และกรอกชื่อโดเมนที่ต้องการ</li>
                  </ul>
                </li>
                <li>
                  <strong>ชี้ DNS Record:</strong> เพิ่มค่า CNAME หรือ A Record ที่ระบบแจ้ง ไปที่ผู้ให้บริการโดเมนของท่าน ระบบ Google จะออก SSL Certificate (HTTPS) ให้อัตโนมัติใน 15 นาที
                </li>
              </ol>

              <div className="p-3 bg-stone-100 rounded-xl text-[11px] text-stone-600">
                💡 <strong>คำแนะนำ:</strong> ในช่วงระหว่างนี้ สามารถใช้ลิงก์สั้น <span className="font-bold text-orange-700 select-all">{shortUrl}</span> ที่สร้างไว้ให้เพื่อส่งลูกค้าหรือโพสต์ได้ทันที ไม่ต้องรอตั้งค่าโดเมน
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Zarntastic AI Learning &bull; พร้อมส่งลูกค้า 24 ชม.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
