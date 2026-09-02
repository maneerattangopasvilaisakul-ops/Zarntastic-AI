const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `app.get("/api/notifications", (req, res) => {`,
  `app.get("/api/notifications", requireAdmin, (req, res) => {`
);

code = code.replace(
  `app.post("/api/notifications/mark-read", (req, res) => {`,
  `app.post("/api/notifications/mark-read", requireAdmin, (req, res) => {`
);

fs.writeFileSync('server.ts', code);
console.log('patched');
