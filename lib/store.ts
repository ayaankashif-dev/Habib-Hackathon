import { EventEmitter } from "events";
import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "./supabaseAdmin";
import type { AnalysisResult, Case, CaseStatus, InputType } from "./types";

// Supabase is the source of truth (durable, inspectable, survives restarts).
// The EventEmitter is purely an in-process fan-out so an open SSE connection
// on this server instance gets pushed the instant a decision lands, without
// polling. See supabase/migrations/0001_cases.sql for the schema.
declare global {
  var __scamwatchEmitter: EventEmitter | undefined;
}

const emitter: EventEmitter = globalThis.__scamwatchEmitter ?? new EventEmitter();
emitter.setMaxListeners(0);
globalThis.__scamwatchEmitter = emitter;

export class StoreNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase isn't set up yet. Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local, " +
        "then run supabase/migrations/0001_cases.sql once in the Supabase SQL editor.",
    );
    this.name = "StoreNotConfiguredError";
  }
}

// PGRST205 (PostgREST) / 42P01 (Postgres) both mean "relation does not
// exist" — i.e. the one-time migration hasn't been run yet. Surfaced as the
// same setup error as a missing client, rather than a generic 500.
function throwIfMissingTable(error: PostgrestError): never {
  if (error.code === "PGRST205" || error.code === "42P01") {
    throw new StoreNotConfiguredError();
  }
  throw new Error(error.message);
}

interface CaseRow {
  id: string;
  created_at: string;
  input_type: InputType;
  analysis: AnalysisResult;
  guardian_evidence_summary: string;
  status: CaseStatus;
  guardian_decision: "STOP" | "SAFE" | null;
  guardian_responded_at: string | null;
}

function rowToCase(row: CaseRow): Case {
  return {
    id: row.id,
    createdAt: row.created_at,
    inputType: row.input_type,
    rawInputRef: "not-stored",
    analysis: row.analysis,
    guardianEvidenceSummary: row.guardian_evidence_summary,
    status: row.status,
    guardianDecision: row.guardian_decision ?? undefined,
    guardianRespondedAt: row.guardian_responded_at ?? undefined,
  };
}

export interface NewCaseInput {
  inputType: InputType;
  analysis: AnalysisResult;
  guardianEvidenceSummary: string;
}

export async function createCase(input: NewCaseInput): Promise<Case> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new StoreNotConfiguredError();

  const { data, error } = await supabase
    .from("cases")
    .insert({
      input_type: input.inputType,
      analysis: input.analysis,
      guardian_evidence_summary: input.guardianEvidenceSummary,
      status: "awaiting_guardian",
    })
    .select()
    .single();

  if (error) throwIfMissingTable(error);
  if (!data) throw new Error("Failed to create case");
  return rowToCase(data as CaseRow);
}

export async function getCase(id: string): Promise<Case | undefined> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new StoreNotConfiguredError();

  const { data, error } = await supabase.from("cases").select().eq("id", id).maybeSingle();
  if (error) throwIfMissingTable(error);
  return data ? rowToCase(data as CaseRow) : undefined;
}

export interface CaseUpdate {
  status: CaseStatus;
  guardianDecision?: "STOP" | "SAFE";
  guardianRespondedAt?: string;
}

export async function updateCase(id: string, patch: CaseUpdate): Promise<Case | undefined> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new StoreNotConfiguredError();

  const { data, error } = await supabase
    .from("cases")
    .update({
      status: patch.status,
      guardian_decision: patch.guardianDecision,
      guardian_responded_at: patch.guardianRespondedAt,
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throwIfMissingTable(error);
  if (!data) return undefined;

  const updated = rowToCase(data as CaseRow);
  emitter.emit(id, updated);
  return updated;
}

export function subscribe(id: string, listener: (c: Case) => void) {
  emitter.on(id, listener);
  return () => emitter.off(id, listener);
}
