import { NextRequest, NextResponse } from "next/server";
import { getCase, StoreNotConfiguredError } from "@/lib/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  try {
    const c = await getCase(caseId);
    if (!c) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json(c);
  } catch (err) {
    if (err instanceof StoreNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to load case" }, { status: 500 });
  }
}
