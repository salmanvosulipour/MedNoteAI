import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
}

export function MobileLayout({ children, showNav = true, className = "" }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex justify-center bg-slate-50 dark:bg-slate-950">
      {/* Mobile Frame Constraint */}
      <div className="w-full max-w-md bg-background min-h-screen shadow-2xl relative flex flex-col overflow-hidden border-x border-slate-200 dark:border-slate-800">
        <main className={`flex-1 flex flex-col ${className} ${showNav ? 'pb-20' : ''}`}>
          {children}
        </main>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
