"use client";

import { ArrowLeft } from "lucide-react";

type ScreenBackBarProps = {
  onBack: () => void;
  label?: string;
};

export function ScreenBackBar({ onBack, label = "Back" }: ScreenBackBarProps) {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 pt-4 pb-2 flex-shrink-0 border-b border-outline-variant/10">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-on-surface-variant hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={2} aria-hidden />
        {label}
      </button>
    </div>
  );
}
