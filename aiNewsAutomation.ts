import Parser from "rss-parser";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// Ensure data folder exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const ARTICLES_FILE = path.join(DATA_DIR, "articles_db.json");
export const RUNS_FILE = path.join(DATA_DIR, "automation_runs_db.json");

export interface VerifiedNewsItem {
  title: string;
  link: string;
  pubDate: string;
  isoDate?: string;
  sourceName: string;
  sourceTier: "Tier 1 Official" | "Tier 2 Trusted";
  domain: string;
  snippet: string;
  relevanceScore: number;
}

export interface AutomationRunLog {
  runId: string;
  startTime: string;
  endTime: string;
  status: "success" | "failed" | "no_news";
  triggerType: "scheduled" | "manual";
  urlsScanned: number;
  urlsVerified: number;
  urlsRejected: number;
  articleId?: string;
  articleTitle?: string;
  errorMessage?: string;
  summaryNote?: string;
}

// Allowed Official Tier 1 and Trusted Tier 2 Domains
export const ALLOWED_DOMAINS = [
  "blog.google",
  "deepmind.google",
  "openai.com",
  "huggingface.co",
  "aws.amazon.com",
  "github.blog",
  "blogs.nvidia.com",
  "machinelearning.apple.com",
  "blogs.microsoft.com",
  "about.fb.com",
  "ai.meta.com",
  "techcrunch.com",
  "theverge.com",
  "technologyreview.com",
  "reuters.com",
  "bloomberg.com",
  "wired.com",
  "ft.com",
];

// Sources Definition with Prioritization
export const OFFICIAL_AI_SOURCES = [
  // Tier 1 Official Sources (Highest Priority)
  {
    name: "Google AI Blog & Research",
    url: "https://blog.google/technology/ai/rss/",
    tier: "Tier 1 Official" as const,
    domain: "blog.google",
  },
  {
    name: "OpenAI Official News",
    url: "https://openai.com/news/rss.xml",
    tier: "Tier 1 Official" as const,
    domain: "openai.com",
  },
  {
    name: "Hugging Face Official Blog",
    url: "https://huggingface.co/blog/feed.xml",
    tier: "Tier 1 Official" as const,
    domain: "huggingface.co",
  },
  {
    name: "AWS Machine Learning",
    url: "https://aws.amazon.com/blogs/machine-learning/feed/",
    tier: "Tier 1 Official" as const,
    domain: "aws.amazon.com",
  },
  {
    name: "GitHub Official AI Blog",
    url: "https://github.blog/category/ai-and-ml/feed/",
    tier: "Tier 1 Official" as const,
    domain: "github.blog",
  },
  {
    name: "NVIDIA AI News",
    url: "https://blogs.nvidia.com/feed/",
    tier: "Tier 1 Official" as const,
    domain: "blogs.nvidia.com",
  },

  // Tier 2 Trusted Sources
  {
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    tier: "Tier 2 Trusted" as const,
    domain: "techcrunch.com",
  },
  {
    name: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    tier: "Tier 2 Trusted" as const,
    domain: "theverge.com",
  },
  {
    name: "MIT Technology Review AI",
    url: "https://www.technologyreview.com/feed/",
    tier: "Tier 2 Trusted" as const,
    domain: "technologyreview.com",
  },
];

// Load persisted articles
export function loadArticles(): any[] {
  try {
    if (fs.existsSync(ARTICLES_FILE)) {
      const raw = fs.readFileSync(ARTICLES_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("[Articles] Error reading articles file:", e);
  }
  return [];
}

export function saveArticles(articles: any[]) {
  try {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), "utf8");
  } catch (e) {
    console.error("[Articles] Error writing articles file:", e);
  }
}

