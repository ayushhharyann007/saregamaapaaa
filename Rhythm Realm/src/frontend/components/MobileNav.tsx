import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Network, Music4, Music2 } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/create", label: "Create", icon: Music4 },
  { to: "/how-search-works", label: "Trie", icon: Network },
];

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Music2 size={18} />
        </span>
        <span className="font-display text-lg font-extrabold text-gradient">Saregama</span>
      </Link>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      {links.map((l) => {
        const active = pathname === l.to;
        return (
          <Link
            key={l.to}
            to={l.to}
            className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <l.icon size={20} />
            <span>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
