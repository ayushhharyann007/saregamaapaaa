export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  genre: string;
  duration: number; // seconds
  plays: number; // popularity metric (synthesized from relevance)
  audioUrl: string; // 30s preview
  artwork: string; // cover image url
  colors: [string, string]; // fallback cover gradient
}

const PALETTE: [string, string][] = [
  ["#f97316", "#db2777"],
  ["#22c55e", "#0ea5e9"],
  ["#8b5cf6", "#ec4899"],
  ["#ef4444", "#f59e0b"],
  ["#06b6d4", "#3b82f6"],
  ["#eab308", "#84cc16"],
  ["#14b8a6", "#6366f1"],
  ["#f43f5e", "#a855f7"],
];

export function colorsFor(seed: string): [string, string] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export const formatPlays = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(0) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

export const formatTime = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};
