import { useState, FormEvent, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  Loader2, 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  HelpCircle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Course } from '../types';
import { COURSES } from '../data/courses';
import { generateAdvisorResponse } from '../utils/aiAdvisorEngine';
import { formatCurrency } from '../utils/scheduleUtils';

interface AICourseAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  courses?: Course[];
  onSelectCourseById?: (courseId: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  matchedCourses?: Course[];
}

export function AICourseAdvisor({
  isOpen,
  onClose,
  courses = COURSES,
  onSelectCourseById,
}: AICourseAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `สวัสดีครับ! ผมคือ **AI Course Consultant & Smart Scheduler** โดย อ.มณีรัตน์ (Zarntastic AI LEARNING) 🤖✨

ผมพร้อมช่วยวิเคราะห์เป้าหมายการทำงานและแนะนำหลักสูตร AI ที่เหมาะสมกับคุณที่สุด พร้อมช่วยคำนวณรอบเวลาเรียนที่ลงตัว!

**ตัวอย่างคำถามที่สามารถสอบถามได้ทันที:**
• *"แนะนำคอร์สสำหรับมือใหม่ ไม่เคยเขียนโค้ด"*
• *"อยากสร้าง AI Automation หรือ AI Agent เชื่อมกับ LINE OA"*
• *"ว่างเรียนช่วงค่ำวันธรรมดา มีคอร์สอะไรบ้าง?"*
• *"ต้องการนำ AI มาช่วยทำ Content และการตลาด ยิงแอด"*
• *"คอร์สสร้าง Web App หรือ Website ด้วย AI มีอะไรบ้าง?"*`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  if (!isOpen) return null;

  // Helper to extract course matches based on message content
  const findRelevantCourses = (text: string): Course[] => {
    const t = text.toLowerCase();
    const matched: Course[] = [];

    if (t.includes('ai starter') || t.includes('เริ่มใช้ ai ให้เป็น') || t.includes('มือใหม่')) {
      const c = courses.find(item => item.id === 'live-ai-starter');
      if (c && !matched.includes(c)) matched.push(c);
    }
    if (t.includes('marketing') || t.includes('การตลาด') || t.includes('ยิงแอด')) {
      const c = courses.find(item => item.id === 'live-ai-marketing');
      if (c && !matched.includes(c)) matched.push(c);
    }
    if (t.includes('claude starter') || t.includes('claude/claude cowork starter')) {
      const c = courses.find(item => item.id === 'live-claude-starter');
      if (c && !matched.includes(c)) matched.push(c);
    }
    if (t.includes('productivity') || t.includes('ทำงานน่าเบื่อให้เร็วขึ้น') || t.includes('ออฟฟิศ')) {
      const c = courses.find(item => item.id === 'live-ai-productivity');
      if (c && !matched.includes(c)) matched.push(c);
    }
    if (t.includes('claude cowork, claude code') || (t.includes('claude') && t.includes('agent'))) {
      const c = courses.find(item => item.id === 'live-claude-cowork-code-agents');
      if (c && !matched.includes(c)) matched.push(c);
    }
    if (t.includes('antigravity') || t.includes('webapp') || t.includes('web app')) {
      const c = courses.find(item => item.id === 'live-ai-webapp-antigravity');
      if (c && !matched.includes(c)) matched.push(c);
    }
    if (t.includes('lovable') || t.includes('website builder')) {
      const c = courses.find(item => item.id === 'live-ai-website-lovable');
      if (c && !matched.includes(c)) matched.push(c);
    }
    if (t.includes('chat gpt work') || t.includes('gpt work') || t.includes('codex')) {
      const c = courses.find(item => item.id === 'live-chatgpt-work-codex-agents');
      if (c && !matched.includes(c)) matched.push(c);
    }

    return matched.slice(0, 3);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          const matched = findRelevantCourses(data.reply + ' ' + userText);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.reply,
              matchedCourses: matched.length > 0 ? matched : undefined,
            },
          ]);
          return;
        }
      }
      
      // Fallback to local intelligent advisory engine
      const localReply = generateAdvisorResponse(userText);
      const matched = findRelevantCourses(localReply + ' ' + userText);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: localReply,
          matchedCourses: matched.length > 0 ? matched : undefined,
        },
      ]);
    } catch (err) {
      // Offline / Network fallback
      const localReply = generateAdvisorResponse(userText);
      const matched = findRelevantCourses(localReply + ' ' + userText);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: localReply,
          matchedCourses: matched.length > 0 ? matched : undefined,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col h-[680px] max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-purple-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>AI Course & Schedule Advisor</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 font-medium">
                  Gemini 3.7
                </span>
              </h3>
              <p className="text-xs text-purple-200">
                วิเคราะห์หลักสูตรที่ตอบโจทย์ พร้อมแนะนำรอบเวลาเรียนที่ลงตัว
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/60">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-[88%] text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none shadow-xs'
                }`}
              >
                {m.role === 'assistant' ? (
                  <div className="space-y-3">
                    <div className="prose prose-sm prose-slate max-w-none text-xs sm:text-sm leading-relaxed">
                      <Markdown>{m.content}</Markdown>
                    </div>

                    {/* Interactive Course Quick Action Cards */}
                    {m.matchedCourses && m.matchedCourses.length > 0 && onSelectCourseById && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        <div className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>หลักสูตรที่เกี่ยวข้อง (คลิกเพื่อจองคิวเรียนทันที):</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {m.matchedCourses.map((c) => (
                            <div 
                              key={c.id}
                              className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 hover:bg-purple-100/80 transition-all flex items-center justify-between gap-2 text-slate-800"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {c.title}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="font-semibold text-purple-700">{formatCurrency(c.price)}</span>
                                  <span>•</span>
                                  <span>{c.totalHours} ชม. ({c.id.startsWith('vdo') ? 'VDO Online' : 'Live 1:1'})</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => onSelectCourseById(c.id)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-xs cursor-pointer"
                              >
                                <span>จองคอร์สนี้</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 animate-spin">
                <Loader2 className="w-4 h-4" />
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-slate-500 flex items-center gap-2 shadow-xs">
                <span className="animate-pulse font-medium">กำลังวิเคราะห์และจัดสรรหลักสูตรด้วย AI...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-600 shrink-0">
          <span className="font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            คำถามด่วน:
          </span>
          {[
            'แนะนำคอร์สสำหรับมือใหม่ ไม่เคยเขียนโค้ด',
            'อยากเรียนสร้าง AI Automation เชื่อม LINE OA',
            'คอร์สไหนเรียน 2 วัน รวม 6 ชั่วโมง?',
            'คอร์ส 1 วัน 3 ชั่วโมง มีอะไรบ้าง?',
            'รอบเวลาเปิดสอนและราคาค่าเรียน',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              className="bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 px-3 py-1.5 rounded-full border border-slate-200 whitespace-nowrap transition-all shadow-xs cursor-pointer font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="พิมพ์เป้าหมายของคุณ หรือถามเกี่ยวกับวันเวลาเรียน..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-purple-600/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">ส่งคำถาม</span>
          </button>
        </form>

      </div>
    </div>
  );
}
