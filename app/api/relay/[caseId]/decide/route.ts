import { NextRequest, NextResponse } from "next/server";
import { getCase, StoreNotConfiguredError, updateCase } from "@/lib/store";

export async function POST(req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  let body: { decision?: "STOP" | "SAFE" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.decision !== "STOP" && body.decision !== "SAFE") {
    return NextResponse.json({ error: "decision must be STOP or SAFE" }, { status: 400 });
  }

  try {
    const existing = await getCase(caseId);
    if (!existing) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    if (existing.status === "resolved_safe" || existing.status === "resolved_stop") {
      return NextResponse.json({ error: "Case already resolved" }, { status: 409 });
    }

    const updated = await updateCase(caseId, {
      guardianDecision: body.decision,
      guardianRespondedAt: new Date().toISOString(),
      status: body.decision === "STOP" ? "resolved_stop" : "resolved_safe",
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof StoreNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to record decision" }, { status: 500 });
  }
}
