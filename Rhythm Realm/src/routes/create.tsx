import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Square, Trash2, Shuffle, Music4 } from "lucide-react";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Make Your Own Song — Saregama" },
      {
        name: "description",
        content:
          "Compose your own track in the browser with an interactive step sequencer. Tap notes, set the tempo, and play your beat — no downloads, fully free.",
      },
      { property: "og:title", content: "Make Your Own Song — Saregama" },
      {
        property: "og:description",
        content: "Compose your own track with a free in-browser step sequencer.",
      },
    ],
  }),
  component: CreatePage,
});

// Pentatonic scale (sounds good with random presses) across two octaves.
const NOTES = [
  { name: "C5", freq: 523.25 },
  { name: "A4", freq: 440.0 },
  { name: "G4", freq: 392.0 },
  { name: "E4", freq: 329.63 },
  { name: "D4", freq: 293.66 },
  { name: "C4", freq: 261.63 },
  { name: "A3", freq: 220.0 },
  { name: "G3", freq: 196.0 },
];

const STEPS = 16;

function CreatePage() {
  const [grid, setGrid] = useState<boolean[][]>(() =>
    NOTES.map(() => Array(STEPS).fill(false)),
  );
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(110);
  const [activeStep, setActiveStep] = useState(-1);

  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);
  const gridRef = useRef(grid);
  gridRef.current = grid;

  const ensureCtx = () => {
    if (!ctxRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  };

  const playNote = (freq: number, when = 0) => {
    const ctx = ensureCtx();
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  };

  const toggleCell = (row: number, col: number) => {
    setGrid((g) => {
      const next = g.map((r) => r.slice());
      next[row][col] = !next[row][col];
      return next;
    });
    if (!grid[row][col]) playNote(NOTES[row].freq);
  };

  const stop = () => {
    setPlaying(false);
    setActiveStep(-1);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const start = () => {
    ensureCtx();
    setPlaying(true);
    stepRef.current = 0;
    const interval = (60 / bpm / 4) * 1000; // 16th notes
    timerRef.current = setInterval(() => {
      const col = stepRef.current % STEPS;
      setActiveStep(col);
      gridRef.current.forEach((row, i) => {
        if (row[col]) playNote(NOTES[i].freq);
      });
      stepRef.current += 1;
    }, interval);
  };

  // Restart loop when tempo changes mid-playback.
  useEffect(() => {
    if (playing) {
      stop();
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);

  useEffect(() => () => stop(), []);

  const clear = () => {
    stop();
    setGrid(NOTES.map(() => Array(STEPS).fill(false)));
  };

  const randomize = () => {
    setGrid(
      NOTES.map(() => Array.from({ length: STEPS }, () => Math.random() < 0.22)),
    );
  };

  const noteCount = useMemo(
    () => grid.reduce((sum, r) => sum + r.filter(Boolean).length, 0),
    [grid],
  );

  return (
    <div className="px-4 py-6 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 max-w-2xl"
      >
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
          <Music4 size={14} /> Studio • Web Audio
        </span>
        <h1 className="font-display text-3xl font-extrabold md:text-5xl">
          Make your own <span className="text-gradient">song</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          Tap the grid to place notes, hit play, and your beat loops live in the
          browser. Tuned to a pentatonic scale, so it always sounds good.
        </p>
      </motion.div>

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          onClick={playing ? stop : start}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
        >
          {playing ? <Square fill="currentColor" size={18} /> : <Play fill="currentColor" size={18} />}
          {playing ? "Stop" : "Play"}
        </button>
        <button
          onClick={randomize}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 font-semibold transition-colors hover:bg-elevated"
        >
          <Shuffle size={18} /> Surprise me
        </button>
        <button
          onClick={clear}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 font-semibold transition-colors hover:bg-elevated"
        >
          <Trash2 size={18} /> Clear
        </button>
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5">
          <span className="text-xs font-semibold text-muted-foreground">Tempo</span>
          <input
            type="range"
            min={60}
            max={180}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-border accent-primary"
          />
          <span className="w-12 text-sm font-bold tabular-nums">{bpm} bpm</span>
        </div>
        <span className="text-sm text-muted-foreground">{noteCount} notes</span>
      </div>

      {/* Sequencer grid */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card p-3 md:p-4">
        <div className="min-w-[640px]">
          {grid.map((row, r) => (
            <div key={r} className="mb-1.5 flex items-center gap-1.5 last:mb-0">
              <span className="w-9 shrink-0 text-right text-[11px] font-semibold text-muted-foreground">
                {NOTES[r].name}
              </span>
              <div
                className="grid flex-1 gap-1.5"
                style={{ gridTemplateColumns: `repeat(${STEPS}, minmax(0, 1fr))` }}
              >
                {row.map((on, c) => (
                  <button
                    key={c}
                    onClick={() => toggleCell(r, c)}
                    aria-label={`${NOTES[r].name} step ${c + 1}`}
                    className={`h-7 rounded-md border transition-colors md:h-8 ${
                      on
                        ? "border-transparent bg-primary shadow-glow"
                        : "border-border bg-elevated hover:bg-border"
                    } ${activeStep === c ? "ring-2 ring-primary/60" : ""} ${
                      c % 4 === 0 ? "opacity-100" : "opacity-90"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground/70">
        Tip: every 4th column is a beat. Lower rows are deeper notes — stack a
        few for a bassline.
      </p>
    </div>
  );
}
