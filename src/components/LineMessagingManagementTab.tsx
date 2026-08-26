import { useState, useEffect } from 'react';
import { Booking, LineNotificationLog, LineMessagingApiSettings } from '../types';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  MessageSquare, 
  ShieldCheck, 
  Smartphone, 
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Calendar,
  Sparkles,
  Video,
  Info,
  Radio,
  Eye,
  Zap,
  Bot,
  Key,
  UserCheck,
  Share2
} from 'lucide-react';

interface LineMessagingManagementTabProps {
  bookings: Booking[];
  onRefreshBookings: () => void;
}

export function LineMessagingManagementTab({
  bookings,
  onRefreshBookings: _onRefreshBookings,
}: LineMessagingManagementTabProps) {
  const [logs, setLogs] = useState<LineNotificationLog[]>([]);
  const [settings, setSettings] = useState<LineMessagingApiSettings>({
    enabled: true,
    tokenConfigured: false,
    channelAccessToken: '',
    channelSecret: '',
    adminLineUserId: '',
    defaultDeliveryMode: 'auto',
    useFlexMessage: true,
    notifyOnBookingCreated: true,
    notifyOnSlipUploaded: true,
    notifyOnPaymentConfirmed: true,
    notifyOnStatusChanged: true,
    includeMeetingLink: true,
  });

  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [tokenInput, setTokenInput] = useState<string>('');
  const [secretInput, setSecretInput] = useState<string>('');
  const [adminUserIdInput, setAdminUserIdInput] = useState<string>('');
  const [testMessageInput, setTestMessageInput] = useState<string>('');
  const [testTargetUserInput, setTestTargetUserInput] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedLog, setSelectedLog] = useState<LineNotificationLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'confirmed' | 'slip_uploaded' | 'booking_created'>('confirmed');

  // Manual Push Modal state
  const [isManualTriggerOpen, setIsManualTriggerOpen] = useState<boolean>(false);
  const [targetBookingId, setTargetBookingId] = useState<string>(bookings[0]?.id || '');
  const [manualEventType, setManualEventType] = useState<'payment_confirmed' | 'booking_created' | 'slip_uploaded' | 'status_changed'>('payment_confirmed');
  const [manualCustomNote, setManualCustomNote] = useState<string>('');
  const [manualTargetUserId, setManualTargetUserId] = useState<string>('');
  const [isSendingManual, setIsSendingManual] = useState<boolean>(false);

  // Fetch settings & logs on mount
  const fetchLineData = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/line/logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setLogs(data.logs);
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.channelAccessToken) setTokenInput(data.settings.channelAccessToken);
          if (data.settings.channelSecret) setSecretInput(data.settings.channelSecret);
          if (data.settings.adminLineUserId) {
            setAdminUserIdInput(data.settings.adminLineUserId);
            setTestTargetUserInput(data.settings.adminLineUserId);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch LINE logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLineData();
  }, []);

  // Save Settings
  const handleSaveSettings = async (updatedSettings: Partial<LineMessagingApiSettings>) => {
    setIsSavingSettings(true);
    try {
      const newSettings = { 
        ...settings, 
        ...updatedSettings,
        channelAccessToken: tokenInput.trim(),
        channelSecret: secretInput.trim(),
        adminLineUserId: adminUserIdInput.trim(),
      };
      const res = await fetch('/api/line/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setTestFeedback({
          type: 'success',
          message: 'บันทึกการตั้งค่า LINE Messaging API เรียบร้อยแล้ว',
        });
      }
    } catch (err: any) {
      setTestFeedback({
        type: 'error',
        message: 'ไม่สามารถบันทึกการตั้งค่าได้: ' + err.message,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Test Messaging API
  const handleSendTestNotification = async () => {
    setIsTesting(true);
    setTestFeedback(null);
    try {
      const res = await fetch('/api/line/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testToken: tokenInput,
          testTargetUserId: testTargetUserInput || adminUserIdInput,
          message: testMessageInput || 'ทดสอบการส่งข้อความแจ้งเตือนสถานะคอร์สผ่าน LINE Messaging API (Flex Message)',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestFeedback({
          type: data.status === 'sent' ? 'success' : 'info',
          message: data.message,
        });
        fetchLineData();
      } else {
        setTestFeedback({
          type: 'error',
          message: data.error || 'เกิดข้อผิดพลาดในการทดสอบ',
        });
      }
    } catch (err: any) {
      setTestFeedback({
        type: 'error',
        message: 'การเชื่อมต่อล้มเหลว: ' + err.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!confirm('ต้องการล้างประวัติการส่งข้อความ LINE ทั้งหมดใช่หรือไม่?')) return;
    try {
      const res = await fetch('/api/line/logs/clear', { method: 'POST' });
      if (res.ok) {
        setLogs([]);
        setSelectedLog(null);
        setTestFeedback({ type: 'success', message: 'ล้างประวัติเรียบร้อยแล้ว' });
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Manual Trigger for a Booking
  const handleSendManualNotification = async () => {
    if (!targetBookingId) {
      alert('กรุณาเลือกรายการจอง');
      return;
    }

    setIsSendingManual(true);
    try {
      const res = await fetch('/api/line/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: targetBookingId,
          eventType: manualEventType,
          customMessage: manualCustomNote,
          targetUserId: manualTargetUserId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestFeedback({
          type: 'success',
          message: `ส่งข้อความแจ้งเตือนคิว ${targetBookingId} ผ่าน LINE Messaging API เรียบร้อยแล้ว!`,
        });
        setIsManualTriggerOpen(false);
        setManualCustomNote('');
        fetchLineData();
      } else {
        alert(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err: any) {
      alert('ส่งไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSendingManual(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${currentOrigin}/api/line/webhook`;

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Status Overview */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#06C755]/10 border border-[#06C755]/20 flex items-center justify-center text-[#05963f]">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>LINE Messaging API Engine</span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    settings.tokenConfigured 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {settings.tokenConfigured ? '🟢 เชื่อมต่อ LINE Official Account พร้อมใช้งาน' : '🟡 Sandbox Mode (จำลอง Flex Messages)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  ระบบส่งข้อความแจ้งเตือนผ่าน <strong>LINE Official Account (Messaging API)</strong> รองรับ Push Message รายบุคคล, Flex Messages การ์ดสวยงาม, และ Webhook โต้ตอบอัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsManualTriggerOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>ส่ง Push Message รายบุคคล</span>
            </button>

            <button
              onClick={fetchLineData}
              disabled={isLoadingLogs}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {testFeedback && (
          <div className={`mt-4 p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-2 ${
            testFeedback.type === 'success' 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' 
              : testFeedback.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-900'
              : 'bg-cyan-50 border border-cyan-200 text-cyan-900'
          }`}>
            <div className="flex items-center gap-2">
              {testFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : testFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-cyan-600 shrink-0" />
              )}
              <span>{testFeedback.message}</span>
            </div>
            <button
              onClick={() => setTestFeedback(null)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Bot Profile Badge (If retrieved from LINE Developers) */}
        {settings.botInfo && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {settings.botInfo.pictureUrl ? (
                <img 
                  src={settings.botInfo.pictureUrl} 
                  alt="Bot Avatar" 
                  className="w-9 h-9 rounded-full object-cover border border-slate-300"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#06C755] flex items-center justify-center text-white font-black text-xs">
                  LINE
                </div>
              )}
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{settings.botInfo.displayName || 'LINE Official Account'}</span>
                  {settings.botInfo.basicId && (
                    <span className="text-emerald-700 font-mono text-[11px] bg-emerald-100/70 px-2 py-0.5 rounded-md font-semibold">
                      {settings.botInfo.basicId}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  LINE Messaging API Channel เชื่อมต่อแล้ว (Chat Mode: {settings.botInfo.chatMode || 'bot'})
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              Bot User ID: {settings.botInfo.userId?.slice(0, 10)}...
            </div>
          </div>
        )}
      </div>

      {/* Grid: Settings Configuration (Left) + Live LINE Preview & Test (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Configuration & Event Toggles (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Token & Credentials Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Key className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  การตั้งค่า LINE Messaging API Credentials
                </h4>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleSaveSettings({ enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#06C755]"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {settings.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </label>
            </div>

            <div className="space-y-4">
              {/* Channel Access Token */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Channel Access Token (Long-lived) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="เช่น eyJhbGciOiJIUzI1NiJ9... (จาก LINE Developers Console)"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#06C755]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 ออก Token ได้ที่ <a href="https://developers.line.biz/console/" target="_blank" rel="noreferrer" className="text-[#05963f] hover:underline inline-flex items-center gap-0.5">LINE Developers Console <ExternalLink className="w-2.5 h-2.5" /></a> หรือระบุใน <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">LINE_CHANNEL_ACCESS_TOKEN</code>
                </p>
              </div>

              {/* Admin LINE User ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admin / Staff LINE User ID (U...)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น U1234567890abcdef..."
                    value={adminUserIdInput}
                    onChange={(e) => setAdminUserIdInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#06C755]"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    User ID ของแอดมินสำหรับรับ Push Message โดยตรง
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Channel Secret (ไม่บังคับ)
                  </label>
                  <input
                    type="password"
                    placeholder="เช่น a1b2c3d4e5f6..."
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#06C755]"
                  />
                  <p className="text-[10.5px] text-slate-400 mt-1">
                    ใช้ตรวจสอบ Webhook signature ความปลอดภัย
                  </p>
                </div>
              </div>

              {/* Delivery Mode and Rich Flex Message Switch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    รูปแบบการส่งข้อความ (Delivery Mode)
                  </label>
                  <select
                    value={settings.defaultDeliveryMode}
                    onChange={(e) => handleSaveSettings({ defaultDeliveryMode: e.target.value as any })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#06C755]"
                  >
                    <option value="auto">🔄 Auto (Push หากมี User ID, มิฉะนั้น Broadcast)</option>
                    <option value="push">🎯 Push Message (ส่งตรงถึง User ID)</option>
                    <option value="broadcast">📢 Broadcast (ส่งถึงผู้ติดตามทั้งหมด)</option>
                  </select>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>LINE Flex Message (การ์ด UI สวยงาม)</span>
                    </div>
                    <p className="text-[10.5px] text-emerald-800">ส่งแบบการ์ด Interactive พร้อมปุ่มลิงก์ Meet</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.useFlexMessage}
                    onChange={(e) => handleSaveSettings({ useFlexMessage: e.target.checked })}
                    className="text-emerald-600 rounded focus:ring-emerald-500 w-4 h-4"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleSaveSettings({})}
                  disabled={isSavingSettings}
                  className="px-5 py-2.5 bg-[#06C755] hover:bg-[#05a847] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า LINE API'}</span>
                </button>
              </div>

            </div>

            {/* Webhook Endpoint Info */}
            <div className="pt-3 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-indigo-600" /> Webhook URL สำหรับ LINE Developers Console:
                  </span>
                  <button
                    onClick={() => copyToClipboard(webhookUrl, 'webhook-url')}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'webhook-url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'webhook-url' ? 'คัดลอกแล้ว' : 'คัดลอก URL'}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 break-all select-all">
                  {webhookUrl}
                </div>
              </div>
            </div>

            {/* Event Triggers Checklist */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                เงื่อนไขการส่งข้อความอัตโนมัติ (Automated Triggers)
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnBookingCreated}
                    onChange={(e) => handleSaveSettings({ notifyOnBookingCreated: e.target.checked })}
                    className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">เมื่อมีการจองคิวใหม่</div>
                    <p className="text-[10px] text-slate-500">ส่งแจ้งเตือนชื่อผู้เรียน คอร์ส และรอบเวลาที่เลือก</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnSlipUploaded}
                    onChange={(e) => handleSaveSettings({ notifyOnSlipUploaded: e.target.checked })}
                    className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">เมื่อลูกค้าส่งสลิปโอนเงิน</div>
                    <p className="text-[10px] text-slate-500">แจ้งเตือนพร้อมยอดที่ AI ตรวจพบและรหัสอ้างอิง</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnPaymentConfirmed}
                    onChange={(e) => handleSaveSettings({ notifyOnPaymentConfirmed: e.target.checked })}
                    className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-emerald-950">เมื่อยืนยันการชำระเงิน ✅</div>
                    <p className="text-[10px] text-emerald-800">ส่ง Flex Message ยืนยันคิวและปุ่ม Google Meet</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnStatusChanged}
                    onChange={(e) => handleSaveSettings({ notifyOnStatusChanged: e.target.checked })}
                    className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">เมื่อเปลี่ยนสถานะอื่นๆ</div>
                    <p className="text-[10px] text-slate-500">เช่น ปฏิเสธสลิป, ยกเลิก หรือจบหลักสูตร</p>
                  </div>
                </label>

              </div>

              {/* Include Meet Link Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.includeMeetingLink}
                    onChange={(e) => handleSaveSettings({ includeMeetingLink: e.target.checked })}
                    className="text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span>แนบปุ่ม Google Meet ในการยืนยันคิวเรียนสดอัตโนมัติ</span>
                </label>
              </div>

            </div>
          </div>

          {/* Quick Test Box */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#06C755]/10 text-[#05963f] rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                ทดสอบส่ง Flex Message ผ่าน LINE Messaging API ทันที
              </h4>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Target User ID (เว้นว่างเพื่อใช้ Admin User ID / Broadcast)"
                  value={testTargetUserInput}
                  onChange={(e) => setTestTargetUserInput(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#06C755]"
                />
                <input
                  type="text"
                  placeholder="ข้อความทดสอบเพิ่มเติม..."
                  value={testMessageInput}
                  onChange={(e) => setTestMessageInput(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#06C755]"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400">
                  {settings.tokenConfigured 
                    ? '⚡ ข้อความจะถูกส่งตรงเข้า LINE Official Account ผ่าน Messaging API' 
                    : 'ℹ️ ยังไม่ใส่ Token ระบบจะบันทึกลง Live Sandbox'}
                </span>

                <button
                  onClick={handleSendTestNotification}
                  disabled={isTesting}
                  className="px-4 py-2 bg-[#06C755] hover:bg-[#05a847] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'กำลังทดสอบ...' : 'ส่งทดสอบเข้า LINE'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Live LINE Chat Bubble Simulator & Message Format Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 text-white shadow-xl flex flex-col h-full">
            
            {/* Phone Screen Mock Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center text-white font-black text-xs shadow-sm">
                  LINE
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{settings.botInfo?.displayName || 'AI Academy OA'}</span>
                    <span className="w-2 h-2 rounded-full bg-[#06C755] animate-pulse"></span>
                  </div>
                  <div className="text-[10px] text-slate-400">LINE Official Account (Flex Message)</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewTab('confirmed')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                    previewTab === 'confirmed' ? 'bg-[#06C755] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  อนุมัติ
                </button>
                <button
                  onClick={() => setPreviewTab('slip_uploaded')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                    previewTab === 'slip_uploaded' ? 'bg-[#06C755] text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ส่งสลิป
                </button>
              </div>
            </div>

            {/* Simulated Chat Window with Flex Bubble */}
            <div className="flex-1 bg-[#849EB5]/25 p-4 rounded-2xl space-y-3 overflow-y-auto max-h-[500px]">
              
              {/* Timestamp */}
              <div className="text-center text-[10px] text-slate-300 font-medium">
                วันนี้ 20:30 น.
              </div>

              {/* LINE Flex Message Card Mockup */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-[#06C755] flex items-center justify-center text-white font-black text-[9px] shrink-0 mt-1 shadow-sm">
                  OA
                </div>
                
                {/* Flex Bubble Container */}
                <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-100 max-w-[96%] w-full text-xs">
                  
                  {/* Flex Header */}
                  <div className={`p-4 text-white ${
                    previewTab === 'confirmed' 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700' 
                      : previewTab === 'slip_uploaded'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-700'
                      : 'bg-gradient-to-r from-slate-800 to-slate-900'
                  }`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                      {previewTab === 'confirmed' ? 'PAYMENT CONFIRMED' : 'SLIP UNDER REVIEW'}
                    </div>
                    <div className="text-sm font-extrabold flex items-center gap-1.5 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        {previewTab === 'confirmed' 
                          ? 'ยืนยันคิวเรียนและชำระเงินสำเร็จ!' 
                          : 'ได้รับสลิปโอนเงินแล้ว (รอตรวจสอบ)'}
                      </span>
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5 font-mono">
                      รหัสจอง: AI-20260825-9812
                    </div>
                  </div>

                  {/* Flex Body */}
                  <div className="p-4 space-y-3">
                    
                    {/* Course & Student info */}
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-900 text-sm">
                        AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        ผู้เรียน: <strong className="text-slate-800">คุณกิตติพงษ์ ทวีรัตน์</strong>
                      </div>
                    </div>

                    {/* Schedule Block */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> ตารางเรียนสดออนไลน์:
                      </div>
                      <div className="text-slate-600 pl-4 text-[11px]">
                        • 25 ส.ค. 2026 เวลา 19:30 - 20:30 น. (D1)
                      </div>
                    </div>

                    {/* Price Block */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-950">
                      <span className="text-[11px] font-semibold">ยอดชำระเงิน:</span>
                      <strong className="text-xs font-black text-emerald-700">฿1,500 (อนุมัติแล้ว)</strong>
                    </div>

                    {/* Google Meet Button in Flex Message */}
                    {settings.includeMeetingLink && previewTab === 'confirmed' && (
                      <a
                        href="https://meet.google.com/zar-ntas-tic"
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center py-2 px-3 bg-[#06C755] hover:bg-[#05a847] text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                      >
                        🎥 กดเข้าร่วมห้องเรียน Google Meet
                      </a>
                    )}

                  </div>

                  {/* Flex Footer */}
                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Zarntastic AI Academy</span>
                    <span>20:30 น.</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Bottom Help note */}
            <div className="mt-3 pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>ผู้เรียนได้รับ Flex Message ทันทีที่แอดมินอนุมัติสลิปหรือระบบตรวจจับสำเร็จ</span>
            </div>

          </div>
        </div>

      </div>

      {/* Dispatch History & Logs Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#06C755]" />
              <span>ประวัติการส่งแจ้งเตือน LINE Messaging API ล่าสุด (Dispatch Logs)</span>
              <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {logs.length} รายการ
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              ตรวจสอบสถานะ, ประเภทการส่ง (Push / Broadcast), และโครงสร้าง Flex Message
            </p>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างประวัติ</span>
              </button>
            )}
          </div>
        </div>

        {/* Logs Table */}
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">ยังไม่มีประวัติการส่งแจ้งเตือน LINE Messaging API ในรอบนี้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">เวลาส่ง</th>
                  <th className="py-3 px-4">ผู้รับ / ผู้เรียน</th>
                  <th className="py-3 px-4">เหตุการณ์ (Event)</th>
                  <th className="py-3 px-4">รูปแบบ (Delivery)</th>
                  <th className="py-3 px-4">สถานะการส่ง</th>
                  <th className="py-3 px-4">ตัวอย่างข้อความ</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('th-TH', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Recipient */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">คุณ{log.recipientName}</div>
                      {log.targetLineUserId ? (
                        <div className="text-[10px] text-slate-500 font-mono">
                          UID: {log.targetLineUserId.slice(0, 10)}...
                        </div>
                      ) : log.recipientLineId ? (
                        <div className="text-[10px] text-slate-500 font-mono">
                          LINE: @{log.recipientLineId}
                        </div>
                      ) : null}
                      {log.bookingId && (
                        <span className="text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded font-mono mt-0.5 inline-block">
                          {log.bookingId}
                        </span>
                      )}
                    </td>

                    {/* Event Type */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.eventType === 'payment_confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.eventType === 'slip_uploaded'
                          ? 'bg-purple-100 text-purple-800'
                          : log.eventType === 'booking_created'
                          ? 'bg-cyan-100 text-cyan-800'
                          : log.eventType === 'test'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.eventType === 'payment_confirmed' && '✅ ยืนยันคอร์ส'}
                        {log.eventType === 'slip_uploaded' && '💸 แนบสลิป'}
                        {log.eventType === 'booking_created' && '📝 จองใหม่'}
                        {log.eventType === 'status_changed' && '🔄 เปลี่ยนสถานะ'}
                        {log.eventType === 'test' && '🧪 ทดสอบระบบ'}
                      </span>
                    </td>

                    {/* Delivery Mode */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                        {log.deliveryMode === 'push' ? '🎯 Push' : log.deliveryMode === 'broadcast' ? '📢 Broadcast' : '📦 Sandbox'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.status === 'sent' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ส่งสำเร็จ
                        </span>
                      )}
                      {log.status === 'simulated' && (
                        <span className="inline-flex items-center gap-1 text-cyan-700 font-medium text-[11px]">
                          <Smartphone className="w-3.5 h-3.5" /> Sandbox Log
                        </span>
                      )}
                      {log.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" /> ส่งไม่สำเร็จ
                        </span>
                      )}
                    </td>

                    {/* Message Preview */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-600 text-[11px] truncate font-sans">
                        {log.message.split('\n')[0]}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>ดูข้อความเต็ม</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal: View Full Log Message */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {selectedLog.bookingId || selectedLog.id}
                </span>
                <h4 className="text-sm font-bold text-white">
                  รายละเอียดข้อความ LINE Message: {selectedLog.recipientName}
                </h4>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <pre className="text-xs font-sans whitespace-pre-wrap text-slate-800 leading-relaxed max-h-72 overflow-y-auto">
                  {selectedLog.message}
                </pre>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>เวลาที่ส่ง: {new Date(selectedLog.timestamp).toLocaleString('th-TH')}</span>
                <button
                  onClick={() => copyToClipboard(selectedLog.message, selectedLog.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === selectedLog.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === selectedLog.id ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Manual Trigger for a Booking */}
      {isManualTriggerOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                <span>ส่งข้อความแจ้งเตือนผู้เรียนผ่าน LINE Messaging API</span>
              </h4>
              <button
                onClick={() => setIsManualTriggerOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  เลือกรายการจองของผู้เรียน:
                </label>
                <select
                  value={targetBookingId}
                  onChange={(e) => setTargetBookingId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#06C755] font-medium"
                >
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.id}] คุณ{b.customer.name} - {b.courseTitle.slice(0, 30)}... ({b.payment.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target LINE User ID (ระบุเฉพาะเจาะจง หรือเว้นว่างเพื่อใช้โหมดอัตโนมัติ):
                </label>
                <input
                  type="text"
                  placeholder="เช่น U1234567890abcdef..."
                  value={manualTargetUserId}
                  onChange={(e) => setManualTargetUserId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#06C755]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ประเภทข้อความแจ้งเตือน:
                </label>
                <select
                  value={manualEventType}
                  onChange={(e) => setManualEventType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#06C755] font-medium"
                >
                  <option value="payment_confirmed">✅ ยืนยันการชำระเงินและคิวนัดหมาย (พร้อมปุ่มลิงก์ Google Meet)</option>
                  <option value="slip_uploaded">💸 แจ้งเตือนสลิปโอนเงินอยู่ระหว่างการตรวจสอบ</option>
                  <option value="booking_created">📝 แจ้งเตือนรายละเอียดการจองคิวใหม่</option>
                  <option value="status_changed">🔄 แจ้งเตือนการอัปเดตสถานะคิว</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ข้อความเพิ่มเติมถึงผู้เรียน (ถ้ามี):
                </label>
                <textarea
                  rows={2}
                  placeholder="เช่น กรุณาเตรียมคอมพิวเตอร์และเข้าห้องเรียนก่อนเวลา 5 นาที..."
                  value={manualCustomNote}
                  onChange={(e) => setManualCustomNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#06C755]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => setIsManualTriggerOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  disabled={isSendingManual}
                  onClick={handleSendManualNotification}
                  className="px-5 py-2 bg-[#06C755] hover:bg-[#05a847] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingManual ? 'กำลังส่ง...' : 'ส่งแจ้งเตือนทันที'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
