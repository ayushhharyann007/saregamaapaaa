import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Delete,
  RotateCcw,
  CornerDownRight,
  Zap,
  Volume2,
  VolumeX,
  Trophy,
  Sparkles,
} from "lucide-react";
import { type Song, formatPlays } from "@/backend/data/songs";
import { buildTrie, type TrieNode } from "@/backend/trie";
import { usePlayer } from "@/frontend/context/PlayerContext";
import { SongCover } from "./SongCover";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

/* ---------------- tiny WebAudio blip engine ---------------- */
function useBlip(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(
    (freq: number, type: OscillatorType = "sine", dur = 0.12) => {
      if (!enabled || typeof window === "undefined") return;
      try {
        if (!ctxRef.current)
          ctxRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
        const ctx = ctxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
      } catch {
        /* ignore */
      }
    },
    [enabled],
  );
}

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

export function TrieExplorer({ songs }: { songs: Song[] }) {
  const { play } = usePlayer();
  const [prefix, setPrefix] = useState("");
  const [sound, setSound] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const demoRef = useRef<number | null>(null);
  const blip = useBlip(sound);

  const songMap = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const trie = useMemo(() => buildTrie(songs), [songs]);

  const { path, node } = useMemo(() => trie.traverse(prefix), [trie, prefix]);
  const valid = node !== null;

  const children = useMemo(() => {
    if (!node) return [];
    return Array.from(node.children.values()).sort(
      (a, b) => b.songIds.length - a.songIds.length,
    );
  }, [node]);

  // map of next-available-letter -> subtree song count, for the keyboard
  const nextCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of children) m.set(c.char, c.songIds.length);
    return m;
  }, [children]);

  const results = useMemo(() => {
    if (!node) return [];
    return Array.from(new Set(node.songIds))
      .map((id) => songMap.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.plays - a.plays);
  }, [node, songMap]);

  const burst = useCallback((emoji: string, count = 10) => {
    const next: Particle[] = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i,
      x: 40 + Math.random() * 20,
      y: 50,
      emoji,
    }));
    setParticles((p) => [...p, ...next]);
    window.setTimeout(
      () => setParticles((p) => p.filter((x) => !next.some((n) => n.id === x.id))),
      1100,
    );
  }, []);

  const stopDemo = () => {
    if (demoRef.current) {
      clearInterval(demoRef.current);
      demoRef.current = null;
    }
  };

  const pushChar = useCallback(
    (ch: string) => {
      stopDemo();
      const available = nextCounts.has(ch);
      blip(available ? 440 + prefix.length * 70 : 160, available ? "sine" : "sawtooth");
      if (available && nextCounts.get(ch) === 1) burst("🎯", 14);
      setPrefix((p) => p + ch);
    },
    [blip, burst, nextCounts, prefix.length],
  );

  const back = useCallback(() => {
    blip(300, "triangle");
    setPrefix((p) => p.slice(0, -1));
  }, [blip]);

  const reset = useCallback(() => {
    blip(220, "triangle");
    setPrefix("");
  }, [blip]);

  // physical keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Backspace") {
        e.preventDefault();
        back();
      } else if (e.key === " ") {
        e.preventDefault();
        pushChar(" ");
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        pushChar(e.key.toLowerCase());
      } else if (e.key === "Escape") {
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pushChar, back, reset]);

  const runDemo = () => {
    stopDemo();
    const sample = (songs[0]?.title || "song").toLowerCase().replace(/[^a-z ]/g, "");
    const target = sample.split(" ")[0].slice(0, 5);
    setPrefix("");
    let i = 0;
    demoRef.current = window.setInterval(() => {
      i += 1;
      blip(440 + i * 70, "sine");
      setPrefix(target.slice(0, i));
      if (i >= target.length) {
        stopDemo();
        burst("✨", 16);
      }
    }, 520);
  };

  useEffect(() => () => stopDemo(), []);

  // celebrate on full match (leaf)
  useEffect(() => {
    if (valid && prefix.length >= 2 && children.length === 0 && results.length > 0) {
      burst("🏆", 18);
    }
  }, [valid, children.length, results.length, prefix.length, burst]);

  const pathChars = prefix.split("");
  const scanSaved = songs.length > 0 ? Math.round((1 - results.length / songs.length) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 md:p-8">
      {/* floating particles */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, x: `${p.x}%`, y: `${p.y}%`, scale: 0.6 }}
              animate={{
                opacity: 0,
                y: `${p.y - 35 - Math.random() * 25}%`,
                x: `${p.x + (Math.random() * 30 - 15)}%`,
                scale: 1.4,
                rotate: Math.random() * 90 - 45,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute text-2xl"
            >
              {p.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <motion.span
              animate={{ rotate: [0, -12, 12, 0] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <Zap size={22} className="text-primary" />
            </motion.span>
            Interactive Trie Explorer
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Type on your keyboard, tap the on-screen keys, or click a node — glowing keys are
            the only valid next letters.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSound((s) => !s)}
            className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium transition-transform hover:scale-105"
            title={sound ? "Mute sounds" : "Enable sounds"}
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={runDemo}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
          >
            <Play fill="currentColor" size={14} /> Run demo
          </button>
        </div>
      </div>

      {/* live stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Characters typed" value={prefix.length} />
        <Stat label="Matching songs" value={results.length} accent />
        <Stat label="Branches here" value={children.length} />
        <Stat label="Scan avoided" value={`${scanSaved}%`} accent />
      </div>

      {/* input + controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toLowerCase().replace(/[^a-z ]/g, ""))}
            placeholder="Type letters… e.g. te, ka, ar"
            className="w-full rounded-full border border-border bg-background px-5 py-3 text-lg outline-none transition-shadow focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          onClick={back}
          disabled={!prefix}
          className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-elevated disabled:opacity-40"
        >
          <Delete size={16} /> Back
        </button>
        <button
          onClick={reset}
          disabled={!prefix}
          className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-elevated disabled:opacity-40"
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>

      {/* tree canvas */}
      <div className="scrollbar-thin overflow-x-auto rounded-2xl bg-background p-6">
        <div className="flex min-w-max flex-col items-center gap-0">
          <TreeNode label="ROOT" tone="root" />
          {pathChars.map((ch, i) => {
            const reachable = i < path.length - 1;
            return (
              <div key={i} className="flex flex-col items-center">
                <Connector ok={reachable || (valid && i === pathChars.length - 1)} />
                <TreeNode
                  label={ch === " " ? "␣" : ch}
                  tone={valid || i < path.length - 1 ? "active" : "miss"}
                  delay={i * 0.04}
                />
              </div>
            );
          })}

          {valid && children.length > 0 && (
            <>
              <Connector ok branch />
              <div className="mt-3 flex max-w-3xl flex-wrap justify-center gap-3">
                <AnimatePresence mode="popLayout">
                  {children.map((c) => (
                    <ChildNode key={c.char} node={c} onClick={() => pushChar(c.char)} />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

          {valid && children.length === 0 && (
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-4 flex items-center gap-2 rounded-full bg-primary/15 px-4 py-1.5 text-sm font-semibold text-primary"
            >
              <Trophy size={16} /> Leaf reached — full match!
            </motion.p>
          )}
          {!valid && (
            <motion.p
              initial={{ x: -6 }}
              animate={{ x: [0, -6, 6, -4, 4, 0] }}
              className="mt-4 rounded-lg bg-destructive/15 px-3 py-1.5 text-sm text-destructive"
            >
              No branch for “{prefix}”. Press Back.
            </motion.p>
          )}
        </div>
      </div>

      {/* virtual keyboard */}
      <div className="mt-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Sparkles size={15} className="text-primary" /> Pick the next letter
        </h3>
        <div className="flex flex-wrap gap-2">
          {ALPHABET.map((ch) => {
            const count = nextCounts.get(ch);
            const active = count !== undefined;
            return (
              <motion.button
                key={ch}
                whileHover={active ? { scale: 1.12, y: -3 } : {}}
                whileTap={active ? { scale: 0.9 } : {}}
                onClick={() => pushChar(ch)}
                disabled={!active}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl border-2 font-display text-base font-bold uppercase transition-colors ${
                  active
                    ? "border-primary bg-primary/15 text-primary shadow-glow"
                    : "border-border bg-background text-muted-foreground/40"
                }`}
              >
                {ch}
                {active && (
                  <span className="absolute -right-1 -top-2 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
          <motion.button
            whileHover={nextCounts.has(" ") ? { scale: 1.06, y: -3 } : {}}
            whileTap={nextCounts.has(" ") ? { scale: 0.95 } : {}}
            onClick={() => pushChar(" ")}
            disabled={!nextCounts.has(" ")}
            className={`flex h-11 items-center justify-center rounded-xl border-2 px-6 text-sm font-semibold transition-colors ${
              nextCounts.has(" ")
                ? "border-primary bg-primary/15 text-primary shadow-glow"
                : "border-border bg-background text-muted-foreground/40"
            }`}
          >
            space {nextCounts.has(" ") ? `(${nextCounts.get(" ")})` : ""}
          </motion.button>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Compared <span className="font-bold text-primary">{prefix.length}</span> character
        {prefix.length !== 1 ? "s" : ""} →{" "}
        <span className="font-bold text-primary">{results.length}</span> matching song
        {results.length !== 1 ? "s" : ""} (out of {songs.length}).
      </p>

      {/* results */}
      <div className="mt-6">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <CornerDownRight size={18} className="text-primary" /> Trie Output Results ({results.length})
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {results.slice(0, 8).map((s, i) => (
              <motion.button
                key={s.id}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ x: 4 }}
                onClick={() => play(s, results)}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-elevated"
              >
                <SongCover song={s} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.title}</span>
                  <span className="block truncate text-sm text-muted-foreground">{s.artist}</span>
                </span>
                <span className="text-xs text-muted-foreground">{formatPlays(s.plays)}</span>
                <Play fill="currentColor" size={16} className="text-primary" />
              </motion.button>
            ))}
          </AnimatePresence>
          {results.length === 0 && (
            <p className="text-sm text-muted-foreground">Pick a node above to see songs.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <motion.div
        key={String(value)}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 16 }}
        className={`font-display text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </motion.div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function TreeNode({
  label,
  tone,
  delay = 0,
}: {
  label: string;
  tone: "root" | "active" | "miss";
  delay?: number;
}) {
  const cls =
    tone === "root"
      ? "bg-elevated text-foreground border-border"
      : tone === "active"
        ? "bg-primary text-primary-foreground border-transparent shadow-glow"
        : "bg-destructive/20 text-destructive border-destructive/40";
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 320, damping: 18 }}
      className={`flex h-14 min-w-14 items-center justify-center rounded-full border-2 px-3 font-display text-lg font-bold ${cls}`}
    >
      {label}
    </motion.div>
  );
}

function ChildNode({ node, onClick }: { node: TrieNode; onClick: () => void }) {
  return (
    <motion.button
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.15, y: -3 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="group relative flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-border bg-card font-display text-lg font-bold transition-colors hover:border-primary hover:text-primary"
      title={`${node.songIds.length} songs`}
    >
      {node.char === " " ? "␣" : node.char}
      <span className="absolute -bottom-5 text-[10px] font-medium text-muted-foreground">
        {node.songIds.length}
      </span>
    </motion.button>
  );
}

function Connector({ ok, branch }: { ok: boolean; branch?: boolean }) {
  return (
    <motion.span
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      className={`my-1 block w-0.5 origin-top ${branch ? "h-5" : "h-4"} ${
        ok ? "bg-primary" : "bg-border"
      }`}
    />
  );
}
