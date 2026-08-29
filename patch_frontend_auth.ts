import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Update fetchBookings to pass token if available
const fetchBookingsRe = /const \[bookingsRes, notifsRes\] = await Promise\.all\(\[\n\s*fetch\('\/api\/bookings'\),\n\s*fetch\('\/api\/notifications'\),\n\s*\]\);/m;
const fetchBookingsNew = `const headers: Record<string, string> = {};
      if (user?.token) {
        headers['Authorization'] = \`Bearer \${user.token}\`;
      }
      const [bookingsRes, notifsRes] = await Promise.all([
        fetch('/api/bookings', { headers }),
        fetch('/api/notifications', { headers }),
      ]);`;
content = content.replace(fetchBookingsRe, fetchBookingsNew);

// Update handleAdminUpdateStatus to pass token
const updateStatusRe = /const res = await fetch\(`\/api\/bookings\/\$\{bookingId\}\/status`, \{\n\s*method: 'POST',\n\s*headers: \{ 'Content-Type': 'application\/json' \},\n\s*body: JSON\.stringify\(\{ status, reviewNotes \}\),\n\s*\}\);/m;
const updateStatusNew = `const res = await fetch(\`/api/bookings/\${bookingId}/status\`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${user?.token}\`
        },
        body: JSON.stringify({ status, reviewNotes }),
      });`;
content = content.replace(updateStatusRe, updateStatusNew);

fs.writeFileSync('src/App.tsx', content);
