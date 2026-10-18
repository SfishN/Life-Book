import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, maxRetries: 0, timeout: 12_000 });
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL || "gpt-5.4-mini";
}

export function parseJsonText<T>(text: string): T | null {
  const cleaned = text.trim()
    .replace(/^\x60{3}json\s*/i, "")
    .replace(/^\x60{3}\s*/i, "")
    .replace(/\s*\x60{3}$/, "");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const starts = [cleaned.indexOf("{"), cleaned.indexOf("[")].filter((index) => index >= 0);
    if (!starts.length) return null;
    const start = Math.min(...starts);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}
