"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Search, Copy, History, Calendar } from "lucide-react";
import { format, subMonths, subDays, startOfMonth, endOfMonth } from "date-fns";
import type { RecallResult } from "@/types";

type RecallViewProps = {
  userId: number;
};

type TimeOption = { label: string; key: string; days?: number; months?: number };

const TIME_OPTIONS: TimeOption[] = [
  { label: "7 Days", key: "7d", days: 7 },
  { label: "14 Days", key: "14d", days: 14 },
  { label: "1 Month", key: "1m", months: 1 },
  { label: "3 Months", key: "3m", months: 3 },
  { label: "6 Months", key: "6m", months: 6 },
];

export function RecallView({ userId }: RecallViewProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecallResult | null>(null);
  const [selectedTime, setSelectedTime] = useState("7d");

  const handleGenerate = async () => {
    if (!query.trim()) return;
    setLoading(true);

    const now = new Date();
    const option = TIME_OPTIONS.find((t) => t.key === selectedTime) ?? TIME_OPTIONS[0];
    const endDate = endOfMonth(now).toISOString();
    const startDate = option.days
      ? subDays(now, option.days).toISOString()
      : startOfMonth(subMonths(now, option.months!)).toISOString();

    try {
      const res = await fetch("/api/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          userId,
          startDate,
          endDate,
        }),
      });
      const data = (await res.json()) as RecallResult;
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({
        query,
        synthesis: "Request failed. Please try again.",
        relevantEntries: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto flex h-full overflow-hidden">
      <section className="flex-1 p-10 overflow-y-auto flex flex-col gap-10 w-full">
        <div>
          <h1 className="text-[2.25rem] font-bold tracking-[-0.06em] text-primary">
            Recall Assistant
          </h1>
          <p className="text-[0.8rem] font-medium text-on-surface-variant mt-2 uppercase tracking-widest opacity-70">
            Synthesizing insights based on your curated archive.
          </p>
        </div>

        {/* Date range selector */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-on-surface-variant" />
            <span className="text-[0.65rem] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
              Recall period:
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedTime(t.key)}
                className={`px-4 py-2 rounded-md text-[0.7rem] font-bold uppercase tracking-[0.1em] transition-all ${
                  selectedTime === t.key
                    ? "bg-primary text-white"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-secondary-container"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 border border-primary rounded-md bg-white flex flex-col overflow-hidden"
          >
            <div className="p-8 border-b border-outline-variant/20 bg-surface-container-low/30 flex justify-between items-start">
              <div className="max-w-[70%]">
                <h2 className="text-[0.65rem] uppercase tracking-[0.15em] font-bold text-on-surface-variant mb-3">
                  Synthesized Response
                </h2>
                <p className="text-primary font-bold text-lg leading-tight tracking-[-0.02em]">
                  {result.query}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(result.synthesis)}
                className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-md text-primary font-bold text-[0.7rem] uppercase tracking-widest hover:bg-surface-container-low transition-all active:scale-95"
              >
                <Copy size={14} />
                Copy
              </button>
            </div>

            <div className="p-10 flex-1 overflow-y-auto">
              <div className="max-w-none text-on-surface-variant space-y-8 text-[0.95rem] leading-relaxed">
                <p className="first-letter:text-4xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:text-primary">
                  {result.synthesis}
                </p>

                {result.achievements && result.achievements.length > 0 && (
                  <div className="space-y-6 mt-10">
                    <h3 className="text-primary font-bold text-[0.75rem] uppercase tracking-[0.2em] border-b border-outline-variant/30 pb-4">
                      Key Achievements:
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {result.achievements.map((a, i) => (
                        <div
                          key={i}
                          className="border border-outline-variant/20 rounded-md p-6 bg-surface-container-low/10"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-3 py-1 bg-secondary-container text-primary text-[0.6rem] uppercase tracking-widest rounded-md font-bold">
                              {a.title}
                            </span>
                            <span className="text-[0.65rem] text-on-surface-variant uppercase tracking-widest">
                              {a.period}
                            </span>
                          </div>
                          <p className="text-[0.85rem] leading-relaxed text-on-surface-variant">
                            {a.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="mt-12 opacity-50 italic text-[0.7rem] uppercase tracking-widest">
                  Note: Insights derived from {result.relevantEntries.length}{" "}
                  archive entries.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 border border-outline-variant/20 rounded-md bg-white/50 flex flex-col items-center justify-center text-center p-20">
            <Search size={48} strokeWidth={0.5} className="text-outline-variant mb-6" />
            <h3 className="text-[0.8rem] font-bold text-primary uppercase tracking-[0.2em] mb-3">
              Awaiting Query
            </h3>
            <p className="text-[0.8rem] text-on-surface-variant max-w-sm uppercase tracking-widest leading-loose">
              Paste your performance review question or inquiry. I will search your
              archive to construct a detailed synthesis.
            </p>
          </div>
        )}

        <div className="shrink-0 pt-6">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-32 border border-primary rounded-md bg-white p-5 text-[0.9rem] text-primary placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-low transition-all resize-none leading-relaxed"
              placeholder="What were your major achievements in Q3 regarding cross-functional collaboration?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
            <div className="absolute bottom-5 right-5">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !query.trim()}
                className="px-8 py-3 bg-primary text-white font-bold text-[0.75rem] uppercase tracking-[0.15em] rounded-md hover:bg-neutral-800 transition-all disabled:opacity-30 active:scale-95 shadow-lg shadow-primary/10"
              >
                {loading ? "Synthesizing..." : "Generate Recall"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 px-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
            <span>Shift + Enter to submit</span>
            <div className="flex items-center gap-2">
              <History size={12} />
              <span>Querying {TIME_OPTIONS.find(t => t.key === selectedTime)?.label} of logs</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
