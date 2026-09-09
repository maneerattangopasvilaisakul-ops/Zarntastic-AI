const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const authCode = `
// Basic User In-Memory DB
let appUsers = [
  {
    id: 'user_1',
    name: 'คุณวิภาวรรณ (ผู้เรียนทดสอบ)',
    email: 'student@761rqbfc.com',
    password: 'password123',
    phone: '081-2345678',
    lineId: '@studentdemo',
    role: 'student'
  }
];

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, phone, lineId } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Missing required fields" });
  
  if (appUsers.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: "อีเมลนี้มีในระบบแล้ว" });
  }
  
  const newUser = {
    id: 'user_' + Date.now(),
    name,
    email: email.toLowerCase(),
    password,
    phone: phone || '',
    lineId: lineId || '',
    role: 'student'
  };
  appUsers.push(newUser);
  
  const { password: _, ...userWithoutPass } = newUser;
  res.json({ success: true, user: userWithoutPass });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = appUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
  }
  const { password: _, ...userWithoutPass } = user;
  res.json({ success: true, user: userWithoutPass });
});
`;

code = code.replace('// 1. Get all bookings', authCode + '\n// 1. Get all bookings');
fs.writeFileSync('server.ts', code);
