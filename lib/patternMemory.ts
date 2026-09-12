import type { RiskLevel } from "./types";

// PRD §9.2: "Basic scam-pattern memory (localStorage) — recognize a
// repeated pattern in-session." Deliberately lightweight: a bag-of-words
// Jaccard similarity against risky (non-SAFE) messages seen before on this
// device, capped to a small rolling window. This is a supplementary notice
// only — it never changes the actual risk verdict, which stays fully
// explained by the engine's own signals/reason for this specific message.
const STORAGE_KEY = "saathi:seenRiskyPatterns";
const MAX_ENTRIES = 30;
const SIMILARITY_THRESHOLD = 0.6;

interface SeenPattern {
  words: string[];
  seenAt: string;
}

function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function loadPatterns(): SeenPattern[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SeenPattern[]) : [];
  } catch {
    return [];
  }
}

/**
 * Checks whether this message closely resembles a previously-seen risky
 * message on this device, then records it (if risky) for future checks.
 * Returns false for SAFE messages — only risky patterns are worth flagging
 * as "you've seen this before".
 */
export function checkAndRecordPattern(text: string, riskLevel: RiskLevel): boolean {
  if (typeof window === "undefined" || riskLevel === "SAFE") return false;

  try {
    const patterns = loadPatterns();
    const words = normalize(text);
    if (words.length === 0) return false;

    const isRepeat = patterns.some((p) => jaccard(words, p.words) >= SIMILARITY_THRESHOLD);

    const updated = [...patterns, { words, seenAt: new Date().toISOString() }].slice(-MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return isRepeat;
  } catch {
    return false;
  }
}
