import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type Song } from "@/backend/data/songs";

interface PlayerState {
  current: Song | null;
  queue: Song[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  play: (song: Song, queue?: Song[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
}

const Ctx = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Song | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVol] = useState(0.8);

  useEffect(() => {
    const a = new Audio();
    a.volume = volume;
    audioRef.current = a;
    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnd = () => nextRef.current();
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextRef = useRef<() => void>(() => {});

  const play = (song: Song, q?: Song[]) => {
    const a = audioRef.current;
    if (!a) return;
    if (q) setQueue(q);
    if (current?.id === song.id) {
      a.play();
      setIsPlaying(true);
      return;
    }
    setCurrent(song);
    a.src = song.audioUrl;
    a.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      a.play();
      setIsPlaying(true);
    }
  };

  const next = () => {
    if (!current) return;
    const idx = queue.findIndex((s) => s.id === current.id);
    const n = queue[(idx + 1) % queue.length];
    if (n) play(n);
  };
  nextRef.current = next;

  const prev = () => {
    if (!current) return;
    const idx = queue.findIndex((s) => s.id === current.id);
    const p = queue[(idx - 1 + queue.length) % queue.length];
    if (p) play(p);
  };

  const seek = (t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
    setProgress(t);
  };

  const setVolume = (v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setVol(v);
  };

  return (
    <Ctx.Provider
      value={{ current, queue, isPlaying, progress, duration, volume, play, toggle, next, prev, seek, setVolume }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
