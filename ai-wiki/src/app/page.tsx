"use client";

import Link from "next/link";
import BackgroundShader from "@/components/BackgroundShader";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SUGGESTED = [
  "Hogwarts",
  "Artificial Intelligence",
  "World Wide Web",
  "Black Holes",
  "Renaissance Art",
  "Climate Change",
  "Game Theory",
  "CRISPR",
];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <BackgroundShader className="w-full h-full" />
      </div>
      <div className="absolute inset-0 -z-0" style={{ background: "radial-gradient(1200px 600px at 50% 0%, rgba(15,13,10,0) 0%, rgba(15,13,10,0.5) 55%, rgba(15,13,10,0.8) 100%)" }} />

      <div className="relative px-6 py-16 md:py-24 max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-5xl md:text-6xl inline-block px-8 py-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/10" style={{ fontWeight: 700 }}>Newt</h1>
          <div className="mt-6 inline-block px-6 py-4 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/8">
            <p className="text-sm md:text-base opacity-80">A living, fully AI‑generated web of knowledge. Search a topic or follow links—every page is created on the fly.</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/explore" className="btn btn-accent px-5 py-3 text-sm">Start Exploring</Link>
            <button
              className="btn px-5 py-3 text-sm"
              onClick={() => {
                const pick = SUGGESTED[Math.floor(Math.random() * SUGGESTED.length)];
                router.push(`/explore?q=${encodeURIComponent(pick)}`);
              }}
            >
              Random Page
            </button>
          </div>
          <form className="mt-6 max-w-xl mx-auto" onSubmit={(e) => { e.preventDefault(); const q = query.trim(); if (q) router.push(`/visit/${encodeURIComponent(q)}`); }}>
            <div className="flex gap-2 items-center">
              <input className="field" placeholder="Visit a website (e.g., Twitter, Hogwarts, Spotify)" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button className="btn btn-accent px-4 py-2" type="submit">Visit</button>
            </div>
          </form>
        </header>

        <section className="card p-6">
          <div className="text-sm opacity-70 mb-3">Recommended websites</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <Link key={s} href={`/visit/${encodeURIComponent(s)}`} className="chip">{s}</Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
