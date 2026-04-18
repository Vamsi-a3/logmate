import { NextResponse } from "next/server";
import { synthesizeRecall } from "@/lib/recall-ai";
import { getLogsByDateRange, readLogsFromStore } from "@/lib/log-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = String(body.query ?? "");
    const userId = Number(body.userId);
    const startDate = body.startDate as string | undefined;
    const endDate = body.endDate as string | undefined;

    if (!query.trim()) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    let logs;
    if (startDate && endDate) {
      logs = await getLogsByDateRange(userId, startDate, endDate);
    } else {
      logs = await readLogsFromStore(userId);
    }

    const result = await synthesizeRecall(query, logs);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to synthesize recall" },
      { status: 500 }
    );
  }
}
