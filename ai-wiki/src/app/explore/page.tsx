"use client";

import { useEffect, useMemo, useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

const SUGGESTED_TOPICS = [
  "Quantum Computing",
  "Photosynthesis",
  "The Renaissance",
  "Blockchain",
  "Black Holes",
  "CRISPR",
  "Game Theory",
  "Machine Learning",
  "Climate Change",
  "French Revolution",
  "Neural Networks",
  "Graph Theory",
  "Microplastics",
  "RNA Vaccines",
  "Higgs Boson",
  "Hogwarts",
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function Explore() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = useMemo(() => params.get("q")?.trim() ?? "", [params]);
  const [topic, setTopic] = useState(initialQ);
  const { complete, completion, isLoading, error, stop, setCompletion } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
  });
  const [history, setHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  // Auto cover image state
  const [coverImg, setCoverImg] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverRequestedFor, setCoverRequestedFor] = useState<string | null>(null);

  useEffect(() => {
    if (initialQ) complete(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aiwiki:history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  function pushHistory(q: string) {
    try {
      const next = [q, ...history.filter((h) => h.toLowerCase() !== q.toLowerCase())].slice(0, 8);
      setHistory(next);
      localStorage.setItem("aiwiki:history", JSON.stringify(next));
    } catch {}
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = topic.trim();
    if (!q) return;
    const usp = new URLSearchParams(Array.from(params.entries()));
    usp.set("q", q);
    router.push(`/explore?${usp.toString()}`);
    pushHistory(q);
    // reset cover image for new query
    setCoverImg(null);
    setCoverError(null);
    setCoverRequestedFor(null);
    await complete(q);
  }

  // Extract first H1 and first paragraph as lead
  function extractTitleAndLead(md: string): { title: string | null; lead: string | null } {
    const lines = md.split(/\r?\n/);
    let title: string | null = null;
    let lead: string | null = null;
    let i = 0;
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i < lines.length && /^#\s+/.test(lines[i])) {
      title = lines[i].replace(/^#\s+/, "").trim();
      i++;
      // skip blank lines
      while (i < lines.length && lines[i].trim() === "") i++;
      // collect first paragraph until blank line or heading
      const para: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !/^#{1,6}\s+/.test(lines[i])
      ) {
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

  // Auto-request a single cover image once we have a title
  useEffect(() => {
    if (!completion || coverLoading || coverImg) return;
    const { title, lead } = extractTitleAndLead(completion);
    if (!title) return;
    if (coverRequestedFor === title) return;
    let aborted = false;
    async function run() {
      try {
        setCoverLoading(true);
        setCoverError(null);
        setCoverRequestedFor(title);
        const res = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: buildAestheticPrompt(title as string, lead), count: 1 }),
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
    }
    run();
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completion]);

  return (
    <main className="min-h-dvh mx-auto px-6 py-8 content max-w-7xl">
      {/* Enhanced Header */}
      <header className="text-center mb-12">
        <div className="inline-block px-8 py-4 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/8 mb-6">
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-2" style={{ fontWeight: 700 }}>
            The AI Web
          </h1>
          <p className="text-sm opacity-80">Every page is generated on demand. Follow links to explore.</p>
        </div>
      </header>

      {/* Enhanced Search Area */}
      <section className="mb-10">
        <div className="card p-6">
          <form onSubmit={onSubmit} className="mb-4">
            <div className="flex gap-3 items-center flex-wrap sm:flex-nowrap">
              <input
                type="text"
                value={topic}
                onChange={(e) => { setTopic(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
                placeholder="Search any topic... (e.g., Hogwarts explained to a five year old)"
                className="field flex-1 min-w-0 text-base"
              />
              <div className="flex gap-2">
                <button type="submit" className="btn btn-accent px-6 py-3 disabled:opacity-60 font-medium" disabled={isLoading}>
                  {isLoading ? "Generating…" : "Generate"}
                </button>
                {isLoading ? (
                  <button type="button" onClick={() => stop()} className="btn px-4 py-3 text-red-300 border-red-300/20">Stop</button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const pool = SUGGESTED_TOPICS;
                      const pick = pool[Math.floor(Math.random() * pool.length)];
                      setTopic(pick);
                      const usp = new URLSearchParams(Array.from(params.entries()));
                      usp.set("q", pick);
                      router.push(`/explore?${usp.toString()}`);
                      pushHistory(pick);
                      complete(pick);
                    }}
                    className="btn px-4 py-3"
                  >
                    Random
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Autocomplete dropdown */}
          {showDropdown && topic.trim().length > 0 ? (
            <div className="absolute z-10 mt-2 w-full card p-2 max-w-2xl">
              {SUGGESTED_TOPICS.filter((t) => t.toLowerCase().includes(topic.toLowerCase())).slice(0, 6).map((s) => (
                <button
                  key={s}
                  className="block w-full text-left px-3 py-2 menu-item rounded-lg"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setTopic(s);
                    const usp = new URLSearchParams(Array.from(params.entries()));
                    usp.set("q", s);
                    router.push(`/explore?${usp.toString()}`);
                    pushHistory(s);
                    complete(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Enhanced Suggestions and history */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm opacity-70 font-medium">Suggested:</span>
            {SUGGESTED_TOPICS.slice(0, 8).map((s) => (
              <button
                key={s}
                className="chip hover:bg-var(--surface-hover) transition-colors"
                onClick={() => {
                  setTopic(s);
                  const usp = new URLSearchParams(Array.from(params.entries()));
                  usp.set("q", s);
                  router.push(`/explore?${usp.toString()}`);
                  pushHistory(s);
                  complete(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {history.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm opacity-70 font-medium">Recent:</span>
              {history.map((h) => (
                <button
                  key={h}
                  className="chip hover:bg-var(--surface-hover) transition-colors"
                  onClick={() => {
                    setTopic(h);
                    const usp = new URLSearchParams(Array.from(params.entries()));
                    usp.set("q", h);
                    router.push(`/explore?${usp.toString()}`);
                    complete(h);
                  }}
                >
                  {h}
                </button>
              ))}
              <button className="chip hover:bg-red-500/20 transition-colors" onClick={() => { setHistory([]); try { localStorage.removeItem("aiwiki:history"); } catch {} }}>Clear</button>
            </div>
          )}
        </div>
      </section>

      {error ? <p className="text-red-400 mb-4">Something went wrong. Please try again.</p> : null}

      {/* Enhanced Layout: Article + TOC */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        {/* Main Article Section */
        }
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold opacity-80">Article</h2>
            <div className="flex gap-2">
              <button 
                type="button" 
                className="btn px-4 py-2 text-sm hover:bg-green-500/20 transition-colors" 
                onClick={async () => { 
                  try { 
                    await navigator.clipboard.writeText(completion ?? ""); 
                  } catch {} 
                }}
              >
                Copy
              </button>
              <button 
                type="button" 
                className="btn px-4 py-2 text-sm hover:bg-red-500/20 transition-colors" 
                onClick={() => setCompletion("")}
              >
                Clear
              </button>
            </div>
          </div>
          
          <article className="card p-8 min-h-[500px]">
            {completion ? (
              <ReactMarkdown
                components={{
                  h1: ({ children, ...props }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <div>
                        <h1 id={id} className="text-3xl font-bold mb-4 pb-2 border-b border-white/10" {...props}>{children}</h1>
                        {/* Auto cover image directly under title */}
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
                  h2: ({ children, ...props }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return <h2 id={id} className="text-2xl font-semibold mt-8 mb-4" {...props}>{children}</h2>;
                  },
                  h3: ({ children, ...props }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return <h3 id={id} className="text-xl font-medium mt-6 mb-3" {...props}>{children}</h3>;
                  },
                  p: ({ children, ...props }) => (
                    <p className="mb-4 leading-7" {...props}>{children}</p>
                  ),
                  a: ({ href, children, ...props }) => {
                    const label = String(children);
                    const isExternal = !!href && /^(https?:)?\/\//i.test(href);
                    if (!href) return <span {...props}>{children}</span>;
                    if (isExternal) return <a href={href} {...props} rel="noreferrer" target="_blank" className="text-blue-400 hover:text-blue-300 underline">{children}</a>;
                    // Internal link: Enhanced styling with navigation indicator
                    return (
                      <a
                        href={`/explore?q=${encodeURIComponent(href)}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const q = href.toString();
                          const usp = new URLSearchParams(Array.from(params.entries()));
                          usp.set("q", q);
                          router.push(`/explore?${usp.toString()}`);
                          pushHistory(q);
                          complete(q);
                        }}
                        className="inline-flex items-center gap-1 text-accent hover:text-accent/80 underline underline-offset-2 decoration-accent/50 hover:decoration-accent transition-all group"
                        title={`Go to article: ${href}`}
                        {...props}
                      >
                        {children}
                        <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">→</span>
                      </a>
                    );
                  },
                }}
              >
                {completion}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center justify-center h-48 text-center">
                <div>
                  <p className="opacity-60 text-lg mb-2">No article yet</p>
                  <p className="opacity-40 text-sm">Enter a topic above to generate an AI-powered article</p>
                </div>
              </div>
            )}
          </article>

          {/* Auto image now generated and injected under the title */}
        </section>

        {/* Enhanced Table of Contents Sidebar */}
        <aside className="lg:sticky lg:top-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              Table of Contents
            </h3>
            {completion ? (
              <TOC content={completion} />
            ) : (
              <div className="text-center py-8">
                <p className="opacity-60 text-sm">Sections will appear here when you generate an article</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function TOC({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const items: { level: number; text: string; id: string }[] = [];
  for (const line of lines) {
    const m1 = /^#\s+(.+)$/.exec(line);
    const m2 = /^##\s+(.+)$/.exec(line);
    const m3 = /^###\s+(.+)$/.exec(line);
    if (m1) items.push({ level: 1, text: m1[1].trim(), id: slugify(m1[1].trim()) });
    else if (m2) items.push({ level: 2, text: m2[1].trim(), id: slugify(m2[1].trim()) });
    else if (m3) items.push({ level: 3, text: m3[1].trim(), id: slugify(m3[1].trim()) });
  }
  if (items.length === 0) return <div className="opacity-60 text-sm text-center py-4">No sections found.</div>;
  
  return (
    <nav className="space-y-2">
      {items.map((it, index) => (
        <div key={it.id} className={`${
          it.level === 1 ? 'border-l-2 border-accent/30 pl-3' :
          it.level === 2 ? 'border-l-2 border-white/10 pl-4 ml-2' :
          'border-l-2 border-white/5 pl-4 ml-6'
        }`}>
          <a
            href={`#${it.id}`}
            onClick={(e) => { 
              e.preventDefault(); 
              const el = document.getElementById(it.id); 
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); 
            }}
            className={`block py-2 px-2 rounded-md hover:bg-white/5 transition-colors ${
              it.level === 1 ? 'font-semibold text-accent text-sm' :
              it.level === 2 ? 'text-sm' :
              'text-xs opacity-80'
            }`}
            title={`Jump to: ${it.text}`}
          >
            <span className="flex items-center gap-2">
              <span className="truncate">{it.text}</span>
            </span>
          </a>
        </div>
      ))}
    </nav>
  );
}
