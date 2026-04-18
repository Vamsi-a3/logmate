import { NextResponse } from "next/server";
import { processChatLogEntry } from "@/lib/chat-llm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = String(body.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    const response = await processChatLogEntry(text);
    return NextResponse.json({ response });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
