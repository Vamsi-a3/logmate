"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  eachMonthOfInterval,
  endOfYear,
  format,
  startOfYear,
} from "date-fns";

type ArchiveMonthsViewProps = {
  onSelectMonth: (d: Date) => void;
};

export function ArchiveMonthsView({ onSelectMonth }: ArchiveMonthsViewProps) {
  const years = [2023, 2024, 2025, 2026];
  const [selectedYear, setSelectedYear] = useState(2023);

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(selectedYear, 0)),
    end: endOfYear(new Date(selectedYear, 0)),
  });

  return (
    <main className="flex-grow w-full max-w-[1200px] mx-auto px-8 py-16 flex flex-col gap-12">
      <header className="flex flex-col gap-4">
        <h1 className="text-[2.25rem] font-bold tracking-[-0.06em] text-primary">
          Historical Archive
        </h1>
        <p className="text-[0.85rem] text-on-surface-variant max-w-2xl uppercase tracking-[0.1em] leading-loose opacity-70">
          Access past entries and chronological records. Select a year to filter the
          grid, then choose a month to view detailed logs.
        </p>
      </header>

      <section className="w-full overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex gap-4 min-w-max">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => setSelectedYear(year)}
              className={`text-[0.7rem] uppercase tracking-[0.2em] px-8 py-3.5 rounded-md font-bold transition-all active:scale-95 ${
                year === selectedYear
                  ? "bg-primary text-white"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-secondary-container"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {months.map((month) => (
          <motion.button
            key={month.getTime()}
            type="button"
            whileHover={{ y: -4 }}
            onClick={() => onSelectMonth(month)}
            className="bg-white border border-outline-variant/30 rounded-md aspect-[4/3] flex flex-col items-center justify-center gap-3 hover:border-primary transition-all group"
          >
            <span className="text-lg font-bold tracking-[-0.04em] text-primary group-hover:underline decoration-1 underline-offset-[10px]">
              {format(month, "MMMM")}
            </span>
            <span className="text-[0.6rem] text-on-surface-variant uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 font-bold transition-opacity">
              Entries Recorded
            </span>
          </motion.button>
        ))}
      </section>
    </main>
  );
}
