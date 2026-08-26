import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export function AuthModal({ onClose, defaultMode = 'login' }: AuthModalProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Admin login bypass check
    if (email === 'zarnzarn10@gmail.com' && password === 'Enter10!') {
      login({
        id: 'admin_001',
        name: 'Administrator',
        email,
        phone: '061-5614269',
        lineId: '@zarntastic',
        role: 'admin'
      });
      onClose();
      return;
    }

    if (mode === 'login') {
      // Mock login for demo: if they enter any email, we log them in
      if (!email || !password) {
        setError('กรุณากรอกอีเมลและรหัสผ่าน');
        return;
      }
      
      const storedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = storedUsers.find((u: any) => u.email === email && u.password === password);
      
      if (user) {
        login({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          lineId: user.lineId,
          role: 'student'
        });
        onClose();
      } else {
        // Just bypass for demo purposes if not found, or show error
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }
    } else {
      // Register
      if (!email || !password || !name) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }
      const storedUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const newUser = {
        id: 'user_' + Date.now(),
        name,
        email,
        password, // Not secure, but for demo
        phone,
        lineId
      };
      localStorage.setItem('mock_users', JSON.stringify([...storedUsers, newUser]));
      
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {mode === 'login' ? 'เข้าสู่ระบบ (Login)' : 'สมัครสมาชิก (Register)'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
              {error}
            </div>
          )}
          
          {mode === 'register' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="ชื่อของคุณ" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ (เลือก)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="08x-xxxxxxx" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">LINE ID (เลือก)</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input type="text" value={lineId} onChange={e => setLineId(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="@yourlineid" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="email@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none" placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer">
            {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
          
          <div className="text-center text-xs text-slate-500 mt-4">
            {mode === 'login' ? (
              <p>ยังไม่มีบัญชี? <button type="button" onClick={() => setMode('register')} className="text-cyan-600 font-bold hover:underline">สมัครสมาชิกที่นี่</button></p>
            ) : (
              <p>มีบัญชีอยู่แล้ว? <button type="button" onClick={() => setMode('login')} className="text-cyan-600 font-bold hover:underline">เข้าสู่ระบบ</button></p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
