export type RiskLevel = "SAFE" | "CHECK" | "STOP";

export type Lang = "en" | "ur" | "roman-ur";

export type SignalType =
  | "money_request"
  | "urgency"
  | "secrecy"
  | "impersonation"
  | "link"
  | "credential_request";

export interface RiskSignal {
  type: SignalType;
  present: boolean;
}

export interface AnalysisResult {
  riskLevel: RiskLevel;
  signals: RiskSignal[];
  plainLanguageReason: string;
  recommendedAction: string;
  language: Lang;
  source: "rules" | "rules+ai";
}

export type InputType = "text" | "screenshot" | "voice";

export type CaseStatus =
  | "pending"
  | "awaiting_guardian"
  | "resolved_safe"
  | "resolved_stop";

export interface Case {
  id: string;
  createdAt: string;
  inputType: InputType;
  rawInputRef: string;
  analysis: AnalysisResult;
  guardianEvidenceSummary: string;
  status: CaseStatus;
  guardianDecision?: "STOP" | "SAFE";
  guardianRespondedAt?: string;
}

export interface DemoScenario {
  id: string;
  labelKey: string;
  text: string;
  inputType: InputType;
}
