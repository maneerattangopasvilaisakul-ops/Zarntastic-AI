const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

// The functions handleSeedTestData and handleClearTestData
code = code.replace(/\/\/ Handle Seed Test Data to Firebase[\s\S]*?const handleClearTestData[\s\S]*?setTimeout\(\(\) => setSeedNotice\(null\), 8000\);\s*\}/, '');

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
