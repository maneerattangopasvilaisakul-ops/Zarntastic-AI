const fs = require('fs');

let content = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// Add imports
if (!content.includes('Calendar as CalendarIcon')) {
  content = content.replace(
    'import { Calendar, Clock, MapPin, Video, CheckCircle, Search, Filter, AlertCircle, Sparkles, ChevronLeft, ChevronRight, MessageSquare, Edit3, Trash2, ExternalLink } from \'lucide-react\';',
    'import { Calendar, Clock, MapPin, Video, CheckCircle, Search, Filter, AlertCircle, Sparkles, ChevronLeft, ChevronRight, MessageSquare, Edit3, Trash2, ExternalLink, Calendar as CalendarIcon } from \'lucide-react\';'
  );
}

if (!content.includes('syncToGoogleCalendar')) {
  content = content.replace(
    'import { formatThaiDate, formatCurrency, getValidNextDates } from \'../utils/scheduleUtils\';',
    'import { formatThaiDate, formatCurrency, getValidNextDates } from \'../utils/scheduleUtils\';\nimport { syncToGoogleCalendar } from \'../utils/calendar\';'
  );
}

if (!content.includes('signInWithPopup')) {
  content = content.replace(
    'import { useAuth } from \'../contexts/AuthContext\';',
    'import { useAuth } from \'../contexts/AuthContext\';\nimport { signInWithPopup, GoogleAuthProvider } from \'firebase/auth\';\nimport { auth, googleProvider } from \'../firebase\';'
  );
}

// Add state for calendar syncing
content = content.replace(
  'const [isSubmittingReview, setIsSubmittingReview] = useState(false);',
  'const [isSubmittingReview, setIsSubmittingReview] = useState(false);\n  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);\n  const [googleToken, setGoogleToken] = useState<string | null>(null);'
);

// Add handleSyncCalendar function
const syncFn = `
  const handleSyncCalendar = async (booking: Booking) => {
    setIsSyncingCalendar(true);
    try {
      let token = googleToken;
      if (!token) {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          token = credential.accessToken;
          setGoogleToken(token);
        } else {
          throw new Error('ไม่สามารถดึงข้อมูลสิทธิ์การเข้าถึง Calendar ได้');
        }
      }
      
      const success = await syncToGoogleCalendar(booking, token);
      if (success) {
        alert('ซิงค์ข้อมูลลง Google Calendar สำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาดในการสร้างกิจกรรมบน Calendar');
      }
    } catch (error: any) {
      console.error(error);
      alert('Error: ' + error.message);
    } finally {
      setIsSyncingCalendar(false);
    }
  };
`;

if (!content.includes('handleSyncCalendar')) {
  content = content.replace(
    'const handleApproveSlip = async (booking: Booking) => {',
    syncFn + '\n  const handleApproveSlip = async (booking: Booking) => {'
  );
}

// Add button to UI
const calendarBtn = `
                <button
                  disabled={isSyncingCalendar}
                  onClick={() => handleSyncCalendar(inspectingBooking)}
                  className="px-4 py-2.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CalendarIcon className="w-4 h-4" />
                  {isSyncingCalendar ? 'กำลังซิงค์...' : 'เพิ่มลง Calendar'}
                </button>
`;

if (!content.includes('handleSyncCalendar(inspectingBooking)')) {
  content = content.replace(
    '<button\n                  disabled={isSubmittingReview}\n                  onClick={() => onUpdateBookingStatus(inspectingBooking.id, \'completed\', \'คอร์สเรียนเสร็จสิ้นสมบูรณ์\')}',
    calendarBtn + '\n                <button\n                  disabled={isSubmittingReview}\n                  onClick={() => onUpdateBookingStatus(inspectingBooking.id, \'completed\', \'คอร์สเรียนเสร็จสิ้นสมบูรณ์\')}'
  );
}

fs.writeFileSync('src/components/AdminDashboard.tsx', content);
console.log('Patched AdminDashboard.tsx for Calendar Sync');
