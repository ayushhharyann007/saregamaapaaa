import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Library, Network, Music2, ListMusic, Music4 } from "lucide-react";
import { motion } from "framer-motion";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/create", label: "Make a Song", icon: Music4 },
  { to: "/how-search-works", label: "How Search Works", icon: Network },
  { to: "/playlist", label: "Curated Playlist", icon: ListMusic },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-2 p-3 md:flex">
      <Link to="/" className="mb-2 flex items-center gap-2 px-3 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Music2 size={20} />
        </span>
        <span className="font-display text-xl font-extrabold text-gradient">Saregama</span>
      </Link>
      <nav className="flex flex-col gap-1 rounded-xl bg-card p-2">
        {links.map((l) => {
          const active = pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              className="relative flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-elevated"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <l.icon size={20} className={`relative z-10 ${active ? "text-primary" : ""}`} />
              <span className={`relative z-10 ${active ? "text-foreground" : ""}`}>{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-2 flex flex-1 flex-col gap-3 rounded-xl bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Library size={20} /> Your Library
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground/70">
          Powered by a Trie-based search engine for instant Bollywood song
          suggestions.
        </p>
      </div>
    </aside>
  );
}
