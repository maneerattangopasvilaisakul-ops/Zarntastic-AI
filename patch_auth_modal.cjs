const fs = require('fs');
let code = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

// Remove localStorage initialization
code = code.replace(/try\s*\{\s*const stored = localStorage\.getItem\('mock_users'\)[\s\S]*?catch\s*\(e\)\s*\{\s*console\.error\('Local storage access error', e\);\s*\}/, '');

// Update login function
code = code.replace(/if\s*\(mode === 'login'\)\s*\{\s*let storedUsers:\s*any\[\]\s*=\s*\[\];\s*try\s*\{\s*storedUsers = JSON\.parse\(localStorage\.getItem\('mock_users'\) \|\| '\[\]'\);\s*\}[\s\S]*?\}\s*\} else if\s*\(mode === 'register'\)\s*\{/g, `if (mode === 'login') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
        });
        const data = await res.json();
        if (res.ok && data.user) {
          login(data.user);
          onClose();
        } else {
          setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    } else if (mode === 'register') {`);

// Update register function
code = code.replace(/let storedUsers:\s*any\[\]\s*=\s*\[\];\s*try\s*\{\s*storedUsers = JSON\.parse\(localStorage\.getItem\('mock_users'\) \|\| '\[\]'\);\s*\}\s*catch\s*\(err\)\s*\{\s*storedUsers = \[\];\s*\}[^]*?localStorage\.setItem\('mock_users', JSON\.stringify\(\[\.\.\.storedUsers, newUser\]\)\);\s*setSuccessMsg\('สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ\.\.\.'\);\s*setTimeout\(\(\) => \{\s*login\([\s\S]*?\);\s*onClose\(\);\s*\}, 1500\);\s*\}\s*catch\s*\(err\)\s*\{\s*setError\('เกิดข้อผิดพลาดในการบันทึกข้อมูล'\);\s*\}/, `try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: cleanEmail, password: cleanPassword, phone: phone.trim(), lineId: lineId.trim() })
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setSuccessMsg('สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...');
          setTimeout(() => {
            login(data.user);
            onClose();
          }, 1500);
        } else {
          setError(data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }`);

fs.writeFileSync('src/components/AuthModal.tsx', code);
