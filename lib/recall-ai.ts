import type { LogEntry, RecallResult } from "@/types";

export async function synthesizeRecall(
  query: string,
  entries: LogEntry[]
): Promise<RecallResult> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    return {
      query,
      synthesis: "Set MISTRAL_API_KEY in .env.local to enable recall synthesis.",
      relevantEntries: [],
    };
  }

  const context = entries
    .map((e) => `[${e.timestamp}] ${e.content}`)
    .join("\n---\n");

  const prompt = `You are an editorial assistant for "LogMate".
Based on the following user log entries, answer the query: "${query}"

Logs:
${context}

Synthesize a concise, high-end editorial response.
Include a "Key Achievements" section with structured achievements if applicable.
Return your response as a JSON object with this schema:
{
  "synthesis": string,
  "relevantEntriesIndices": number[],
  "achievements": { "title": string, "period": string, "description": string }[]
}
Return ONLY the JSON object, no markdown fences or extra text.`;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Mistral recall error:", err);
      throw new Error("Mistral API error");
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty model response");

    const result = JSON.parse(text) as {
      synthesis: string;
      relevantEntriesIndices: number[];
      achievements?: RecallResult["achievements"];
    };

    return {
      query,
      synthesis: result.synthesis,
      relevantEntries: (result.relevantEntriesIndices ?? [])
        .map((idx: number) => entries[idx])
        .filter(Boolean),
      achievements: result.achievements,
    };
  } catch (error) {
    console.error("AI Synthesis failed:", error);
    return {
      query,
      synthesis:
        "I encountered an error while synthesizing your logs. Please try again.",
      relevantEntries: [],
    };
  }
}
