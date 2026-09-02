import { NotificationItem } from '../types';
import { COURSES } from '../data/courses';
import { Bell, CheckCheck, Clock, ShieldCheck, X, Sparkles } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onSelectBooking: (bookingId?: string) => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onSelectBooking,
}: NotificationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end">
      
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-stone-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600/30 text-orange-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">การแจ้งเตือนคิวและสลิป</h3>
              <p className="text-xs text-stone-400">อัปเดตแบบเรียลไทม์เมื่อมีการจองใหม่</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-5 py-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs">
          <span className="text-stone-500 font-medium">
            ทั้งหมด ({notifications.length}) รายการ
          </span>
          <button
            onClick={onMarkAllAsRead}
            className="text-orange-700 hover:text-orange-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>อ่านทั้งหมดแล้ว</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-stone-400 text-xs">
              ยังไม่มีการแจ้งเตือนในขณะนี้
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.bookingId) {
                    onSelectBooking(notif.bookingId);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl transition-all cursor-pointer ${
                  notif.isRead
                    ? 'hover:bg-stone-50 opacity-80'
                    : 'bg-orange-50/40 hover:bg-orange-50 border-l-4 border-orange-500 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-stone-900 leading-snug">
                    {notif.title}
                  </span>
                  <span className="text-[10px] text-stone-400 whitespace-nowrap">
                    {new Date(notif.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                  </span>
                </div>

                
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                  {notif.message}
                </p>
                
                {notif.vdoCourseId && COURSES.find(c => c.id === notif.vdoCourseId)?.vdoLinks && (
                  <div className="mt-3 p-3 bg-white border border-stone-200 rounded-lg shadow-sm space-y-2">
                    <div className="text-[10px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      ลิงก์เข้าเรียน VDO Online ของคุณ
                    </div>
                    <ul className="space-y-1.5">
                      {COURSES.find(c => c.id === notif.vdoCourseId)?.vdoLinks?.map((link, idx) => (
                        <li key={idx}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex flex-col p-2 bg-stone-50 hover:bg-orange-50 rounded border border-stone-100 hover:border-orange-200 transition-colors group">
                             <span className="text-xs font-semibold text-stone-800 group-hover:text-orange-700">{link.title}</span>
                             <span className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">{link.url}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}


                {notif.bookingId && (
                  <div className="mt-2 text-[10px] text-orange-700 font-mono font-semibold flex items-center gap-1">
                    <span>รหัส: {notif.bookingId}</span>
                    <span className="text-stone-400">• คลิกเพื่อตรวจสอบ</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
}
