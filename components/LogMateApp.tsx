"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { startOfMonth } from "date-fns";
import type { View, LogEntry, AppUser } from "@/types";
import { TopNav } from "@/components/TopNav";
import { LoginView } from "@/components/LoginView";
import { DashboardView } from "@/components/DashboardView";
import { WritingView } from "@/components/WritingView";
import { RecallSelectView } from "@/components/RecallSelectView";
import { ArchiveListView } from "@/components/ArchiveListView";
import { RecallView } from "@/components/RecallView";
import { ArchiveMonthsView } from "@/components/ArchiveMonthsView";
import { FrequencySelectView } from "@/components/FrequencySelectView";
import { ScreenBackBar } from "@/components/ScreenBackBar";

const PARENT_VIEW: Partial<Record<View, View>> = {
  dashboard: "login",
  frequency_select: "dashboard",
  writing: "frequency_select",
  recall_select: "dashboard",
  recall: "recall_select",
  archive_months: "recall_select",
  archive_list: "archive_months",
};

type WritingConfig = {
  type: "daily" | "weekly";
  date?: Date;
  range?: { start: Date; end: Date };
};

export function LogMateApp() {
  const [view, setView] = useState<View>("login");
  const [user, setUser] = useState<AppUser | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const [writingConfig, setWritingConfig] = useState<WritingConfig>({
    type: "daily",
    date: new Date(),
  });

  // Load logs from API when user is set
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`/api/logs?userId=${user.id}`);
        if (res.ok) {
          const data = (await res.json()) as { logs?: LogEntry[] };
          if (Array.isArray(data.logs)) {
            setLogs(data.logs);
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, [user]);

  // Restore session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("logmate_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser) as AppUser;
      if (parsed.id && parsed.username) {
        setUser(parsed);
        setView("dashboard");
      }
    }
  }, []);

  const handleLogin = (appUser: AppUser) => {
    setUser(appUser);
    localStorage.setItem("logmate_user", JSON.stringify(appUser));
    setView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setLogs([]);
    localStorage.removeItem("logmate_user");
    setView("login");
  };

  const handleBack = () => {
    const prev = PARENT_VIEW[view];
    if (!prev) return;
    if (prev === "login") {
      handleLogout();
      return;
    }
    setView(prev);
  };

  const persistLog = async (content: string) => {
    if (!user) return;
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      timestamp: new Date().toISOString(),
      type: writingConfig.type,
      selectedDate: writingConfig.date?.toISOString(),
      dateRange: writingConfig.range
        ? {
            start: writingConfig.range.start.toISOString(),
            end: writingConfig.range.end.toISOString(),
          }
        : undefined,
    };

    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newLog, userId: user.id }),
      });
      const data = await res.json();

      if (data.split) {
        // Weekly log was split into daily entries — refetch from DB
        const logsRes = await fetch(`/api/logs?userId=${user.id}`);
        if (logsRes.ok) {
          const logsData = (await logsRes.json()) as { logs?: LogEntry[] };
          if (Array.isArray(logsData.logs)) {
            setLogs(logsData.logs);
          }
        }
      } else {
        setLogs((prev) => [newLog, ...prev]);
      }
    } catch (e) {
      console.error(e);
      // Still add locally as fallback
      setLogs((prev) => [newLog, ...prev]);
    }
  };

  const renderView = () => {
    switch (view) {
      case "dashboard":
        return <DashboardView setView={setView} />;
      case "writing":
        return <WritingView onSaveLog={persistLog} dateInfo={writingConfig} />;
      case "recall_select":
        return <RecallSelectView setView={setView} />;
      case "recall":
        return <RecallView userId={user?.id ?? 0} />;
      case "archive_months":
        return (
          <ArchiveMonthsView
            onSelectMonth={(m) => {
              setSelectedMonth(m);
              setView("archive_list");
            }}
          />
        );
      case "archive_list":
        return <ArchiveListView logs={logs} month={selectedMonth} />;
      case "frequency_select":
        return (
          <FrequencySelectView
            onSelect={(config) => {
              setWritingConfig(config);
              setView("writing");
            }}
          />
        );
      default:
        return <DashboardView setView={setView} />;
    }
  };

  if (view === "login") {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <TopNav
        setView={setView}
        onLogout={handleLogout}
        userName={user?.username ?? "Guest"}
      />

      {view !== "dashboard" && <ScreenBackBar onBack={handleBack} />}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
