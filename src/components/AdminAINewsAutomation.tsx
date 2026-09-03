import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  FileText, 
  Trash2, 
  Eye, 
  Globe, 
  CheckCircle, 
  AlertTriangle,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Article } from '../data/articles';
import { ArticleModal } from './ArticleModal';

interface AutomationLog {
  runId: string;
  startTime: string;
  endTime: string;
  status: 'success' | 'failed' | 'no_news';
  triggerType: 'scheduled' | 'manual';
  urlsScanned: number;
  urlsVerified: number;
  urlsRejected: number;
  articleId?: string;
  articleTitle?: string;
  errorMessage?: string;
  summaryNote?: string;
}

interface AutomationStatus {
  schedule: string;
  timezone: string;
  cronExpression: string;
  totalAutomatedArticles: number;
  lastRun: AutomationLog | null;
  officialSources: {
    name: string;
    url: string;
    tier: string;
    domain: string;
  }[];
}

export function AdminAINewsAutomation() {
  const [statusInfo, setStatusInfo] = useState<AutomationStatus | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunningPipeline, setIsRunningPipeline] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<{ success: boolean; message: string; article?: any } | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  const token = localStorage.getItem('token');

  const fetchAutomationData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Status
      const statusRes = await fetch('/api/admin/automation/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setStatusInfo(sData);
      }

      // 2. Fetch Logs
      const logsRes = await fetch('/api/admin/automation/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData);
      }

      // 3. Fetch Articles
      const artRes = await fetch('/api/articles');
      if (artRes.ok) {
        const aData = await artRes.json();
        setArticles(aData);
      }
    } catch (err) {
      console.error('Error fetching automation data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomationData();
  }, []);

  const handleRunNow = async () => {
    if (isRunningPipeline) return;
    setIsRunningPipeline(true);
    setRunResult(null);

    try {
      const res = await fetch('/api/admin/automation/run-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setRunResult({
          success: true,
          message: `สำเร็จ! สร้างบทความ "${data.article?.title || 'Weekly AI News'}" เรียบร้อยแล้ว`,
          article: data.article
        });
      } else {
        setRunResult({
          success: false,
          message: data.message || data.error || 'เกิดข้อผิดพลาดในการดึงและประมวลผลข่าว'
        });
      }
      fetchAutomationData();
    } catch (err: any) {
      setRunResult({
        success: false,
        message: err.message || 'Network error when triggering automation'
      });
    } finally {
      setIsRunningPipeline(false);
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`ต้องการลบบทความ "${title}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAutomationData();
      }
    } catch (e) {
      console.error('Error deleting article:', e);
    }
  };

  const automatedArticles = articles.filter(a => a.isAutomated || a.category === 'ai-news');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-stone-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                AI Content Engine v2.0
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anti-Hallucination Guardrail Active
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              ระบบสร้างบทความข่าว AI อัตโนมัติ (Weekly AI Blog Automation)
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              สแกนและตรวจสอบความถูกต้องของข่าวสารจาก Tier 1 Official & Tier 2 Trusted Sources ทุกวันเสาร์ เวลา 09:00 น. (Asia/Bangkok) พร้อมระบบป้องกันภาพหลอน (Zero Hallucination) บังคับอ้างอิง URL ต้นทางที่เข้าถึงได้จริงเท่านั้น
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRunNow}
              disabled={isRunningPipeline}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isRunningPipeline ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                  <span>กำลังสแกนและสร้างบทความ...</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 fill-stone-950" />
                  <span>⚡ รันดึงข่าวทันที (Run Now)</span>
                </>
              )}
            </button>

            <button
              onClick={fetchAutomationData}
              disabled={isLoading}
              className="p-3 bg-stone-800/80 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-2xl transition-all cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Execution Alert Feedback */}
      {runResult && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 shadow-md ${
          runResult.success 
            ? 'bg-emerald-950/40 border-emerald-700 text-emerald-100' 
            : 'bg-rose-950/40 border-rose-700 text-rose-100'
        }`}>
          <div className="flex items-center gap-2.5">
            {runResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{runResult.message}</span>
          </div>

          {runResult.article && (
            <button
              onClick={() => setPreviewArticle(runResult.article)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ดูบทความ</span>
            </button>
          )}
        </div>
      )}

      {/* Configuration & Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>ตารางเวลาทำงานอัตโนมัติ (Schedule)</span>
          </div>
          <div className="text-lg font-extrabold text-stone-900">
            {statusInfo?.schedule || 'ทุกวันเสาร์ 09:00 น.'}
          </div>
          <div className="text-[11px] text-stone-500 font-mono">
            Timezone: {statusInfo?.timezone || 'Asia/Bangkok'} ({statusInfo?.cronExpression || '0 9 * * 6'})
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>การตรวจสอบความถูกต้อง (Anti-Hallucination)</span>
          </div>
          <div className="text-lg font-extrabold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>100% Verified Sources Only</span>
          </div>
          <div className="text-[11px] text-stone-500">
            URL Reachability Check (Timeout 4s) + Domain Whitelist Enforced
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>บทความที่เผยแพร่แล้ว (Published)</span>
          </div>
          <div className="text-lg font-extrabold text-stone-900">
            {automatedArticles.length} <span className="text-xs font-normal text-stone-500">บทความประจำสัปดาห์</span>
          </div>
          <div className="text-[11px] text-stone-500">
            รวมบทความในคลังความรู้ทั้งหมด: {articles.length} บทความ
          </div>
        </div>
      </div>

      {/* Official Verified Feeds List */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-600" />
            <span>แหล่งข่าวทางการที่ได้รับอนุญาต (Configured Tier 1 & Tier 2 Feeds)</span>
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {statusInfo?.officialSources?.length || 9} แหล่งข้อมูลชั้นนำ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(statusInfo?.officialSources || []).map((src, idx) => (
            <div 
              key={idx}
              className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-purple-300 transition-all flex items-center justify-between gap-3 text-xs"
            >
              <div className="truncate space-y-0.5">
                <div className="font-bold text-stone-900 truncate">
                  {src.name}
                </div>
                <div className="text-[10px] text-stone-400 font-mono truncate">
                  {src.domain}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${
                src.tier.includes('Tier 1')
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              }`}>
                {src.tier}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Published Weekly AI News Articles */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-600" />
            <span>บทความสรุปข่าว AI ประจำสัปดาห์ในคลังความรู้</span>
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {automatedArticles.length} รายการ
          </span>
        </div>

        {automatedArticles.length === 0 ? (
          <div className="text-center py-10 text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
            ยังไม่มีบทความข่าว AI อัตโนมัติ — กดปุ่ม "⚡ รันดึงข่าวทันที" เพื่อทดสอบสร้างบทความแรก
          </div>
        ) : (
          <div className="space-y-3">
            {automatedArticles.map((art) => (
              <div 
                key={art.id}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold">
                      {art.categoryLabel}
                    </span>
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {art.publishedDate}
                    </span>
                    {art.sources && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-md font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {art.sources.length} แหล่งข่าวทางการ
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-extrabold text-stone-900">
                    {art.title}
                  </h4>
                  <p className="text-xs text-stone-600 line-clamp-1">
                    {art.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setPreviewArticle(art)}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>อ่านบทความ</span>
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(art.id, art.title)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="ลบบทความ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution Run Logs Table */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-700" />
            <span>ประวัติการทำงานของระบบ (Automation Execution Logs)</span>
          </h3>
          <span className="text-xs text-stone-500 font-medium">
            {logs.length} บันทึก
          </span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
            ยังไม่มีบันทึกการทำงาน
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-bold bg-stone-50/50">
                  <th className="p-3">Run ID</th>
                  <th className="p-3">เวลาที่รัน</th>
                  <th className="p-3">ประเภท</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3">URLs ที่สแกน</th>
                  <th className="p-3">URLs ผ่านเกณฑ์</th>
                  <th className="p-3">บทความที่สร้าง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => (
                  <tr key={log.runId} className="hover:bg-stone-50/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-stone-700">
                      {log.runId}
                    </td>
                    <td className="p-3 text-stone-600 whitespace-nowrap">
                      {new Date(log.startTime).toLocaleString('th-TH')}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.triggerType === 'scheduled'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.triggerType === 'scheduled' ? '⏰ ทุกวันเสาร์' : '⚡ สั่งรันด้วยตนเอง'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-fit ${
                        log.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'no_news'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status === 'success' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {log.status === 'no_news' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                        {log.status === 'failed' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-stone-600">
                      {log.urlsScanned}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-700">
                      {log.urlsVerified} ({log.urlsRejected} ถูกคัดออก)
                    </td>
                    <td className="p-3">
                      {log.articleTitle ? (
                        <span className="font-bold text-stone-900 max-w-xs truncate block" title={log.articleTitle}>
                          {log.articleTitle}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">
                          {log.summaryNote || log.errorMessage || '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Article Preview Modal */}
      {previewArticle && (
        <ArticleModal
          article={previewArticle}
          onClose={() => setPreviewArticle(null)}
        />
      )}
    </div>
  );
}
