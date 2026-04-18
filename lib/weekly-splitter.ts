import { format, addDays } from "date-fns";

export interface DailyEntry {
  date: string; // ISO date string
  content: string;
}

export async function splitWeeklyLog(
  text: string,
  startDate: Date,
  endDate: Date
): Promise<DailyEntry[]> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    // Fallback: assign entire text to the first day
    return [{ date: startDate.toISOString(), content: text }];
  }

  const dateLabels = [];
  let d = new Date(startDate);
  while (d <= endDate) {
    dateLabels.push(format(d, "yyyy-MM-dd (EEEE)"));
    d = addDays(d, 1);
  }

  const prompt = `You are a work-log organizer. A user submitted a weekly work summary covering ${format(startDate, "yyyy-MM-dd")} to ${format(endDate, "yyyy-MM-dd")}.

Split this into individual daily entries for each of these dates:
${dateLabels.join(", ")}

If the user didn't mention work for a specific day, write "No activities logged for this day." for that day.

Weekly summary:
${text}

Return ONLY a JSON array with objects in this format:
[{ "date": "YYYY-MM-DD", "content": "..." }, ...]
One entry per day, in chronological order. No markdown fences.`;

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
      console.error("Mistral weekly-split error:", await res.text());
      return [{ date: startDate.toISOString(), content: text }];
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return [{ date: startDate.toISOString(), content: text }];

    const parsed = JSON.parse(raw);
    // Handle both { entries: [...] } and [...] formats
    const entries: { date: string; content: string }[] = Array.isArray(parsed)
      ? parsed
      : parsed.entries ?? parsed.days ?? [parsed];

    return entries.map((e) => ({
      date: new Date(e.date).toISOString(),
      content: e.content,
    }));
  } catch (e) {
    console.error("Weekly split failed:", e);
    return [{ date: startDate.toISOString(), content: text }];
  }
}
