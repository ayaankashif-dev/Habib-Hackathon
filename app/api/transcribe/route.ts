import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Groq's free tier (console.groq.com, no credit card required) hosts
// whisper-large-v3-turbo behind an OpenAI-compatible /audio/transcriptions
// endpoint. When no key is configured, the client falls back to live
// in-browser transcription via the Web Speech API, so voice notes still
// work end-to-end without any API key at all.
const GROQ_WHISPER_MODEL = "whisper-large-v3-turbo";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server transcription not configured. Use in-browser voice capture instead." },
      { status: 501 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'audio' file" }, { status: 400 });
  }

  try {
    const upstream = new FormData();
    upstream.append("file", file, file.name || "audio.webm");
    upstream.append("model", GROQ_WHISPER_MODEL);

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ text: (data.text ?? "").trim() });
  } catch {
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
}
