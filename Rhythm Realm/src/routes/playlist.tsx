import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ExternalLink, Music } from "lucide-react";

export const Route = createFileRoute("/playlist")({
  head: () => ({
    meta: [
      { title: "Curated Playlist — Saregama" },
      { name: "description", content: "Listen to a curated Spotify playlist right inside Saregama." },
    ],
  }),
  component: Playlist,
});

function Playlist() {
  return (
    <div className="px-4 py-6 md:px-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954]/20 text-[#1DB954]">
            <Music size={20} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold">Spotify Curated Playlist</h1>
            <p className="text-sm text-muted-foreground">
              Hand-picked tracks streamed directly from Spotify.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-card p-1 shadow-lg"
      >
        <iframe
          title="Spotify Embed: Recommendation Playlist"
          src="https://open.spotify.com/embed/playlist/0PThJwCBW45qx06rShe0oZ?utm_source=generator&theme=0"
          width="100%"
          height="500"
          style={{ minHeight: "360px", borderRadius: "1.25rem" }}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="block"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ExternalLink size={14} />
        <span>
          Playlist opens inside an official Spotify embed. You need Spotify Premium for full tracks.
        </span>
      </motion.div>
    </div>
  );
}
