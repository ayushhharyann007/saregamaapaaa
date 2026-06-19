import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayer } from "@/frontend/context/PlayerContext";
import { formatTime } from "@/backend/data/songs";
import { SongCover } from "./SongCover";

function Equalizer() {
  return (
    <div className="flex items-end gap-0.5">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="eq-bar w-1 rounded-full bg-primary"
          style={{ height: 14, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function PlayerBar() {
  const { current, isPlaying, toggle, next, prev, progress, duration, seek, volume, setVolume } =
    usePlayer();

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-14 z-40 border-t border-border bg-surface/95 px-3 py-2 backdrop-blur md:bottom-0 md:px-4 md:py-3"
        >
          <div className="mx-auto flex max-w-screen-2xl items-center gap-4">
            <div className="flex w-1/4 min-w-0 items-center gap-3">
              <SongCover song={current} size={52} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{current.title}</p>
                <p className="truncate text-xs text-muted-foreground">{current.artist}</p>
              </div>
              {isPlaying && <Equalizer />}
            </div>

            <div className="flex flex-1 flex-col items-center gap-1">
              <div className="flex items-center gap-5">
                <button onClick={prev} className="text-muted-foreground hover:text-foreground">
                  <SkipBack fill="currentColor" size={18} />
                </button>
                <button
                  onClick={toggle}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
                >
                  {isPlaying ? <Pause fill="currentColor" size={18} /> : <Play fill="currentColor" size={18} />}
                </button>
                <button onClick={next} className="text-muted-foreground hover:text-foreground">
                  <SkipForward fill="currentColor" size={18} />
                </button>
              </div>
              <div className="flex w-full max-w-md items-center gap-2">
                <span className="w-9 text-right text-[11px] text-muted-foreground">
                  {formatTime(progress)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={progress}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-primary"
                />
                <span className="w-9 text-[11px] text-muted-foreground">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="hidden w-1/4 items-center justify-end gap-2 md:flex">
              <Volume2 size={18} className="text-muted-foreground" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-border accent-primary"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
