import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";

export const runtime = "nodejs";
export const maxDuration = 30;

// ocr.space's free tier (ocr.space/ocrapi, no credit card required) is tried
// first when OCR_API_KEY is set — it's faster and doesn't need to download a
// trained-data model on first use. tesseract.js (fully local, no key) is the
// guaranteed fallback either way, so OCR always works even offline/keyless.
async function ocrSpaceRecognize(file: File): Promise<string | null> {
  const apiKey = process.env.OCR_API_KEY;
  if (!apiKey) return null;

  try {
    const upstream = new FormData();
    upstream.append("file", file, file.name || "image.png");
    upstream.append("apikey", apiKey);
    upstream.append("language", "eng");
    upstream.append("OCREngine", "2");
    upstream.append("scale", "true");
    upstream.append("detectOrientation", "true");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: upstream,
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.IsErroredOnProcessing) return null;

    const text = data?.ParsedResults?.[0]?.ParsedText;
    return typeof text === "string" ? text.trim() : null;
  } catch {
    return null;
  }
}

async function tesseractRecognize(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(buffer);
    return data.text.trim();
  } finally {
    await worker.terminate();
  }
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing 'image' file" }, { status: 400 });
  }

  const viaOcrSpace = await ocrSpaceRecognize(file);
  if (viaOcrSpace !== null && viaOcrSpace.length > 0) {
    return NextResponse.json({ text: viaOcrSpace, source: "ocrspace" });
  }

  try {
    const text = await tesseractRecognize(file);
    return NextResponse.json({ text, source: "tesseract" });
  } catch (err) {
    return NextResponse.json(
      { error: "OCR failed. Please type the message instead.", detail: String(err) },
      { status: 502 },
    );
  }
}
