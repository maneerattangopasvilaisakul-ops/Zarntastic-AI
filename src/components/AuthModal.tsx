import { signInWithGoogle } from '../firebase';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MessageCircle, 
  ShieldCheck, 
  GraduationCap, 
  Sparkles, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'forgot_password' | 'admin';
}

export function AuthModal({ onClose, defaultMode = 'login' }: AuthModalProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password' | 'admin'>(defaultMode);
  const [mounted, setMounted] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [lineId, setLineId] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Seed initial demo users if not present
    
  }, []);

  // Switch to Admin Login Screen (requires password entry)
  const handleSwitchToAdminMode = () => {
    setMode('admin');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanForgotEmail = (forgotEmail || email).trim().toLowerCase();

    if (!cleanForgotEmail) {
      setError('กรุณากรอกอีเมลที่ใช้ลงทะเบียนเพื่อขอรีเซ็ตรหัสผ่าน');
      return;
    }

    setForgotSubmitting(true);
    setTimeout(() => {
      setForgotSubmitting(false);
      setForgotSubmitted(true);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    if (!cleanPassword) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    // 1. Admin Master Check
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
      });
      if (res.ok) {
        const data = await res.json();
        login({
          id: 'admin_001',
          name: 'อาจารย์ซาน',
          email: cleanEmail,
          phone: '061-5614269',
          lineId: '@761rqbfc',
          role: 'admin',
          token: data.token
        });
        onClose();
        return;
      } else if (mode === 'admin') {
        setError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง กรุณากรอกรหัสผ่านใหม่อีกครั้ง');
        return;
      }
    } catch (err) {
      if (mode === 'admin') {
        setError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง กรุณากรอกรหัสผ่านใหม่อีกครั้ง');
        return;
      }
    }

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
  };

  const modalContent = (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-stone-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="auth-modal-dialog"
        className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
              {mode === 'login' ? (
                <User className="w-5 h-5" />
              ) : mode === 'register' ? (
                <Sparkles className="w-5 h-5" />
              ) : mode === 'admin' ? (
                <ShieldCheck className="w-5 h-5 text-orange-300" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                {mode === 'login' 
                  ? 'เข้าสู่ระบบสมาชิก' 
                  : mode === 'register' 
                  ? 'สมัครสมาชิกใหม่' 
                  : mode === 'admin'
                  ? 'เข้าสู่ระบบผู้ดูแลระบบ (Admin)'
                  : 'กู้คืนรหัสผ่าน (Forgot Password)'}
              </h2>
              <p className="text-[11px] text-stone-400">
                {mode === 'admin' ? 'สำหรับอาจารย์ซาน จัดการคิวและสลิป' : 'ZARNTASTIC AI LEARNING Portal'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 hover:bg-stone-700/80 rounded-xl text-stone-400 hover:text-white transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Password Mode View */}
        {mode === 'admin' ? (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 bg-gradient-to-r from-stone-900 to-indigo-950 text-white rounded-2xl border border-indigo-800/70 flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-orange-300 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                  <span>พอร์ทัลอาจารย์ผู้สอน & Admin</span>
                  <span className="text-[9px] bg-indigo-500/50 text-orange-300 font-bold px-1.5 py-0.5 rounded">Security Check</span>
                </div>
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อยืนยันตัวตนก่อนเข้าสู่ระบบจัดการคิวและตรวจสอบสลิป
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-200 text-center font-bold animate-in fade-in">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  อีเมลผู้ดูแลระบบ (Admin Email) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    id="auth-admin-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
                    placeholder="กรอกอีเมลผู้ดูแลระบบ"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">
                    รหัสผ่านผู้ดูแลระบบ (Password) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      toast.error("หากลืมรหัสผ่านผู้ดูแลระบบ กรุณาติดต่อผ่าน LINE ID: zarn หรือโทร 061-5614269");
                    }}
                    className="text-[11px] text-orange-700 hover:text-orange-800 font-bold hover:underline cursor-pointer"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    autoComplete="new-password"
                    id="auth-admin-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all"
                    placeholder="กรอกรหัสผ่านผู้ดูแลระบบ"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="auth-admin-submit-btn"
                className="w-full py-3 bg-gradient-to-r from-stone-900 to-indigo-900 hover:from-stone-800 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <ShieldCheck className="w-4 h-4 text-orange-300" />
                <span>ยืนยันรหัสผ่านเข้าสู่ระบบ Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setPassword('');
                  }}
                  className="text-xs text-stone-500 hover:text-stone-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>กลับไปหน้าเข้าสู่ระบบสำหรับนักเรียน</span>
                </button>
              </div>
            </form>
          </div>
        ) : mode === 'forgot_password' ? (
          <div className="p-5 sm:p-6 space-y-4">
            {forgotSubmitted ? (
              <div className="text-center py-4 space-y-4 animate-in fade-in">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    ส่งคำขอกู้คืนรหัสผ่านเรียบร้อยแล้ว
                  </h3>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                    ระบบได้ส่งข้อมูลการตั้งรหัสผ่านใหม่ไปยังอีเมล <span className="font-bold text-stone-900">{forgotEmail || email}</span> แล้ว (หากไม่พบ กรุณาตรวจสอบใน Junk/Spam)
                  </p>
                </div>

                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs text-stone-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-orange-800">
                    <Info className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>ช่องทางช่วยเหลือด่วน:</span>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    หากต้องการเข้าเรียนหรือใช้งานทันที สามารถแจ้งอาจารย์ผ่าน LINE Official ได้ตลอดเวลา
                  </p>
                  <a
                    href="https://line.me/ti/p/N9UPH4OL4L"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl font-bold text-[11px] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>ติดต่อ LINE ID: zarn</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setForgotSubmitted(false);
                    setError('');
                  }}
                  className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>กลับไปหน้าเข้าสู่ระบบ</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                  กรุณากรอกอีเมลที่คุณใช้สมัครสมาชิก ระบบจะส่งคำแนะนำและลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-200 text-center font-bold">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    อีเมลที่ลงทะเบียน <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                    <input 
                      type="email" 
                      required 
                      autoComplete="email"
                      id="auth-forgot-email"
                      value={forgotEmail || email} 
                      onChange={e => {
                        setForgotEmail(e.target.value);
                        setEmail(e.target.value);
                      }} 
                      className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
                      placeholder="name@example.com" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={forgotSubmitting}
                  id="auth-forgot-submit-btn"
                  className="w-full py-3 bg-gradient-to-r from-stone-900 to-orange-700 hover:from-stone-800 hover:to-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {forgotSubmitting ? (
                    <span>กำลังส่งคำขอ...</span>
                  ) : (
                    <>
                      <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="text-xs text-stone-500 hover:text-stone-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>กลับไปหน้าเข้าสู่ระบบ</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Mode Switch Tabs */}
            <div className="p-4 sm:p-6 pb-2">
              <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-2xl border border-stone-200">
                <button
                  type="button"
                  id="tab-mode-login"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  เข้าสู่ระบบ (Login)
                </button>
                <button
                  type="button"
                  id="tab-mode-register"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  สมัครสมาชิก (Register)
                </button>
              </div>
            </div>
            
            {/* Instructor & Admin Notice / Direct Switch */}
            {mode === 'login' && (
              <div className="px-4 sm:px-6 pt-1 pb-1">
                <div className="p-3 bg-gradient-to-r from-stone-900 to-indigo-950 text-white rounded-2xl border border-indigo-800/60 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-orange-300 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>สำหรับอาจารย์ & Admin</span>
                        <span className="text-[9px] bg-indigo-500/40 text-orange-300 font-bold px-1.5 py-0.2 rounded">ผู้ดูแล</span>
                      </div>
                      <p className="text-[10px] text-stone-300">
                        เข้าสู่ระบบจัดการคิวและตรวจสอบสลิป
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="btn-admin-direct-login"
                    onClick={handleSwitchToAdminMode}
                    className="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-400 text-stone-950 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <span>เข้าสู่ระบบ Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="px-4 sm:px-6 pb-6 space-y-3.5">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl border border-rose-200 text-center font-bold animate-in fade-in">
                  {error}
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                      <input 
                        type="text" 
                        required 
                        autoComplete="off"
                        id="auth-input-name"
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
                        placeholder="คุณชื่อ นามสกุล" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                        <input 
                          type="tel" 
                          required 
                          autoComplete="off"
                          id="auth-input-phone"
                          value={phone} 
                          onChange={e => setPhone(e.target.value)} 
                          className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
                          placeholder="08X-XXX-XXXX" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        LINE ID
                      </label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                        <input 
                          type="text" 
                          autoComplete="off"
                          id="auth-input-lineid"
                          value={lineId} 
                          onChange={e => setLineId(e.target.value)} 
                          className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
                          placeholder="@yourline" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  อีเมล <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                  <input 
                    type="email" 
                    required 
                    autoComplete="off"
                    id="auth-input-email"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
                    placeholder="name@example.com" 
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">
                    รหัสผ่าน <span className="text-rose-500">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      id="btn-forgot-password-link"
                      onClick={() => {
                        setForgotEmail(email);
                        setMode('forgot_password');
                        setError('');
                      }}
                      className="text-[11px] text-orange-700 hover:text-orange-800 font-bold hover:underline cursor-pointer"
                    >
                      ลืมรหัสผ่าน? (Forgot Password)
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    autoComplete="new-password"
                    id="auth-input-password"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full pl-10 pr-10 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white outline-none transition-all" 
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                id="auth-submit-btn"
                className="w-full py-3 bg-gradient-to-r from-stone-900 to-orange-700 hover:from-stone-800 hover:to-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{mode === 'login' ? 'เข้าสู่ระบบ' : 'ยืนยันการสมัครสมาชิก'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
                {mode === 'login' ? (
                  <p>
                    ยังไม่มีบัญชีสมาชิก?{' '}
                    <button 
                      type="button" 
                      onClick={() => {
                        setMode('register');
                        setError('');
                      }} 
                      className="text-orange-700 font-bold hover:underline cursor-pointer"
                    >
                      สมัครสมาชิกที่นี่
                    </button>
                  </p>
                ) : (
                  <p>
                    มีบัญชีอยู่แล้ว?{' '}
                    <button 
                      type="button" 
                      onClick={() => {
                        setMode('login');
                        setError('');
                      }} 
                      className="text-orange-700 font-bold hover:underline cursor-pointer"
                    >
                      เข้าสู่ระบบ
                    </button>
                  </p>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}
