import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
}

export function MobileLayout({ children, showNav = true, className = "" }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center items-start relative overflow-hidden">
      {/* iPad ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-slate-100 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-200/30 dark:bg-blue-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl" />
      </div>

      {/* Mobile Frame Constraint — comfortable on iPad with shadow and border */}
      <div className="relative w-full max-w-md md:max-w-lg lg:max-w-xl bg-background min-h-screen md:min-h-0 md:h-screen shadow-2xl md:shadow-[0_0_80px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden md:border-x border-slate-200 dark:border-slate-800 md:my-0">
        <main className={`flex-1 flex flex-col ${className} ${showNav ? 'pb-20' : ''}`}>
          {children}
        </main>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
