import { NextResponse } from "next/server";

const SARVAM_URL = "https://api.sarvam.ai/speech-to-text";

/** Match web_app.py hallucination filter */
function filterHallucination(transcript: string): boolean {
  const words = transcript
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\./g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return false;
  const yesCount = words.filter((w) => w === "yes").length;
  return yesCount / words.length >= 0.5;
}

export async function POST(request: Request) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "Transcription is not configured (missing SARVAM_API_KEY)." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json(
      { error: "Missing or empty audio file (field: file)." },
      { status: 400 }
    );
  }

  try {
    const outbound = new FormData();
    outbound.append("model", "saaras:v3");
    outbound.append("mode", "translate");
    outbound.append("file", file, "audio.wav");

    const res = await fetch(SARVAM_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: outbound,
    });

    const rawText = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        {
          error: "Transcription service returned an invalid response.",
          detail: rawText.slice(0, 200),
        },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const msg =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as { message?: string }).message === "string"
          ? (data as { message: string }).message
          : `Sarvam error (${res.status})`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const transcript =
      typeof data === "object" &&
      data !== null &&
      "transcript" in data &&
      typeof (data as { transcript?: string }).transcript === "string"
        ? (data as { transcript: string }).transcript.trim()
        : "";

    if (!transcript || filterHallucination(transcript)) {
      return NextResponse.json({ transcript: "" });
    }

    return NextResponse.json({ transcript });
  } catch (e) {
    console.error("Transcribe error:", e);
    return NextResponse.json(
      { error: "Transcription request failed." },
      { status: 502 }
    );
  }
}
