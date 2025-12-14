import { Link, useLocation } from "wouter";
import { Home, FileText, Mic, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        <Link href="/home">
          <a className={cn("flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors duration-200", isActive("/home") ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <Home className="w-6 h-6" strokeWidth={isActive("/home") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Home</span>
          </a>
        </Link>
        
        <Link href="/cases">
          <a className={cn("flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors duration-200", isActive("/cases") ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <FileText className="w-6 h-6" strokeWidth={isActive("/cases") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Cases</span>
          </a>
        </Link>

        <Link href="/record">
          <a className="flex flex-col items-center justify-center -mt-6">
            <div className={cn("flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform duration-200 active:scale-95", 
              isActive("/record") 
                ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                : "bg-primary text-primary-foreground shadow-primary/30"
            )}>
              <Mic className="w-7 h-7" />
            </div>
            <span className={cn("text-[10px] font-medium mt-1", isActive("/record") ? "text-primary" : "text-muted-foreground")}>Record</span>
          </a>
        </Link>

        <Link href="/profile">
          <a className={cn("flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors duration-200", isActive("/profile") ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <User className="w-6 h-6" strokeWidth={isActive("/profile") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Profile</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
