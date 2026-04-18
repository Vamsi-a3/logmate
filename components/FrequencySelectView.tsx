"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Archive,
  ArrowRight as ArrowForward,
} from "lucide-react";
import { addDays, startOfToday } from "date-fns";
import { CalendarDropdown } from "@/components/CalendarDropdown";

type WritingConfig = {
  type: "daily" | "weekly";
  date?: Date;
  range?: { start: Date; end: Date };
};

type FrequencySelectViewProps = {
  onSelect: (config: WritingConfig) => void;
};

export function FrequencySelectView({ onSelect }: FrequencySelectViewProps) {
  const [mode, setMode] = useState<"daily" | "weekly" | null>(null);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const calendarSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mode) return;
    const t = window.setTimeout(() => {
      calendarSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [mode]);

  const selectMode = (next: "daily" | "weekly") => {
    setMode(next);
  };

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto px-8 py-20 flex flex-col bg-surface overflow-y-auto">
      <header className="mb-20">
        <h1 className="font-bold text-[3rem] leading-tight tracking-[-0.08em] text-primary mb-6">
          Archive Resolution
        </h1>
        <p className="text-[0.9rem] text-on-surface-variant max-w-2xl leading-relaxed uppercase tracking-[0.1em] opacity-70">
          Define the window for your next synthesis. Daily logs capture precision;
          Weekly logs archive broader cycles.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mb-20">
        <button
          type="button"
          onClick={() => selectMode("daily")}
          className={`group flex flex-col text-left bg-white border rounded-lg p-12 transition-all duration-500 ${
            mode === "daily"
              ? "border-primary ring-8 ring-primary/5"
              : "border-outline-variant/30 hover:border-primary opacity-60 hover:opacity-100"
          }`}
        >
          <div className="mb-12 flex items-start justify-between">
            <CalendarIcon
              size={48}
              strokeWidth={0.5}
              className={`${
                mode === "daily" ? "text-primary" : "text-on-surface-variant"
              } transition-colors`}
            />
            <span
              className={`text-[0.6rem] uppercase tracking-[0.25em] font-bold py-2 px-5 rounded-full border ${
                mode === "daily"
                  ? "border-primary text-primary"
                  : "border-outline-variant/30"
              }`}
            >
              Detailed
            </span>
          </div>
          <h2 className="font-bold text-5xl tracking-[-0.06em] text-primary mb-3">
            DAILY
          </h2>
          <p className="text-[0.75rem] text-on-surface-variant uppercase tracking-[0.2em] font-bold opacity-60">
            Chronological Accuracy
          </p>
        </button>

        <button
          type="button"
          onClick={() => selectMode("weekly")}
          className={`group flex flex-col text-left bg-white border rounded-lg p-12 transition-all duration-500 ${
            mode === "weekly"
              ? "border-primary ring-8 ring-primary/5"
              : "border-outline-variant/30 hover:border-primary opacity-60 hover:opacity-100"
          }`}
        >
          <div className="mb-12 flex items-start justify-between">
            <Archive
              size={48}
              strokeWidth={0.5}
              className={`${
                mode === "weekly" ? "text-primary" : "text-on-surface-variant"
              } transition-colors`}
            />
            <span
              className={`text-[0.6rem] uppercase tracking-[0.25em] font-bold py-2 px-5 rounded-full border ${
                mode === "weekly"
                  ? "border-primary text-primary"
                  : "border-outline-variant/30"
              }`}
            >
              Systemic
            </span>
          </div>
          <h2 className="font-bold text-5xl tracking-[-0.06em] text-primary mb-3">
            WEEKLY
          </h2>
          <p className="text-[0.75rem] text-on-surface-variant uppercase tracking-[0.2em] font-bold opacity-60">
            Theme Aggregation
          </p>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode && (
          <motion.section
            ref={calendarSectionRef}
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-12 pb-24 border-t border-outline-variant/10 pt-20 scroll-mt-24"
          >
            <div className="text-center max-w-xl">
              <h3 className="text-[0.7rem] uppercase tracking-[0.3em] font-bold text-primary mb-4">
                Set Target Window
              </h3>
              <p className="text-[0.85rem] text-on-surface-variant leading-relaxed opacity-60">
                {mode === "daily"
                  ? "Select the specific day you wish to record. Historical accuracy improves future recall."
                  : "Select the starting date for your 7-day aggregation period."}
              </p>
            </div>

            <div className="w-full flex flex-col md:flex-row items-center justify-center gap-16">
              <CalendarDropdown
                selectedDate={selectedDate}
                onSelect={(d) => setSelectedDate(d)}
                mode={mode === "daily" ? "single" : "range"}
              />

              <div className="flex flex-col gap-4 w-full max-w-[340px]">
                <button
                  type="button"
                  onClick={() =>
                    onSelect({
                      type: mode as "daily" | "weekly",
                      date: mode === "daily" ? selectedDate : undefined,
                      range:
                        mode === "weekly"
                          ? {
                              start: selectedDate,
                              end: addDays(selectedDate, 6),
                            }
                          : undefined,
                    })
                  }
                  className="w-full py-6 bg-primary text-white rounded-md font-bold text-[0.9rem] uppercase tracking-[0.3em] shadow-2xl hover:bg-neutral-800 transition-all active:scale-95 flex items-center justify-center gap-4 group"
                >
                  Initialize Log
                  <ArrowForward
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
                <div className="flex items-center gap-3 justify-center text-[0.6rem] text-on-surface-variant/40 uppercase tracking-[0.2em] font-bold">
                  <div className="w-4 h-[1px] bg-outline-variant" />
                  <span>Proceed to Archive Session</span>
                  <div className="w-4 h-[1px] bg-outline-variant" />
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
