import type { AnalysisResult, Lang, RiskLevel, RiskSignal, SignalType } from "./types";

// Keyword banks covering English, Urdu script, and Roman Urdu — this is a
// hackathon heuristic layer, not an exhaustive scam-language corpus.
const PATTERNS: Record<SignalType, RegExp[]> = {
  money_request: [
    /\brs\.?\s?\d/i,
    /\brupees?\b/i,
    /\bpkr\b/i,
    /\d{3,}\s?(hazar|hazaar|thousand|lakh|lac)/i,
    /\bsend (me )?money\b/i,
    /\bbhej do\b/i,
    /\bbhejo\b/i,
    /\btransfer\b/i,
    /\beasypaisa\b/i,
    /\bjazzcash\b/i,
    /\baccount number\b/i,
    /\bpaisay?\b/i,
    /پیسے/,
    /روپے/,
    /بھیج/,
  ],
  urgency: [
    /\burgent(ly)?\b/i,
    /\bright now\b/i,
    /\bimmediately\b/i,
    /\bjaldi\b/i,
    /\babhi\b/i,
    /\bforan\b/i,
    /\bhurry\b/i,
    /\btoday only\b/i,
    /\blast chance\b/i,
    /\bexpires? (today|soon)\b/i,
    /جلدی/,
    /ابھی/,
    /فوراً/,
  ],
  secrecy: [
    /\bdon'?t tell\b/i,
    /\bkisi ko mat batana\b/i,
    /\bkisi ko na batana\b/i,
    /\bkisi ko batana mat\b/i,
    /\bkisi ko batao mat\b/i,
    /\bbetween us\b/i,
    /\bkeep it secret\b/i,
    /\braaz\b/i,
    /کسی کو نہ بتانا/,
    /راز/,
  ],
  impersonation: [
    /\bmain\s+\w+\s+bol raha hoon\b/i,
    /\bthis is your (bank|son|daughter|boss)\b/i,
    /\bphone kharab\b/i,
    /\bnaya number\b/i,
    /\bnew number\b/i,
    /\bcalling from (bank|hr|head office)\b/i,
    /\bofficial (whatsapp|number)\b/i,
    /بول رہا ہوں/,
  ],
  link: [
    /https?:\/\/\S+/i,
    /\bwww\.\S+/i,
    /\bbit\.ly\/\S+/i,
    /\bclick (this|the) link\b/i,
    /\bapk\b/i,
    /\binstall (this|the) app\b/i,
  ],
  credential_request: [
    /\botp\b/i,
    /\bcnic\b/i,
    /\bpassword\b/i,
    /\bpin code\b/i,
    /\bverification code\b/i,
    /\bcard number\b/i,
    /\bcvv\b/i,
    /شناختی کارڈ/,
    /پاسورڈ/,
  ],
};

const STOP_COMBOS: SignalType[][] = [
  ["money_request", "urgency"],
  ["money_request", "secrecy"],
  ["credential_request", "urgency"],
  ["impersonation", "money_request"],
  ["link", "credential_request"],
];

function detectSignals(text: string): RiskSignal[] {
  return (Object.keys(PATTERNS) as SignalType[]).map((type) => ({
    type,
    present: PATTERNS[type].some((re) => re.test(text)),
  }));
}

function ruleBasedLevel(signals: RiskSignal[]): RiskLevel {
  const present = new Set(signals.filter((s) => s.present).map((s) => s.type));
  const count = present.size;

  const hasStopCombo = STOP_COMBOS.some((combo) => combo.every((t) => present.has(t)));
  if (hasStopCombo) return "STOP";
  if (count >= 3) return "STOP";
  if (count >= 1) return "CHECK";
  return "SAFE";
}

const REASON_TEMPLATES: Record<Lang, Partial<Record<SignalType, string>>> = {
  en: {
    money_request: "This message is asking you to send money.",
    urgency: "It is pushing you to act right now, without time to think.",
    secrecy: "It is telling you to keep this a secret from others.",
    impersonation: "It may be pretending to be someone you trust.",
    link: "It contains a link or app you weren't expecting.",
    credential_request: "It is asking for a password, OTP, or ID number.",
  },
  ur: {
    money_request: "یہ پیغام آپ سے پیسے مانگ رہا ہے۔",
    urgency: "یہ آپ کو سوچنے کا وقت دیے بغیر ابھی کام کرنے پر مجبور کر رہا ہے۔",
    secrecy: "یہ آپ سے کہہ رہا ہے کہ کسی کو مت بتائیں۔",
    impersonation: "شاید یہ کسی اور کے نام پر بات کر رہا ہے۔",
    link: "اس میں ایک غیر متوقع لنک یا ایپ ہے۔",
    credential_request: "یہ پاسورڈ، او ٹی پی، یا شناختی نمبر مانگ رہا ہے۔",
  },
  "roman-ur": {
    money_request: "Yeh message aapse paise maang raha hai.",
    urgency: "Yeh aapko sochne ka waqt diye bagair abhi kaam karne par majboor kar raha hai.",
    secrecy: "Yeh aapse keh raha hai kisi ko na batayen.",
    impersonation: "Shayad yeh kisi aur ke naam par baat kar raha hai.",
    link: "Ismein ek ghair mutawaqqa link ya app hai.",
    credential_request: "Yeh password, OTP, ya ID number maang raha hai.",
  },
};

