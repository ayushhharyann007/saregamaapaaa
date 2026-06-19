import { type ReactNode } from "react";
import { Outlet } from "@tanstack/react-router";
import { PlayerProvider } from "@/frontend/context/PlayerContext";
import { Sidebar } from "./Sidebar";
import { PlayerBar } from "./PlayerBar";
import { MobileTopBar, MobileBottomNav } from "./MobileNav";

export function AppLayout({ children }: { children?: ReactNode }) {
  return (
    <PlayerProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="scrollbar-thin flex-1 overflow-y-auto pb-44 md:pb-28">
          <MobileTopBar />
          {children ?? <Outlet />}
        </main>
      </div>
      <PlayerBar />
      <MobileBottomNav />
    </PlayerProvider>
  );
}
