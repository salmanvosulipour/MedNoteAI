import { MobileLayout } from "@/components/MobileLayout";
import { CaseCard } from "@/components/CaseCard";
import { Mic, Search, Plus, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import heroBg from "@assets/generated_images/futuristic_medical_hero_gradient.png";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCases, type Case } from "@/lib/api";

export default function HomePage() {
  const [avatar, setAvatar] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  const [userName, setUserName] = useState("Dr. Smith");

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => fetchCases("demo-user"),
  });

  const recentCases = cases.slice(0, 3);

  useEffect(() => {
    const savedAvatar = localStorage.getItem("user-avatar");
    const savedName = localStorage.getItem("user-fullname");
    if (savedAvatar) setAvatar(savedAvatar);
    if (savedName) setUserName(savedName.split(" ").pop() || "Doctor");

    const handleStorageChange = () => {
       const updated = localStorage.getItem("user-avatar");
       const updatedName = localStorage.getItem("user-fullname");
       if (updated) setAvatar(updated);
       if (updatedName) setUserName(updatedName.split(" ").pop() || "Doctor");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <MobileLayout>
      <header className="relative px-6 pt-16 pb-12 overflow-hidden rounded-b-[40px] shadow-2xl shadow-blue-900/5 mb-8">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} className="w-full h-full object-cover opacity-90" alt="Hero" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/90 dark:from-slate-900/60 dark:to-slate-900/90 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-sm text-slate-500 font-medium tracking-wide uppercase mb-1">{getGreeting()}</p>
              <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">{userName}</h1>
            </div>
            <Link href="/profile" className="w-12 h-12 rounded-2xl bg-white/50 backdrop-blur-md border border-white/60 shadow-lg overflow-hidden p-0.5 hover:scale-105 transition-transform duration-300" data-testid="link-profile">
              <img src={avatar} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
            </Link>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search patient history..." 
              className="pl-12 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/40 dark:border-white/10 h-14 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/20 text-base transition-all focus:scale-[1.02]"
              data-testid="input-search"
            />
          </div>
        </div>
      </header>

      <div className="px-6 space-y-8 pb-8">
        <div className="grid grid-cols-2 gap-5">
          <Link href="/record" className="relative overflow-hidden flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300 group" data-testid="link-new-session">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform duration-500">
              <Mic className="w-7 h-7 text-white fill-white/20" />
            </div>
            <span className="font-bold text-lg tracking-tight">New Session</span>
            <span className="text-xs text-blue-100 mt-1 font-medium">Auto-Scribe</span>
          </Link>
          
          <Link href="/cases" className="relative overflow-hidden flex flex-col items-center justify-center p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group" data-testid="link-cases">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Plus className="w-7 h-7 text-slate-600 dark:text-slate-300" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">All Cases</span>
            <span className="text-xs text-muted-foreground mt-1 font-medium">{cases.length} Records</span>
          </Link>
        </div>

        <Link href="/subscription" className="block group" data-testid="link-subscription">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-white p-1">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 opacity-20 group-hover:opacity-30 transition-opacity duration-500 animate-gradient-x" />
            <div className="relative bg-slate-950 dark:bg-slate-100 rounded-[20px] p-5 flex items-center justify-between">
              <div>
                 <h3 className="font-bold text-white dark:text-slate-900 text-lg">Pro Access</h3>
                 <p className="text-slate-400 dark:text-slate-600 text-xs mt-1">Unlock unlimited AI power</p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider group-hover:bg-amber-500 group-hover:text-white transition-colors">
                Upgrade
              </div>
            </div>
          </div>
        </Link>

        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h2 className="text-xl font-heading font-bold text-foreground">Recent Cases</h2>
            <Link href="/cases" className="text-sm text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="link-view-all">View All</Link>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : recentCases.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              <Mic className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">No Cases Yet</h3>
              <p className="text-sm text-slate-400">Start your first recording to create a case</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCases.map((c: Case, i: number) => (
                <div key={c.id} style={{ animationDelay: `${i * 100}ms` }} className="animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-backwards">
                   <CaseCard data={{
                     id: c.id,
                     patientName: c.patientName,
                     age: c.age,
                     gender: c.gender === "M" ? "M" : c.gender === "F" ? "F" : "O",
                     chiefComplaint: c.chiefComplaint,
                     date: new Date(c.recordedAt).toLocaleDateString(),
                     status: c.status as "draft" | "processing" | "completed",
                   }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
