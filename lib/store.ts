import { EventEmitter } from "events";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseClient";
import type { AnalysisResult, Case, CaseStatus, InputType } from "./types";

// Firebase Firestore is the source of truth (durable, cloud-hosted, survives restarts).
// The EventEmitter is an in-process fan-out so an open SSE connection
// gets pushed the instant a decision lands without polling.
declare global {
  var __scamwatchEmitter: EventEmitter | undefined;
}

const emitter: EventEmitter = globalThis.__scamwatchEmitter ?? new EventEmitter();
emitter.setMaxListeners(0);
globalThis.__scamwatchEmitter = emitter;

export class StoreNotConfiguredError extends Error {
  constructor() {
    super(
      "Firebase is not configured. Please ensure Firebase credentials are set in .env.local",
    );
    this.name = "StoreNotConfiguredError";
  }
}

export interface NewCaseInput {
  inputType: InputType;
  analysis: AnalysisResult;
  guardianEvidenceSummary: string;
}

export async function createCase(input: NewCaseInput): Promise<Case> {
  if (!db) throw new StoreNotConfiguredError();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const caseData: Case = {
    id,
    createdAt: now,
    inputType: input.inputType,
    rawInputRef: "not-stored",
    analysis: input.analysis,
    guardianEvidenceSummary: input.guardianEvidenceSummary,
    status: "awaiting_guardian",
  };

  const caseRef = doc(db, "cases", id);
  await setDoc(caseRef, caseData);

  return caseData;
}

export async function getCase(id: string): Promise<Case | undefined> {
  if (!db) throw new StoreNotConfiguredError();

  const caseRef = doc(db, "cases", id);
  const snap = await getDoc(caseRef);

  if (!snap.exists()) {
    return undefined;
  }

  return snap.data() as Case;
}

export interface CaseUpdate {
  status: CaseStatus;
  guardianDecision?: "STOP" | "SAFE";
  guardianRespondedAt?: string;
}

export async function updateCase(id: string, patch: CaseUpdate): Promise<Case | undefined> {
  if (!db) throw new StoreNotConfiguredError();

  const caseRef = doc(db, "cases", id);
  const snap = await getDoc(caseRef);

  if (!snap.exists()) {
    return undefined;
  }

  const existing = snap.data() as Case;
  const updated: Case = {
    ...existing,
    status: patch.status,
    guardianDecision: patch.guardianDecision ?? existing.guardianDecision,
    guardianRespondedAt: patch.guardianRespondedAt ?? existing.guardianRespondedAt,
  };

  const updateFields: Record<string, unknown> = {
    status: patch.status,
  };
  if (patch.guardianDecision !== undefined) {
    updateFields.guardianDecision = patch.guardianDecision;
  }
  if (patch.guardianRespondedAt !== undefined) {
    updateFields.guardianRespondedAt = patch.guardianRespondedAt;
  }

  await updateDoc(caseRef, updateFields);

  emitter.emit(id, updated);
  return updated;
}

export function subscribe(id: string, listener: (c: Case) => void) {
  emitter.on(id, listener);
  return () => emitter.off(id, listener);
}
