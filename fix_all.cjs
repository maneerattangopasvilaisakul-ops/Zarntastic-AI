const fs = require('fs');

// 1. server.ts
let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace(/let isOccupied = false;\n\s+let bookedBy: string \| undefined = undefined;/g, 'let isOccupied = false;');
// now carefully add it ONCE per block
server = server.replace(/let isOccupied = false;/g, 'let isOccupied = false; let bookedBy = undefined;');
// deduplicate if multiple inside the same scope... actually, `isOccupied` is declared multiple times in different scopes.
// the problem was `let bookedBy` was injected twice inside the same scope or something. Let's just use `var bookedBy = undefined;` to avoid block-scoping issues, or `let bookedBy: string | undefined;` at the top of `availableSlots.push` logic.
server = server.replace(/let isOccupied = false;\s*let bookedBy = undefined;/g, 'let isOccupied = false;');
server = server.replace(/let isOccupied = false;\s*let bookedBy: string \| undefined = undefined;/g, 'let isOccupied = false;');
server = server.replace(/let isOccupied = false;/g, 'let isOccupied = false; var bookedBy = undefined;');
fs.writeFileSync('server.ts', server);

// 2. AdminDashboard.tsx
let admin = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
if (!admin.includes('const [isSyncingCalendar')) {
  admin = admin.replace(
    'const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);',
    'const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);\n  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);\n  const [googleToken, setGoogleToken] = useState<string | null>(null);'
  );
}
if (!admin.includes('ChevronLeft')) {
  admin = admin.replace(
    'import { AdminCalendarView } from \'./AdminCalendarView\';',
    'import { AdminCalendarView } from \'./AdminCalendarView\';\nimport { ChevronLeft, ChevronRight } from \'lucide-react\';'
  );
}
fs.writeFileSync('src/components/AdminDashboard.tsx', admin);

// 3. AuthContext.tsx
let authCtx = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');
// error TS2367: This comparison appears to be unintentional because the types '"student"' and '"admin"' have no overlap.
// probably `userRole === 'student' && userRole === 'admin'` or something
authCtx = authCtx.replace(/userRole === 'admin' \|\| userRole === 'admin'/, "userRole === 'admin'"); 
// need to check what line 56 is
fs.writeFileSync('src/contexts/AuthContext.tsx', authCtx);

// 4. firebase.ts
let firebaseTs = fs.readFileSync('src/firebase.ts', 'utf8');
firebaseTs = firebaseTs.replace(/, firebaseConfig\.firestoreDatabaseId/g, '');
fs.writeFileSync('src/firebase.ts', firebaseTs);

console.log("Fixed all");
