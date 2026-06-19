import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Search as SearchIcon, Play, Pause, Network } from "lucide-react";
import { formatPlays, formatTime, type Song } from "@/backend/data/songs";
import { buildTrie, suggest } from "@/backend/trie";
import { usePlayer } from "@/frontend/context/PlayerContext";
import { SongCover } from "@/frontend/components/SongCover";
import { songsQueryOptions } from "@/backend/songsQuery";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Songs — Saregama" },
      { name: "description", content: "Predictive Bollywood song search powered by a Trie. Type a few letters and get instant auto-complete suggestions ranked by popularity." },
      { property: "og:title", content: "Search Songs — Saregama" },
      { property: "og:description", content: "Predictive Bollywood song search powered by a Trie." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(songsQueryOptions),
  component: SearchPage,
  pendingComponent: () => (
    <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Loading songs…</div>
  ),
});

function SearchPage() {
  const { data: songs } = useSuspenseQuery(songsQueryOptions);
  const [query, setQuery] = useState("");
  const { play, toggle, current, isPlaying } = usePlayer();

  const songMap = useMemo(() => new Map<string, Song>(songs.map((s) => [s.id, s])), [songs]);
  const trie = useMemo(() => buildTrie(songs), [songs]);

  const suggestionIds = useMemo(() => suggest(trie, query, songMap, 5), [trie, query, songMap]);
  const suggestions = suggestionIds.map((id) => songMap.get(id)!);

  const allMatches = useMemo(() => {
    if (!query.trim()) return [];
    const ids = Array.from(new Set(trie.search(query)));
    return ids.map((id) => songMap.get(id)!).filter(Boolean).sort((a, b) => b.plays - a.plays);
  }, [query, trie, songMap]);

  const resultQueue = allMatches.length ? allMatches : songs;

  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Search</h1>
        <Link to="/how-search-works" className="flex items-center gap-2 text-sm text-primary hover:underline">
          <Network size={16} /> See how it works
        </Link>
      </div>

      <div className="relative mx-auto mt-4 max-w-2xl">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs or artists…"
          className="w-full rounded-full border border-border bg-card py-4 pl-12 pr-4 text-lg outline-none transition-shadow focus:shadow-glow focus:ring-2 focus:ring-primary/50"
        />

        <AnimatePresence>
          {query.trim() && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-card"
            >
              <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Top suggestions
              </p>
              {suggestions.map((s, i) => {
                const idx = s.title.toLowerCase().indexOf(query.toLowerCase());
                return (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => play(s, resultQueue)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-elevated"
                  >
                    <SongCover song={s} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {idx >= 0 ? (
                          <>
                            {s.title.slice(0, idx)}
                            <mark className="bg-primary/30 text-foreground">{s.title.slice(idx, idx + query.length)}</mark>
                            {s.title.slice(idx + query.length)}
                          </>
                        ) : (
                          s.title
                        )}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">{s.artist}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{formatPlays(s.plays)}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        {query.trim() === "" ? (
          <BrowseGenres songs={songs} onPick={setQuery} />
        ) : allMatches.length === 0 ? (
          <p className="text-center text-muted-foreground">No songs found for “{query}”.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {allMatches.length} result{allMatches.length > 1 ? "s" : ""} for “{query}”
            </p>
            <div className="overflow-hidden rounded-2xl border border-border">
              {allMatches.map((s, i) => {
                const active = current?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => (active ? toggle() : play(s, resultQueue))}
                    className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-elevated"
                  >
                    <span className="w-5 text-center text-sm text-muted-foreground">{i + 1}</span>
                    <SongCover song={s} size={44} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate font-medium ${active ? "text-primary" : ""}`}>{s.title}</span>
                      <span className="block truncate text-sm text-muted-foreground">{s.artist} • {s.album}</span>
                    </span>
                    <span className="hidden text-xs text-muted-foreground sm:block">{formatPlays(s.plays)}</span>
                    <span className="w-12 text-right text-xs text-muted-foreground">{formatTime(s.duration)}</span>
                    <span className="text-primary">
                      {active && isPlaying ? <Pause fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BrowseGenres({ songs, onPick }: { songs: Song[]; onPick: (q: string) => void }) {
  const genres = Array.from(new Set(songs.map((s) => s.genre))).slice(0, 9);
  const colors = ["#f97316", "#22c55e", "#8b5cf6", "#ef4444", "#06b6d4", "#eab308", "#14b8a6", "#f43f5e"];
  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-bold">Browse by genre</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {genres.map((g, i) => (
          <motion.button
            key={g}
            whileHover={{ scale: 1.03 }}
            onClick={() => onPick(g)}
            className="relative h-28 overflow-hidden rounded-xl p-4 text-left font-display text-lg font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${colors[i % colors.length]}, ${colors[(i + 2) % colors.length]})` }}
          >
            {g}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
