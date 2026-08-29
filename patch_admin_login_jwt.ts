import fs from 'fs';

let content = fs.readFileSync('src/components/AdminLoginForm.tsx', 'utf8');

const loginRe = /const doAdminLogin = async \(emailVal: string, passVal: string\) => \{[\s\S]*?\};/m;
const newLogin = `const doAdminLogin = async (emailVal: string, passVal: string) => {
    const cleanEmail = emailVal.trim().toLowerCase();
    const cleanPass = passVal.trim();
    if (!cleanEmail || !cleanPass) {
      setError('กรุณากรอกอีเมลและรหัสผ่านผู้ดูแลระบบ');
      return;
    }
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass })
      });
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      const data = await res.json();
      setError('');
      login({
        id: 'admin_001',
        name: 'อาจารย์ซาร์น (Administrator)',
        email: cleanEmail,
        phone: '061-5614269',
        lineId: '@zarntastic',
        role: 'admin',
        token: data.token
      } as any);
      onSuccess();
    } catch (err: any) {
      setError('อีเมลหรือรหัสผ่านผู้ดูแลระบบไม่ถูกต้อง');
    }
  };`;

content = content.replace(loginRe, newLogin);
fs.writeFileSync('src/components/AdminLoginForm.tsx', content);
