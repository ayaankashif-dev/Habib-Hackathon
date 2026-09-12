import { NextRequest, NextResponse } from "next/server";
import { createCase, StoreNotConfiguredError } from "@/lib/store";
import { buildGuardianSummary } from "@/lib/riskEngine";
import type { AnalysisResult, InputType, Lang } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: {
    analysis?: AnalysisResult;
    inputType?: InputType;
    lang?: Lang;
    messageText?: string;
    rawInputRef?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const analysis = body.analysis;
  if (!analysis) {
    return NextResponse.json({ error: "Missing 'analysis'" }, { status: 400 });
  }

  const lang: Lang = body.lang ?? analysis.language ?? "roman-ur";
  const rawInput = body.rawInputRef ?? body.messageText ?? "";

  try {
    const newCase = await createCase({
      inputType: body.inputType ?? "text",
      rawInputRef: rawInput,
      analysis,
      guardianEvidenceSummary: buildGuardianSummary(analysis, lang, rawInput),
    });
    const query = rawInput ? `?msg=${encodeURIComponent(rawInput)}` : "";
    return NextResponse.json({
      caseId: newCase.id,
      guardianUrl: `/guardian/${newCase.id}${query}`,
    });
  } catch (err) {
    if (err instanceof StoreNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
  }
}
