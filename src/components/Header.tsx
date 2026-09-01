import { useState } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Volume2, 
  VolumeX, 
  Clock, 
  Phone, 
  MessageCircle, 
  Star, 
  Search, 
  X, 
  Menu,
  BookOpen,
  Home,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
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
  searchQuery = '',
  onSearchChange,
}: HeaderProps) {
  const [logoError, setLogoError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleNavClick = (view: 'student' | 'admin' | 'knowledge') => {
    onViewChange(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div id="header-container" className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand Name */}
          <div 
            id="brand-logo-btn"
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0 py-1"
            onClick={() => handleNavClick('student')}
          >
            {logoError ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40 text-white font-black text-xl tracking-tighter shrink-0">
                Z
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                <img 
                  src="/logo.png" 
                  alt="Zarntastic AI LEARNING Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-white flex items-center gap-1">
                  <span>ZARNTASTIC</span>
                  <span className="text-cyan-400 font-bold text-[9px] sm:text-xs px-1.5 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800 whitespace-nowrap">AI</span>
                </h1>
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full shrink-0">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>5.0 Fastwork Pro</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden md:block truncate max-w-xs mt-0.5">
                Turning Ideas Into Visual Experiences • ระบบจองคิว AI
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links (>= lg) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 ml-2 mr-auto shrink-0">
            <button 
              id="nav-btn-home"
              onClick={() => handleNavClick('student')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                currentView === 'student' 
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-xs' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              หน้าแรก & จองคิว
            </button>
            <button 
              id="nav-btn-knowledge"
              onClick={() => handleNavClick('knowledge')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                currentView === 'knowledge' 
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-xs' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              คลังความรู้ AI
            </button>
            <button 
              id="nav-btn-admin-portal"
              onClick={() => handleNavClick('admin')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'admin' 
                  ? 'bg-indigo-600 text-white border border-indigo-500 shadow-xs' 
                  : 'text-indigo-300 hover:text-white hover:bg-indigo-950/60 border border-indigo-800/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ระบบจัดการอาจารย์ (Admin)</span>
            </button>
          </nav>
          
          {/* Desktop Global Search (>= md) */}
          <div className="hidden md:flex items-center mx-2 z-10 relative flex-1 max-w-xs lg:max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                id="header-global-search"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange?.(e.target.value);
                  if (currentView !== 'student') {
                    onViewChange('student');
                  }
                }}
                placeholder="ค้นหาหลักสูตร, เครื่องมือ..."
                className="w-full pl-9 pr-8 py-1.5 bg-slate-800/80 border border-slate-700 rounded-full text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Contact Badges (>= xl) */}
          <div className="hidden xl:flex items-center gap-2">
            <a
              href="https://lin.ee/NE2vFcZ"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold hover:bg-emerald-900/60 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>@zarntastic</span>
            </a>
            <a
              href="tel:0615614269"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>061-5614269</span>
            </a>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* AI Advisor Button */}
            <button
              id="header-btn-ai-advisor"
              onClick={onOpenAIAdvisor}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-sm border border-purple-400/30 transition-all cursor-pointer"
              title="ปรึกษา AI แนะนำคอร์สและเวลาเรียน"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 animate-pulse" />
              <span className="hidden sm:inline">AI Advisor</span>
            </button>

            {/* Sound alert toggle (Admin only) */}
            {isAdmin && (
              <button
                id="header-btn-sound-toggle"
                onClick={onToggleSound}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
            )}

            {/* Notifications Bell (Admin only) */}
            {isAdmin && (
              <button
                id="header-btn-notifications"
                onClick={onOpenNotifications}
                className="relative p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="การแจ้งเตือนคิวและสลิปใหม่ (เฉพาะแอดมิน)"
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
            )}

            {/* Desktop Auth Button (>= lg) */}
            <div className="hidden lg:flex items-center">
              {user ? (
                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                  {isAdmin && (
                    <button
                      onClick={() => handleNavClick(currentView === 'admin' ? 'student' : 'admin')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        currentView === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{currentView === 'admin' ? 'กลับหน้าแรก' : 'จัดการระบบ'}</span>
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 transition-all ml-1 whitespace-nowrap cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>ออก</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              )}
            </div>

            {/* Mobile & Tablet Hamburger Toggle Button (< lg) */}
            <button
              id="btn-mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              className="lg:hidden p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-cyan-400" />
              ) : (
                <Menu className="w-5 h-5 text-slate-200" />
              )}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu (< lg) */}
      {mobileMenuOpen && (
        <div 
          id="mobile-dropdown-menu"
          className="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl px-4 py-4 space-y-4 shadow-2xl animate-in slide-in-from-top-3 duration-200 max-h-[85vh] overflow-y-auto"
        >
          {/* Mobile Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="mobile-search-input"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange?.(e.target.value);
                if (currentView !== 'student') {
                  onViewChange('student');
                }
              }}
              placeholder="ค้นหาชื่อคอร์ส, AI Tools..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <button
              type="button"
              id="mobile-nav-home"
              onClick={() => handleNavClick('student')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                currentView === 'student'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-cyan-400" />
                <span>หน้าแรก & เลือกคอร์สเรียน</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              id="mobile-nav-knowledge"
              onClick={() => handleNavClick('knowledge')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                currentView === 'knowledge'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>คลังความรู้ AI & คู่มือ</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            {/* Admin Portal Entry */}
            <button
              type="button"
              id="mobile-nav-admin"
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                  : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>จัดการระบบอาจารย์ (Admin Portal)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Quick AI Consultant Prompt Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAIAdvisor();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-900/30 cursor-pointer min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>ปรึกษาเลือกคอร์สกับ Gemini AI</span>
            </button>
          </div>

          {/* Quick Contacts Box */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2.5 text-xs">
            <div className="font-bold text-slate-300 flex items-center justify-between">
              <span>ช่องทางติดต่อสถาบัน</span>
              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" /> Fastwork Pro 5.0
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://lin.ee/NE2vFcZ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-400 font-semibold min-h-[40px]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>LINE Official</span>
              </a>
              <a
                href="tel:0615614269"
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-700 border border-slate-600 text-slate-200 font-semibold min-h-[40px]"
              >
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>061-5614269</span>
              </a>
            </div>
            <div className="text-[10px] text-slate-400 leading-tight pt-1 border-t border-slate-700/60">
              <Clock className="w-3 h-3 inline mr-1 text-slate-500" />
              บุคคลทั่วไป: จ-ศ 19:30-22:30, ส 10:00-23:00, อา 09:00-18:00
            </div>
          </div>

          {/* Mobile Auth Button */}
          <div className="pt-2 border-t border-slate-800">
            {user ? (
              <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 text-xs">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-slate-200">{user.email || 'ผู้ใช้งาน'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 transition-colors"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAuthModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <User className="w-4 h-4 text-cyan-400" />
                <span>เข้าสู่ระบบสมาชิก / แอดมิน</span>
              </button>
            )}
          </div>

        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </header>
  );
}
