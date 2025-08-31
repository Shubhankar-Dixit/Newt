"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

const LinkSchema = z.object({ label: z.string(), href: z.string() });
const HeroSchema = z.object({
  headline: z.string(),
  subheadline: z.string().optional(),
  cta: z.object({ label: z.string(), target: z.string() }).optional(),
});
const CardSchema = z.object({ title: z.string(), body: z.string().optional(), target: z.string().optional() });
const FormFieldSchema = z.object({
  label: z.string().optional(),
  name: z.string().optional(),
  type: z.enum(["text", "email", "password", "textarea"]).optional(),
  placeholder: z.string().optional(),
});
const FormSchema = z.object({
  title: z.string().optional(),
  fields: z.array(FormFieldSchema).optional(),
  submitLabel: z.string().optional(),
  actionTarget: z.string().optional(),
});
const FeedPostSchema = z.object({
  author: z.string().optional(),
  handle: z.string().optional(),
  timestamp: z.string().optional(),
  content: z.string().optional(),
  target: z.string().optional(),
  likes: z.number().optional(),
});
const FeedSchema = z.object({
  title: z.string().optional(),
  posts: z.array(FeedPostSchema).optional(),
});
const SectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), hero: HeroSchema }),
  z.object({ type: z.literal("text"), markdown: z.string() }),
  z.object({ type: z.literal("grid"), items: z.array(CardSchema).min(1).max(12) }),
  z.object({ type: z.literal("feature"), title: z.string(), body: z.string() }),
  z.object({ type: z.literal("form"), form: FormSchema }),
  z.object({ type: z.literal("feed"), feed: FeedSchema }),
  z.object({ type: z.literal("wiki"), name: z.literal("NewtWiki"), subject: z.string(), article: z.string() }),
  z.object({ type: z.literal("footer"), links: z.array(LinkSchema).optional() }),
]);
const SiteSchema = z.object({
  title: z.string(),
  nav: z.array(LinkSchema).optional(),
  sections: z.array(SectionSchema).min(1),
});

