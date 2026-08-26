import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /\{currentView === 'student' \? \(/;
const replaceWith = `
        {currentView === 'knowledge' && (
          <div className="space-y-8">
            <KnowledgeBase />
          </div>
        )}
        {currentView === 'student' && (
`;

content = content.replace(regex, replaceWith);

const regex2 = /\) : \(\s*\/\* Admin \/ Instructor Portal \*\/\s*<AdminDashboard[\s\S]*?\/>\s*\)}/;
const replaceWith2 = `)}
        {currentView === 'admin' && (
          /* Admin / Instructor Portal */
          <AdminDashboard
            bookings={bookings}
            onUpdateBookingStatus={handleAdminUpdateStatus}
            onRefreshBookings={fetchBookings}
          />
        )}`;

content = content.replace(regex2, replaceWith2);

fs.writeFileSync('src/App.tsx', content);
