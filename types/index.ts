export type View =
  | "login"
  | "dashboard"
  | "writing"
  | "recall"
  | "archive_months"
  | "archive_day"
  | "frequency_select"
  | "chat_setup"
  | "recall_select"
  | "archive_list";

export interface LogEntry {
  id: string;
  content: string;
  timestamp: string;
  type: "daily" | "weekly";
  selectedDate?: string;
  dateRange?: { start: string; end: string };
  tags?: string[];
}

export interface RecallResult {
  query: string;
  synthesis: string;
  relevantEntries: LogEntry[];
  achievements?: {
    title: string;
    period: string;
    description: string;
  }[];
}

export interface AppUser {
  id: number;
  username: string;
}
