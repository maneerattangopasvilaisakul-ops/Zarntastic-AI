import { useState, useEffect, useCallback, useRef } from 'react';
import { Course, Booking, ScheduleSlot, CustomerInfo, NotificationItem, BookingStatus, UserCategory } from './types';
import { COURSES } from './data/courses';
import { Header } from './components/Header';
import { CourseSelector } from './components/CourseSelector';
import { SlotScheduler } from './components/SlotScheduler';
import { CustomerForm } from './components/CustomerForm';
import { PaymentModal } from './components/PaymentModal';
import { BookingSuccessModal } from './components/BookingSuccessModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AICourseAdvisor } from './components/AICourseAdvisor';
import { NotificationDrawer } from './components/NotificationDrawer';
import { CourseDetailModal } from './components/CourseDetailModal';
import { FastworkReviews } from './components/FastworkReviews';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  X, 
  CalendarCheck,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // Navigation & View Mode
  const [currentView, setCurrentView] = useState<'student' | 'admin'>('student');
  const [bookingStep, setBookingStep] = useState<'course' | 'schedule' | 'customer'>('course');

  // Selected State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(COURSES[0]);
  const [selectedSlots, setSelectedSlots] = useState<ScheduleSlot[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    lineId: '',
    notes: '',
    experienceLevel: 'Beginner',
    clientType: 'general',
  });

  // Data Store
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(true);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string>('');

  // Modals
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState<boolean>(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState<boolean>(false);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  // Sound alert & Notification Toast
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'alert' | 'info' } | null>(null);
  const prevNotifCountRef = useRef<number>(0);

  // Play audio chime using Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.2); // D6

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // ignore
    }
  }, [soundEnabled]);

  // Show Toast
  const triggerToast = (title: string, desc: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setToastMessage({ title, desc, type });
    playNotificationSound();
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Fetch Bookings & Notifications from Backend API
  const fetchBookings = useCallback(async () => {
    try {
      const [bookingsRes, notifsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/notifications'),
      ]);
      if (bookingsRes.ok) {
        const bookingsData: Booking[] = await bookingsRes.json();
        setBookings(bookingsData);
      }
      if (notifsRes.ok) {
        const notifsData: NotificationItem[] = await notifsRes.json();
        setNotifications(notifsData);

        // Check if new notifications arrived
        if (prevNotifCountRef.current > 0 && notifsData.length > prevNotifCountRef.current) {
          const newest = notifsData[0];
          triggerToast(newest.title, newest.message, 'info');
        }
        prevNotifCountRef.current = notifsData.length;
      }
    } catch (e) {
      console.warn('Fallback to local state if fetch interrupted:', e);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 8000); // polling updates
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // Create Booking
  const handleCreateBooking = async () => {
    if (!selectedCourse || selectedSlots.length === 0) return;
    setIsSubmittingBooking(true);
    setServerError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          courseTitle: selectedCourse.title,
          totalHours: selectedCourse.totalHours,
          totalDays: selectedCourse.totalDays,
          totalPrice: selectedCourse.price,
          customer: customerInfo,
          schedule: selectedSlots,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'เกิดข้อผิดพลาดในการจอง');
        triggerToast('ไม่สามารถจองได้', data.error || 'ช่วงเวลานี้ถูกจองแล้ว', 'alert');
        return;
      }

      // Success
      setActiveBooking(data.booking);
      setIsPaymentModalOpen(true);
      triggerToast('สร้างรายการจองสำเร็จ', `รหัส ${data.booking.id} กรุณาแนบสลิปเพื่อยืนยัน`, 'success');
      fetchBookings();
    } catch (err: any) {
      setServerError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Upload Slip
  const handleUploadSlip = async (slipUrl: string, referenceNo?: string, manualAmount?: number) => {
    if (!activeBooking) return;
    try {
      const res = await fetch(`/api/bookings/${activeBooking.id}/slip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slipUrl,
          referenceNo,
          manualAmount,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActiveBooking(data.booking);
        setIsPaymentModalOpen(false);
        setIsSuccessModalOpen(true);
        triggerToast('ส่งสลิปเรียบร้อย', 'ระบบ AI และแอดมินกำลังตรวจสอบความถูกต้อง', 'success');
        fetchBookings();
      } else {
        triggerToast('ข้อผิดพลาด', data.error || 'ไม่สามารถส่งสลิปได้', 'alert');
      }
    } catch (err) {
      triggerToast('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'alert');
    }
  };

  // Admin Update Status
  const handleAdminUpdateStatus = async (bookingId: string, status: BookingStatus, reviewNotes?: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes }),
      });
      if (res.ok) {
        triggerToast('อัปเดตสถานะสำเร็จ', `เปลี่ยนสถานะคิวเป็น ${status.toUpperCase()}`, 'success');
        fetchBookings();
      }
    } catch (e) {
      triggerToast('เกิดข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้', 'alert');
    }
  };

  // Mark all notifs as read
  const handleMarkNotifsRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', { method: 'POST' });
      fetchBookings();
    } catch (e) {
      // ignore
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-start gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toastMessage.type === 'alert' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-xs sm:text-sm text-white">{toastMessage.title}</div>
              <div className="text-xs text-slate-300 mt-0.5">{toastMessage.desc}</div>
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        notifications={notifications}
        unreadCount={unreadNotifCount}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {currentView === 'student' ? (
          <div className="space-y-8">
            
            {/* Step Navigation Progress Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between overflow-x-auto">
              {[
                { step: 'course', number: 1, title: 'เลือกคอร์สเรียน AI' },
                { step: 'schedule', number: 2, title: 'เลือกวัน & เวลาเรียน' },
                { step: 'customer', number: 3, title: 'ข้อมูลผู้เรียน & สลิป' },
              ].map((s, idx) => {
                const isActive = bookingStep === s.step;
                const isPassed = (s.step === 'course' && bookingStep !== 'course') ||
                                 (s.step === 'schedule' && bookingStep === 'customer');

                return (
                  <div key={s.step} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <button
                      onClick={() => {
                        if (s.step === 'course') setBookingStep('course');
                        if (s.step === 'schedule' && selectedCourse) setBookingStep('schedule');
                      }}
                      className={`flex items-center gap-2 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'text-cyan-700'
                          : isPassed
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        isActive
                          ? 'bg-cyan-600 text-white ring-2 ring-cyan-600/30'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-4 h-4" /> : s.number}
                      </span>
                      <span>{s.title}</span>
                    </button>

                    {idx < 2 && (
                      <ChevronRight className="w-4 h-4 text-slate-300 mx-1 sm:mx-3" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 1: Course Selection */}
            {bookingStep === 'course' && (
              <div className="space-y-12">
                <CourseSelector
                  selectedCourse={selectedCourse}
                  onSelectCourse={(course) => {
                    setSelectedCourse(course);
                    setSelectedSlots([]);
                    setBookingStep('schedule');
                  }}
                  onOpenDetails={(course) => {
                    setDetailCourse(course);
                    setIsDetailModalOpen(true);
                  }}
                />

                {/* Reviews and Ratings from Fastwork */}
                <FastworkReviews />
              </div>
            )}

            {/* Step 2: Slot Scheduling */}
            {bookingStep === 'schedule' && selectedCourse && (
              <SlotScheduler
                course={selectedCourse}
                bookings={bookings}
                selectedSlots={selectedSlots}
                onSelectSlots={(slots) => setSelectedSlots(slots)}
                onProceedToForm={() => setBookingStep('customer')}
                userCategory={(customerInfo.clientType as UserCategory) || 'general'}
                onUserCategoryChange={(category) => setCustomerInfo((prev) => ({ ...prev, clientType: category }))}
              />
            )}

            {/* Step 3: Customer Registration Form */}
            {bookingStep === 'customer' && selectedCourse && (
              <CustomerForm
                course={selectedCourse}
                selectedSlots={selectedSlots}
                customerInfo={customerInfo}
                onUpdateCustomer={(info) => setCustomerInfo(info)}
                onBackToSlots={() => setBookingStep('schedule')}
                onSubmitToPayment={handleCreateBooking}
                isLoading={isSubmittingBooking}
                errorMessage={serverError}
              />
            )}

          </div>
        ) : (
          /* Admin / Instructor Portal */
          <AdminDashboard
            bookings={bookings}
            onUpdateBookingStatus={handleAdminUpdateStatus}
            onRefreshBookings={fetchBookings}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700">
            ZARNTASTIC AI LEARNING • Fastwork Verified AI Specialist & Corporate Trainer
          </p>
          <p>
            บุคคลทั่วไป: จันทร์-ศุกร์ (19.30-22.30 น.), เสาร์-อาทิตย์ (09.00-18.00 น.) • องค์กร (Corporate In-House): จันทร์-เสาร์ (09.00-18.00 น.)
          </p>
        </div>
      </footer>

      {/* Course Detail Modal */}
      <CourseDetailModal
        course={detailCourse}
        onClose={() => setIsDetailModalOpen(false)}
        onSelectCourse={(course) => {
          setSelectedCourse(course);
          setSelectedSlots([]);
          setBookingStep('schedule');
        }}
      />

      {/* Payment & Slip Upload Modal */}
      {isPaymentModalOpen && activeBooking && (
        <PaymentModal
          booking={activeBooking}
          onUploadSlip={handleUploadSlip}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {/* Booking Success Voucher Modal */}
      {isSuccessModalOpen && activeBooking && (
        <BookingSuccessModal
          booking={activeBooking}
          onClose={() => {
            setIsSuccessModalOpen(false);
            setBookingStep('course');
            setSelectedSlots([]);
          }}
          onViewAdmin={() => {
            setIsSuccessModalOpen(false);
            setCurrentView('admin');
          }}
        />
      )}

      {/* AI Course Advisor Chat */}
      <AICourseAdvisor
        isOpen={isAIAdvisorOpen}
        onClose={() => setIsAIAdvisorOpen(false)}
        onSelectCourseById={(courseId) => {
          const found = COURSES.find((c) => c.id === courseId);
          if (found) {
            setSelectedCourse(found);
            setSelectedSlots([]);
            setBookingStep('schedule');
            setIsAIAdvisorOpen(false);
          }
        }}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkNotifsRead}
        onSelectBooking={(bookingId) => {
          setCurrentView('admin');
        }}
      />

    </div>
  );
}
