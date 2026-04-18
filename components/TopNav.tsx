"use client";

import { User as UserIcon } from "lucide-react";
import type { View } from "@/types";

type TopNavProps = {
  setView: (v: View) => void;
  onLogout: () => void;
  userName: string;
};

export function TopNav({ setView, onLogout, userName }: TopNavProps) {
  return (
    <nav className="bg-surface h-[64px] w-full border-b border-outline-variant/30 sticky top-0 z-50">
      <div className="flex justify-between items-center px-8 w-full max-w-[1200px] mx-auto h-full">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setView("dashboard")}
            className="text-[1.5rem] font-bold tracking-[-0.04em] text-primary uppercase"
          >
            LogMate
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 pr-6 border-r border-outline-variant/30">
            <UserIcon size={16} strokeWidth={2} className="text-on-surface-variant" />
            <span className="text-[0.7rem] uppercase tracking-[0.1em] font-bold text-primary">
              {userName}
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="text-on-surface-variant hover:text-primary transition-colors text-[0.7rem] uppercase tracking-[0.1em] font-bold"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
