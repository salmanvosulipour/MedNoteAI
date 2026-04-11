import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, FileText, Mic, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "./BottomNav";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  className?: string;
}

function SidebarNav() {
  const [location] = useLocation();
  const isActive = (path: string) => location === path || (path === "/home" && location === "/");

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/cases", icon: FileText, label: "Cases" },
    { href: "/record", icon: Mic, label: "Record" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0 shrink-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Mic className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">MedNote AI</p>
            <p className="text-xs text-muted-foreground">Clinical Assistant</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              isActive(href)
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            data-testid={`sidebar-nav-${label.toLowerCase()}`}
          >
            <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive(href) ? 2.5 : 2} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Web & iOS — same account
        </p>
      </div>
    </aside>
  );
}

export function MobileLayout({ children, showNav = true, className = "" }: MobileLayoutProps) {
  return (
    <>
      {/* Desktop layout: sidebar + content */}
      <div className="hidden lg:flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {showNav && <SidebarNav />}
        <main className={cn("flex-1 overflow-y-auto", className)}>
          <div className="max-w-4xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile layout: centered frame + bottom nav */}
      <div className="lg:hidden min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center items-start relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-slate-100 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-200/30 dark:bg-blue-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-md md:max-w-lg bg-background min-h-screen shadow-2xl md:shadow-[0_0_80px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden md:border-x border-slate-200 dark:border-slate-800">
          <main className={`flex-1 flex flex-col ${className} ${showNav ? 'pb-20' : ''}`}>
            {children}
          </main>
          {showNav && <BottomNav />}
        </div>
      </div>
    </>
  );
}