const ACTION_TEMPLATES: Record<Lang, Record<RiskLevel, string>> = {
  en: {
    SAFE: "No urgent action needed, but stay alert.",
    CHECK: "Don't act yet. Ask your trusted person first.",
    STOP: "Don't send money or share any codes. Ask your trusted person now.",
  },
  ur: {
    SAFE: "فوری کارروائی کی ضرورت نہیں، پھر بھی چوکنا رہیں۔",
    CHECK: "ابھی کچھ نہ کریں۔ پہلے اپنے قابلِ اعتماد شخص سے پوچھیں۔",
    STOP: "پیسے نہ بھیجیں اور کوئی کوڈ نہ بتائیں۔ ابھی اپنے قابلِ اعتماد شخص سے پوچھیں۔",
  },
  "roman-ur": {
    SAFE: "Foran kuch karne ki zaroorat nahi, phir bhi chaukanna rahein.",
    CHECK: "Abhi kuch na karein. Pehle apne trusted person se poochein.",
    STOP: "Paise na bhejein aur koi code na batayen. Abhi apne trusted person se poochein.",
  },
};

function buildReason(signals: RiskSignal[], level: RiskLevel, lang: Lang): string {
  const present = signals.filter((s) => s.present).map((s) => s.type);
  if (present.length === 0) {
    return lang === "ur"
      ? "اس پیغام میں کوئی واضح خطرے کی علامت نہیں ملی۔"
      : lang === "roman-ur"
        ? "Is message mein koi wazeh khatre ki nishani nahi mili."
        : "We didn't find a clear danger sign in this message.";
  }
  const templates = REASON_TEMPLATES[lang];
  const bullets = present.slice(0, 3).map((t) => templates[t]).filter(Boolean);
  return bullets.join(" ");
}

export interface RiskEngineOptions {
  lang: Lang;
  timeoutMs?: number;
}

/**
 * Rule-based pre-screen. Always runs synchronously and is the guaranteed
 * fallback if any AI refinement step fails or times out.
 */
export function ruleBasedAnalyze(text: string, lang: Lang): AnalysisResult {
  const signals = detectSignals(text);
  const riskLevel = ruleBasedLevel(signals);
  return {
    riskLevel,
    signals,
    plainLanguageReason: buildReason(signals, riskLevel, lang),
    recommendedAction: ACTION_TEMPLATES[lang][riskLevel],
    language: lang,
    source: "rules",
  };
}

interface AiRefinement {
  riskLevel?: RiskLevel;
  plainLanguageReason?: string;
  recommendedAction?: string;
}

function extractJson(raw: string): AiRefinement | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!["SAFE", "CHECK", "STOP"].includes(parsed.riskLevel)) return null;
    return parsed as AiRefinement;
  } catch {
    return null;
  }
}

function buildPrompt(text: string, lang: Lang): { system: string; user: string } {
  const langName = lang === "ur" ? "Urdu script" : lang === "roman-ur" ? "Roman Urdu" : "English";
  return {
    system:
      "You classify possible scam/deepfake-adjacent messages for a low-literacy safety app. " +
      "Reply with ONLY compact JSON: " +
      '{"riskLevel":"SAFE"|"CHECK"|"STOP","plainLanguageReason":"1-2 short sentences","recommendedAction":"1 short sentence"}. ' +
      `Write the two text fields in ${langName}, at a simple reading level, with no percentages or technical jargon. ` +
      "Bias toward CHECK or STOP when unsure — never mark something SAFE unless it is clearly benign.",
    user: text.slice(0, 4000),
  };
}

// Gemini's free tier (aistudio.google.com/apikey, no credit card required) is
// the primary semantic pass. thinkingBudget:0 skips extended "thinking" so
// the JSON answer comes back directly instead of being truncated by it.
const GEMINI_MODEL = "gemini-flash-latest";

