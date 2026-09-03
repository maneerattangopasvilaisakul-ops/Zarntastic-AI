const fs = require('fs');
let admin = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

admin = admin.replace("import { AdminCalendarView } from './AdminCalendarView';", "import { AdminCalendarView } from './AdminCalendarView';\nimport { ChevronLeft, ChevronRight } from 'lucide-react';");

fs.writeFileSync('src/components/AdminDashboard.tsx', admin);
console.log("Fixed chevron");
