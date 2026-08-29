import fs from 'fs';

let content = fs.readFileSync('src/components/AdminLoginForm.tsx', 'utf8');

// Add Firebase imports
content = content.replace("import { useAuth } from '../contexts/AuthContext';", "import { useAuth } from '../contexts/AuthContext';\nimport { signInWithEmailAndPassword } from 'firebase/auth';\nimport { auth } from '../firebase';");

// Replace doAdminLogin function
const loginRe = /const doAdminLogin = \(emailVal: string, passVal: string\) => \{[\s\S]*?\};/m;
const newLogin = `const doAdminLogin = async (emailVal: string, passVal: string) => {
    const cleanEmail = emailVal.trim().toLowerCase();
    const cleanPass = passVal.trim();
    if (!cleanEmail || !cleanPass) {
      setError('กรุณากรอกอีเมลและรหัสผ่านผู้ดูแลระบบ');
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const idToken = await userCredential.user.getIdToken();
      setError('');
      login({
        id: userCredential.user.uid,
        name: 'อาจารย์ซาร์น (Administrator)',
        email: cleanEmail,
        phone: '061-5614269',
        lineId: '@zarntastic',
        role: 'admin',
        token: idToken
      } as any);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError('อีเมลหรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
    }
  };`;

content = content.replace(loginRe, newLogin);
fs.writeFileSync('src/components/AdminLoginForm.tsx', content);
