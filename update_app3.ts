import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The admin view logic was accidentally removed, let's restore it
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

if (!content.includes('Restricted Access')) {
  content = content.replace(
    /(<main className="flex-1 w-full relative">)/,
    adminViewCode + '\n      {/* Student View */}\n      {currentView === \'student\' && $1'
  );
  
  // Close the Student view condition block if not closed
  if (!content.includes('{/* Knowledge Base View */}')) {
    content = content.replace(
      /(<FastworkReviews \/>\s*<\/main>)/,
      '$1\n      )}'
    );
  }
}

fs.writeFileSync('src/App.tsx', content);
