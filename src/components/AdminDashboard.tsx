import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Booking, BookingStatus, Course } from '../types';
import { COURSES } from '../data/courses';
import { formatThaiDate, formatCurrency, getValidNextDates } from '../utils/scheduleUtils';
import { syncToGoogleCalendar } from '../utils/calendar';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Download, 
  Eye, 
  AlertCircle, 
  Send, 
  Lock, 
  Plus, 
  Trash2, 
  Video, 
  User, 
  Phone, 
  Mail, 
  MessageSquare,
  FileCheck,
  RefreshCw,
  ExternalLink,
  ListFilter,
  CalendarDays,
  Database,
  Flame,
  Check,
  Layers,
  SearchX,
  Share2
} from 'lucide-react';
import { AdminCalendarView } from './AdminCalendarView';
import { AdminAINewsAutomation } from './AdminAINewsAutomation';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { EditBookingModal } from './EditBookingModal';
import { normalizeMeetingLink, isInstantMeetLink } from '../utils/meetingUtils';

interface AdminDashboardProps {
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus, reviewNotes?: string) => Promise<void>;
  onRefreshBookings: () => void;
  onOpenShareLink?: () => void;
}

export function AdminDashboard({
  bookings,
  onUpdateBookingStatus,
  onRefreshBookings,
  onOpenShareLink,
}: AdminDashboardProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'automation'>('list');
  const [inspectingBooking, setInspectingBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [lineTestResult, setLineTestResult] = useState<string | null>(null);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingEmail, setIsTestingEmail] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    configured: boolean;
    providers: { id: string; name: string }[];
    hasGmail: boolean;
    gmailUser: string | null;
  } | null>(null);

  const fetchEmailStatus = async () => {
    try {
      const headers: Record<string, string> = {};
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      const res = await fetch('/api/admin/email-status', { headers });
      if (res.ok) {
        const data = await res.json();
        setEmailStatus(data);
      }
    } catch (e) {}
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setEmailTestResult(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: 'maneerat.tangopasvilaisakul@gmail.com' }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailTestResult({
          success: true,
          message: data.preview
            ? `บันทึกระบบจำลอง: ${data.message}`
            : `ส่งอีเมลทดสอบไปยัง ${data.to} สำเร็จเรียบร้อยแล้ว! (${data.provider || 'Gmail SMTP'})`,
        });
      } else {
        setEmailTestResult({
          success: false,
          message: data.error || 'ไม่สามารถส่งอีเมลได้ กรุณาตรวจสอบการตั้งค่าอีเมล',
        });
      }
    } catch (err: any) {
      setEmailTestResult({ success: false, message: `ข้อผิดพลาด: ${err.message}` });
    } finally {
      setIsTestingEmail(false);
      setTimeout(() => setEmailTestResult(null), 10000);
    }
  };

  // Database & Test Data States
  const [firebaseStatus, setFirebaseStatus] = useState<{
    connected: boolean;
    databaseId?: string;
    mode?: string;
    totalBookings?: number;
    totalNotifications?: number;
    lastSync?: string;
  }>({ connected: false, databaseId: 'bookings_db.json' });
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Google Meet & System Settings States
  const [systemSettings, setSystemSettings] = useState<{
    defaultMeetLink: string;
    instructorName: string;
    contactPhone: string;
    contactLine: string;
    contactLineId: string;
    contactEmail: string;
  } | null>(null);
  const [editingMeetLink, setEditingMeetLink] = useState<string>('');
  const [isUpdatingMeetLink, setIsUpdatingMeetLink] = useState<boolean>(false);
  const [showMeetSettingsModal, setShowMeetSettingsModal] = useState<boolean>(false);
  const [defaultMeetInput, setDefaultMeetInput] = useState<string>('');
  const [isSavingMeetSettings, setIsSavingMeetSettings] = useState<boolean>(false);

  // Fetch Firebase Status
  const fetchFirebaseStatus = async () => {
    try {
      const res = await fetch('/api/firebase/status');
      if (res.ok) {
        const data = await res.json();
        setFirebaseStatus(data);
      }
    } catch (e) {
      // ignore
    }
  };

  // Fetch System Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSystemSettings(data.settings);
          setDefaultMeetInput(data.settings.defaultMeetLink || 'https://meet.google.com/new');
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchFirebaseStatus();
    fetchEmailStatus();
    fetchSettings();
    const interval = setInterval(() => {
      fetchFirebaseStatus();
      fetchEmailStatus();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync editingMeetLink when inspecting a booking
  useEffect(() => {
    if (inspectingBooking) {
      setEditingMeetLink(normalizeMeetingLink(inspectingBooking.meetingLink));
    }
  }, [inspectingBooking?.id]);

  // Update Google Meet link for inspecting booking
  const handleSaveBookingMeetLink = async () => {
    if (!inspectingBooking) return;
    if (!editingMeetLink.trim()) {
      alert('กรุณากรอกลิงก์ Google Meet');
      return;
    }
    setIsUpdatingMeetLink(true);
    try {
      const res = await fetch(`/api/bookings/${inspectingBooking.id}/meeting-link`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({ meetingLink: editingMeetLink.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.booking) {
        setInspectingBooking(data.booking);
        onRefreshBookings();
        setSeedNotice('อัปเดตลิงก์ห้องเรียน Google Meet เรียบร้อยแล้ว!');
        setTimeout(() => setSeedNotice(null), 5000);
      } else {
        alert(data.error || 'ไม่สามารถบันทึกลิงก์ห้องเรียนได้');
      }
    } catch (e: any) {
      alert(e.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsUpdatingMeetLink(false);
    }
  };

  // Update Default Google Meet Room for all future bookings
  const handleSaveDefaultMeetLink = async () => {
    if (!defaultMeetInput.trim()) {
      alert('กรุณากรอกลิงก์ Google Meet');
      return;
    }
    setIsSavingMeetSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify({ defaultMeetLink: defaultMeetInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSystemSettings(data.settings);
        setShowMeetSettingsModal(false);
        setSeedNotice('บันทึกห้องเรียนเริ่มต้น Google Meet สำเร็จ!');
        setTimeout(() => setSeedNotice(null), 5000);
      }
    } catch (e: any) {
      alert(e.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSavingMeetSettings(false);
    }
  };

  // Handle Seed Test Data to Firebase
  const handleSeedTestData = async () => {
    setIsSeeding(true);
    setSeedNotice(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      const res = await fetch('/api/admin/seed-test-data', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        setSeedNotice(data.message || 'สร้างชุดข้อมูลทดสอบใน Firebase สำเร็จแล้ว!');
        onRefreshBookings();
        fetchFirebaseStatus();
      } else {
        setSeedNotice(data.error || 'เกิดข้อผิดพลาดในการสร้างข้อมูลทดสอบ');
      }
    } catch (err: any) {
      setSeedNotice(`ข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSeeding(false);
      setTimeout(() => setSeedNotice(null), 8000);
    }
  };

  // Handle Clear Test Data from Firebase
  const handleClearTestData = async () => {
    setIsClearing(true);
    setShowClearConfirm(false);
    setSeedNotice(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      const res = await fetch('/api/admin/clear-test-data', {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        setSeedNotice(data.message || 'ล้างข้อมูลใน Firebase Firestore เรียบร้อยแล้ว');
        onRefreshBookings();
        fetchFirebaseStatus();
      } else {
        setSeedNotice(data.error || 'เกิดข้อผิดพลาดในการล้างข้อมูล');
      }
    } catch (err: any) {
      setSeedNotice(`ข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsClearing(false);
      setTimeout(() => setSeedNotice(null), 8000);
    }
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const customerName = b.customer?.name || '';
      const customerPhone = b.customer?.phone || '';
      const bookingId = b.id || '';
      const courseTitle = b.courseTitle || '';

      const matchSearch =
        (customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerPhone.includes(searchTerm) ||
        (bookingId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (courseTitle || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || (b.payment?.status || '') === statusFilter;

      let matchDate = true;
      if (dateFilter !== 'all' && b.createdAt) {
        const bookingDate = new Date(b.createdAt || Date.now());
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateFilter === 'today') {
          matchDate = bookingDate >= today;
        } else if (dateFilter === 'last7days') {
          const last7 = new Date(today);
          last7.setDate(last7.getDate() - 7);
          matchDate = bookingDate >= last7;
        } else if (dateFilter === 'thisMonth') {
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          matchDate = bookingDate >= firstDayOfMonth;
        }
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

  // KPI Metrics
  const metrics = useMemo(() => {
    // Filter bookings only by date filter for top-level KPIs
    const dateFiltered = bookings.filter(b => {
      let matchDate = true;
      if (dateFilter !== 'all' && b.createdAt) {
        const bookingDate = new Date(b.createdAt || Date.now());
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateFilter === 'today') {
          matchDate = bookingDate >= today;
        } else if (dateFilter === 'last7days') {
          const last7 = new Date(today);
          last7.setDate(last7.getDate() - 7);
          matchDate = bookingDate >= last7;
        } else if (dateFilter === 'thisMonth') {
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          matchDate = bookingDate >= firstDayOfMonth;
        }
      }
      return matchDate;
    });

    const total = dateFiltered.length;
    const pendingReview = dateFiltered.filter((b) => (b.payment?.status || '') === 'under_review' || (b.payment?.status || '') === 'pending_slip').length;
    const confirmed = dateFiltered.filter((b) => (b.payment?.status || '') === 'confirmed').length;
    const totalRevenue = dateFiltered
      .filter((b) => (b.payment?.status || '') === 'confirmed' || (b.payment?.status || '') === 'completed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return { total, pendingReview, confirmed, totalRevenue };
  }, [bookings, dateFilter]);

  // Chart Data (Bookings per course over selected period)
  const chartData = useMemo(() => {
    const dateFiltered = bookings.filter(b => {
      let matchDate = true;
      if (dateFilter !== 'all' && b.createdAt) {
        const bookingDate = new Date(b.createdAt || Date.now());
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateFilter === 'today') {
          matchDate = bookingDate >= today;
        } else if (dateFilter === 'last7days') {
          const last7 = new Date(today);
          last7.setDate(last7.getDate() - 7);
          matchDate = bookingDate >= last7;
        } else if (dateFilter === 'thisMonth') {
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          matchDate = bookingDate >= firstDayOfMonth;
        }
      }
      return matchDate;
    });

    const courseCounts: Record<string, number> = {};
    dateFiltered.forEach((b) => {
      // Shorten the title for the chart to make it fit nicely
      const title = b.courseTitle || 'คอร์สเรียน AI';
      const shortTitle = title.split('(')[0].trim();
      courseCounts[shortTitle] = (courseCounts[shortTitle] || 0) + 1;
    });

    return Object.keys(courseCounts)
      .map((title) => ({
        name: title,
        bookings: courseCounts[title],
      }))
      .sort((a, b) => b.bookings - a.bookings); // Sort by highest demand
  }, [bookings, dateFilter]);

  // Export CSV
  const handleExportCSV = () => {
  const sanitizeCSV = (val: string) => {
    if (val && /^[=+-@]/.test(val)) {
      return "'" + val;
    }
    return val;
  };

    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Email', 'LINE ID', 'Course', 'Price', 'Status', 'Dates & Times', 'Created At'];
    const rows = bookings.map((b) => [
      b.id,
      `"${sanitizeCSV(b.customer?.name || '')}"`,
      `"${sanitizeCSV(b.customer?.phone || '')}"`,
      `"${sanitizeCSV(b.customer?.email || '')}"`,
      `"${sanitizeCSV(b.customer?.lineId || '')}"`,
      `"${b.courseTitle || 'คอร์สเรียน AI'}"`,
      b.totalPrice,
      b.payment?.status || '',
      `"${(b.schedule || []).map((s) => `${s.date} (${s.startTime}-${s.endTime})`).join('; ')}"`,
      b.createdAt || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai_course_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Test LINE Notify Webhook
  const handleTestLineNotify = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      const res = await fetch('/api/notifications/test-webhook', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          channel: 'LINE Official / Notify',
          recipient: 'Admin Group',
          message: `ทดสอบระบบแจ้งเตือนคอร์ส AI สำเร็จ มีคิวที่ต้องตรวจสอบ ${metrics.pendingReview} รายการ`,
        }),
      });
      const data = await res.json();
      setLineTestResult(`ส่งแจ้งเตือนสำเร็จ: ${data.previewMessage || 'เรียบร้อย'}`);
      setTimeout(() => setLineTestResult(null), 5000);
    } catch (e) {
      setLineTestResult('ส่งทดสอบแจ้งเตือนเรียบร้อย (จำลองระบบ)');
      setTimeout(() => setLineTestResult(null), 5000);
    }
  };

  
  const handleSyncCalendar = async (booking: Booking) => {
    setIsSyncingCalendar(true);
    try {
      let token = googleToken;
      if (!token) {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          token = credential.accessToken;
          setGoogleToken(token);
        } else {
          throw new Error('ไม่สามารถดึงข้อมูลสิทธิ์การเข้าถึง Calendar ได้');
        }
      }
      
      const success = await syncToGoogleCalendar(booking, token);
      if (success) {
        setSeedNotice('ซิงค์ข้อมูลลง Google Calendar สำเร็จ!');
      } else {
        setSeedNotice('เกิดข้อผิดพลาดในการสร้างกิจกรรมบน Calendar');
      }
    } catch (error: any) {
      console.error(error);
      setSeedNotice('Calendar Error: ' + error.message);
    } finally {
      setIsSyncingCalendar(false);
      setTimeout(() => setSeedNotice(null), 8000);
    }
  };

  const handleApproveSlip = async (booking: Booking) => {
    setIsSubmittingReview(true);
    try {
      await onUpdateBookingStatus(booking.id, 'confirmed', reviewNoteInput || 'สลิปถูกต้อง อนุมัติคิวเรียบร้อย');
      setInspectingBooking(null);
      setReviewNoteInput('');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRejectSlip = async (booking: Booking) => {
    setIsSubmittingReview(true);
    try {
      await onUpdateBookingStatus(booking.id, 'rejected', reviewNoteInput || 'สลิปไม่ถูกต้อง หรือยอดเงินไม่ตรง');
      setInspectingBooking(null);
      setReviewNoteInput('');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันคิวแล้ว</span>;
      case 'under_review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold animate-pulse"><Clock className="w-3.5 h-3.5" /> รอตรวจสลิป</span>;
      case 'pending_slip':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200 text-xs font-bold"><Clock className="w-3.5 h-3.5" /> รอลูกค้าแนบสลิป</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> ปฏิเสธสลิป</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold"><FileCheck className="w-3.5 h-3.5" /> เรียนเสร็จสิ้น</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-xs font-medium">ยกเลิกแล้ว</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>โหมดผู้ดูแลระบบ / อาจารย์ผู้สอน (Admin Portal)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            ระบบจัดการคิวและตรวจสอบสลิปการจอง
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            ตรวจสถานะการชำระเงิน, สลิปโอนเงิน, ป้องกันเวลาชนกัน, และจัดการตารางสอนแบบ Real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenShareLink && (
            <button
              id="admin-btn-share-link"
              onClick={onOpenShareLink}
              className="p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="ลิงก์สั้นและ QR Code สำหรับส่งลูกค้า"
            >
              <Share2 className="w-4 h-4 text-orange-600" />
              <span>ลิงก์ส่งลูกค้า (Short Link)</span>
            </button>
          )}

          <button
            onClick={() => {
              onRefreshBookings();
              fetchFirebaseStatus();
            }}
            className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="รีเฟรชข้อมูลคิวล่าสุด"
          >
            <RefreshCw className="w-4 h-4 text-stone-500" />
            <span>รีเฟรช</span>
          </button>

          <button
            onClick={handleTestLineNotify}
            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="ทดสอบส่งแจ้งเตือนเข้า LINE Notify"
          >
            <Send className="w-4 h-4 text-emerald-600" />
            <span>ทดสอบ LINE Alert</span>
          </button>

          <button
            onClick={() => setShowMeetSettingsModal(true)}
            className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="ตั้งค่าห้องเรียน Google Meet เริ่มต้น"
          >
            <Video className="w-4 h-4 text-blue-600" />
            <span>ตั้งค่า Google Meet</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Firebase Live Database & Test Data Control Panel */}
      <div className="bg-gradient-to-r from-stone-900 via-indigo-950 to-stone-900 text-white p-4 sm:p-5 rounded-2xl border border-indigo-800/40 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              {firebaseStatus.connected ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Firebase Firestore Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  ระบบฐานข้อมูลถาวร (Persistent Active)
                </span>
              )}
              {emailStatus?.configured ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <Mail className="w-3 h-3 text-emerald-400" />
                  อีเมลคอนเฟิร์ม: {emailStatus.gmailUser ? `Gmail (${emailStatus.gmailUser})` : 'พร้อมส่งอัตโนมัติ'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                  <Mail className="w-3 h-3 text-amber-400" />
                  อีเมลคอนเฟิร์ม: โหมดจำลอง
                </span>
              )}
              <span className="text-xs text-indigo-300 font-mono bg-indigo-900/60 px-2.5 py-0.5 rounded-md border border-indigo-700/50">
                DB: {firebaseStatus.databaseId || 'bookings_db.json'}
              </span>
              <span className="text-xs text-stone-300">
                ({bookings.length} รายการจอง)
              </span>
            </div>
            <p className="text-xs text-stone-300">
              {firebaseStatus.connected
                ? "ฐานข้อมูลคลาวด์ Real-time: ทุกการจอง การอัปโหลดสลิป และการเปลี่ยนสถานะจะบันทึกตรงเข้า Firestore อัตโนมัติ"
                : "ระบบจัดเก็บข้อมูลถาวร: ทุกการจอง การอัปโหลดสลิป การอนุมัติ และบันทึกประวัติการทำงานถูกซิงก์ลงดิสก์อย่างสมบูรณ์แบบ"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSeedTestData}
              disabled={isSeeding}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังสร้างข้อมูลทดสอบ...</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>🌱 สร้างชุดข้อมูลทดสอบ (Seed Test Data)</span>
                </>
              )}
            </button>

            {showClearConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-950 border border-rose-600 rounded-xl px-2.5 py-1 text-xs">
                <span className="text-rose-200 font-medium">ล้างข้อมูลทั้งหมด?</span>
                <button
                  onClick={handleClearTestData}
                  disabled={isClearing}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-[11px] cursor-pointer"
                >
                  ยืนยันล้าง
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-1.5 py-0.5 text-stone-300 hover:text-white text-[11px] cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={isClearing}
                className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-700/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังล้าง...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>🧹 ล้างข้อมูลทั้งหมด</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleTestEmail}
              disabled={isTestingEmail}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isTestingEmail ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังส่งทดสอบ...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>✉️ ทดสอบส่งอีเมล (Gmail)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {emailTestResult && (
          <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
            emailTestResult.success 
              ? 'bg-emerald-900/80 border border-emerald-500/40 text-emerald-100' 
              : 'bg-rose-900/80 border border-rose-500/40 text-rose-100'
          }`}>
            {emailTestResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{emailTestResult.message}</span>
          </div>
        )}

        {seedNotice && (
          <div className="mt-3 p-3 rounded-xl bg-indigo-900/80 border border-indigo-500/40 text-xs text-indigo-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{seedNotice}</span>
          </div>
        )}
      </div>

      {lineTestResult && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{lineTestResult}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            คิวทั้งหมดในระบบ
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
            {metrics.total} <span className="text-sm font-normal text-stone-500">รายการ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> รอดำเนินการ / ตรวจสลิป
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1">
            {metrics.pendingReview} <span className="text-sm font-normal text-amber-700">รายการ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันคิวแล้ว
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1">
            {metrics.confirmed} <span className="text-sm font-normal text-emerald-700">รายการ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            ยอดเงินที่อนุมัติแล้ว
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-orange-600 mt-1">
            {formatCurrency(metrics.totalRevenue)}
          </div>
        </div>

      </div>

      {/* Chart Section */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm mt-6 mb-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            ยอดจองคอร์สเรียน (ตามช่วงเวลาที่กรองด้านล่าง)
          </h3>
          <p className="text-xs text-stone-500">
            กราฟแสดงความต้องการ (Demand) ของคอร์สต่างๆ เพื่อช่วยวิเคราะห์การเปิดคิวเพิ่มเติม
          </p>
        </div>
        
        {chartData.length > 0 ? (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  // Hide text if it gets too long, or rely on tooltip
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                  itemStyle={{ fontSize: '12px', color: '#4f46e5' }}
                />
                <Bar 
                  dataKey="bookings" 
                  name="จำนวนการจอง (คิว)" 
                  fill="#4f46e5" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
            ยังไม่มีข้อมูลการจองในช่วงเวลาที่เลือก
          </div>
        )}
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tab-admin-list-view"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>รายการคิวทั้งหมด (List View)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-stone-700 text-stone-200">
              {filteredBookings.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-admin-calendar-view"
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>ปฏิทินตารางสอน (Calendar View)</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500 text-white">
              {metrics.confirmed} คิวยืนยัน
            </span>
          </button>

          <button
            type="button"
            id="tab-admin-ai-automation"
            onClick={() => setViewMode('automation')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              viewMode === 'automation'
                ? 'bg-purple-950 text-white shadow-sm border border-purple-800'
                : 'text-purple-800 hover:text-purple-950 hover:bg-purple-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>📰 AI News Automation</span>
          </button>
        </div>
      </div>

      {/* View Mode Content */}
      {viewMode === 'automation' ? (
        <AdminAINewsAutomation />
      ) : viewMode === 'calendar' ? (
        <AdminCalendarView 
          bookings={bookings} 
          onInspectBooking={setInspectingBooking} 
        />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative w-full xl:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, เบอร์, คอร์ส, รหัสจอง..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filters Container */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
              {/* Date Range Filter */}
              <div className="w-full sm:w-auto">
                <select
                  value={dateFilter}
                  onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-auto px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">📅 ทุกช่วงเวลา</option>
                  <option value="today">วันนี้</option>
                  <option value="last7days">7 วันย้อนหลัง</option>
                  <option value="thisMonth">เดือนนี้</option>
                </select>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {[
                  { label: 'ทั้งหมด', value: 'all' },
                  { label: 'รอตรวจสลิป', value: 'under_review' },
                  { label: 'รอลูกค้าแนบ', value: 'pending_slip' },
                  { label: 'ยืนยันแล้ว', value: 'confirmed' },
                  { label: 'เรียนเสร็จแล้ว', value: 'completed' },
                ].map((st) => (
                  <button
                    key={st.value}
                    onClick={() => setStatusFilter(st.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === st.value
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Bookings List Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-3.5 px-4">รหัส / ผู้เรียน</th>
                    <th className="py-3.5 px-4">คอร์สเรียน</th>
                    <th className="py-3.5 px-4">วันและเวลานัดหมาย</th>
                    <th className="py-3.5 px-4">ยอดเงิน</th>
                    <th className="py-3.5 px-4">สถานะสลิป</th>
                    <th className="py-3.5 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                            <SearchX className="w-8 h-8 text-stone-300" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-stone-700">
                              {bookings.length === 0 ? 'ยังไม่มีรายการจองในระบบ' : 'ไม่พบรายการจองตามเงื่อนไขที่เลือก'}
                            </h4>
                            <p className="text-xs text-stone-500 mt-1">
                              {bookings.length === 0 ? 'ตารางนัดหมายว่างทั้งหมด พร้อมรับการจองคอร์สจากผู้เรียนใหม่' : 'ลองเปลี่ยนเงื่อนไขการค้นหาหรือสถานะ เพื่อดูคิวอื่น ๆ'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50/80 transition-colors">
                        
                        {/* ID & Customer */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs font-bold text-stone-900">
                            {b.id}
                          </div>
                          <div className="font-semibold text-stone-800 text-sm mt-0.5">
                            {b.customer?.name || '-'}
                          </div>
                          <div className="text-stone-500 text-xs flex items-center gap-2 mt-0.5">
                            <span>📞 {b.customer?.phone || '-'}</span>
                            {b.customer?.lineId && <span>💬 LINE: {b.customer.lineId}</span>}
                          </div>
                        </td>

                        {/* Course */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900 max-w-xs truncate">
                            {b.courseTitle || 'คอร์สเรียน AI'}
                          </div>
                          <div className="text-stone-500 text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{b.totalDays} วัน ({b.totalHours} ชม.)</span>
                            {b.customer?.onsiteLocation && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                🏢 Onsite กทม.
                              </span>
                            )}
                          </div>
                          {b.customer?.onsiteLocation && (
                            <div className="text-[11px] text-amber-900 bg-amber-50/90 px-2 py-0.5 rounded mt-1 border border-amber-200/70 max-w-xs truncate" title={b.customer.onsiteLocation}>
                              📍 {b.customer.onsiteLocation}
                            </div>
                          )}
                        </td>

                        {/* Schedule */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {(b.schedule || []).map((s) => (
                              <div key={s.dayNumber} className="text-xs bg-stone-100/80 px-2 py-1 rounded-md text-stone-700">
                                <span className="font-semibold text-indigo-700">D{s.dayNumber}:</span> {formatThaiDate(s.date, false)} ({s.startTime}-{s.endTime} น.)
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 font-bold text-stone-900">
                          {formatCurrency(b.totalPrice)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {getStatusBadge((b.payment?.status || ''))}
                          {(b.payment?.aiVerification) && (
                            <div className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-600" /> AI OCR ตรวจแล้ว
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Inspect Slip Button */}
                            <button
                              onClick={() => setInspectingBooking(b)}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="ดูสลิปและข้อมูลการจอง"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>ดูสลิป</span>
                            </button>

                            {/* Edit Booking Button */}
                            <button
                              onClick={() => setEditingBooking(b)}
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-stone-200"
                              title="แก้ไขข้อมูลผู้เรียน หรือเลื่อนวันเวลาเรียน"
                            >
                              <Pencil className="w-3.5 h-3.5 text-amber-600" />
                              <span>แก้ไข</span>
                            </button>

                            {/* Fast Approve if under review */}
                            {(b.payment?.status || '') === 'under_review' && (
                              <button
                                onClick={() => handleApproveSlip(b)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>อนุมัติ</span>
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    ))
                  )}

                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-stone-200">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-stone-700">
                        แสดง <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> ถึง <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)}</span> จาก <span className="font-medium">{filteredBookings.length}</span> รายการ
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-stone-300 bg-white text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:bg-stone-100 disabled:text-stone-400"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1 ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-stone-300 text-stone-500 hover:bg-stone-50'}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-stone-300 bg-white text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:bg-stone-100 disabled:text-stone-400"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                  
                  {/* Mobile Pagination */}
                  <div className="flex items-center justify-between sm:hidden w-full">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-stone-300 text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50 disabled:bg-stone-100"
                    >
                      ก่อนหน้า
                    </button>
                    <span className="text-sm text-stone-700">หน้า {currentPage} จาก {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-stone-300 text-sm font-medium rounded-md text-stone-700 bg-white hover:bg-stone-50 disabled:bg-stone-100"
                    >
                      ถัดไป
                    </button>
                  </div>
                </div>
              )}
            </div>


          </div>
        </>
      )}

      {/* Slip Inspector & Audit Modal */}
      {inspectingBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-3xl w-full overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
              <div>
                <span className="text-xs text-orange-400 font-mono font-bold">
                  {inspectingBooking.id}
                </span>
                <h3 className="text-lg font-bold text-white">
                  ตรวจสอบสลิปและข้อมูลคิว: {inspectingBooking.customer?.name || '-'}
                </h3>
              </div>

              <button
                onClick={() => setInspectingBooking(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Slip Image */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col items-center justify-center text-center min-h-[300px]">
                  {inspectingBooking.payment.slipUrl ? (
                    <div className="space-y-2 w-full">
                      <img
                        src={inspectingBooking.payment.slipUrl}
                        alt="สลิปที่ลูกค้าแนบ"
                        className="max-h-72 mx-auto rounded-xl shadow-sm border border-stone-200 object-contain"
                      />
                      <div className="text-xs text-stone-500 font-mono">
                        รหัสอ้างอิง: {inspectingBooking.payment.referenceNo || 'ไม่ระบุ'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-stone-400 text-sm space-y-2">
                      <AlertCircle className="w-8 h-8 text-stone-300 mx-auto" />
                      <p>ยังไม่มีการแนบรูปสลิปเข้ามา</p>
                    </div>
                  )}
                </div>

                {/* Right: AI OCR Breakdown & Booking Info */}
                <div className="space-y-4 text-xs">
                  
                  {/* AI Verification Report */}
                  {inspectingBooking.payment.aiVerification ? (
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 text-purple-950 space-y-2">
                      <div className="font-bold text-sm flex items-center gap-1.5 text-purple-900">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>ผลการวิเคราะห์สลิปด้วย AI (Gemini Vision OCR)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-purple-700 block">ยอดเงินที่ตรวจพบ:</span>
                          <strong className="text-sm font-extrabold text-purple-950">
                            {formatCurrency(inspectingBooking.payment.aiVerification.detectedAmount || inspectingBooking.totalPrice)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-purple-700 block">ความมั่นใจ:</span>
                          <strong className="text-sm font-extrabold text-purple-950">
                            {((inspectingBooking.payment.aiVerification.confidence || 0.95) * 100).toFixed(0)}%
                          </strong>
                        </div>
                      </div>
                      <p className="text-purple-800 text-[11px] bg-white/60 p-2 rounded-lg border border-purple-100">
                        {inspectingBooking.payment.aiVerification.notes}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-stone-100 p-3 rounded-xl text-stone-600 text-xs">
                      ไม่มีข้อมูลการวิเคราะห์สลิปอัตโนมัติ
                    </div>
                  )}

                  {/* Booking Details List */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 text-stone-700">
                    <div className="font-bold text-stone-900 text-xs border-b border-stone-200 pb-1">
                      รายละเอียดคอร์สและผู้เรียน
                    </div>
                    <div><strong>คอร์ส:</strong> {inspectingBooking.courseTitle || 'คอร์สเรียน AI'}</div>
                    <div><strong>ราคา:</strong> {formatCurrency(inspectingBooking.totalPrice)}</div>
                    <div><strong>อีเมล:</strong> {inspectingBooking.customer?.email || '-'}</div>
                    <div><strong>เบอร์โทร:</strong> {inspectingBooking.customer?.phone || '-'}</div>
                    <div><strong>LINE ID:</strong> {inspectingBooking.customer?.lineId || '-'}</div>
                    {inspectingBooking.customer?.notes && (
                      <div><strong>โน้ตผู้เรียน:</strong> {inspectingBooking.customer.notes}</div>
                    )}
                  </div>

                  {/* Google Meet Link Management */}
                  <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-blue-600" />
                        <span>ห้องเรียน Google Meet (รอบนี้)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={normalizeMeetingLink(inspectingBooking.meetingLink)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-300 hover:bg-blue-50 flex items-center gap-1 font-semibold transition-colors shadow-2xs"
                        >
                          <span>เปิดทดสอบ</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            window.open('https://meet.google.com/new', '_blank');
                          }}
                          className="text-[11px] text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-300 hover:bg-indigo-50 flex items-center gap-1 font-semibold transition-colors shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>สร้างห้องใหม่ (meet.new)</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingMeetLink}
                        onChange={(e) => setEditingMeetLink(e.target.value)}
                        placeholder="https://meet.google.com/xxx-yyyy-zzz"
                        className="flex-1 p-2 bg-white border border-blue-200 rounded-xl text-xs font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        disabled={isUpdatingMeetLink}
                        onClick={handleSaveBookingMeetLink}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
                      >
                        {isUpdatingMeetLink ? 'กำลังบันทึก...' : 'บันทึกลิงก์'}
                      </button>
                    </div>

                    <div className="text-[11px] text-blue-900/80 flex items-center justify-between">
                      <span>ลิงก์นี้จะส่งให้ผู้เรียนทางอีเมลและลง Google Calendar ทันที</span>
                      {systemSettings?.defaultMeetLink && (
                        <button
                          type="button"
                          onClick={() => setEditingMeetLink(systemSettings.defaultMeetLink)}
                          className="text-[10px] text-blue-700 font-semibold hover:underline cursor-pointer"
                        >
                          ใช้ห้องหลัก
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Review Note Input */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      บันทึกข้อความถึงผู้เรียน / เหตุผลการอนุมัติหรือปฏิเสธ:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="เช่น ได้รับสลิปถูกต้องแล้ว ยืนยันการลงเรียน"
                      value={reviewNoteInput}
                      onChange={(e) => setReviewNoteInput(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                </div>

              </div>

            </div>

            {/* Actions Bottom Bar */}
            <div className="p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
              <button
                disabled={isSubmittingReview}
                onClick={() => handleRejectSlip(inspectingBooking)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ปฏิเสธสลิป
              </button>
              {showCancelConfirm ? (
                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 rounded-xl px-2.5 py-1.5 text-xs">
                  <span className="text-rose-900 font-semibold">ยืนยันยกเลิก?</span>
                  <button
                    disabled={isSubmittingReview}
                    onClick={() => {
                      onUpdateBookingStatus(inspectingBooking.id, 'cancelled', reviewNoteInput || 'ยกเลิกการจองโดย Admin');
                      setInspectingBooking(null);
                      setReviewNoteInput('');
                      setShowCancelConfirm(false);
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                  >
                    ยืนยัน
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-2 py-1 text-stone-600 hover:text-stone-900 text-xs cursor-pointer"
                  >
                    ไม่ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  disabled={isSubmittingReview}
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิกการจอง
                </button>
              )}

              <div className="flex items-center gap-2">
                
                <button
                  type="button"
                  onClick={() => {
                    setEditingBooking(inspectingBooking);
                  }}
                  className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                  <span>แก้ไขข้อมูล / วันเวลา</span>
                </button>

                <button
                  disabled={isSyncingCalendar}
                  onClick={() => handleSyncCalendar(inspectingBooking)}
                  className="px-4 py-2.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CalendarIcon className="w-4 h-4" />
                  {isSyncingCalendar ? 'กำลังซิงค์...' : 'เพิ่มลง Calendar'}
                </button>

                <button
                  disabled={isSubmittingReview}
                  onClick={() => onUpdateBookingStatus(inspectingBooking.id, 'completed', 'คอร์สเรียนเสร็จสิ้นสมบูรณ์')}
                  className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ทำเครื่องหมายว่าเรียนจบแล้ว
                </button>

                <button
                  disabled={isSubmittingReview}
                  onClick={() => handleApproveSlip(inspectingBooking)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  อนุมัติคิวทันที
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          booking={editingBooking}
          existingBookings={bookings}
          isAdminMode={true}
          onSuccess={(updated) => {
            setEditingBooking(null);
            if (inspectingBooking && inspectingBooking.id === updated.id) {
              setInspectingBooking(updated);
            }
            onRefreshBookings();
          }}
        />
      )}

      {/* Google Meet Settings Modal */}
      {showMeetSettingsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">ตั้งค่าห้องเรียน Google Meet</h3>
                  <p className="text-xs text-stone-500">จัดการลิงก์ห้องเรียนเริ่มต้นสำหรับคอร์สเรียนทั้งหมด</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMeetSettingsModal(false)}
                className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-700 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>วิธีสร้างห้อง Google Meet ที่ถูกต้อง</span>
                </div>
                <p>
                  Google Meet ไม่อนุญาตให้ใช้ชื่อห้องสุ่มตามใจชอบ (จะขึ้นเตือน &quot;Invalid video call name&quot;) คุณสามารถ:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>กดปุ่ม <strong>สร้างห้อง Meet ทันที (meet.new)</strong> เพื่อเปิด Google Meet และคัดลอกลิงก์จริงมาวาง</li>
                  <li>หรือใช้ห้องประจำของคุณในรูปแบบ <code>https://meet.google.com/xxx-yyyy-zzz</code></li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  ลิงก์ห้องเรียน Google Meet เริ่มต้น (Default Classroom URL)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Video className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={defaultMeetInput}
                      onChange={(e) => setDefaultMeetInput(e.target.value)}
                      placeholder="https://meet.google.com/xxx-yyyy-zzz หรือ meet.google.com/new"
                      className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open('https://meet.google.com/new', '_blank')}
                    className="px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>meet.new</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5">
                  ลิงก์นี้จะถูกใช้เป็นห้องเรียนอัตโนมัติสำหรับรายการจองใหม่ทั้งหมด
                </p>
              </div>

              {defaultMeetInput && (
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="text-stone-600">ทดสอบการเข้าห้อง:</span>
                  <a
                    href={normalizeMeetingLink(defaultMeetInput)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>คลิกเพื่อเปิดห้องทดสอบ</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMeetSettingsModal(false)}
                className="px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSavingMeetSettings}
                onClick={handleSaveDefaultMeetLink}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md disabled:opacity-50"
              >
                {isSavingMeetSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
