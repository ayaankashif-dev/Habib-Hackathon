import type { AnalysisResult, InputType } from "./types";

export interface PendingAnalysis {
  text: string;
  inputType: InputType;
  analysis: AnalysisResult;
  repeatedPattern?: boolean;
}

const KEY = "scamwatch:pendingAnalysis";

export function savePendingAnalysis(p: PendingAnalysis) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function loadPendingAnalysis(): PendingAnalysis | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingAnalysis) : null;
  } catch {
    return null;
  }
}

export function clearPendingAnalysis() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
