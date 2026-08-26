import { useState } from 'react';
import { Bell, CalendarCheck, ShieldCheck, Sparkles, User, Volume2, VolumeX, Clock, Phone, MessageCircle, Star, Search, X, Receipt } from 'lucide-react';
import { NotificationItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { INSTRUCTOR_INFO } from '../data/courses';

interface HeaderProps {
  currentView: 'student' | 'admin' | 'knowledge';
  onViewChange: (view: 'student' | 'admin' | 'knowledge') => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenNotifications: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAIAdvisor: () => void;
  onOpenTrackBooking?: () => void;
  onOpenAuthModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Header({
  currentView,
  onViewChange,
  unreadCount,
  onOpenNotifications,
  soundEnabled,
  onToggleSound,
  onOpenAIAdvisor,
  onOpenTrackBooking,
  onOpenAuthModal,
  searchQuery = '',
  onSearchChange,
}: HeaderProps) {
    const [logoError, setLogoError] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-2 py-3 lg:py-0 lg:h-20 pb-4 lg:pb-0">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer order-1" onClick={() => onViewChange('student')}>
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

          
          {/* Main Navigation */}
          <div className="w-full lg:w-auto flex items-center justify-center gap-3 sm:gap-5 order-3 lg:order-2 lg:ml-8 lg:mr-auto">
            <button 
              onClick={() => onViewChange('student')}
              className={`text-sm font-semibold transition-colors cursor-pointer ${currentView === 'student' ? 'text-cyan-400 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              หน้าแรก
            </button>
            <button 
              onClick={() => onViewChange('knowledge')}
              className={`text-sm font-semibold transition-colors cursor-pointer ${currentView === 'knowledge' ? 'text-cyan-400 font-bold' : 'text-slate-300 hover:text-white'}`}
            >
              คลังความรู้
            </button>
            {onOpenTrackBooking && (
              <button 
                onClick={onOpenTrackBooking}
                className="text-sm font-semibold text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded-lg cursor-pointer"
                title="ค้นหาคิวจอง ตรวจสอบสถานะ และอัปโหลดสลิปย้อนหลัง"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>ค้นหาคิว / ส่งสลิป</span>
              </button>
            )}
            <button 
              onClick={() => onViewChange(currentView === 'admin' ? 'student' : 'admin')}
              className={`text-sm font-semibold transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg border cursor-pointer ${
                currentView === 'admin' 
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                  : 'bg-indigo-950/50 border-indigo-700/60 text-indigo-300 hover:text-white hover:bg-indigo-900/60'
              }`}
              title="เข้าสู่ระบบจัดการ Admin"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin</span>
            </button>
          </div>
          
          {/* Global Search */}
          <div className="w-full md:w-auto flex items-center justify-center order-4 lg:order-3 lg:ml-auto lg:mr-4 xl:mr-0 z-10 relative">
            <div className="relative w-full max-w-md md:w-48 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange?.(e.target.value);
                  if (currentView !== 'student') {
                    onViewChange('student');
                  }
                }}
                placeholder="ค้นหาหลักสูตร..."
                className="w-full pl-9 pr-8 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Contact & Hours Badges */}
          <div className="w-full xl:w-auto flex items-center justify-center gap-3 order-5 xl:order-4 xl:ml-4">
            <a
              href="https://lin.ee/Sy3xOAP"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-sm transition-all hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>LINE</span>
            </a>
            <a
              href="tel:0615614269"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold hover:bg-slate-750 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>061-5614269</span>
            </a>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 order-2 lg:order-5 ml-auto lg:ml-0">
            
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

            {/* Auth & View Controls */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              {user ? (
                <div className="flex items-center">
                  {isAdmin && (
                    <button
                      onClick={() => onViewChange(currentView === 'admin' ? 'student' : 'admin')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        currentView === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{currentView === 'admin' ? 'กลับหน้าแรก' : 'จัดการระบบ'}</span>
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 transition-all ml-1"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ออกจากระบบ</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuthModal}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}