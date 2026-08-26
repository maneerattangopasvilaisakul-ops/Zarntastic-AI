import { useState, useMemo } from 'react';
import { Booking, BookingStatus, Course } from '../types';
import { COURSES } from '../data/courses';
import { formatThaiDate, formatCurrency, getValidNextDates, THAI_MONTHS_SHORT, THAI_DAYS } from '../utils/scheduleUtils';
import { CourseManagementTab } from './CourseManagementTab';
import { LineMessagingManagementTab } from './LineMessagingManagementTab';
import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
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
  TrendingUp,
  Activity,
  BarChart3,
  CalendarCheck,
  ArrowUpRight,
  Layers,
  BookOpen,
  Bell,
  Smartphone,
  LayoutGrid,
  Table as TableIcon,
  Check,
  ChevronDown,
  MessageCircle
} from 'lucide-react';

interface AdminDashboardProps {
  bookings: Booking[];
  courses?: Course[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus, reviewNotes?: string) => Promise<void>;
  onRefreshBookings: () => void;
  onAddCourse?: (courseData: Partial<Course>) => Promise<boolean>;
  onEditCourse?: (courseId: string, courseData: Partial<Course>) => Promise<boolean>;
  onDeleteCourse?: (courseId: string) => Promise<boolean>;
  onResetCourses?: () => Promise<boolean>;
}

