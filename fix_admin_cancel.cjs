const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const rejectButton = `<button
                disabled={isSubmittingReview}
                onClick={() => handleRejectSlip(inspectingBooking)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ปฏิเสธสลิป / แจ้งโอนใหม่
              </button>`;

const newButtons = `<button
                disabled={isSubmittingReview}
                onClick={() => handleRejectSlip(inspectingBooking)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ปฏิเสธสลิป
              </button>
              <button
                disabled={isSubmittingReview}
                onClick={() => {
                   if(window.confirm('คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?')) {
                     onUpdateBookingStatus(inspectingBooking.id, 'cancelled', reviewNoteInput || 'ยกเลิกการจองโดย Admin');
                     setInspectingBooking(null);
                     setReviewNoteInput('');
                   }
                }}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ยกเลิกการจอง
              </button>`;

content = content.replace(rejectButton, newButtons);
fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log("Updated AdminDashboard.tsx");
