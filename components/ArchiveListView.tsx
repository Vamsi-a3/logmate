"use client";

import { Archive } from "lucide-react";
import { format, isSameMonth, isSameYear } from "date-fns";
import type { LogEntry } from "@/types";

type ArchiveListViewProps = {
  logs: LogEntry[];
  month: Date;
};

export function ArchiveListView({ logs, month }: ArchiveListViewProps) {
  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    return isSameMonth(logDate, month) && isSameYear(logDate, month);
  });

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto flex flex-col h-full overflow-hidden p-10 pt-16">
      <header className="mb-12">
        <h1 className="text-[2.5rem] font-bold tracking-[-0.08em] text-primary leading-none mb-4">
          {format(month, "MMMM yyyy")}
        </h1>
        <p className="text-[0.7rem] uppercase tracking-[0.3em] font-bold text-on-surface-variant">
          Archived Logs ({filteredLogs.length})
        </p>
      </header>

      <div className="flex-1 overflow-y-auto pr-4 space-y-6 hide-scrollbar pb-24">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-8 bg-white border border-outline-variant/30 rounded-md hover:border-primary transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="text-[0.7rem] uppercase tracking-widest font-bold text-primary">
                  {format(new Date(log.timestamp), "EEEE, MMM dd")}
                </span>
                <span className="px-3 py-1 bg-secondary-container text-primary text-[0.6rem] uppercase tracking-widest rounded-full font-bold">
                  {log.type}
                </span>
              </div>
              <p className="text-[0.95rem] text-on-surface-variant leading-relaxed italic whitespace-pre-wrap">
                &quot;{log.content}&quot;
              </p>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-24">
            <Archive size={64} strokeWidth={0.5} className="mb-6 mx-auto" />
            <p className="text-[0.8rem] uppercase tracking-widest font-bold">
              No entries recorded for this period.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
