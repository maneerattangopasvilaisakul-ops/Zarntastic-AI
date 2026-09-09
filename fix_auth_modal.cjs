const fs = require('fs');
let code = fs.readFileSync('src/components/AuthModal.tsx', 'utf8');

// Replace handleLogin block from "if (mode === 'login') {" to "};"
const oldBlock = `
    if (mode === 'login') {
      let storedUsers: any[] = [];
      try {
        storedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      } catch (err) {
        storedUsers = [];
      }

      // Check registered users
      const foundUser = storedUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
      );

      if (foundUser) {
        login({
          id: foundUser.id || 'user_' + Date.now(),
          name: foundUser.name || 'ผู้เรียน',
          email: foundUser.email,
          phone: foundUser.phone || '',
          lineId: foundUser.lineId || '',
          role: foundUser.role || 'student'
        });
        onClose();
      } else {
        // If user entered email and password but never registered before,
        // provide seamless auto-sign-in option or friendly guidance:
        const userExistsWithDiffPass = storedUsers.find(u => u.email.toLowerCase() === cleanEmail);
        if (userExistsWithDiffPass) {
          setError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง หรือกดปุ่ม "ลืมรหัสผ่าน?" ด้านล่าง');
        } else {
          // Seamlessly auto-register this new student so they are never blocked!
          const autoName = cleanEmail.split('@')[0] || 'ผู้เรียนใหม่';
          const newUser = {
            id: 'user_' + Date.now(),
            name: autoName,
            email: cleanEmail,
            password: cleanPassword,
            phone: phone || '',
            lineId: lineId || '',
            role: 'student'
          };
          try {
            localStorage.setItem('mock_users', JSON.stringify([...storedUsers, newUser]));
          } catch (e) {}

          login({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            lineId: newUser.lineId,
            role: 'student'
          });
          onClose();
        }
      }
    } else {
      // Register Mode
      if (!name.trim()) {
        setError('กรุณากรอกชื่อ-นามสกุล');
        return;
      }

      let storedUsers: any[] = [];
      try {
        storedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      } catch (err) {
        storedUsers = [];
      }

      // Disallow registering if email belongs to admin
      try {
        const adminRes = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: 'dummy' })
        });
        // We actually shouldn't even check this by hitting login, just skip hardcoded check 
        // since admin login is handled on backend anyway. But just to prevent them using admin emails:
      } catch (e) {}

      const existingUser = storedUsers.find(u => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        setError('อีเมลนี้มีในระบบแล้ว กรุณาสลับไปที่แท็บ "เข้าสู่ระบบ"');
        return;
      }

      const newUser = {
        id: 'user_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        password: cleanPassword,
        phone: phone.trim(),
        lineId: lineId.trim(),
        role: 'student'
      };

      try {
        localStorage.setItem('mock_users', JSON.stringify([...storedUsers, newUser]));
      } catch (e) {}

      login({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        lineId: newUser.lineId,
        role: 'student'
      });
      onClose();
    }
`;

const newBlock = `
    if (mode === 'login') {
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
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
    } else if (mode === 'register') {
      if (!name.trim()) {
        setError('กรุณากรอกชื่อ-นามสกุล');
        return;
      }
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: cleanEmail, password: cleanPassword, phone: phone.trim(), lineId: lineId.trim() })
        });
        const data = await res.json();
        if (res.ok && data.user) {
          login(data.user);
          onClose();
        } else {
          setError(data.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      }
    }
`;

code = code.replace(oldBlock.trim(), newBlock.trim());
fs.writeFileSync('src/components/AuthModal.tsx', code);
