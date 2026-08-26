import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add import
if (!content.includes('useAuth')) {
  content = content.replace(
    "import { Course, Booking", 
    "import { useAuth } from './contexts/AuthContext';\nimport { Course, Booking"
  );
}

// Add hook
if (!content.includes('const { user, isAdmin } = useAuth();')) {
  content = content.replace(
    "export default function App() {", 
    "export default function App() {\n  const { user, isAdmin } = useAuth();"
  );
}

// Sync user profile to customer info
const syncCode = `
  // Auto-fill customer info if logged in
  useEffect(() => {
    if (user) {
      setCustomerInfo(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        lineId: user.lineId || prev.lineId,
      }));
    }
  }, [user]);
`;

if (!content.includes('Auto-fill customer info')) {
  content = content.replace(
    /const \[bookingStep, setBookingStep\] = useState/,
    syncCode + '\n  const [bookingStep, setBookingStep] = useState'
  );
}

// Protect Admin View
const adminViewCode = `
      {/* Protected Admin View */}
      {currentView === 'admin' && (
        <main className="flex-1 w-full bg-slate-50/50">
          {!isAdmin ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Restricted Access</h2>
              <p className="text-slate-600 max-w-md">
                คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ (Administrator)
              </p>
              <button 
                onClick={() => setCurrentView('student')} 
                className="mt-6 px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                กลับไปหน้าแรก
              </button>
            </div>
          ) : (
            <AdminDashboard 
              bookings={bookings} 
              onUpdateBookingStatus={handleUpdateBookingStatus} 
              onRefreshBookings={fetchBookings} 
            />
          )}
        </main>
      )}
`;

content = content.replace(
  /\{\/\* Admin View \*\/\}\s*\{currentView === 'admin' && \([\s\S]*?\}\s*\)\}/m,
  adminViewCode
);

fs.writeFileSync('src/App.tsx', content);
