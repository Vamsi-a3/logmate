import { NextRequest, NextResponse } from "next/server";
import { appendLogToStore, readLogsFromStore } from "@/lib/log-store";
import { splitWeeklyLog } from "@/lib/weekly-splitter";
import type { LogEntry } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const userId = Number(request.nextUrl.searchParams.get("userId"));
    if (!userId) {
      return NextResponse.json({ logs: [] });
    }
    const logs = await readLogsFromStore(userId);
    return NextResponse.json({ logs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ logs: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const entry = body as LogEntry & { userId?: number };

    if (!userId || !entry?.id || typeof entry.content !== "string") {
      return NextResponse.json(
        { error: "Invalid log entry or missing userId" },
        { status: 400 }
      );
    }

    if (entry.type === "weekly" && entry.dateRange) {
      // Split weekly log into daily entries via AI
      const dailyEntries = await splitWeeklyLog(
        entry.content,
        new Date(entry.dateRange.start),
        new Date(entry.dateRange.end)
      );

      for (const daily of dailyEntries) {
        const dailyLog: LogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          content: daily.content,
          timestamp: daily.date,
          type: "daily",
          selectedDate: daily.date,
        };
        await appendLogToStore(dailyLog, userId);
      }

      return NextResponse.json({
        ok: true,
        split: true,
        count: dailyEntries.length,
      });
    }

    // Daily log — insert as-is
    await appendLogToStore(entry, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save log" }, { status: 500 });
  }
}
