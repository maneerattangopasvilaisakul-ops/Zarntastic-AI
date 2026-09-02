import React, { useState } from 'react';
import { Lock, Shield, User, ArrowRight, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';



interface AdminLoginFormProps {
  onSuccess: () => void;
}

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const doAdminLogin = async (emailVal: string, passVal: string) => {
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
        name: 'อาจารย์ซาน (Administrator)',
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doAdminLogin(username, password);
  };

  return (
    <div className="flex items-center justify-center min-h-[65vh] py-8 sm:py-12 px-3">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-stone-200 w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-stone-900 via-indigo-600 to-orange-600"></div>
        
        <div className="flex justify-center mb-5 mt-2">
          <div className="w-16 h-16 bg-stone-900 text-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-stone-900/20 border border-stone-700">
            <Shield className="w-8 h-8" />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-center text-stone-900 mb-1 tracking-tight">
          Admin & Instructor Portal
        </h2>
        <p className="text-center text-xs sm:text-sm text-stone-500 mb-4 font-medium">
          ระบบจัดการคิวเรียน ตารางสอน และตรวจสอบสลิปโอนเงิน
        </p>

        {/* Security Warning Notice */}
        <div className="mb-5 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed font-medium">
            <span className="font-bold">ระบบความปลอดภัยขั้นสูง:</span> กรุณากรอกอีเมลและรหัสผ่านทุกครั้งที่เข้าใช้งาน (ระบบไม่จำรหัสผ่านของผู้ดูแลระบบ)
          </div>
        </div>
        
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-xs sm:text-sm rounded-xl border border-rose-200 text-center font-bold animate-in fade-in">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              อีเมลผู้ดูแลระบบ (Admin Email)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type="email"
                required
                autoComplete="off"
                id="admin-username-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                placeholder="กรอกอีเมลอาจารย์ผู้สอน"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                รหัสผ่าน (Password)
              </label>
              <button
                type="button"
                onClick={() => {
                  toast.error("หากลืมรหัสผ่านผู้ดูแลระบบ กรุณาติดต่อกู้คืนรหัสผ่านผ่าน LINE ID: zarn หรือโทร 061-5614269");
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                id="admin-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            id="admin-login-submit-btn"
            className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer text-xs sm:text-sm"
          >
            <span>เข้าสู่ระบบจัดการอาจารย์</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
