import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/lib/riskEngine";
import type { Lang } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: { text?: string; lang?: Lang };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const lang: Lang = body.lang ?? "roman-ur";

  if (!text) {
    return NextResponse.json({ error: "Missing 'text' field" }, { status: 400 });
  }

  try {
    const result = await analyze(text, { lang });
    return NextResponse.json(result);
  } catch {
    // Guardrail: never fail silently to SAFE. Default to CHECK.
    return NextResponse.json({
      riskLevel: "CHECK",
      signals: [],
      plainLanguageReason:
        lang === "ur"
          ? "پوری طرح جانچ نہیں ہو سکی۔"
          : lang === "roman-ur"
            ? "Poori tarah jaanch nahi ho saki."
            : "Couldn't fully analyze this message.",
      recommendedAction:
        lang === "ur"
          ? "براہ کرم اپنے قابلِ اعتماد شخص سے پوچھیں۔"
          : lang === "roman-ur"
            ? "Apne trusted person se poochein."
            : "Please ask your trusted person.",
      language: lang,
      source: "rules",
    });
  }
}
