import { useState, FormEvent } from 'react';
import { Sparkles, Send, Bot, User, X, Loader2, ArrowRight } from 'lucide-react';
import { Course } from '../types';

interface AICourseAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourseById: (courseId: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AICourseAdvisor({
  isOpen,
  onClose,
  onSelectCourseById,
}: AICourseAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `สวัสดีครับ! ผมคือ **AI Course Consultant & Smart Scheduler** 🤖✨
ผมพร้อมช่วยคุณเลือกคอร์ส AI ที่เหมาะกับเป้าหมายการทำงานและตารางเวลาของคุณมากที่สุด!

คุณสามารถสอบถามได้เลยครับ เช่น:
• *"อยากนำ AI ไปช่วยทำงานอัตโนมัติ ไม่ต้องเขียนโค้ด ควรเริ่มคอร์สไหน?"*
• *"ว่างเรียนเฉพาะช่วงค่ำวันธรรมดา มีคอร์สอะไรบ้าง?"*
• *"ต้องการสร้าง Web App หรือ AI Agent ต่อกับ API"*`,
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

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
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'ขออภัย ไม่สามารถดึงคำตอบได้ในขณะนี้',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาลองใหม่อีกครั้ง',
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col h-[650px] max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-purple-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>AI Course & Schedule Advisor</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Powered by Gemini 3.7
                </span>
              </h3>
              <p className="text-xs text-purple-200">
                ปรึกษาหลักสูตรและแนะนำเวลาเรียนที่เหมาะกับคุณ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
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
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-slate-500 flex items-center gap-2">
                <span className="animate-pulse">กำลังประมวลผลคำแนะนำ...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-600">
          <span className="font-semibold text-slate-500 shrink-0">คำถามด่วน:</span>
          {[
            'แนะนำคอร์สสำหรับมือใหม่ ไม่เคยเขียนโค้ด',
            'อยากเรียนสร้าง AI Automation เชื่อม LINE OA',
            'คอร์สไหนเรียน 2 วัน รวม 6 ชั่วโมง?',
            'คอร์ส 8 ชั่วโมง มีรอบเวลาไหนบ้าง?',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              className="bg-white hover:bg-slate-200 px-2.5 py-1 rounded-full border border-slate-200 whitespace-nowrap transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="พิมพ์เป้าหมายของคุณ หรือถามเกี่ยวกับวันเวลาเรียน..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">ส่งคำถาม</span>
          </button>
        </form>

      </div>
    </div>
  );
}
