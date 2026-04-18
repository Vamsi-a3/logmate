import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const bridgeUrl =
    process.env.NEXT_PUBLIC_SARVAM_BRIDGE_URL ?? "http://127.0.0.1:8000";

  try {
    const body = await request.formData();
    const res = await fetch(`${bridgeUrl}/transcribe`, {
      method: "POST",
      body,
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Transcribe proxy error:", e);
    return NextResponse.json(
      { error: "Transcription service unavailable" },
      { status: 502 }
    );
  }
}