export function AdminDashboard({
  bookings,
  courses = COURSES,
  onUpdateBookingStatus,
  onRefreshBookings,
  onAddCourse = async () => true,
  onEditCourse = async () => true,
  onDeleteCourse = async () => true,
  onResetCourses = async () => true,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'courses' | 'alerts'>('bookings');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [inspectingBooking, setInspectingBooking] = useState<Booking | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [lineTestResult, setLineTestResult] = useState<string | null>(null);
  const [dailyChartMode, setDailyChartMode] = useState<'bar' | 'area'>('bar');

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        b.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customer.phone.includes(searchTerm) ||
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || b.payment.status === statusFilter;

      let matchDate = true;
      if (dateFilter !== 'all' && b.createdAt) {
        const bookingDate = new Date(b.createdAt);
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

  // KPI Metrics
  const metrics = useMemo(() => {
    // Filter bookings only by date filter for top-level KPIs
    const dateFiltered = bookings.filter(b => {
      let matchDate = true;
      if (dateFilter !== 'all' && b.createdAt) {
        const bookingDate = new Date(b.createdAt);
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
    const pendingReview = dateFiltered.filter((b) => b.payment.status === 'under_review' || b.payment.status === 'pending_slip').length;
    const confirmed = dateFiltered.filter((b) => b.payment.status === 'confirmed').length;
    const totalRevenue = dateFiltered
      .filter((b) => b.payment.status === 'confirmed' || b.payment.status === 'completed')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    return { total, pendingReview, confirmed, totalRevenue };
  }, [bookings, dateFilter]);

  // 7-Day Daily Booking Volume Aggregation
  const last7DaysData = useMemo(() => {
    const result = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${monthNum}-${dayNum}`;
      
      const day = d.getDate();
      const month = THAI_MONTHS_SHORT[d.getMonth()];
      const shortDayName = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'][d.getDay()];
      const fullDayName = THAI_DAYS[d.getDay()];
      const label = `${shortDayName} ${day} ${month}`;
      const fullDateLabel = `${fullDayName}ที่ ${day} ${month} ${year + 543}`;

      // Filter bookings for this day (by createdAt or schedule date)
      const dayBookings = bookings.filter((b) => {
        if (b.createdAt) {
          const bDate = new Date(b.createdAt);
          const bYear = bDate.getFullYear();
          const bMonth = String(bDate.getMonth() + 1).padStart(2, '0');
          const bDay = String(bDate.getDate()).padStart(2, '0');
          const bDateStr = `${bYear}-${bMonth}-${bDay}`;
          return bDateStr === dateStr;
        }
        return b.schedule?.some(s => s.date === dateStr);
      });

      const confirmed = dayBookings.filter(b => b.payment.status === 'confirmed' || b.payment.status === 'completed').length;
      const underReview = dayBookings.filter(b => b.payment.status === 'under_review').length;
      const pendingSlip = dayBookings.filter(b => b.payment.status === 'pending_slip').length;
      const totalVolume = dayBookings.length;
      const revenue = dayBookings
        .filter(b => b.payment.status === 'confirmed' || b.payment.status === 'completed')
        .reduce((sum, b) => sum + b.totalPrice, 0);

      result.push({
        dateStr,
        label,
        fullDateLabel,
        volume: totalVolume,
        confirmed,
        underReview,
        pendingSlip,
        revenue,
      });
    }

    return result;
  }, [bookings]);

  // 7-Day Stats Summary
  const last7DaysStats = useMemo(() => {
    const totalVolume = last7DaysData.reduce((sum, d) => sum + d.volume, 0);
    const totalConfirmed = last7DaysData.reduce((sum, d) => sum + d.confirmed, 0);
    const totalPending = last7DaysData.reduce((sum, d) => sum + d.underReview + d.pendingSlip, 0);
    const totalRevenue = last7DaysData.reduce((sum, d) => sum + d.revenue, 0);
    const avgDaily = (totalVolume / 7).toFixed(1);

    let peakDay = last7DaysData[0];
    for (const d of last7DaysData) {
      if (d.volume > peakDay.volume) {
        peakDay = d;
      }
    }

    return {
      totalVolume,
      totalConfirmed,
      totalPending,
      totalRevenue,
      avgDaily,
      peakDay: peakDay && peakDay.volume > 0 ? peakDay : null,
    };
  }, [last7DaysData]);

  // Chart Data (Bookings per course over selected period)
  const chartData = useMemo(() => {
    const dateFiltered = bookings.filter(b => {
      let matchDate = true;
      if (dateFilter !== 'all' && b.createdAt) {
        const bookingDate = new Date(b.createdAt);
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
      const shortTitle = b.courseTitle.split('(')[0].trim();
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
    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Email', 'LINE ID', 'Course', 'Price', 'Status', 'Dates & Times', 'Created At'];
    const rows = bookings.map((b) => [
      b.id,
      `"${b.customer.name}"`,
      `"${b.customer.phone}"`,
      `"${b.customer.email}"`,
      `"${b.customer.lineId}"`,
      `"${b.courseTitle}"`,
      b.totalPrice,
      b.payment.status,
      `"${b.schedule.map((s) => `${s.date} (${s.startTime}-${s.endTime})`).join('; ')}"`,
      b.createdAt,
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
      const res = await fetch('/api/notifications/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'LINE Official / Notify',
          recipient: 'Admin Group',
          message: `ทดสอบระบบแจ้งเตือนคอร์ส AI สำเร็จ มีคิวที่ต้องตรวจสอบ ${metrics.pendingReview} รายการ`,
        }),
      });
      const data = await res.json();
      setLineTestResult(`ส่งแจ้งเตือนสำเร็จ: ${data.previewMessage}`);
      setTimeout(() => setLineTestResult(null), 5000);
    } catch (e) {
      setLineTestResult('เกิดข้อผิดพลาดในการส่ง Webhook');
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

  const handleSendLineNotifyForBooking = async (booking: Booking, eventType: string = 'payment_confirmed') => {
    try {
      const res = await fetch('/api/line/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          eventType,
          customMessage: reviewNoteInput || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLineTestResult(`🔔 ส่งการแจ้งเตือน LINE ให้คุณ${booking.customer.name} เรียบร้อยแล้ว`);
        setTimeout(() => setLineTestResult(null), 5000);
      } else {
        alert(data.error || 'ส่งแจ้งเตือนไม่สำเร็จ');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันคิวแล้ว</span>;
      case 'under_review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold animate-pulse"><Clock className="w-3.5 h-3.5" /> รอตรวจสลิป</span>;
      case 'pending_slip':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold"><Clock className="w-3.5 h-3.5" /> รอลูกค้าแนบสลิป</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> ปฏิเสธสลิป</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold"><FileCheck className="w-3.5 h-3.5" /> เรียนเสร็จสิ้น</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">ยกเลิกแล้ว</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>โหมดผู้ดูแลระบบ / อาจารย์ผู้สอน (Admin Portal)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            ระบบจัดการคิวและตรวจสอบสลิปการจอง
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            ตรวจสถานะการชำระเงิน, สลิปโอนเงิน, ป้องกันเวลาชนกัน, และจัดการตารางสอนแบบ Real-time
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefreshBookings}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="รีเฟรชข้อมูลคิวล่าสุด"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
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
            onClick={handleExportCSV}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-cyan-400" />
          <span>จัดการคิว & ตรวจสอบสลิป</span>
          {metrics.pendingReview > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {metrics.pendingReview}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>จัดการคอร์สเรียน AI (Course Catalog)</span>
          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {courses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>ระบบแจ้งเตือน & LINE Messaging API</span>
        </button>
      </div>

      {/* RENDER CONTENT BASED ON ACTIVE TAB */}
      {activeTab === 'courses' ? (
        <CourseManagementTab
          courses={courses}
          onAddCourse={onAddCourse}
          onEditCourse={onEditCourse}
          onDeleteCourse={onDeleteCourse}
          onResetCourses={onResetCourses}
        />
      ) : activeTab === 'alerts' ? (
        <LineMessagingManagementTab
          bookings={bookings}
          onRefreshBookings={onRefreshBookings}
        />
      ) : (
        <>

      {lineTestResult && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{lineTestResult}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            คิวทั้งหมดในระบบ
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {metrics.total} <span className="text-sm font-normal text-slate-500">รายการ</span>
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ยอดเงินที่อนุมัติแล้ว
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600 mt-1">
            {formatCurrency(metrics.totalRevenue)}
          </div>
        </div>

      </div>

      {/* 7-Day Daily Booking Volume Summary Card (Recharts) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm mt-6 mb-6">
        {/* Header & Chart Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  สรุปปริมาณการจองรายวันย้อนหลัง 7 วัน
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                    7 วันล่าสุด
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  วิเคราะห์แนวโน้มปริมาณการจอง (Daily Booking Volume) และสถานะคิวในแต่ละวัน
                </p>
              </div>
            </div>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setDailyChartMode('bar')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                dailyChartMode === 'bar'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>กราฟแท่งแยกสถานะ</span>
            </button>
            <button
              onClick={() => setDailyChartMode('area')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                dailyChartMode === 'area'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>กราฟแนวโน้ม (Trend)</span>
            </button>
          </div>
        </div>

        {/* 7-Day Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-slate-500">ยอดจองรวม 7 วัน</div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 flex items-baseline gap-1.5">
              <span>{last7DaysStats.totalVolume}</span>
              <span className="text-xs font-normal text-slate-500">คิว (เฉลี่ย {last7DaysStats.avgDaily}/วัน)</span>
            </div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/80 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-emerald-700">ยืนยันแล้วใน 7 วัน</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-900 mt-0.5 flex items-baseline gap-1.5">
              <span>{last7DaysStats.totalConfirmed}</span>
              <span className="text-xs font-medium text-emerald-700">
                {last7DaysStats.totalVolume > 0
                  ? `(${Math.round((last7DaysStats.totalConfirmed / last7DaysStats.totalVolume) * 100)}%)`
                  : ''}
              </span>
            </div>
          </div>

          <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-amber-700">รอดำเนินการ / ตรวจสลิป</div>
            <div className="text-lg sm:text-xl font-bold text-amber-900 mt-0.5">
              {last7DaysStats.totalPending} <span className="text-xs font-normal text-amber-700">คิว</span>
            </div>
          </div>

          <div className="bg-cyan-50/60 border border-cyan-200/80 p-3 rounded-xl">
            <div className="text-[11px] font-semibold text-cyan-800">รายได้สะสม 7 วัน</div>
            <div className="text-lg sm:text-xl font-bold text-cyan-700 mt-0.5">
              {formatCurrency(last7DaysStats.totalRevenue)}
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-[280px] sm:h-[300px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            {dailyChartMode === 'bar' ? (
              <BarChart data={last7DaysData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px]">
                          <p className="font-bold text-indigo-300 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                            <span>{d.fullDateLabel || d.label}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-normal">
                              รวม {d.volume} คิว
                            </span>
                          </p>
                          <div className="space-y-1.5 text-slate-300">
                            <div className="flex justify-between items-center text-emerald-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                                ยืนยัน / เสร็จสิ้น:
                              </span>
                              <span className="font-bold">{d.confirmed} คิว</span>
                            </div>
                            {d.underReview > 0 && (
                              <div className="flex justify-between items-center text-amber-400">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                                  รอตรวจสลิป:
                                </span>
                                <span className="font-bold">{d.underReview} คิว</span>
                              </div>
                            )}
                            {d.pendingSlip > 0 && (
                              <div className="flex justify-between items-center text-sky-400">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
                                  รอลูกค้าแนบสลิป:
                                </span>
                                <span className="font-bold">{d.pendingSlip} คิว</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-1.5 border-t border-slate-800 text-slate-300">
                              <span>ยอดเงิน:</span>
                              <span className="font-bold text-cyan-400">{formatCurrency(d.revenue)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />
                <Bar 
                  dataKey="confirmed" 
                  name="ยืนยันแล้ว" 
                  stackId="a" 
                  fill="#10b981" 
                  radius={[0, 0, 0, 0]}
                  barSize={32}
                />
                <Bar 
                  dataKey="underReview" 
                  name="รอตรวจสลิป" 
                  stackId="a" 
                  fill="#f59e0b" 
                  radius={[0, 0, 0, 0]}
                  barSize={32}
                />
                <Bar 
                  dataKey="pendingSlip" 
                  name="รอลูกค้าแนบสลิป" 
                  stackId="a" 
                  fill="#38bdf8" 
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            ) : (
              <AreaChart data={last7DaysData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px]">
                          <p className="font-bold text-indigo-300 border-b border-slate-800 pb-1.5 mb-2">
                            {d.fullDateLabel || d.label}
                          </p>
                          <div className="space-y-1 text-slate-300">
                            <div className="flex justify-between items-center">
                              <span>ปริมาณการจองรวม:</span>
                              <span className="font-extrabold text-indigo-300">{d.volume} คิว</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400">
                              <span>ยืนยันแล้ว:</span>
                              <span className="font-bold">{d.confirmed} คิว</span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-slate-300">
                              <span>ยอดเงิน:</span>
                              <span className="font-bold text-cyan-400">{formatCurrency(d.revenue)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  name="จำนวนการจองรวม (คิว)" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#volumeGradient)" 
                  activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-6 mb-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            ยอดจองคอร์สเรียน (ตามช่วงเวลาที่กรองด้านล่าง)
          </h3>
          <p className="text-xs text-slate-500">
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
          <div className="h-[180px] flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
            ยังไม่มีข้อมูลการจองในช่วงเวลาที่เลือก
          </div>
        )}
      </div>

      {/* Filter and Search Bar with View Mode Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full xl:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, เบอร์, คอร์ส, รหัสจอง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters and View Switcher Container */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full xl:w-auto">
          {/* Date Range Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="แสดงแบบการ์ด (เหมาะกับมือถือ)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>การ์ด</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="แสดงแบบตาราง"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>ตาราง</span>
            </button>
          </div>

        </div>

      </div>

      {/* Bookings Display Area */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-xs">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-500">ไม่พบรายการจองที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง</p>
        </div>
      ) : viewMode === 'card' ? (
        /* Mobile-Friendly Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredBookings.map((b) => {
            const isUnderReview = b.payment.status === 'under_review';
            const isConfirmed = b.payment.status === 'confirmed';
            const isPendingSlip = b.payment.status === 'pending_slip';

            return (
              <div 
                key={b.id} 
                className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                  isUnderReview 
                    ? 'border-amber-300 ring-2 ring-amber-400/20' 
                    : isConfirmed 
                    ? 'border-emerald-200' 
                    : 'border-slate-200'
                }`}
              >
                {/* Card Top Banner / Badges */}
                <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-2 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                        {b.id}
                      </span>
                      {b.payment.aiVerification && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                          <Sparkles className="w-2.5 h-2.5" /> AI Verified
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-2 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                      <span>{b.customer.name}</span>
                    </h3>
                  </div>

                  <div className="flex-shrink-0">
                    {getStatusBadge(b.payment.status)}
                  </div>
                </div>

                {/* Card Body Information */}
                <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                  
                  {/* Course Title & Price */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-relaxed">
                      {b.courseTitle}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500">{b.totalDays} วัน ({b.totalHours} ชม.)</span>
                      <span className="font-extrabold text-indigo-700 text-sm">{formatCurrency(b.totalPrice)}</span>
                    </div>
                  </div>

                  {/* Customer Contacts */}
                  <div className="space-y-1 text-xs text-slate-600 bg-white">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <a href={`tel:${b.customer.phone}`} className="hover:text-cyan-700 font-medium">{b.customer.phone}</a>
                    </div>
                    {b.customer.lineId && (
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-[#06C755] flex-shrink-0" />
                        <span className="font-medium text-slate-700">LINE: {b.customer.lineId}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{b.customer.email}</span>
                    </div>
                  </div>

                  {/* Schedule Dates */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> วันและเวลานัดหมาย ({b.schedule.length} วัน)
                    </div>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {b.schedule.map((s) => (
                        <div key={s.dayNumber} className="text-xs bg-indigo-50/70 border border-indigo-100/80 px-2.5 py-1 rounded-lg text-indigo-950 flex items-center justify-between">
                          <span className="font-bold text-indigo-700">วัน {s.dayNumber}:</span>
                          <span className="font-medium">{formatThaiDate(s.date, false)}</span>
                          <span className="text-[11px] text-indigo-600 font-semibold">{s.startTime}-{s.endTime} น.</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Slip Preview Thumbnail if available */}
                  {b.payment.slipUrl && (
                    <div 
                      onClick={() => setInspectingBooking(b)}
                      className="cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center gap-3 hover:bg-slate-100 transition-colors group"
                    >
                      <img 
                        src={b.payment.slipUrl} 
                        alt="สลิป" 
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200" 
                      />
                      <div className="text-xs flex-1 min-w-0">
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600" />
                          <span>สลิปโอนเงินที่แนบมา</span>
                        </div>
                        <div className="text-slate-500 text-[11px] truncate">
                          {b.payment.referenceNo ? `เลขอ้างอิง: ${b.payment.referenceNo}` : 'คลิกเพื่อดูรูปและวิเคราะห์'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Status Update Selector */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ปรับเปลี่ยนสถานะด่วน:
                    </label>
                    <select
                      value={b.payment.status}
                      onChange={(e) => onUpdateBookingStatus(b.id, e.target.value as BookingStatus, 'เปลี่ยนสถานะผ่านการ์ดจัดการ')}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-slate-800"
                    >
                      <option value="under_review">⏳ รอตรวจสลิป (Under Review)</option>
                      <option value="pending_slip">📝 รอลูกค้าแนบสลิป (Pending Slip)</option>
                      <option value="confirmed">✅ ยืนยันคิว / สลิปถูกต้อง (Confirmed)</option>
                      <option value="completed">🎓 เรียนเสร็จสิ้น (Completed)</option>
                      <option value="rejected">❌ ปฏิเสธสลิป (Rejected)</option>
                      <option value="cancelled">🚫 ยกเลิกคิว (Cancelled)</option>
                    </select>
                  </div>

                </div>

                {/* Card Action Buttons Footer */}
                <div className="p-3.5 sm:p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setInspectingBooking(b)}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="ดูสลิปและข้อมูลการจองแบบเต็ม"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>ดูสลิป</span>
                    </button>

                    <button
                      onClick={() => handleSendLineNotifyForBooking(b, b.payment.status === 'confirmed' ? 'payment_confirmed' : 'status_changed')}
                      className="px-3 py-2 bg-[#06C755]/10 hover:bg-[#06C755]/20 text-[#05963f] border border-[#06C755]/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="ส่งข้อความแจ้งเตือนสถานะไปยัง LINE ของผู้เรียน"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>LINE</span>
                    </button>
                  </div>

                  {/* Primary Context Action Button */}
                  {isUnderReview ? (
                    <button
                      onClick={() => handleApproveSlip(b)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>อนุมัติคิว</span>
                    </button>
                  ) : isConfirmed ? (
                    <button
                      onClick={() => onUpdateBookingStatus(b.id, 'completed', 'คอร์สเรียนเสร็จสิ้นสมบูรณ์')}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>จบการสอน</span>
                    </button>
                  ) : null}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Table View for Desktop / Wide screens */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3.5 px-4">รหัส / ผู้เรียน</th>
                  <th className="py-3.5 px-4">คอร์สเรียน</th>
                  <th className="py-3.5 px-4">วันและเวลานัดหมาย</th>
                  <th className="py-3.5 px-4">ยอดเงิน</th>
                  <th className="py-3.5 px-4">สถานะสลิป</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* ID & Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-bold text-slate-900">
                        {b.id}
                      </div>
                      <div className="font-semibold text-slate-800 text-sm mt-0.5">
                        {b.customer.name}
                      </div>
                      <div className="text-slate-500 text-xs flex items-center gap-2 mt-0.5">
                        <span>📞 {b.customer.phone}</span>
                        {b.customer.lineId && <span>💬 LINE: {b.customer.lineId}</span>}
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 max-w-xs truncate">
                        {b.courseTitle}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {b.totalDays} วัน ({b.totalHours} ชม.)
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {b.schedule.map((s) => (
                          <div key={s.dayNumber} className="text-xs bg-slate-100/80 px-2 py-1 rounded-md text-slate-700">
                            <span className="font-semibold text-indigo-700">D{s.dayNumber}:</span> {formatThaiDate(s.date, false)} ({s.startTime}-{s.endTime} น.)
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(b.totalPrice)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(b.payment.status)}
                      {b.payment.aiVerification && (
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
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="ดูสลิปและข้อมูลการจอง"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูสลิป</span>
                        </button>

                        {/* LINE Notify direct button */}
                        <button
                          onClick={() => handleSendLineNotifyForBooking(b, b.payment.status === 'confirmed' ? 'payment_confirmed' : 'status_changed')}
                          className="px-2.5 py-1.5 bg-[#06C755]/10 hover:bg-[#06C755]/20 text-[#05963f] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="ส่งข้อความแจ้งเตือนสถานะไปยัง LINE"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>LINE</span>
                        </button>

                        {/* Fast Approve if under review */}
                        {b.payment.status === 'under_review' && (
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
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
      </>
      )}

      {/* Slip Inspector & Audit Modal */}
      {inspectingBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-xs text-cyan-400 font-mono font-bold">
                  {inspectingBooking.id}
                </span>
                <h3 className="text-lg font-bold text-white">
                  ตรวจสอบสลิปและข้อมูลคิว: {inspectingBooking.customer.name}
                </h3>
              </div>

              <button
                onClick={() => setInspectingBooking(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Slip Image */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center min-h-[300px]">
                  {inspectingBooking.payment.slipUrl ? (
                    <div className="space-y-2 w-full">
                      <img
                        src={inspectingBooking.payment.slipUrl}
                        alt="สลิปที่ลูกค้าแนบ"
                        className="max-h-72 mx-auto rounded-xl shadow-sm border border-slate-200 object-contain"
                      />
                      <div className="text-xs text-slate-500 font-mono">
                        รหัสอ้างอิง: {inspectingBooking.payment.referenceNo || 'ไม่ระบุ'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
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
                    <div className="bg-slate-100 p-3 rounded-xl text-slate-600 text-xs">
                      ไม่มีข้อมูลการวิเคราะห์สลิปอัตโนมัติ
                    </div>
                  )}

                  {/* Booking Details List */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-slate-700">
                    <div className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1">
                      รายละเอียดคอร์สและผู้เรียน
                    </div>
                    <div><strong>คอร์ส:</strong> {inspectingBooking.courseTitle}</div>
                    <div><strong>ราคา:</strong> {formatCurrency(inspectingBooking.totalPrice)}</div>
                    <div><strong>อีเมล:</strong> {inspectingBooking.customer.email}</div>
                    <div><strong>เบอร์โทร:</strong> {inspectingBooking.customer.phone}</div>
                    <div><strong>LINE ID:</strong> {inspectingBooking.customer.lineId}</div>
                    {inspectingBooking.customer.notes && (
                      <div><strong>โน้ตผู้เรียน:</strong> {inspectingBooking.customer.notes}</div>
                    )}
                  </div>

                  {/* Review Note Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      บันทึกข้อความถึงผู้เรียน / เหตุผลการอนุมัติหรือปฏิเสธ:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="เช่น ได้รับสลิปถูกต้องแล้ว ยืนยันการลงเรียน"
                      value={reviewNoteInput}
                      onChange={(e) => setReviewNoteInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                </div>

              </div>

            </div>

            {/* Actions Bottom Bar */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  disabled={isSubmittingReview}
                  onClick={() => handleRejectSlip(inspectingBooking)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ปฏิเสธสลิป / แจ้งโอนใหม่
                </button>

                <button
                  disabled={isSubmittingReview}
                  onClick={() => handleSendLineNotifyForBooking(inspectingBooking, inspectingBooking.payment.status === 'confirmed' ? 'payment_confirmed' : 'status_changed')}
                  className="px-3.5 py-2.5 bg-[#06C755]/10 hover:bg-[#06C755]/20 text-[#05963f] border border-[#06C755]/30 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="ส่งข้อความแจ้งเตือนสถานะปัจจุบันไปยัง LINE"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>ส่ง LINE แจ้งเตือน</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
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

    </div>
  );
}
