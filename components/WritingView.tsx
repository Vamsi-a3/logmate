"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Mic, Send, Square, Save, FileText } from "lucide-react";
import { format } from "date-fns";
import { startSarvamVoiceCapture } from "@/lib/sarvam-voice-capture";

type DateInfo = {
  type: "daily" | "weekly";
  date?: Date;
  range?: { start: Date; end: Date };
};

type ChatMsg =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      saved: boolean;
    };

type WritingViewProps = {
  onSaveLog: (content: string) => void | Promise<void>;
  dateInfo: DateInfo;
};

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

export function WritingView({ onSaveLog, dateInfo }: WritingViewProps) {
  const [composer, setComposer] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const voiceSessionRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, chatLoading]);

  /** Stops the mic and flushes the last chunk; Sarvam may still return transcript moments later. */
  const stopRecording = useCallback(async () => {
    const session = voiceSessionRef.current;
    voiceSessionRef.current = null;
    setIsRecording(false);
    if (session) {
      await session.stop();
    }
  }, []);

  /** Full teardown on unmount */
  const disconnectVoice = useCallback(async () => {
    const session = voiceSessionRef.current;
    voiceSessionRef.current = null;
    setIsRecording(false);
    if (session) {
      await session.stop();
    }
  }, []);

  const startListening = useCallback(async () => {
    if (voiceSessionRef.current) return;
    setVoiceError(null);
    try {
      const session = await startSarvamVoiceCapture({
        onTranscript: (text) => {
          setComposer((prev) => (prev.trim() ? `${prev} ${text}` : text));
        },
        onError: (msg) => setVoiceError(msg),
      });
      voiceSessionRef.current = session;
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      setVoiceError(
        e instanceof Error
          ? e.message
          : "Could not start voice capture. Check microphone permission and SARVAM_API_KEY on the server."
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      void disconnectVoice();
    };
  }, [disconnectVoice]);

  // Send to AI for polishing, then show draft to edit & save
  const sendToLlm = async () => {
    if (isRecording) return;
    const text = composer.trim();
    if (!text || chatLoading) return;
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: text },
    ]);
    setComposer("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { response?: string; error?: string };
      const responseText =
        data.response ||
        (data.error ? "Could not get a response." : "Empty response.");
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: responseText,
          saved: false,
        },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "Network error. Please try again.",
          saved: false,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Save raw text directly without AI polishing
  const saveDirectly = async () => {
    const text = composer.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      await onSaveLog(text);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", content: text },
        { id: uid(), role: "assistant", content: "Saved to archive.", saved: true },
      ]);
      setComposer("");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const updateAssistantContent = (id: string, value: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id && m.role === "assistant" ? { ...m, content: value } : m
      )
    );
  };

  const saveAssistantDraft = async (id: string) => {
    const msg = messages.find((m) => m.id === id && m.role === "assistant") as
      | (ChatMsg & { role: "assistant" })
      | undefined;
    if (!msg || msg.saved) return;
    setSaving(true);
    try {
      await onSaveLog(msg.content);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id && m.role === "assistant" ? { ...m, saved: true } : m
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const dateLabel =
    dateInfo.type === "daily"
      ? format(dateInfo.date!, "EEEE, MMMM dd, yyyy")
      : `${format(dateInfo.range!.start, "MMM dd")} — ${format(
          dateInfo.range!.end,
          "MMM dd, yyyy"
        )}`;

  const composerHasText = composer.trim().length > 0;
  const sendDisabled = isRecording || !composerHasText || chatLoading;

  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto relative flex flex-col min-h-0">
      <div className="px-8 pt-6 pb-2 text-center shrink-0">
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant border border-outline-variant/30 px-3 py-1.5 rounded-full">
          {dateLabel}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4 min-h-0"
      >
        {messages.length === 0 && !chatLoading && (
          <div className="flex flex-col items-center justify-center py-16 opacity-40 select-none text-center">
            <p className="text-[0.85rem] text-on-surface-variant uppercase tracking-widest max-w-sm">
              Use voice or type your journal entry. Send to AI for polishing, or
              save directly to your archive.
            </p>
          </div>
        )}

        {voiceError && (
          <p className="text-center text-[0.75rem] text-red-700 max-w-lg mx-auto">
            {voiceError}
          </p>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-end max-w-[85%] md:max-w-[70%] rounded-md px-5 py-4 bg-primary text-white text-[0.9rem] leading-relaxed"
            >
              {m.content}
            </motion.div>
          ) : m.saved ? (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start w-full max-w-[90%] md:max-w-[75%] rounded-md border border-green-300 bg-green-50 p-5 flex flex-col gap-2"
            >
              <span className="text-[0.6rem] uppercase tracking-[0.2em] font-bold text-green-700">
                Saved to archive
              </span>
              <p className="text-[0.9rem] text-primary leading-relaxed">
                {m.content}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start w-full max-w-[90%] md:max-w-[75%] rounded-md border border-outline-variant/30 bg-white p-5 flex flex-col gap-3"
            >
              <span className="text-[0.6rem] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
                AI Draft — edit if needed, then save
              </span>
              <textarea
                value={m.content}
                onChange={(e) => updateAssistantContent(m.id, e.target.value)}
                className="w-full min-h-[120px] text-[0.9rem] text-primary leading-relaxed bg-transparent border border-outline-variant/20 rounded-md p-3 resize-y focus:outline-none focus:border-primary/40"
                spellCheck
              />
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => void saveAssistantDraft(m.id)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-white text-[0.7rem] font-bold uppercase tracking-[0.15em] hover:bg-neutral-800 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Save size={14} strokeWidth={2} />
                  {saving ? "Saving..." : "Save to archive"}
                </button>
              </div>
            </motion.div>
          )
        )}

        {chatLoading && (
          <div className="self-start text-[0.75rem] text-on-surface-variant uppercase tracking-widest animate-pulse">
            AI is polishing your entry…
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-outline-variant/10 px-8 pb-10 pt-6 bg-gradient-to-t from-surface via-surface to-transparent">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
          <div className="flex justify-center gap-3 flex-wrap">
            {isRecording ? (
              <button
                type="button"
                onClick={() => void stopRecording()}
                className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-[0.75rem] uppercase tracking-[0.2em] bg-red-600 text-white shadow-xl hover:bg-red-700 transition-all animate-pulse"
              >
                <Square size={14} fill="currentColor" />
                Stop Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startListening()}
                className="flex items-center gap-2 px-8 py-3 rounded-full font-bold text-[0.75rem] uppercase tracking-[0.2em] bg-white border border-primary text-primary hover:bg-surface-container-low transition-all"
              >
                <Mic size={18} />
                Start listening
              </button>
            )}
          </div>

          <div className="w-full bg-white border border-primary rounded-md p-3 flex items-end gap-3 focus-within:ring-2 focus-within:ring-primary/5">
            <textarea
              value={composer}
              onChange={(e) => setComposer(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none resize-none py-3 text-[0.9rem] text-primary placeholder:text-outline-variant focus:ring-0 leading-relaxed min-h-[52px]"
              placeholder={
                isRecording
                  ? "Listening… transcript appears here."
                  : "Type your journal entry, or use voice..."
              }
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!sendDisabled) void sendToLlm();
                }
              }}
              disabled={chatLoading}
            />
            <div className="flex flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void saveDirectly()}
                disabled={!composerHasText || isRecording || saving}
                className="p-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Save directly"
                title="Save as-is to archive"
              >
                <FileText size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => void sendToLlm()}
                disabled={sendDisabled}
                className="p-3 bg-primary text-white rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Send to AI"
                title="Send to AI for polishing"
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between px-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60">
            <span>
              {isRecording
                ? "Recording... stop when done"
                : "Enter → AI polish · Green button → save directly"}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
