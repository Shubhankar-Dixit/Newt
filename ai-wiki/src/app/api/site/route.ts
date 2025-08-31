import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { streamObject } from "ai";
import { z } from "zod";

export const runtime = "edge";
export const preferredRegion = ["iad1", "sfo1", "fra1"]; // optional hint

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

// Schema for a generative website page that always includes a NewtWiki section.
const LinkSchema = z.object({ label: z.string(), href: z.string() });
const HeroSchema = z.object({
  headline: z.string(),
  subheadline: z.string().optional(),
  cta: z.object({ label: z.string(), target: z.string() }).optional(),
});
const CardSchema = z.object({
  title: z.string(),
  body: z.string().optional(),
  target: z.string().optional(),
});

const FormFieldSchema = z.object({
  label: z.string(),
  name: z.string(),
  type: z.enum(["text", "email", "password", "textarea"]).default("text"),
  placeholder: z.string().optional(),
});

const FormSchema = z.object({
  title: z.string().optional(),
  fields: z.array(FormFieldSchema).min(1),
  submitLabel: z.string().default("Submit"),
  actionTarget: z.string().optional(),
  successMessage: z.string().optional(),
});

const PostSchema = z.object({
  author: z.string(),
  handle: z.string().optional(),
  content: z.string(), // markdown
  target: z.string().optional(), // open post/thread/topic
  likes: z.number().optional(),
  timestamp: z.string().optional(),
});

const FeedSchema = z.object({
  title: z.string().optional(),
  posts: z.array(PostSchema).min(1).max(20),
});
const SectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), hero: HeroSchema }),
  z.object({ type: z.literal("text"), markdown: z.string() }),
  z.object({ type: z.literal("grid"), items: z.array(CardSchema).min(1).max(12) }),
  z.object({ type: z.literal("feature"), title: z.string(), body: z.string() }),
  z.object({ type: z.literal("form"), form: FormSchema }),
  z.object({ type: z.literal("feed"), feed: FeedSchema }),
  z.object({
    type: z.literal("wiki"),
    name: z.literal("NewtWiki"),
    subject: z.string(),
    article: z.string(),
  }),
  z.object({ type: z.literal("footer"), links: z.array(LinkSchema).optional() }),
]);

const SiteSchema = z.object({
  title: z.string(),
  nav: z.array(LinkSchema).optional(),
  sections: z.array(SectionSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const { query } = (await req.json()) as { query?: string };
    const siteQuery = (query ?? "").trim();
    if (!siteQuery) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Server missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    const sys = [
      "You generate structured JSON that describes a single web page.",
      "The web is fully AI-generated; you can design rich, varied layouts.",
      "You may include sections: hero, text (markdown), grid (cards), feature, form (sign up/login/contact), feed (social posts), footer, and always one wiki section named 'NewtWiki'.",
      "Infer the canonical subject/title from the user's query and use it as the site 'title'.",
      "Do NOT include style/audience modifiers in the title (e.g., title 'Hogwarts', not 'Hogwarts for a five year old').",
      "When the user asks for a style/audience (e.g., explained to a 5-year-old), apply it to the prose but keep the title canonical.",
      "Internal links should use short hrefs without protocols (e.g., 'Hogwarts', 'Photosynthesis').",
      "Do NOT output any additional text outside of JSON.",
    ].join(" ");

    const result = await streamObject({
      model: groq("openai/gpt-oss-20b"),
      schema: SiteSchema,
      system: sys,
      prompt: `Create a website specification (JSON) for: "${siteQuery}".

Guidelines:
- Compose a cohesive page using any sections: hero, feature blocks, grids/cards, rich text, forms (sign up/login/contact), social feed with posts, and a 'wiki' section named 'NewtWiki'.
- The 'form' section should include fields appropriate to the site (e.g., email/password for login or name/email for signup) and an actionTarget topic to navigate to after submission.
- The 'feed' section should include several short posts with authors and markdown content; add targets to open related topics when appropriate.
- The 'wiki' section must contain a canonical 'subject' and an 'article' in Markdown.
- The 'article' should include an H1 (# CanonicalSubject) as the first line, followed by content adapted to the user's requested style/audience if any.
- Add a few relevant nav links and internal references (hrefs are plain topic names with no protocol).
- Keep total content concise.`,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    return NextResponse.json(
      { error: "Site generation failed" },
      { status: 500 }
    );
  }
}
