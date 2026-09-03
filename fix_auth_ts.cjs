const fs = require('fs');

let authCtx = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');
authCtx = authCtx.replace(/if \(user\?\.role !== 'admin'\)/g, "if ((user as any)?.role !== 'admin')"); 
fs.writeFileSync('src/contexts/AuthContext.tsx', authCtx);
console.log("Fixed AuthContext.tsx");
