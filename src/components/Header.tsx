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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 text-stone-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div id="header-container" className="flex items-center justify-between min-h-16 sm:min-h-20 py-2 sm:py-0 gap-2 sm:gap-4">
          
          {/* Logo & Brand Name */}
          <div 
            id="brand-logo-btn"
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0 py-1"
            onClick={() => handleNavClick('student')}
          >
            {logoError ? (
              <div className="flex items-center gap-2.5">
                {/* Z Icon matching the uploaded logo */}
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="zTop" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#fcd34d" />
                      </linearGradient>
                      <linearGradient id="zDiag" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ea580c" />
                        <stop offset="100%" stopColor="#9a3412" />
                      </linearGradient>
                      <linearGradient id="zBottom" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ea580c" />
                      </linearGradient>
                    </defs>
                    <path d="M 15 35 H 75 Q 85 35 85 25 Q 85 15 75 15 H 15 Q 5 15 5 25 Q 5 35 15 35 Z" fill="url(#zTop)" />
                    <path d="M 85 25 L 15 85 L 35 85 L 90 25 Z" fill="url(#zDiag)" />
                    <path d="M 25 85 H 85 Q 95 85 95 75 Q 95 65 85 65 H 25 Q 15 65 15 75 Q 15 85 25 85 Z" fill="url(#zBottom)" />
                  </svg>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="font-extrabold text-base sm:text-lg lg:text-xl tracking-tight text-[#4A2B12] leading-[1.1]">
                    Zarntastic
                  </div>
                  <span className="text-[#ea580c] font-bold text-[9px] sm:text-[10px] tracking-[0.15em] uppercase mt-0.5">
                    AI LEARNING
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-auto h-9 sm:h-11 flex items-center justify-center shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Zarntastic AI LEARNING Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
          </div>

          {/* Desktop Navigation Links (>= lg) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 ml-2 mr-auto shrink-0">
            <button 
              id="nav-btn-home"
              onClick={() => handleNavClick('student')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                currentView === 'student' 
                  ? 'bg-stone-100 text-orange-600 border border-stone-200 shadow-xs' 
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              หน้าแรก & จองคิว
            </button>
            <button 
              id="nav-btn-knowledge"
              onClick={() => handleNavClick('knowledge')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                currentView === 'knowledge' 
                  ? 'bg-stone-100 text-orange-600 border border-stone-200 shadow-xs' 
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
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
              <Search className="absolute left-3 top-1/2 -transtone-y-1/2 w-4 h-4 text-stone-400" />
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
                className="w-full pl-9 pr-8 py-1.5 bg-stone-100 border border-stone-200 rounded-full text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-stone-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-2.5 top-1/2 -transtone-y-1/2 text-stone-500 hover:text-stone-800"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop Contact Badges (>= xl) */}
          <div className="hidden xl:flex items-center gap-2">
            <a
              href="https://line.me/R/ti/p/@761rqbfc?ts=09011400&oat_content=url"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold hover:bg-emerald-900/60 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>LINE ID: zarn</span>
            </a>
            <a
              href="tel:0615614269"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-xs font-semibold hover:text-stone-900 hover:bg-stone-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-orange-400" />
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
                className="p-2 sm:p-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200 transition-colors cursor-pointer"
                title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
              </button>
            )}

            {/* Notifications Bell (Admin only) */}
            {isAdmin && (
              <button
                id="header-btn-notifications"
                onClick={onOpenNotifications}
                className="relative p-2 sm:p-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200 transition-colors cursor-pointer"
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
                <div className="flex items-center bg-stone-800 p-1 rounded-xl border border-stone-700">
                  {isAdmin && (
                    <button
                      onClick={() => handleNavClick(currentView === 'admin' ? 'student' : 'admin')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        currentView === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{currentView === 'admin' ? 'กลับหน้าแรก' : 'จัดการระบบ'}</span>
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-400 hover:text-rose-400 transition-all ml-1 whitespace-nowrap cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>ออก</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md transition-all cursor-pointer"
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
              className="lg:hidden p-2 sm:p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-200 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-orange-400" />
              ) : (
                <Menu className="w-5 h-5 text-stone-600" />
              )}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu (< lg) */}
      {mobileMenuOpen && (
        <div 
          id="mobile-dropdown-menu"
          className="lg:hidden border-t border-stone-200 bg-white/98 backdrop-blur-xl px-4 py-4 space-y-4 shadow-2xl animate-in slide-in-from-top-3 duration-200 max-h-[85vh] overflow-y-auto"
        >
          {/* Mobile Search Input */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -transtone-y-1/2 w-4 h-4 text-stone-400" />
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
              className="w-full pl-10 pr-9 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="absolute right-3 top-1/2 -transtone-y-1/2 text-stone-500 hover:text-stone-800 p-1"
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
                  ? 'bg-orange-600/20 text-orange-400 border border-orange-500/40'
                  : 'bg-stone-800/60 text-stone-200 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-orange-400" />
                <span>หน้าแรก & เลือกคอร์สเรียน</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-500" />
            </button>

            <button
              type="button"
              id="mobile-nav-knowledge"
              onClick={() => handleNavClick('knowledge')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                currentView === 'knowledge'
                  ? 'bg-orange-600/20 text-orange-400 border border-orange-500/40'
                  : 'bg-stone-800/60 text-stone-200 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-orange-400" />
                <span>คลังความรู้ AI & คู่มือ</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-500" />
            </button>

            {/* Admin Portal Entry */}
            <button
              type="button"
              id="mobile-nav-admin"
              onClick={() => handleNavClick('admin')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                  : 'bg-stone-800/60 text-stone-200 hover:bg-stone-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>จัดการระบบอาจารย์ (Admin Portal)</span>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-500" />
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
          <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200/80 space-y-2.5 text-xs">
            <div className="font-bold text-stone-300 flex items-center justify-between">
              <span>ช่องทางติดต่อสถาบัน</span>
              <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" /> Fastwork Pro 5.0
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://line.me/R/ti/p/@761rqbfc?ts=09011400&oat_content=url"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-400 font-semibold min-h-[40px]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>LINE Official</span>
              </a>
              <a
                href="tel:0615614269"
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-stone-700 border border-stone-600 text-stone-200 font-semibold min-h-[40px]"
              >
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                <span>061-5614269</span>
              </a>
            </div>
            <div className="text-[10px] text-stone-400 leading-tight pt-1 border-t border-stone-700/60">
              <Clock className="w-3 h-3 inline mr-1 text-stone-500" />
              บุคคลทั่วไป: จ-ศ 19:30-22:30, ส 10:00-23:00, อา 09:00-18:00
            </div>
          </div>

          {/* Mobile Auth Button */}
          <div className="pt-2 border-t border-stone-800">
            {user ? (
              <div className="flex items-center justify-between bg-stone-800/80 p-2.5 rounded-xl border border-stone-700">
                <div className="flex items-center gap-2 text-xs">
                  <User className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-stone-200">{user.email || 'ผู้ใช้งาน'}</span>
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
                className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold border border-stone-700 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <User className="w-4 h-4 text-orange-400" />
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
