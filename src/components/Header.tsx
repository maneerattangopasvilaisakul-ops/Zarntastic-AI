import { useState } from 'react';
import { Bell, CalendarCheck, ShieldCheck, Sparkles, User, Volume2, VolumeX, Clock, Phone, MessageCircle, Star } from 'lucide-react';
import { NotificationItem } from '../types';
import { INSTRUCTOR_INFO } from '../data/courses';

interface HeaderProps {
  currentView: 'student' | 'admin';
  onViewChange: (view: 'student' | 'admin') => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenNotifications: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAIAdvisor: () => void;
}

export function Header({
  currentView,
  onViewChange,
  unreadCount,
  onOpenNotifications,
  soundEnabled,
  onToggleSound,
  onOpenAIAdvisor,
}: HeaderProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewChange('student')}>
            {logoError ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40 text-white font-black text-xl tracking-tighter shrink-0">
                Z
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                <img 
                  src="/logo.png" 
                  alt="Zarntastic AI LEARNING Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  ZARNTASTIC <span className="text-cyan-400 font-bold text-xs px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800">AI LEARNING</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>5.0 Fastwork Pro</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
                Turning Ideas Into Visual Experiences • ระบบจองคิวเรียน AI อัตโนมัติ
              </p>
            </div>
          </div>

          {/* Contact & Hours Badges */}
          <div className="hidden xl:flex items-center gap-3">
            <a
              href="https://lin.ee/Sy3xOAP"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold hover:bg-emerald-900/60 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>LINE: @zarntastic</span>
            </a>
            <a
              href="tel:0615614269"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>061-5614269</span>
            </a>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* AI Advisor Button */}
            <button
              id="header-btn-ai-advisor"
              onClick={onOpenAIAdvisor}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 text-xs sm:text-sm font-medium text-white shadow-sm border border-purple-400/30 transition-all cursor-pointer"
              title="ปรึกษา AI แนะนำคอร์สและเวลาเรียน"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span className="hidden sm:inline">AI Advisor</span>
            </button>

            {/* Sound alert toggle */}
            <button
              id="header-btn-sound-toggle"
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Notifications Bell */}
            <button
              id="header-btn-notifications"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="การแจ้งเตือนคิวและสลิปใหม่"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold text-white items-center justify-center">
                    {unreadCount}
                  </span>
                </span>
              )}
            </button>

            {/* View Mode Switcher (Student vs Admin) */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                id="header-btn-view-student"
                onClick={() => onViewChange('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'student'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>จองคอร์ส</span>
              </button>
              <button
                id="header-btn-view-admin"
                onClick={() => onViewChange('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'admin'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>แอดมิน</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
