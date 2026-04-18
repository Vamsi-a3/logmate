import pool from "./db";
import { ensureSchema } from "./init-db";
import type { LogEntry } from "@/types";

export async function readLogsFromStore(userId: number): Promise<LogEntry[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT id, content, timestamp, type, selected_date AS "selectedDate",
            date_range_start AS "dateRangeStart", date_range_end AS "dateRangeEnd", tags
     FROM logs WHERE user_id = $1 ORDER BY timestamp DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    timestamp: r.timestamp,
    type: r.type,
    selectedDate: r.selectedDate ?? undefined,
    dateRange:
      r.dateRangeStart && r.dateRangeEnd
        ? { start: r.dateRangeStart, end: r.dateRangeEnd }
        : undefined,
    tags: r.tags ?? undefined,
  }));
}

export async function appendLogToStore(
  entry: LogEntry,
  userId: number
): Promise<void> {
  await ensureSchema();
  await pool.query(
    `INSERT INTO logs (id, user_id, content, timestamp, type, selected_date, date_range_start, date_range_end, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO NOTHING`,
    [
      entry.id,
      userId,
      entry.content,
      entry.timestamp,
      entry.type,
      entry.selectedDate ?? null,
      entry.dateRange?.start ?? null,
      entry.dateRange?.end ?? null,
      entry.tags ?? null,
    ]
  );
}

export async function getLogsByDateRange(
  userId: number,
  start: string,
  end: string
): Promise<LogEntry[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    `SELECT id, content, timestamp, type, selected_date AS "selectedDate",
            date_range_start AS "dateRangeStart", date_range_end AS "dateRangeEnd", tags
     FROM logs
     WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
     ORDER BY timestamp DESC`,
    [userId, start, end]
  );
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    timestamp: r.timestamp,
    type: r.type,
    selectedDate: r.selectedDate ?? undefined,
    dateRange:
      r.dateRangeStart && r.dateRangeEnd
        ? { start: r.dateRangeStart, end: r.dateRangeEnd }
        : undefined,
    tags: r.tags ?? undefined,
  }));
}
