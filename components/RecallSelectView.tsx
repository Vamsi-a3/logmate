"use client";

import { motion } from "motion/react";
import { Archive, MessageSquare } from "lucide-react";
import type { View } from "@/types";

type RecallSelectViewProps = {
  setView: (v: View) => void;
};

export function RecallSelectView({ setView }: RecallSelectViewProps) {
  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto px-8 py-24 flex flex-col items-center justify-center">
      <div className="w-full flex flex-col md:flex-row gap-8 lg:gap-16 justify-center items-stretch min-h-[460px]">
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setView("archive_months")}
          className="group relative flex-1 flex flex-col items-center justify-center p-12 bg-white border border-outline-variant/30 hover:border-primary rounded-md transition-all duration-300 text-center hover:bg-surface-container-low"
        >
          <div className="relative z-10 flex flex-col items-center gap-8">
            <Archive
              size={80}
              strokeWidth={0.5}
              className="text-primary group-hover:-translate-y-2 transition-transform duration-500"
            />
            <div className="flex flex-col gap-3">
              <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-primary">
                VIEW ARCHIVE
              </h2>
              <p className="text-[0.8rem] text-on-surface-variant max-w-[220px] mx-auto opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 leading-relaxed">
                Browse your detailed logs by year and month.
              </p>
            </div>
          </div>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setView("recall")}
          className="group relative flex-1 flex flex-col items-center justify-center p-12 bg-white border border-outline-variant/30 hover:border-primary rounded-md transition-all duration-300 text-center hover:bg-surface-container-low"
        >
          <div className="relative z-10 flex flex-col items-center gap-8">
            <MessageSquare
              size={80}
              strokeWidth={0.5}
              className="text-primary group-hover:-translate-y-2 transition-transform duration-500"
            />
            <div className="flex flex-col gap-3">
              <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-primary">
                SUMMARIZE
              </h2>
              <p className="text-[0.8rem] text-on-surface-variant max-w-[220px] mx-auto opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 leading-relaxed">
                Interact with the RAG model to extract and summarize insights.
              </p>
            </div>
          </div>
        </motion.button>
      </div>
    </main>
  );
}
