import { type Song } from "@/backend/data/songs";
import { Music } from "lucide-react";
import { useState } from "react";

export function SongCover({
  song,
  size,
  fill = false,
  className = "",
}: {
  song: Song;
  size?: number;
  fill?: boolean;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const initials = song.title.slice(0, 1).toUpperCase();
  const dim = fill ? undefined : size ?? 160;
  const showImg = song.artwork && !error;
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg ${fill ? "h-full w-full" : ""} ${className}`}
      style={{
        width: dim,
        height: dim,
        background: `linear-gradient(135deg, ${song.colors[0]}, ${song.colors[1]})`,
      }}
    >
      {showImg ? (
        <img
          src={song.artwork}
          alt={`${song.title} cover`}
          loading="lazy"
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <span className="font-display text-4xl font-extrabold text-white/90 drop-shadow-lg">
            {initials}
          </span>
          <Music className="absolute bottom-2 right-2 text-white/40" size={20} />
        </>
      )}
    </div>
  );
}
