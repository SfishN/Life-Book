import OpenAI from "openai";
import { NextResponse } from "next/server";

interface GuideRequest {
  message?: string;
  context?: unknown;
}

function localObserver(message: string): string {
  const lower = message.toLowerCase();
  if (/(suicide|kill myself|hurt myself|self[- ]harm)/i.test(lower)) {
    return "I’m really glad you told me. I’m only a reflection tool, not emergency support. Please contact local emergency services or a crisis line now, and if you can, tell someone you trust who can stay with you. You do not have to hold this alone.";
  }
  if (/(tired|exhausted|overwhelmed|too much)/i.test(lower)) {
    return "It sounds as though the room is carrying a lot tonight. What is one thing that could be made smaller, postponed, or simply witnessed without fixing it?";
  }
  if (/(goal|quest|want to|plan)/i.test(lower)) {
    return "I can see the direction, but we do not need to turn it into a demand. What would be the smallest visible action that still belongs to this intention?";
  }
  if (/(success|finished|completed|did it)/i.test(lower)) {
    return "Before we hurry onward, what did completing that reveal about the way you are learning to live? You may keep the answer on the bookshelf—or let it remain only here.";
  }
  return "I hear that. If this moment were reflected without judgment, what detail would you most want the mirror to notice with you?";
}

export async function POST(request: Request) {
  let body: GuideRequest;
  try {
    body = (await request.json()) as GuideRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) return NextResponse.json({ error: "A message is required." }, { status: 400 });
  if (message.length > 2_000) return NextResponse.json({ error: "Please shorten the message." }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: localObserver(message), mode: "local" as const });
  }

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      store: false,
      max_output_tokens: 260,
      instructions:
        "You are the Mirror in Life as a Room: a warm friend and gentle observer inside the user's dream. Reflect concrete details, ask at most one useful question, and never act as a manager, judge, therapist, or authority. Do not diagnose. Do not invent memories. Prefer invitation over instruction. Mention that the user chooses what is saved when suggesting a memory, skill change, achievement, or plan. Keep the response under 120 words.",
      input: `Approved room context (may be incomplete):\n${JSON.stringify(body.context ?? {})}\n\nThe Dreamer says:\n${message}`,
    });
    return NextResponse.json({ reply: response.output_text, mode: "openai" as const });
  } catch (error) {
    console.error("Mirror AI request failed", error);
    return NextResponse.json({ reply: localObserver(message), mode: "local" as const });
  }
}