export default function VisitPage() {
  const params = useParams<{ slug?: string[] }>();
  const router = useRouter();
  const query = useMemo(() => decodeURIComponent((params?.slug || []).join("/")).replace(/\+/g, " "), [params]);

  const { object, submit, isLoading, error, clear } = useObject({ api: "/api/site", schema: SiteSchema });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (query && (!object || object.title?.toLowerCase() !== query.toLowerCase())) {
      submit({ query });
    }
  }, [query, object, submit]);

  useEffect(() => { setSearch(query); }, [query]);

  function goto(target: string) {
    router.push(`/visit/${encodeURIComponent(target)}`);
    submit({ query: target });
  }

  return (
    <main className="min-h-dvh mx-auto px-4 py-6 max-w-6xl">
      {/* Top bar: title + controls + search + history nav */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl" style={{ fontWeight: 700 }}>{object?.title || query || "Loading…"}</h1>
            {error ? <div className="text-red-400 text-sm">Generation failed. Try reloading.</div> : null}
          </div>
          <div className="flex gap-2">
            <button className="btn px-3 py-2" onClick={() => (router.back())}>Back</button>
            <button className="btn px-3 py-2" onClick={() => (typeof window !== 'undefined' && window.history.forward())}>Forward</button>
            <button className="btn px-3 py-2" onClick={() => submit({ query })} disabled={isLoading}>Regenerate</button>
            <button className="btn px-3 py-2" onClick={() => clear?.()}>Clear</button>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); const q = search.trim(); if (q) goto(q); }}>
          <div className="flex gap-2 items-center">
            <input className="field" placeholder="Search or visit a website (e.g., Twitter, Hogwarts, Spotify)" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn btn-accent px-4 py-2" type="submit">Visit</button>
          </div>
        </form>
      </div>

      {/* Nav links */}
      {object?.nav && object.nav.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          {object.nav.map((l, idx: number) => (
            <button key={idx} className="chip" onClick={() => l?.href && goto(l.href)} disabled={!l?.href}>
              {l?.label ?? l?.href ?? "Link"}
            </button>
          ))}
        </div>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-6">
        {object?.sections?.map((s, i: number) => {
          const t = (s as { type?: string })?.type;
          if (t === "hero" && (s as { hero?: { headline?: string; subheadline?: string; cta?: { label?: string; target?: string } } }).hero) {
            const hero = (s as { hero?: { headline?: string; subheadline?: string; cta?: { label?: string; target?: string } } }).hero;
            return (
              <section className="card p-6" key={i}>
                <h2 className="text-3xl" style={{ fontWeight: 700 }}>{hero?.headline}</h2>
                {hero?.subheadline ? <p className="mt-2 opacity-80">{hero.subheadline}</p> : null}
                {hero?.cta ? (
                  <div className="mt-4">
                    <button className="btn btn-accent px-4 py-2" onClick={() => hero?.cta?.target && goto(hero.cta.target)} disabled={!hero?.cta?.target}>
                      {hero?.cta?.label ?? "Open"}
                    </button>
                  </div>
                ) : null}
              </section>
            );
          } else if (t === "text" && (s as { markdown?: string }).markdown) {
            return (
              <section className="card p-6 content" key={i}>
                <ReactMarkdown components={{
                  a: ({ href, children, ...props }) => {
                    if (!href) return <span {...props}>{children}</span>;
                    return (
                      <a href={`/visit/${encodeURIComponent(href)}`} onClick={(e) => { e.preventDefault(); goto(href.toString()); }} {...props}>
                        {children}
                      </a>
                    );
                  }
                }}>
                  {(s as { markdown?: string }).markdown}
                </ReactMarkdown>
              </section>
            );
          } else if (t === "grid" && s && 'items' in s && Array.isArray(s.items)) {
            return (
              <section className="card p-6" key={i}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {s.items.map((c, j: number) => {
                    if (!c) return null;
                    return (
                    <div key={j} className="card p-4">
                      <div className="font-semibold">{c?.title ?? "Item"}</div>
                      {c?.body ? <p className="opacity-80 text-sm mt-1">{c.body}</p> : null}
                      {c?.target ? (
                        <div className="mt-3">
                          <button className="btn px-3 py-2" onClick={() => c?.target && goto(c.target)} disabled={!c?.target}>Open</button>
                        </div>
                      ) : null}
                    </div>
                    );
                  })}
                </div>
              </section>
            );
          } else if (t === "feature" && s && 'title' in s) {
            return (
              <section className="card p-6" key={i}>
                <h3 className="text-xl" style={{ fontWeight: 600 }}>{s?.title ?? "Feature"}</h3>
                {s && 'body' in s && s?.body ? <p className="opacity-80 mt-1">{s.body}</p> : null}
              </section>
            );
          } else if (t === "form" && s && 'form' in s && s.form) {
            return (
              <section className="card p-6" key={i}>
                {s.form?.title ? <h3 className="text-xl mb-3" style={{ fontWeight: 600 }}>{s.form.title}</h3> : null}
                <FormRenderer form={s.form} onSubmit={() => goto(s.form?.actionTarget || query)} />
              </section>
            );
          } else if (t === "feed" && s && 'feed' in s && s.feed) {
            return (
              <section className="card p-6" key={i}>
                {s.feed?.title ? <h3 className="text-xl mb-3" style={{ fontWeight: 600 }}>{s.feed.title}</h3> : null}
                <div className="flex flex-col gap-3">
                  {(s.feed?.posts || []).map((p, j: number) => {
                    if (!p) return null;
                    return (
                    <article key={j} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{p?.author ?? "User"} {p?.handle ? <span className="opacity-70 text-xs">{p.handle}</span> : null}</div>
                        {p?.timestamp ? <div className="opacity-70 text-xs">{p.timestamp}</div> : null}
                      </div>
                      <div className="content">
                        <ReactMarkdown components={{
                          a: ({ href, children, ...props }) => {
                            if (!href) return <span {...props}>{children}</span>;
                            return (
                              <a href={`/visit/${encodeURIComponent(href)}`} onClick={(e) => { e.preventDefault(); goto(href.toString()); }} {...props}>
                                {children}
                              </a>
                            );
                          }
                        }}>
                          {p?.content ?? ""}
                        </ReactMarkdown>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {p?.target ? <button className="chip" onClick={() => p.target && goto(p.target)}>Open</button> : null}
                        {typeof p?.likes === 'number' ? <span className="chip">❤ {p.likes}</span> : null}
                      </div>
                    </article>
                    );
                  })}
                </div>
              </section>
            );
          } else if (t === "wiki" && s && 'subject' in s && 'article' in s) {
            return (
              <WikiSectionViewer key={i} subject={s?.subject ?? object?.title ?? query} article={s?.article ?? ""} goto={goto} name={s && 'name' in s ? s?.name ?? "NewtWiki" : "NewtWiki"} />
            );
          } else if (t === "footer" && s && 'links' in s) {
            return (
              <footer className="card p-6" key={i}>
                <div className="flex flex-wrap gap-2">
                  {(s.links || []).map((l, j: number) => {
                    if (!l) return null;
                    return (
                    <button key={j} className="chip" onClick={() => l?.href && goto(l.href)} disabled={!l?.href}>
                      {l?.label ?? l?.href ?? "Link"}
                    </button>
                    );
                  })}
                </div>
              </footer>
            );
          }
          return null;
        })}
      </div>
    </main>
  );
}

