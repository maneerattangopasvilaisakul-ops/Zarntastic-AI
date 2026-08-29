import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const loginRoute = `app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();
  
  if (
    (cleanEmail === 'zarnzarn10@gmail.com' || cleanEmail === 'admin@zarntastic.com') && 
    (cleanPass === 'Enter10!' || cleanPass === 'admin123')
  ) {
    const token = jwt.sign({ role: 'admin', email: cleanEmail }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token });
  } else {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
});`;

content = content.replace(loginRoute, '');
content = content.replace('const app = express();', 'const app = express();\n\n' + loginRoute);
fs.writeFileSync('server.ts', content);
