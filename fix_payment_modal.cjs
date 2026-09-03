const fs = require('fs');
let content = fs.readFileSync('src/components/PaymentModal.tsx', 'utf8');

// Add onCancelBooking to props
content = content.replace(
  /onClose: \(\) => void;/g,
  "onClose: () => void;\n  onCancelBooking: () => void;"
);

content = content.replace(
  /onClose,\n}: PaymentModalProps\) {/g,
  "onClose,\n  onCancelBooking,\n}: PaymentModalProps) {"
);

// Add the cancel button and the text in the Actions Bottom Bar or Submit CTA
const ctaReplacement = `              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  id="btn-confirm-upload-slip"
                  disabled={!slipImage || isVerifying}
                  onClick={handleSubmitSlip}
                  className={\`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md \${
                    slipImage && !isVerifying
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }\`}
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
                <div className="mt-4 flex flex-col items-center gap-2 text-center">`;

content = content.replace(
  /\{\/\* Submit CTA \*\/\}(.|\n)*?<div className="mt-4 flex flex-col items-center gap-2 text-center">/m,
  ctaReplacement
);

fs.writeFileSync('src/components/PaymentModal.tsx', content);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(
  /onClose=\{.*? setIsPaymentModalOpen\(false\)\}/g,
  "onClose={() => setIsPaymentModalOpen(false)}\n          onCancelBooking={handleCustomerCancelBooking}"
);
fs.writeFileSync('src/App.tsx', appContent);

console.log("Updated PaymentModal and App.tsx");