function FormRenderer({ form, onSubmit }: { 
  form: { 
    fields?: Array<{ 
      label?: string; 
      name?: string; 
      type?: "text"|"email"|"password"|"textarea"; 
      placeholder?: string 
    } | undefined>; 
    submitLabel?: string; 
    actionTarget?: string;
    title?: string;
  }; 
  onSubmit: (data: Record<string, string>) => void 
}) {
  const [state, setState] = useState<Record<string, string>>({});
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(state); }} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(form?.fields || []).map((f, i: number) => {
          if (!f) return null;
          return (
          <label key={i} className="flex flex-col gap-1">
            <span className="text-xs opacity-80">{f?.label ?? f?.name ?? "Field"}</span>
            {f?.type === 'textarea' ? (
              <textarea className="field" placeholder={f?.placeholder ?? ''} value={state[f?.name ?? `f${i}`] ?? ''} onChange={(e) => setState((s) => ({ ...s, [f?.name ?? `f${i}`]: e.target.value }))} />
            ) : (
              <input className="field" type={f?.type ?? 'text'} placeholder={f?.placeholder ?? ''} value={state[f?.name ?? `f${i}`] ?? ''} onChange={(e) => setState((s) => ({ ...s, [f?.name ?? `f${i}`]: e.target.value }))} />
            )}
          </label>
          );
        })}
      </div>
      <div>
        <button type="submit" className="btn btn-accent px-4 py-2">{form?.submitLabel ?? 'Submit'}</button>
      </div>
    </form>
  );
}

function WikiSectionViewer({ subject, article, goto, name }: { subject: string; article: string; goto: (t: string) => void; name?: string }) {
  const [coverImg, setCoverImg] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [requestedFor, setRequestedFor] = useState<string | null>(null);

  function extractTitleAndLead(md: string): { title: string | null; lead: string | null } {
    const lines = md.split(/\r?\n/);
    let title: string | null = null;
    let lead: string | null = null;
    let i = 0;
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i < lines.length && /^#\s+/.test(lines[i])) {
      title = lines[i].replace(/^#\s+/, "").trim();
      i++;
      while (i < lines.length && lines[i].trim() === "") i++;
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() !== "" && !/^#{1,6}\s+/.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      lead = para.join(" ").trim() || null;
    }
    return { title, lead };
  }

  function buildAestheticPrompt(title: string, lead?: string | null): string {
    const context = lead ? ` Context: ${lead.slice(0, 260)}` : "";
    return [
      `Editorial, Pinterest-aesthetic hero image of "${title}".`,
      "Artful composition, soft natural light, shallow depth of field,",
      "rich color grading, organic textures, tasteful negative space,",
      "cinematic look, highly detailed, no text, no watermark, no borders.",
      "Clean background, evocative mood, professional photography style.",
      "Aspect ratio 16:9.",
      context,
    ].join(" ");
  }

  useEffect(() => {
    if (!article || coverImg) return;
    const { title, lead } = extractTitleAndLead(article);
    const t = title || subject;
    if (!t) return;
    if (requestedFor === t) return;
    let aborted = false;
    (async () => {
      try {
        setCoverLoading(true);
        setCoverError(null);
        setRequestedFor(t);
        const res = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: buildAestheticPrompt(t, lead), count: 1 }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error || `Request failed (${res.status})`);
        }
        const data = (await res.json()) as { images?: string[] };
        if (!aborted) setCoverImg((data.images || [])[0] || null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Image generation failed";
        if (!aborted) setCoverError(msg);
      } finally {
        if (!aborted) setCoverLoading(false);
      }
    })();
    return () => { aborted = true; };
  }, [article, subject, requestedFor, coverImg]);

  return (
    <section className="card p-6 content">
      <div className="text-sm opacity-70 mb-2">{name ?? "NewtWiki"}</div>
      <ReactMarkdown
        components={{
          h1: ({ children, ...props }) => {
            const text = String(children);
            const id = text
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, "")
              .trim()
              .replace(/\s+/g, "-");
            return (
              <div>
                <h1 id={id} className="text-3xl font-bold mb-4 pb-2 border-b border-white/10" {...props}>{children}</h1>
                {coverImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImg} alt={`Illustration: ${text}`} className="mt-4 w-full rounded-lg border border-white/10" />
                ) : coverLoading ? (
                  <div className="mt-4 text-xs opacity-60">Generating cover image…</div>
                ) : coverError ? (
                  <div className="mt-4 text-xs text-red-300">{coverError}</div>
                ) : null}
              </div>
            );
          },
          a: ({ href, children, ...props }) => {
            if (!href) return <span {...props}>{children}</span>;
            return (
              <a href={`/visit/${encodeURIComponent(href)}`} onClick={(e) => { e.preventDefault(); goto(href.toString()); }} {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {article}
      </ReactMarkdown>
    </section>
  );
}
