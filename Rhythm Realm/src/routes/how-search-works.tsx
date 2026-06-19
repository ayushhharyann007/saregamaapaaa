import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Database, GitBranch, Search, Keyboard, Layers, Timer } from "lucide-react";
import { TrieExplorer } from "@/frontend/components/TrieExplorer";
import { songsQueryOptions } from "@/backend/songsQuery";
import type { Song } from "@/backend/data/songs";

export const Route = createFileRoute("/how-search-works")({
  head: () => ({
    meta: [
      { title: "How Search Works — Trie Visualization" },
      { name: "description", content: "An animated explainer of how a Trie data structure powers instant prefix-based song search, and why it beats relational wildcard queries." },
      { property: "og:title", content: "How Trie Search Works" },
      { property: "og:description", content: "Animated Trie prefix-search visualization." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(songsQueryOptions),
  component: HowItWorks,
  pendingComponent: () => (
    <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Loading songs…</div>
  ),
});

function HowItWorks() {
  const { data: songs } = useSuspenseQuery(songsQueryOptions);

  return (
    <div className="px-4 py-8 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-10 max-w-3xl text-center"
      >
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
          <GitBranch size={14} /> Data Structure: Trie (Prefix Tree)
        </span>
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">
          How <span className="text-gradient">search</span> works
        </h1>
        <p className="mt-4 text-muted-foreground">
          Every keystroke walks one branch of a tree instead of scanning every row in a
          database. Click the nodes below and watch the engine think.
        </p>
      </motion.div>

      <DatasetStats songs={songs} />

      <KeystrokeWalkthrough songs={songs} />

      <div className="mx-auto max-w-4xl">
        <TrieExplorer songs={songs} />
      </div>

      <RaceSection total={songs.length} />

      <ComplexityTable total={songs.length} />

      <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-3">
        <ConceptCard icon={Zap} title="O(L) lookup" text="A search costs only the length of your query (L), not the number of songs (N). Adding a million songs doesn't slow it down." />
        <ConceptCard icon={GitBranch} title="Shared prefixes" text="Songs starting with the same letters share branches, so memory and traversal stay compact." />
        <ConceptCard icon={Database} title="Beats SQL LIKE" text="A 'LIKE prefix%' query without an index scans every row. The Trie jumps straight to the branch." />
      </div>
    </div>
  );
}

function DatasetStats({ songs }: { songs: Song[] }) {
  const stats = useMemo(() => {
    const artists = new Set(songs.map((s) => s.artist)).size;
    const letters = new Set(
      songs.map((s) => (s.title[0] || "").toLowerCase()).filter((c) => /[a-z]/.test(c)),
    ).size;
    const totalChars = songs.reduce((a, s) => a + s.title.length, 0);
    return { songs: songs.length, artists, letters, totalChars };
  }, [songs]);

  const items = [
    { icon: Database, label: "Songs indexed", value: stats.songs.toLocaleString() },
    { icon: Search, label: "Unique artists", value: stats.artists.toLocaleString() },
    { icon: GitBranch, label: "Root branches", value: `${stats.letters}` },
    { icon: Layers, label: "Characters stored", value: stats.totalChars.toLocaleString() },
  ];

  return (
    <div className="mx-auto mb-12 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="rounded-2xl border border-border bg-card p-4 text-center"
        >
          <it.icon className="mx-auto mb-2 text-primary" size={20} />
          <div className="font-display text-2xl font-extrabold text-gradient">{it.value}</div>
          <div className="text-xs text-muted-foreground">{it.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

const DEMO_QUERIES = ["arijit", "taylor", "telugu", "drake", "shreya"];

function KeystrokeWalkthrough({ songs }: { songs: Song[] }) {
  const [queryIdx, setQueryIdx] = useState(0);
  const [typed, setTyped] = useState(0);
  const query = DEMO_QUERIES[queryIdx];

  useEffect(() => {
    if (typed < query.length) {
      const t = setTimeout(() => setTyped((n) => n + 1), 520);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTyped(0);
      setQueryIdx((i) => (i + 1) % DEMO_QUERIES.length);
    }, 1800);
    return () => clearTimeout(t);
  }, [typed, query.length]);

  const prefix = query.slice(0, typed);
  const matches = useMemo(() => {
    if (!prefix) return songs.length;
    const p = prefix.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().startsWith(p) || s.artist.toLowerCase().startsWith(p),
    ).length;
  }, [prefix, songs]);

  return (
    <div className="mx-auto mb-14 max-w-4xl rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="mb-5 flex items-center gap-2">
        <Keyboard className="text-primary" size={18} />
        <h2 className="font-display text-xl font-bold">Watch a query walk the tree</h2>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {query.split("").map((ch, i) => (
          <motion.div
            key={`${queryIdx}-${i}`}
            initial={{ opacity: 0.25, y: 0 }}
            animate={
              i < typed
                ? { opacity: 1, y: -4, scale: 1.05 }
                : { opacity: 0.25, y: 0, scale: 1 }
            }
            className={`flex h-12 w-12 items-center justify-center rounded-xl border font-display text-xl font-bold transition-colors ${
              i < typed
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            {ch}
          </motion.div>
        ))}
        <div className="flex items-center pl-2 text-sm text-muted-foreground">
          step {typed} / {query.length}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-background p-4">
          <div className="text-xs text-muted-foreground">Current prefix</div>
          <div className="font-display text-2xl font-bold text-primary">
            {prefix || "—"}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              |
            </motion.span>
          </div>
        </div>
        <div className="rounded-2xl bg-background p-4">
          <div className="text-xs text-muted-foreground">Comparisons made</div>
          <div className="font-display text-2xl font-bold">{typed}</div>
        </div>
        <div className="rounded-2xl bg-background p-4">
          <div className="text-xs text-muted-foreground">Matching songs</div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={matches}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="font-display text-2xl font-bold text-gradient"
            >
              {matches.toLocaleString()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">
        Each highlighted letter is a single hop down the tree. After just{" "}
        <span className="font-bold text-primary">{query.length}</span> hops the engine
        narrowed {songs.length.toLocaleString()} songs down to a tiny branch — no full scan
        required.
      </p>
    </div>
  );
}

function RaceSection({ total }: { total: number }) {
  const [run, setRun] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRun((r) => r + 1), 4000);
    return () => clearInterval(t);
  }, []);
  const trieSteps = 3;
  return (
    <div className="mx-auto mt-14 max-w-4xl rounded-3xl border border-border bg-card p-6 md:p-8">
      <h2 className="mb-6 text-center font-display text-xl font-bold">Trie vs. Database scan</h2>
      <Bar key={`t${run}`} label="Trie (prefix walk)" value={trieSteps} max={total} color="var(--gradient-brand)" duration={0.6} note={`~${trieSteps} comparisons`} />
      <div className="h-4" />
      <Bar key={`s${run}`} label="SQL LIKE 'prefix%' (full scan)" value={total} max={total} color="linear-gradient(135deg,#ef4444,#f59e0b)" duration={2} note={`${total} rows scanned`} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        The Trie reaches matches in a handful of steps while a full scan touches every one of
        the <span className="font-bold text-primary">{total}</span> songs.
      </p>
    </div>
  );
}

function Bar({ label, value, max, color, duration, note }: { label: string; value: number; max: number; color: string; duration: number; note: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{note}</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-background">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, (value / max) * 100)}%` }}
          transition={{ duration, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function ComplexityTable({ total }: { total: number }) {
  const rows = [
    { op: "Best case lookup", trie: "O(L)", scan: "O(N)", win: true },
    { op: "Worst case lookup", trie: "O(L)", scan: "O(N)", win: true },
    { op: "Prefix autocomplete", trie: "O(L + k)", scan: "O(N)", win: true },
    { op: "Memory (shared prefixes)", trie: "Compact", scan: "Flat list", win: true },
  ];
  return (
    <div className="mx-auto mt-14 max-w-4xl rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="mb-5 flex items-center gap-2">
        <Timer className="text-primary" size={18} />
        <h2 className="font-display text-xl font-bold">Complexity at a glance</h2>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="grid grid-cols-3 bg-background text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="p-3">Operation</div>
          <div className="p-3 text-center text-primary">Trie</div>
          <div className="p-3 text-center">SQL scan</div>
        </div>
        {rows.map((r, i) => (
          <motion.div
            key={r.op}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="grid grid-cols-3 border-t border-border text-sm"
          >
            <div className="p-3 font-medium">{r.op}</div>
            <div className="p-3 text-center font-mono font-bold text-primary">{r.trie}</div>
            <div className="p-3 text-center font-mono text-muted-foreground">{r.scan}</div>
          </motion.div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        With <span className="font-bold text-primary">N = {total.toLocaleString()}</span>{" "}
        songs and a short query length L, the Trie stays effectively constant while a scan grows
        with the catalog.
      </p>
    </div>
  );
}



function ConceptCard({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-border bg-card p-5">
      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Icon size={20} />
      </span>
      <h3 className="mb-1 font-display font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </motion.div>
  );
}
