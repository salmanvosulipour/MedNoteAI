import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { CaseCard, Case } from "@/components/CaseCard";
import { Mic, Search, Plus, Filter } from "lucide-react";
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Welcome back,</p>
            <h1 className="text-2xl font-heading font-bold text-foreground">Dr. Smith</h1>
          </div>
          <Link href="/profile">
            <a className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Avatar" />
            </a>
          </Link>
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
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/record">
            <a className="flex flex-col items-center justify-center p-4 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                <Mic className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">New Session</span>
              <span className="text-[10px] opacity-80 mt-0.5">Start Recording</span>
            </a>
          </Link>
          <Link href="/cases">
            <a className="flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 text-primary">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm text-foreground">Manual Note</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Create without Audio</span>
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
