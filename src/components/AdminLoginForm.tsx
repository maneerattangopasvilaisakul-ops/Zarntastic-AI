import React, { useState } from 'react';
import { Lock, Shield, User, ArrowRight } from 'lucide-react';

interface AdminLoginFormProps {
  onSuccess: () => void;
}

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Specific admin check
    if (username === 'zarnzarn10@gmail.com' && password === 'Enter10!') {
      setError('');
      onSuccess();
    } else {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-12">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-slate-900 to-cyan-600"></div>
        <div className="flex justify-center mb-6 mt-2">
          <div className="w-16 h-16 bg-slate-900 text-cyan-400 rounded-full flex items-center justify-center shadow-md">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-2 tracking-tight">Admin Portal</h2>
        <p className="text-center text-sm text-slate-500 mb-8 font-medium">
          ระบบจัดการคอร์สเรียนและการจอง
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl border border-rose-100 text-center font-bold">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ชื่อผู้ใช้ (Email)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium"
                placeholder="admin@example.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              รหัสผ่าน
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            เข้าสู่ระบบจัดการ <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
