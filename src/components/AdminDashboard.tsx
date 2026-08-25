import { useState, useMemo } from 'react';
import { Booking, BookingStatus, Course } from '../types';
import { COURSES } from '../data/courses';
import { formatThaiDate, formatCurrency, getValidNextDates } from '../utils/scheduleUtils';
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
  ExternalLink
} from 'lucide-react';

interface AdminDashboardProps {
  bookings: Booking[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus, reviewNotes?: string) => Promise<void>;
  onRefreshBookings: () => void;
}

export function AdminDashboard({
  bookings,
  onUpdateBookingStatus,
  onRefreshBookings,
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [inspectingBooking, setInspectingBooking] = useState<Booking | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [lineTestResult, setLineTestResult] = useState<string | null>(null);

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

      {/* Filter and Search Bar */}
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

        {/* Filters Container */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
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
        </div>

      </div>

      {/* Bookings List Table */}
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
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    ไม่พบรายการจองที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

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
              <button
                disabled={isSubmittingReview}
                onClick={() => handleRejectSlip(inspectingBooking)}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ปฏิเสธสลิป / แจ้งโอนใหม่
              </button>

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
