import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// Replace the requireAdmin middleware and adminAuth init with jsonwebtoken
const adminAuthRe = /import \* as admin from "firebase-admin";[\s\S]*?\} catch \(error\) \{\n\s*console\.error\("Token verification failed:", error\);\n\s*return res\.status\(403\)\.json\(\{ error: 'Forbidden' \}\);\n\s*\}\n\};/m;
const jwtMiddleware = `
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_ZARNTASTIC_KEY_12345";

const requireAdmin = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden' });
  }
};

app.post("/api/admin/login", (req, res) => {
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
});
`;

content = content.replace(adminAuthRe, jwtMiddleware);

// Replace getBookings auth check
const getBookingsRe = /const authHeader = req\.headers\.authorization;\n\s*let isAdmin = false;\n\s*if \(authHeader && authHeader\.startsWith\('Bearer '\) && adminAuth\) \{\n\s*const token = authHeader\.split\('Bearer '\)\[1\];\n\s*try \{\n\s*await adminAuth\.verifyIdToken\(token\);\n\s*isAdmin = true;\n\s*\} catch \(e\) \{ \}\n\s*\}/m;
const getBookingsNew = `const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      jwt.verify(token, JWT_SECRET);
      isAdmin = true;
    } catch (e) { }
  }`;
content = content.replace(getBookingsRe, getBookingsNew);

fs.writeFileSync('server.ts', content);
