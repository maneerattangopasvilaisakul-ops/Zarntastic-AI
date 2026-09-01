import { useState, FormEvent, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  Loader2, 
  RotateCcw, 
  Check, 
  Copy, 
  ChevronRight, 
  Zap, 
  Brain, 
  Rocket, 
  Calendar, 
  GraduationCap, 
  Building2, 
  PlayCircle, 
  Video, 
  Clock,
  ArrowRight,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { COURSES } from '../data/courses';
import { Course } from '../types';

interface AICourseAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourseById: (courseId: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedCourseIds?: string[];
  modelUsed?: string;
  timestamp: string;
}

type GeminiModelType = 'gemini-3.7-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite' | 'gemini-3.5-flash';
type PersonaType = 'advisor' | 'scheduler' | 'corporate';

export function AICourseAdvisor({
  isOpen,
  onClose,
  onSelectCourseById,
}: AICourseAdvisorProps) {
  const [selectedModel, setSelectedModel] = useState<GeminiModelType>('gemini-3.7-flash');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('advisor');
  
  const initialGreeting: ChatMessage = {
    id: 'msg-init',
    role: 'assistant',
    content: `สวัสดีครับ! ผมคือ **Gemini AI Consultant** ประจำสถาบัน **Zarntastic AI LEARNING** (โดย อ.มณีรัตน์ ตั้งโอภาสวิไลสกุล) 🤖✨

🌟 **แนะนำคอร์สเรียนสด Online 1:1 ผ่าน Google Meet (จับมือทำ ปรึกษาโจทย์จริง ตัวต่อตัว)**:
• 💼 **AI for Work: ใช้ AI ในการทำงานคล่อง (3 ชม. ฿3,900)**: ประยุกต์ใช้ AI ครบวงจร เอกสาร รายงาน วิเคราะห์ข้อมูล
• 💻 **AI STARTER (1 ชม. ฿1,500)**: ปูพื้นฐาน AI ให้ใช้งานเป็นทันทีแบบจับมือทำ
• 💻 **Claude Personal Workflow (3 ชม. ฿3,900)**: ออกแบบ Workflow เฉพาะบุคคล เพิ่มความเร็วงาน 10x
• 💻 **AI Webapp Builder with Google AI Studio (3 ชม. ฿3,900)**: สร้าง Web App ต่อ API ใช้งานได้จริง
• 💻 **Claude Cowork & Custom Skills (6 ชม. ฿7,500)**: เจาะลึก Claude และสร้าง Skills ทำงานอัตโนมัติ
• 💻 **สร้าง Landing Page ด้วย AI (6 ชม. ฿7,500)**: ออกแบบและเขียนโค้ดหน้าขายสินค้าเพิ่มยอดขาย

*(🎬 สำหรับคอร์ส VDO Online กำลังอยู่ในสถานะ Coming Soon เร็วๆ นี้)*

คุณสามารถพิมพ์ปรึกษาโจทย์งาน หรือกดเลือกคำถามด่วนด้านล่างเพื่อรับคำแนะนำได้เลยครับ!`,
    suggestedCourseIds: ['live-ai-for-work', 'live-ai-starter', 'live-claude-workflow'],
    timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = overrideText || inputMessage.trim();
    if (!textToSend || isLoading) return;

    const userMsgId = 'usr-' + Date.now();
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };

    // Update conversation with new user message
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send entire history for true multi-turn context
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          userMessage: textToSend,
          model: selectedModel,
          persona: selectedPersona,
        }),
      });

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: data.reply || 'ขออภัย ไม่สามารถสร้างคำแนะนำได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
        suggestedCourseIds: data.suggestedCourseIds || [],
        modelUsed: data.modelUsed || selectedModel,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ AI กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้งครับ',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(undefined, prompt);
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...initialGreeting,
        id: 'msg-init-' + Date.now(),
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick suggestion prompts based strictly on the syllabus
  const quickPrompts = [
    { text: 'สนใจคอร์สสด AI for Work ทำงานคล่องใน 3 ชม. (฿3,900)', icon: '💼' },
    { text: 'อยากเรียนสด 1:1 ปรึกษาโจทย์งานจริง เริ่มต้นคอร์สไหนดี?', icon: '💡' },
    { text: 'สนใจเรียนสด 1:1 สร้าง Web App ด้วย Google AI Studio', icon: '⚡' },
    { text: 'อยากเรียนสด 1:1 ออกแบบ Personal Workflow ด้วย Claude', icon: '🚀' },
    { text: 'สนใจเรียนสดสร้าง Landing Page เพิ่มยอดขาย ธุรกิจ', icon: '🎯' },
    { text: 'คอร์สสด 1:1 มีรอบเวลาไหนบ้าง? วันธรรมดาเรียนได้กี่โมง?', icon: '📅' },
    { text: 'สนใจจองคิววิทยากรบรรยาย อบรม AI นอกสถานที่', icon: '🏢' },
  ];

  return (
    <div 
      id="gemini-chatbot-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/30 max-w-3xl w-full overflow-hidden flex flex-col h-[700px] max-h-[94vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-3.5 sm:p-4 border-b border-indigo-800/40 shrink-0">
          <div className="flex items-center justify-between gap-3">
            
            {/* Title & Avatar */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                    <span>Gemini AI Course Advisor</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  สถาบัน Zarntastic AI LEARNING • ปรึกษาหลักสูตร & จัดตารางเรียน
                </p>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-1.5">
              <a
                href="https://lin.ee/NE2vFcZ"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-sm"
                title="ติดต่อ Admin ทาง LINE @zarntastic"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ติดต่อ Admin</span>
              </a>

              <button
                id="btn-reset-chat"
                onClick={handleResetChat}
                className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1 text-xs"
                title="เริ่มบทสนทนาใหม่"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline">ล้างแชท</span>
              </button>

              <button
                id="btn-close-advisor"
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                title="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Model & Persona Controls */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            
            {/* Persona Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPersona('advisor')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all font-medium text-[11px] cursor-pointer ${
                  selectedPersona === 'advisor'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>ที่ปรึกษาคอร์ส</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPersona('scheduler')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all font-medium text-[11px] cursor-pointer ${
                  selectedPersona === 'scheduler'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>จัดตารางเวลา</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPersona('corporate')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all font-medium text-[11px] cursor-pointer ${
                  selectedPersona === 'corporate'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>คอร์สองค์กร</span>
              </button>
            </div>

            {/* Model Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 hidden sm:inline font-semibold">โมเดล AI:</span>
              <select
                id="select-gemini-model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as GeminiModelType)}
                className="bg-slate-900 text-cyan-300 text-[11px] font-semibold rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
              >
                <option value="gemini-3.7-flash">⚡ Gemini 3.7 Flash (แนะนำ)</option>
                <option value="gemini-3.1-pro-preview">🧠 Gemini 3.1 Pro (วิเคราะห์ลึก)</option>
                <option value="gemini-3.1-flash-lite">🚀 Gemini 3.1 Flash Lite (ความเร็วสูง)</option>
                <option value="gemini-3.5-flash">🌟 Gemini 3.5 Flash (มาตรฐาน)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/70">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const matchedCourses: Course[] = [];
            if (m.suggestedCourseIds && m.suggestedCourseIds.length > 0) {
              for (const cid of m.suggestedCourseIds) {
                const found = COURSES.find((c) => c.id === cid);
                if (found && !matchedCourses.some((item) => item.id === found.id)) {
                  matchedCourses.push(found);
                }
              }
            }

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Container */}
                <div className={`flex flex-col max-w-[88%] sm:max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
                  
                  {/* Bubble */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm relative group ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-indigo-600/10'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    ) : (
                      <div className="prose prose-sm max-w-none text-slate-800 prose-headings:font-bold prose-headings:text-slate-900 prose-headings:my-2 prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-strong:text-purple-900 prose-code:bg-purple-50 prose-code:text-purple-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}

                    {/* Copy Button */}
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => handleCopyText(m.id, m.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600"
                        title="คัดลอกข้อความ"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Interactive Course Suggestions Cards */}
                  {!isUser && matchedCourses.length > 0 && (
                    <div className="mt-2.5 space-y-2 w-full">
                      <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span>คอร์สที่เกี่ยวข้อง:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {matchedCourses.slice(0, 4).map((c) => (
                          <div
                            key={c.id}
                            className="bg-white p-2.5 rounded-xl border border-purple-200 hover:border-purple-400 transition-all shadow-xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 mb-1">
                                {c.isVdoCourse ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 flex items-center gap-1">
                                    <Video className="w-2.5 h-2.5" /> VDO
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-1">
                                    <PlayCircle className="w-2.5 h-2.5" /> สด 1:1
                                  </span>
                                )}
                                <span className="text-[11px] font-bold text-emerald-600 ml-auto">
                                  ฿{c.price.toLocaleString()}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                                {c.title}
                              </h4>
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {c.tagline || c.description}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                onSelectCourseById(c.id);
                                onClose();
                              }}
                              className="mt-2 w-full py-1.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                            >
                              <span>เลือกจองคอร์สนี้</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assistant Footer Actions & Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 mt-1.5 px-1">
                    <div className="flex items-center gap-1.5">
                      <span>{m.timestamp}</span>
                      {!isUser && m.modelUsed && (
                        <>
                          <span>•</span>
                          <span className="text-purple-600 font-medium">{m.modelUsed}</span>
                        </>
                      )}
                    </div>

                    {!isUser && (
                      <a
                        href="https://lin.ee/NE2vFcZ"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#06C755] hover:text-[#05b34c] bg-[#06C755]/10 hover:bg-[#06C755]/20 px-2 py-0.5 rounded-md transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>ติดต่อ Admin ทาง LINE</span>
                      </a>
                    )}
                  </div>

                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 items-center text-slate-500 text-xs">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 animate-spin">
                <Loader2 className="w-4 h-4" />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-slate-600 font-medium text-xs ml-1">
                  Gemini กำลังวิเคราะห์และเรียบเรียงคำตอบ...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips (Syllabus-aligned) */}
        <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
          <span className="font-bold text-slate-600 shrink-0 text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600" />
            คำถามด่วน:
          </span>
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPrompt(item.text)}
              disabled={isLoading}
              className="bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-900 px-2.5 py-1 rounded-full border border-slate-200/90 text-slate-700 whitespace-nowrap transition-all cursor-pointer font-medium text-xs flex items-center gap-1 shrink-0 shadow-2xs"
            >
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => handleSendMessage(e)} 
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            id="input-gemini-chat"
            placeholder="พิมพ์สอบถามคอร์สเรียน ตารางเวลา หรือให้ช่วยเลือกคอร์ส..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            id="btn-send-gemini-chat"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">ส่งคำถาม</span>
          </button>
        </form>

      </div>
    </div>
  );
}