async function callGemini(text: string, lang: Lang, timeoutMs: number): Promise<AiRefinement | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { system, user } = buildPrompt(text, lang);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\nMessage:\n${user}` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 },
            maxOutputTokens: 500,
          },
        }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return extractJson(raw);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Groq's free tier (console.groq.com, no credit card required) is the
// fallback if Gemini is unset/unreachable/rate-limited. reasoning_effort
// "low" keeps the model's internal reasoning short so it doesn't eat the
// whole token budget before emitting the actual JSON answer.
const GROQ_CHAT_MODEL = "openai/gpt-oss-120b";

async function callGroq(text: string, lang: Lang, timeoutMs: number): Promise<AiRefinement | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { system, user } = buildPrompt(text, lang);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_CHAT_MODEL,
        max_tokens: 500,
        reasoning_effort: "low",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    return extractJson(raw);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Gemini first, Groq as fallback. Both are free-tier; no paid API is used.
 * `timeoutMs` is an OVERALL budget for the whole refinement step (not per
 * provider) — PRD §10 targets <3s for text, and Gemini-then-Groq chained at
 * their own full timeouts each could otherwise stack past that under a slow
 * network. Whichever provider is still running when the budget expires is
 * simply ignored; the caller falls back to the (already-computed, instant)
 * rule-based result rather than waiting further.
 */
async function callAiRefinement(text: string, lang: Lang, timeoutMs: number): Promise<AiRefinement | null> {
  const perProviderTimeout = Math.max(800, Math.floor(timeoutMs / 2));
  const attempt = (async () => {
    const gemini = await callGemini(text, lang, perProviderTimeout);
    if (gemini) return gemini;
    return callGroq(text, lang, perProviderTimeout);
  })();

  const budget = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([attempt, budget]);
}

const RISK_RANK: Record<RiskLevel, number> = { SAFE: 0, CHECK: 1, STOP: 2 };

/**
 * Full pipeline: rule-based pre-screen, then optional LLM semantic pass
 * (Gemini, falling back to Groq). The LLM can only raise risk or refine
 * wording — a rule-confirmed STOP never gets softened by a model call, and
 * any AI failure silently falls back to the rule-based result (never fails
 * open to SAFE).
 */
export async function analyze(text: string, opts: RiskEngineOptions): Promise<AnalysisResult> {
  const lang = opts.lang;
  const base = ruleBasedAnalyze(text, lang);

  const refinement = await callAiRefinement(text, lang, opts.timeoutMs ?? 2600);
  if (!refinement) {
    return base;
  }

  const mergedLevel: RiskLevel =
    refinement.riskLevel && RISK_RANK[refinement.riskLevel] > RISK_RANK[base.riskLevel]
      ? refinement.riskLevel
      : base.riskLevel;

  return {
    ...base,
    riskLevel: mergedLevel,
    plainLanguageReason: refinement.plainLanguageReason ?? base.plainLanguageReason,
    recommendedAction: refinement.recommendedAction ?? ACTION_TEMPLATES[lang][mergedLevel],
    source: "rules+ai",
  };
}

export function buildGuardianSummary(analysis: AnalysisResult, lang: Lang, _rawInput?: string): string {
  const present = analysis.signals.filter((s) => s.present).map((s) => s.type);
  const parts: string[] = [];
  if (present.includes("money_request")) {
    parts.push(
      lang === "ur" ? "پیسے مانگے گئے ہیں" : lang === "roman-ur" ? "paise maange gaye hain" : "money was requested",
    );
  }
  if (present.includes("urgency")) {
    parts.push(lang === "ur" ? "جلدی کا دباؤ ڈالا گیا ہے" : lang === "roman-ur" ? "jaldi ka dabao dala gaya hai" : "urgency was used");
  }
  if (present.includes("impersonation")) {
    parts.push(
      lang === "ur" ? "کسی اور کے نام پر بات کی گئی ہے" : lang === "roman-ur" ? "kisi aur ke naam par baat ki gayi hai" : "someone may be impersonated",
    );
  }
  if (present.includes("credential_request")) {
    parts.push(
      lang === "ur" ? "پاسورڈ یا او ٹی پی مانگا گیا ہے" : lang === "roman-ur" ? "password ya OTP maanga gaya hai" : "a password/OTP was requested",
    );
  }
  if (present.includes("link")) {
    parts.push(
      lang === "ur" ? "مشکوک لنک شامل ہے" : lang === "roman-ur" ? "mashkook link shamil hai" : "a suspicious link was found",
    );
  }
  const joined = parts.length
    ? parts.join(lang === "ur" ? "، " : ", ")
    : lang === "ur"
      ? "کچھ غیر معمولی یا مشکوک عناصر ملے ہیں"
      : lang === "roman-ur"
        ? "kuch ghair mamooli ya mashkook cheezein mili hain"
        : "something suspicious was flagged";

  if (lang === "ur") return `اس پیغام میں ${joined}۔ براہ کرم تصدیق کریں کہ کیا کرنا چاہیے۔`;
  if (lang === "roman-ur") return `Is message mein ${joined}. Baraye meharbani check karke faisla dein.`;
  return `In this message, ${joined}. Please review and verify.`;
}
