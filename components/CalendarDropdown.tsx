"use client";

import { useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ArrowLeft, ArrowRight as ArrowForward } from "lucide-react";

type CalendarDropdownProps = {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  mode?: "single" | "range";
};

export function CalendarDropdown({
  selectedDate,
  onSelect,
  mode = "single",
}: CalendarDropdownProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  const monthStart = startOfMonth(currentMonth);
  const startDay = getDay(monthStart);

  const days = eachDayOfInterval({
    start: monthStart,
    end: endOfMonth(currentMonth),
  });

  const rangeEnd = addDays(selectedDate, 6);

  return (
    <div className="bg-white border border-outline-variant/30 rounded-md p-8 w-full max-w-[400px] mx-auto transition-all animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentMonth(subMonths(currentMonth, 1));
          }}
          className="p-2 hover:bg-surface-container-low rounded-md transition-colors border border-outline-variant/10"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-[0.8rem] font-bold uppercase tracking-[0.2em] text-primary">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentMonth(addMonths(currentMonth, 1));
          }}
          className="p-2 hover:bg-surface-container-low rounded-md transition-colors border border-outline-variant/10"
        >
          <ArrowForward size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center mb-4">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="text-[0.65rem] font-bold opacity-30 tracking-widest"
          >
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`spacer-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const isSelected =
            mode === "single"
              ? isSameDay(day, selectedDate)
              : isWithinInterval(day, { start: selectedDate, end: rangeEnd });

          return (
            <button
              key={day.getTime()}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(day);
              }}
              className={`aspect-square text-[0.75rem] rounded-md transition-all flex items-center justify-center font-bold border ${
                isSelected
                  ? "bg-primary text-white border-primary shadow-xl shadow-primary/20"
                  : "hover:border-primary border-transparent text-primary"
              }`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
      <div className="mt-10 pt-6 border-t border-outline-variant/20 flex flex-col gap-4">
        <div className="flex flex-col gap-1 items-center">
          <span className="text-[0.6rem] uppercase tracking-[0.3em] font-bold text-on-surface-variant opacity-50">
            Active temporal window
          </span>
          <span className="text-primary font-bold text-[0.9rem] tracking-tight">
            {mode === "single"
              ? format(selectedDate, "MMMM dd, yyyy")
              : `${format(selectedDate, "MMM dd")} - ${format(
                  rangeEnd,
                  "MMMM dd, yyyy"
                )}`}
          </span>
        </div>
      </div>
    </div>
  );
}
