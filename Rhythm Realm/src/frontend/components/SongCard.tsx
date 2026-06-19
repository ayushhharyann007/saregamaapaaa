import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";
import { type Song, formatPlays } from "@/backend/data/songs";
import { usePlayer } from "@/frontend/context/PlayerContext";
import { SongCover } from "./SongCover";

export function SongCard({ song, queue }: { song: Song; queue?: Song[] }) {
  const { play, toggle, current, isPlaying } = usePlayer();
  const active = current?.id === song.id;
  const playing = active && isPlaying;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative cursor-pointer rounded-xl bg-card p-4 transition-colors hover:bg-elevated"
      onClick={() => (active ? toggle() : play(song, queue))}
    >
      <div className="relative mb-4 aspect-square w-full">
        <SongCover song={song} fill />

        <motion.button
          initial={false}
          animate={{ opacity: active ? 1 : undefined, y: active ? 0 : 8 }}
          className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-glow transition-all group-hover:translate-y-0 group-hover:opacity-100"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} />}
        </motion.button>
      </div>
      <h3 className="truncate font-semibold">{song.title}</h3>
      <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
      <p className="mt-1 text-xs text-muted-foreground/70">{formatPlays(song.plays)} plays</p>
    </motion.div>
  );
}