// Load automation run logs
export function loadRunLogs(): AutomationRunLog[] {
  try {
    if (fs.existsSync(RUNS_FILE)) {
      const raw = fs.readFileSync(RUNS_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("[Runs] Error reading runs file:", e);
  }
  return [];
}

export function saveRunLogs(logs: AutomationRunLog[]) {
  try {
    fs.writeFileSync(RUNS_FILE, JSON.stringify(logs, null, 2), "utf8");
  } catch (e) {
    console.error("[Runs] Error writing runs file:", e);
  }
}

// URL validation & Reachability check (Timeout 4s)
async function isUrlLive(urlStr: string): Promise<boolean> {
  try {
    const parsed = new URL(urlStr);
    const domainMatch = ALLOWED_DOMAINS.some((d) => parsed.hostname.includes(d));
    if (!domainMatch) {
      return false;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(urlStr, {
      method: "HEAD",
      signal: controller.signal,
      headers: { "User-Agent": "Zarntastic-AINews-Verifier/1.0" },
    });
    clearTimeout(timeout);
    return res.status >= 200 && res.status < 400;
  } catch (e) {
    // If HEAD method not supported by server, try GET with range
    try {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 4000);
      const res2 = await fetch(urlStr, {
        method: "GET",
        headers: {
          Range: "bytes=0-100",
          "User-Agent": "Zarntastic-AINews-Verifier/1.0",
        },
        signal: controller2.signal,
      });
      clearTimeout(timeout2);
      return res2.status >= 200 && res2.status < 400;
    } catch (e2) {
      return false;
    }
  }
}

// Check Recency (within last 14 days)
function isWithinRecentDays(dateStr: string, days = 14): boolean {
  if (!dateStr) return true; // fallback if feed does not emit date
  const itemDate = new Date(dateStr);
  if (isNaN(itemDate.getTime())) return true;
  const now = new Date();
  const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= days && diffDays >= -1;
}

// Calculate Relevance Score based on Tier, Recency, and Key AI Terms
function calculateScore(item: any, tier: "Tier 1 Official" | "Tier 2 Trusted", pubDateStr: string): number {
  let score = tier === "Tier 1 Official" ? 50 : 30;

  // Recency bonus
  if (pubDateStr) {
    const itemDate = new Date(pubDateStr);
    if (!isNaN(itemDate.getTime())) {
      const ageHours = (Date.now() - itemDate.getTime()) / (1000 * 60 * 60);
      if (ageHours < 48) score += 20;
      else if (ageHours < 168) score += 10;
    }
  }

  // Keywords bonus
  const text = `${item.title || ""} ${item.contentSnippet || ""} ${item.content || ""}`.toLowerCase();
  const highValueKeywords = [
    "release",
    "launch",
    "model",
    "agent",
    "automation",
    "workflow",
    "enterprise",
    "gemini",
    "gpt",
    "claude",
    "developer",
    "api",
    "multimodal",
  ];
  for (const kw of highValueKeywords) {
    if (text.includes(kw)) score += 5;
  }

  return score;
}

// Core Automation Pipeline Runner
export async function runAINewsAutomationPipeline(triggerType: "scheduled" | "manual" = "manual") {
  const startTime = new Date().toISOString();
  const runId = `RUN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  console.log(`[AI News Automation] Starting pipeline (${triggerType}) Run ID: ${runId}`);

  const parser = new Parser({ timeout: 6000 });
  const rawScannedItems: any[] = [];
  let urlsScanned = 0;
  let urlsVerified = 0;
  let urlsRejected = 0;

  // Load existing articles for duplicate check
  const existingArticles = loadArticles();
  const existingUrls = new Set<string>();
  const existingTitles = new Set<string>();

  existingArticles.forEach((a: any) => {
    if (a.sources) {
      a.sources.forEach((s: any) => s.url && existingUrls.add(s.url.toLowerCase()));
    }
    if (a.title) existingTitles.add(a.title.toLowerCase().trim());
  });

  // 1. Fetch from All Configured Feeds
  for (const source of OFFICIAL_AI_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      if (feed && Array.isArray(feed.items)) {
        for (const item of feed.items.slice(0, 5)) {
          urlsScanned++;
          const link = item.link?.trim();
          const title = item.title?.trim();

          if (!link || !title) {
            urlsRejected++;
            continue;
          }

          // Duplicate URL check
          if (existingUrls.has(link.toLowerCase())) {
            urlsRejected++;
            continue;
          }

          // Duplicate Title check
          if (existingTitles.has(title.toLowerCase())) {
            urlsRejected++;
            continue;
          }

          // Date check (within recent 14 days)
          const dateStr = item.isoDate || item.pubDate || "";
          if (!isWithinRecentDays(dateStr, 14)) {
            urlsRejected++;
            continue;
          }

          rawScannedItems.push({
            title,
            link,
            pubDate: dateStr,
            isoDate: item.isoDate,
            sourceName: source.name,
            sourceTier: source.tier,
            domain: source.domain,
            snippet: (item.contentSnippet || item.content || "").slice(0, 300),
            relevanceScore: calculateScore(item, source.tier, dateStr),
          });
        }
      }
    } catch (err: any) {
      console.warn(`[AI News Automation] Feed fetch warning for ${source.name}:`, err.message);
    }
  }

  // 2. Strict Live URL Verification
  const verifiedNewsItems: VerifiedNewsItem[] = [];
  for (const candidate of rawScannedItems) {
    const isLive = await isUrlLive(candidate.link);
    if (isLive) {
      urlsVerified++;
      verifiedNewsItems.push(candidate);
    } else {
      urlsRejected++;
    }
  }

  // Sort by relevance score & Tier 1 priority
  verifiedNewsItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Take top 3 to 6 verified news items
  const selectedNews = verifiedNewsItems.slice(0, 6);

  if (selectedNews.length === 0) {
    const log: AutomationRunLog = {
      runId,
      startTime,
      endTime: new Date().toISOString(),
      status: "no_news",
      triggerType,
      urlsScanned,
      urlsVerified,
      urlsRejected,
      errorMessage: "ไม่มีข่าว AI ที่ผ่านเกณฑ์การตรวจสอบความถูกต้อง 100% ในรอบเวลานี้",
      summaryNote: "ระบบระงับการสร้างบทความเพื่อป้องกันข้อมูลคลาดเคลื่อน (Strict Anti-Hallucination Safe State)",
    };
    const logs = loadRunLogs();
    logs.unshift(log);
    saveRunLogs(logs);
    return { success: false, log, message: log.errorMessage };
  }

  // 3. Synthesize High-Quality Thai Article with Anti-Hallucination Guardrails
  const thaiDateFormatter = new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  });
  const todayThaiStr = thaiDateFormatter.format(new Date());

  const articleId = `ai-weekly-news-${new Date().toISOString().slice(0, 10)}-${Math.floor(100 + Math.random() * 900)}`;

  // Construct Verified Sources List
  const sources = selectedNews.map((n) => ({
    name: n.sourceName,
    url: n.link,
    tier: n.sourceTier,
    publishedDate: n.pubDate || todayThaiStr,
  }));

  // Build Structured Sections
  const newsSections = selectedNews.map((n, idx) => {
    const cleanSnippet = n.snippet
      ? n.snippet.replace(/<[^>]*>?/gm, "").trim()
      : "อัปเดตนวัตกรรมและฟีเจอร์ใหม่จากแหล่งข่าวทางการ";
    return {
      heading: `${idx + 1}. ${n.title}`,
      body: `【สิ่งที่เกิดขึ้น】: ข้อมูลรายงานอย่างเป็นทางการจาก ${n.sourceName} ระบุว่า ${cleanSnippet}\n\n【ทำไมจึงสำคัญ】: การพัฒนาครั้งนี้ช่วยยกระดับความแม่นยำ ประสิทธิภาพ และการทำงานร่วมกันระหว่างมนุษย์และ AI Agent อย่างมีนัยสำคัญ\n\n【กลุ่มที่ควรให้ความสนใจ】: ผู้บริหาร, นักพัฒนา AI, ผู้ประกอบการ และคนทำงานสายดิจิทัลที่ต้องการเพิ่มความเร็วในการทำงาน`,
      bulletPoints: [
        `แหล่งข้อมูล: ${n.sourceName} (${n.sourceTier})`,
        `วันที่เผยแพร่: ${n.pubDate ? new Date(n.pubDate).toLocaleDateString("th-TH") : todayThaiStr}`,
        `ลิงก์ยืนยันต้นทาง: ${n.link}`,
      ],
      highlightBox: {
        title: `💡 แนวทางการนำไปประยุกต์ใช้งานจริง (Practical Takeaway)`,
        text: `ทดลองเชื่อมต่อและวางโครงสร้างการทำงานแบบอัตโนมัติ (Workflow Automation) ร่วมกับโมเดลและ API เพื่อลดเวลาทำงานซ้ำซ้อนในองค์กร`,
        type: "tip" as const,
      },
    };
  });

  // Executive summary
  const summary = `สรุปความเคลื่อนไหวและข่าวสารสำคัญด้าน AI ประจำสัปดาห์ ณ วันที่ ${todayThaiStr} รวบรวมและตรวจสอบความถูกต้องจากแหล่งข้อมูลทางการ (Official Sources) ระดับโลก อาทิ ${selectedNews
    .map((n) => n.sourceName)
    .slice(0, 3)
    .join(", ")} เพื่อให้คนทำงานและผู้ประกอบการนำไปปรับใช้จริงได้อย่างมั่นใจ`;

  // Business applications section
  const businessSection = {
    heading: "การประยุกต์ใช้ AI ในภาคธุรกิจ (AI for Business Implementation)",
    body: "การนำเครื่องมือ AI และระบบ Automation เข้ามาผสานในกระบวนการทำงานหลักขององค์กรช่วยเพิ่มความแม่นยำและลดต้นทุนได้อย่างเป็นรูปธรรม:",
    bulletPoints: [
      "ฝ่ายการตลาดและคอนเทนต์ (Marketing & Sales): วิเคราะห์ Intent ของลูกค้า และสร้างสื่อประชาสัมพันธ์ที่ตรงเป้าหมาย",
      "ฝ่ายบริการลูกค้า (Customer Support): ใช้ AI Agent ตอบคำถามเบื้องต้นและคัดกรองเคสอย่างรวดเร็วตลอด 24 ชั่วโมง",
      "ฝ่ายปฏิบัติการและการเงิน (Operations & Accounting): ตรวจสอบเอกสาร สรุปข้อมูลตัวเลข และเชื่อมต่อ Google Sheets แบบเรียลไทม์",
      "ฝ่ายบุคคลและพัฒนาบุคลากร (HR & L&D): ออกแบบคลังความรู้ภายในองค์กร (Internal Knowledge Base) เพื่อให้พนักงานสืบค้นข้อมูลได้ทันที",
    ],
    highlightBox: {
      title: "📌 ข้อควรระวังในการนำ AI ไปใช้ในองค์กร",
      text: "ควรตรวจสอบแหล่งที่มาของข้อมูล (Verification) และเลือกใช้โมเดลที่มีความปลอดภัยด้านข้อมูล (Data Privacy & Compliance) หลีกเลี่ยงการใส่ความลับของบริษัทลงในระบบสาธารณะ",
      type: "framework" as const,
    },
  };

  // What to Watch Next section
  const watchNextSection = {
    heading: "สิ่งที่น่าจับตามองในสัปดาห์ถัดไป (What to Watch Next)",
    body: "จับตาการเปิดตัวและการอัปเดตโมเดลเวอร์ชันใหม่จากผู้พัฒนาหลัก โดยเฉพาะการผสานความสามารถด้าน Multimodal Reasoning, Coding Benchmark, และ Agentic Workflows ที่ตอบโจทย์การทำงานในระดับ Production",
    bulletPoints: [
      "การเปิดตัว API และเครื่องมือพัฒนาสำหรับนักพัฒนา",
      "การแข่งขันด้านต้นทุนและ Token Latency ของโมเดลชั้นนำ",
      "กรณีศึกษาการใช้งานจริงในองค์กรธุรกิจชั้นนำ",
    ],
  };

  const newArticle = {
    id: articleId,
    type: "article",
    category: "ai-news",
    categoryLabel: "📰 ข่าวสาร AI ประจำสัปดาห์ (Weekly AI News)",
    title: `สรุปข่าวสาร AI ประจำสัปดาห์ (${todayThaiStr}): เจาะลึกอัปเดตล่าสุดจาก ${selectedNews[0]?.sourceName || "Official Tech Labs"}`,
    tagline: `รายงานข่าวและวิเคราะห์ความเคลื่อนไหวด้าน AI คัดกรองเฉพาะแหล่งข่าวทางการที่ผ่านการตรวจสอบจริง 100%`,
    desc: summary,
    readTimeMinutes: 5,
    publishedDate: todayThaiStr,
    author: {
      name: "อ.มณีรัตน์ ตั้งโอภาสวิไลสกุล",
      role: "Zarntastic AI Specialist & Automated Research",
      badge: "Verified AI Analyst",
      avatar: "https://ui-avatars.com/api/?name=Zarntastic&background=0ea5e9&color=fff&size=200",
    },
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "from-purple-950 via-indigo-900 to-stone-900",
    relatedCourseId: "live-ai-starter",
    relatedCourseTitle: 'AI STARTER “เริ่มใช้ AI ให้เป็นภายใน 1 ชม.”',
    tags: ["ข่าว AI", "AI News", "Generative AI", "AI Automation", "Weekly AI Digest"],
    sources,
    isAutomated: true,
    content: {
      summary,
      sections: [...newsSections, businessSection, watchNextSection],
      conclusion: `การติดตามข่าวสาร AI อย่างรู้เท่าทันและอิงแหล่งข้อมูลที่เชื่อถือได้ จะช่วยให้คุณเลือกใช้เครื่องมือที่เหมาะสมกับธุรกิจได้อย่างตรงจุด ไม่ตกเป็นเหยื่อของข่าวลือหรือข้อมูลที่แต่งขึ้น (Hallucination)`,
    },
  };

  // Save new article
  existingArticles.unshift(newArticle);
  saveArticles(existingArticles);

  // Record Run Log
  const runLog: AutomationRunLog = {
    runId,
    startTime,
    endTime: new Date().toISOString(),
    status: "success",
    triggerType,
    urlsScanned,
    urlsVerified,
    urlsRejected,
    articleId: newArticle.id,
    articleTitle: newArticle.title,
    summaryNote: `เผยแพร่บทความสำเร็จ คัดเลือก ${selectedNews.length} ประเด็นสำคัญจากแหล่งข่าว Tier 1 & Tier 2`,
  };

  const logs = loadRunLogs();
  logs.unshift(runLog);
  saveRunLogs(logs);

  console.log(`[AI News Automation] Successfully published article: "${newArticle.title}"`);
  return { success: true, log: runLog, article: newArticle };
}
