"use client";

import { History, Pencil } from "lucide-react";
import { format } from "date-fns";
import type { View } from "@/types";

type ArchiveDayViewProps = {
  date: Date;
  setView: (v: View) => void;
};

export function ArchiveDayView({ date, setView }: ArchiveDayViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto flex h-full overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-surface-container-low/30 flex flex-col h-full border-r border-outline-variant/10">
        <div className="p-8 pb-4">
          <h2 className="text-[0.6rem] uppercase tracking-[0.25em] text-on-surface-variant font-bold opacity-60">
            Current Cycle
          </h2>
        </div>
        <nav className="flex-1 overflow-y-auto px-5 pb-8 space-y-1">
          {days.map((day) => (
            <button
              key={day}
              type="button"
              className={`w-full flex items-center justify-between px-5 py-4 rounded-md text-left transition-all group ${
                day === 3
                  ? "bg-white border border-outline-variant/30 text-primary shadow-sm ring-1 ring-primary/5"
                  : "hover:bg-surface-container-low/80 text-on-surface-variant"
              }`}
            >
              <div className="flex items-center gap-3">
                {day === 3 && (
                  <div className="w-1 h-4 bg-primary rounded-full" />
                )}
                <span
                  className={`text-[0.8rem] uppercase tracking-widest ${
                    day === 3 ? "font-bold" : "font-medium"
                  }`}
                >
                  Day {day}
                </span>
              </div>
              <span className="text-[0.6rem] uppercase tracking-widest opacity-40">
                (Oct {23 + day})
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="flex-1 flex flex-col overflow-y-auto bg-white relative">
        <div className="p-16 max-w-4xl w-full">
          <header className="mb-20 flex items-end justify-between">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.3em] font-bold text-on-surface-variant mb-4">
                {format(date, "MMMM yyyy")}
              </p>
              <h1 className="text-[2.5rem] font-bold tracking-[-0.08em] text-primary leading-none">
                Day 3 Summary
              </h1>
            </div>
            <div className="flex gap-3">
              <span className="px-4 py-1.5 bg-secondary-container text-primary text-[0.6rem] uppercase tracking-[0.2em] font-bold rounded-md">
                Logged
              </span>
              <button
                type="button"
                onClick={() => setView("recall")}
                className="px-4 py-1.5 bg-transparent text-on-surface-variant border border-outline-variant/30 text-[0.6rem] uppercase tracking-[0.2em] font-bold rounded-md hover:bg-surface-container-low transition-colors"
              >
                Review
              </button>
            </div>
          </header>

          <div className="grid grid-cols-3 gap-8 mb-16">
            <div className="col-span-1 bg-white border border-outline-variant/40 rounded-md p-8 flex flex-col justify-between h-40 group hover:border-primary transition-all">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-on-surface-variant opacity-60">
                Word Count
              </p>
              <p className="text-3xl font-bold text-primary group-hover:scale-105 transition-transform origin-left">
                0
              </p>
            </div>
            <div className="col-span-1 bg-white border border-outline-variant/40 rounded-md p-8 flex flex-col justify-between h-40 group hover:border-primary transition-all">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-on-surface-variant opacity-60">
                Time Spent
              </p>
              <p className="text-3xl font-bold text-primary group-hover:scale-105 transition-transform origin-left">
                --:--
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView("writing")}
              className="col-span-1 border border-outline-variant/20 bg-surface-container-low/30 rounded-md p-8 flex flex-col items-center justify-center h-40 group hover:bg-secondary-container/50 hover:border-primary transition-all"
            >
              <Pencil
                size={24}
                strokeWidth={1}
                className="text-primary mb-4 group-hover:-translate-y-1 transition-transform"
              />
              <p className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-primary">
                New Entry
              </p>
            </button>
          </div>

          <article className="w-full min-h-[400px] flex items-center justify-center border border-outline-variant/10 rounded-md bg-surface-container-low/10">
            <div className="text-center opacity-30">
              <History size={48} strokeWidth={0.5} className="mx-auto mb-6" />
              <p className="text-[0.8rem] uppercase tracking-widest font-bold">
                No entries recorded for this block.
              </p>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
