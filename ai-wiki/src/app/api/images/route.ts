import { NextResponse } from "next/server";

export const runtime = "edge";
export const preferredRegion = ["iad1", "sfo1", "fra1"]; // optional hint

type ImageGenBody = {
  prompt?: string;
  count?: number; // defaults to 2
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash-image-preview:free";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Server missing OPENROUTER_API_KEY" },
        { status: 500 }
      );
    }

    const { prompt, count } = (await req.json()) as ImageGenBody;
    const basePrompt = (prompt ?? "").trim();
    const n = Math.min(Math.max(count ?? 1, 1), 2); // Limit to 1-2 for free tier

    if (!basePrompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    console.log(`[Images API] Generating ${n} image(s) for prompt: "${basePrompt.slice(0, 100)}..."`);

    async function requestOne(): Promise<string | null> {
      try {
        const referer = req.headers.get("referer") || "http://localhost:3000";
        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": referer,
            "X-Title": "Newt AI-Wiki",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              {
                role: "user",
                content: `Generate a high-quality image: ${basePrompt}`,
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        console.log(`[Images API] Response status: ${res.status}`);

        if (!res.ok) {
          const errorText = await res.text().catch(() => "Unknown error");
          console.error(`[Images API] Request failed: ${res.status} - ${errorText}`);
          return null;
        }

        const json = await res.json();
        console.log(`[Images API] Response structure:`, JSON.stringify(json, null, 2));

        // Handle the correct OpenRouter response structure
        const message = json?.choices?.[0]?.message;
        
        // Check for images in the message
        if (message?.images && Array.isArray(message.images)) {
          const imageUrl = message.images[0]?.image_url?.url;
          if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:image")) {
            console.log(`[Images API] Successfully extracted image (${imageUrl.length} chars)`);
            return imageUrl;
          }
        }

        // Alternative: check if content contains image data
        if (message?.content && typeof message.content === "string" && message.content.includes("data:image")) {
          const match = message.content.match(/data:image\/[^;]+;base64,[^\s"']+/);
          if (match) {
            console.log(`[Images API] Extracted image from content`);
            return match[0];
          }
        }

        console.warn(`[Images API] No valid image found in response`);
        return null;
      } catch (error) {
        console.error(`[Images API] Request error:`, error);
        return null;
      }
    }

    const results = await Promise.all(Array.from({ length: n }, () => requestOne()));
    const images = results.filter((u): u is string => Boolean(u));

    console.log(`[Images API] Generated ${images.length} out of ${n} requested images`);

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Image generation returned no images. Check server logs for details." },
        { status: 502 }
      );
    }

    return NextResponse.json({ images });
  } catch (err) {
    console.error(`[Images API] Unexpected error:`, err);
    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
