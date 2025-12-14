import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { CaseCard, Case } from "@/components/CaseCard";
import { Mic, Search, Plus, Filter } from "lucide-react";
import tokenIcon from "@assets/generated_images/gold_medical_token_icon.png";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";

const RECENT_CASES: Case[] = [
  { id: "1", patientName: "Sarah Connor", age: 34, gender: "F", chiefComplaint: "Persistent migraine and visual aura", date: "Today", status: "completed" },
  { id: "2", patientName: "James Howlett", age: 45, gender: "M", chiefComplaint: "Chronic back pain, lower lumbar", date: "Yesterday", status: "processing" },
  { id: "3", patientName: "Diana Prince", age: 29, gender: "F", chiefComplaint: "Annual physical checkup", date: "Oct 24", status: "draft" },
];

export default function HomePage() {
  return (
    <MobileLayout>
      <header className="px-6 pt-12 pb-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Welcome back,</p>
            <h1 className="text-2xl font-heading font-bold text-foreground">Dr. Smith</h1>
          </div>
          <div className="flex gap-3">
             {/* Token Counter */}
             <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-700/50">
                <img src={tokenIcon} alt="Token" className="w-5 h-5 drop-shadow-sm" />
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400">1 Free</span>
             </div>
             
             <Link href="/profile">
              <a className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
              </a>
            </Link>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search patients or cases..." 
            className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-11 shadow-sm"
          />
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Upgrade Banner */}
        <Link href="/subscription">
          <a className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-blue-600 p-5 shadow-lg shadow-blue-500/20 group">
             <div className="relative z-10 text-white">
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                  Upgrade to Pro <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full">RECOMMENDED</span>
                </h3>
                <p className="text-blue-100 text-xs max-w-[80%]">Get unlimited recordings and advanced AI diagnosis support.</p>
             </div>
             <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
          </a>
        </Link>

        {/* Quick Actions - Responsive Grid for Tablets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/record">
            <a className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6 text-red-500" />
              </div>
              <span className="font-semibold text-sm text-foreground">Record Vitals</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Use Free Token</span>
            </a>
          </Link>
          <Link href="/cases">
            <a className="col-span-1 md:col-span-2 flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-blue-500" />
              </div>
              <span className="font-semibold text-sm text-foreground">Manual Entry</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Type details</span>
            </a>
          </Link>
        </div>

        {/* Recent Cases */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-lg font-heading font-semibold">Recent Cases</h2>
            <Link href="/cases">
              <a className="text-sm text-primary font-medium hover:underline">View All</a>
            </Link>
          </div>
          
          <div className="space-y-3">
            {RECENT_CASES.map(c => (
              <CaseCard key={c.id} data={c} />
            ))}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
