import { MobileLayout } from "@/components/MobileLayout";
import { CaseCard, Case } from "@/components/CaseCard";
import { Input } from "@/components/ui/input";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ALL_CASES: Case[] = [
  { id: "1", patientName: "Sarah Connor", age: 34, gender: "F", chiefComplaint: "Persistent migraine and visual aura", date: "Today", status: "completed" },
  { id: "2", patientName: "James Howlett", age: 45, gender: "M", chiefComplaint: "Chronic back pain, lower lumbar", date: "Yesterday", status: "processing" },
  { id: "3", patientName: "Diana Prince", age: 29, gender: "F", chiefComplaint: "Annual physical checkup", date: "Oct 24", status: "draft" },
  { id: "4", patientName: "Bruce Wayne", age: 42, gender: "M", chiefComplaint: "Multiple contusions, fatigue", date: "Oct 22", status: "completed" },
  { id: "5", patientName: "Clark Kent", age: 35, gender: "M", chiefComplaint: "Allergic reaction to unknown substance", date: "Oct 20", status: "completed" },
  { id: "6", patientName: "Tony Stark", age: 48, gender: "M", chiefComplaint: "Chest pain, palpitations", date: "Oct 18", status: "draft" },
];

export default function CasesPage() {
  return (
    <MobileLayout>
      <header className="px-6 pt-12 pb-2 bg-background sticky top-0 z-10">
        <h1 className="text-2xl font-heading font-bold mb-4">Case History</h1>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200"
            />
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="px-6 pb-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg text-xs">All</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg text-xs">Done</TabsTrigger>
            <TabsTrigger value="draft" className="rounded-lg text-xs">Drafts</TabsTrigger>
            <TabsTrigger value="processing" className="rounded-lg text-xs">Proc.</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-3 mt-0">
            {ALL_CASES.map(c => <CaseCard key={c.id} data={c} />)}
          </TabsContent>
          <TabsContent value="completed" className="space-y-3 mt-0">
            {ALL_CASES.filter(c => c.status === 'completed').map(c => <CaseCard key={c.id} data={c} />)}
          </TabsContent>
          <TabsContent value="draft" className="space-y-3 mt-0">
             {ALL_CASES.filter(c => c.status === 'draft').map(c => <CaseCard key={c.id} data={c} />)}
          </TabsContent>
          <TabsContent value="processing" className="space-y-3 mt-0">
             {ALL_CASES.filter(c => c.status === 'processing').map(c => <CaseCard key={c.id} data={c} />)}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}
