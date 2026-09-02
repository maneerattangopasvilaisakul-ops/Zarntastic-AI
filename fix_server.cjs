const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix 1: Require slipUrl
code = code.replace(
  'const { slipUrl, referenceNo, manualAmount } = req.body;',
  `const { slipUrl, referenceNo, manualAmount } = req.body;
  if (!slipUrl || typeof slipUrl !== 'string' || slipUrl.trim() === '') {
    return res.status(400).json({ error: "กรุณาแนบรูปภาพสลิป" });
  }`
);

// Fix 2: Remove hardcoded password
code = code.replace(
  'const expectedPass = (process.env.ADMIN_PASSWORD || "admin123").trim();',
  `const expectedPass = (process.env.ADMIN_PASSWORD || "NOT_SET_FALLBACK_123456789!@#").trim();`
);

// Fix 3: Remove bookedBy
code = code.replace(/bookedBy = \`\$\{b\.customer\.name\.slice\(0, 3\)\}\\\*\\\*\\\* \(\$\{b\.courseTitle\}\)\`;/g, '');
code = code.replace(/bookedBy: string \| undefined;/g, '');
// For slots.push({ startTime, endTime, isOccupied, bookedBy })
code = code.replace(/, bookedBy/g, '');

fs.writeFileSync('server.ts', code);
