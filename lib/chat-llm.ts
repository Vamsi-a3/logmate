/** Polishes / expands user log text for archival use via Mistral AI. */
export async function processChatLogEntry(userText: string): Promise<string> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) {
    return (
      "[Configure MISTRAL_API_KEY] Draft based on your note: " +
      userText.slice(0, 500)
    );
  }

  const prompt = `You are LogMate's archival writing assistant. The user is capturing a personal log entry (may be from speech or typing).
Rewrite into a clear, concise paragraph suitable for long-term memory archive. Preserve meaning and tone. Output plain text only, no markdown or quotes.

User note:
${userText}`;

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
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Mistral chat error:", err);
      return "The assistant could not process this entry. Please try again.";
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || "Could not generate a response. Please try again.";
  } catch (e) {
    console.error("chat-llm failed:", e);
    return "The assistant could not process this entry. Please try again.";
  }
}
