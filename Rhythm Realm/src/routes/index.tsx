import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Play, Search, Network, ListMusic, Music4 } from "lucide-react";
import { SongCard } from "@/frontend/components/SongCard";
import { usePlayer } from "@/frontend/context/PlayerContext";
import { songsQueryOptions } from "@/backend/songsQuery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saregama — Bollywood Music Streaming" },
      { name: "description", content: "Stream real Bollywood hits with instant Trie-powered search suggestions. Play songs, explore trending tracks, and see how prefix search works." },
      { property: "og:title", content: "Saregama — Bollywood Music Streaming" },
      { property: "og:description", content: "Stream real Bollywood hits with instant Trie-powered search suggestions." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(songsQueryOptions),
  component: Home,
  pendingComponent: () => (
    <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Loading songs…</div>
  ),
  errorComponent: () => (
    <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Couldn’t load songs. Try refreshing.</div>
  ),
});

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function Home() {
  const { data: songs } = useSuspenseQuery(songsQueryOptions);
  const { play } = usePlayer();
  const trending = [...songs].sort((a, b) => b.plays - a.plays);
  const featured = trending.slice(0, 10);
  const newReleases = [...songs].sort((a, b) => b.year - a.year).slice(0, 10);

  return (
    <div className="px-4 py-6 md:px-8">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-hero relative mb-10 overflow-hidden rounded-3xl border border-border p-8 md:p-14"
      >
        <div className="relative z-10 max-w-2xl">
          <span className="mb-4 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            Trie-powered search engine • Real previews
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-tight md:text-6xl">
            Your Bollywood <span className="text-gradient">soundtrack</span>, instantly.
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Search across real songs with millisecond predictive suggestions —
            and watch the magic of prefix search unfold.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => featured[0] && play(featured[0], featured)}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
            >
              <Play fill="currentColor" size={18} /> Play Top Hit
            </button>
            <Link to="/search" className="flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-semibold transition-colors hover:bg-elevated">
              <Search size={18} /> Search Songs
            </Link>
            <Link to="/create" className="flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-semibold transition-colors hover:bg-elevated">
              <Music4 size={18} /> Make a Song
            </Link>
            <Link to="/how-search-works" className="flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-semibold transition-colors hover:bg-elevated">
              <Network size={18} /> How Search Works
            </Link>
            <Link to="/playlist" className="flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-semibold transition-colors hover:bg-elevated">
              <ListMusic size={18} /> Curated Playlist
            </Link>
          </div>
        </div>
        <motion.div
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--gradient-brand)" }}
        />
      </motion.section>

      <Section title="Trending Now">
        {featured.map((s) => (
          <motion.div key={s.id} variants={item}>
            <SongCard song={s} queue={featured} />
          </motion.div>
        ))}
      </Section>

      <Section title="New Releases">
        {newReleases.map((s) => (
          <motion.div key={s.id} variants={item}>
            <SongCard song={s} queue={newReleases} />
          </motion.div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-display text-2xl font-bold">{title}</h2>
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {children}
      </motion.div>
    </section>
  );
}
