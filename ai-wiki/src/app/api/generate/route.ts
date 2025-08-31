import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";

export const runtime = "edge";
export const preferredRegion = ["iad1", "sfo1", "fra1"]; // optional hint

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { topic, prompt } = (await req.json()) as {
      topic?: string;
      prompt?: string;
    };
    const subject = (topic ?? prompt ?? "").trim();
    if (!subject) {
      return NextResponse.json(
        { error: "Missing topic" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Server missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    const result = await streamText({
      model: groq("openai/gpt-oss-20b"),
      system: [
        "You are an encyclopedic writer for a fully AI-generated web.",
        "Always infer the canonical subject from the user's prompt.",
        "Do NOT put audience or style modifiers into the title.",
        "The H1 title (# Title) must be ONLY the canonical subject (e.g., 'Hogwarts').",
        "The prose can adapt to audience/style instructions (e.g., 'explained to a five year old').",
      ].join(" "),
      prompt: `Create a Markdown article about "${subject}".

Rules:
- Start with a single H1 heading that is ONLY the canonical subject (no modifiers).
- Follow with a short lead paragraph (2–4 sentences).
- Include 3–6 sections with H2 (##) headings and concise paragraphs.
- Keep a neutral, factual tone unless the user asked for a specific style.
- If the user asked for a specific audience/style (e.g., "explained to a five year old"), adapt the writing accordingly—but never change the H1 title.
- Add up to 5 internal cross-links using Markdown links like [Related Topic](Related Topic) to canonical topics (no URLs) when appropriate.
- Do not include external links, footnotes, or references.
- Keep it under 900 words.
`,
    });

    // Use the helper on the result for the correct streaming response.
    return result.toTextStreamResponse();
  } catch (err) {
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}

