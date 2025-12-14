import { MobileLayout } from "@/components/MobileLayout";
import { CaseCard } from "@/components/CaseCard";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Loader2, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { fetchCases, type Case } from "@/lib/api";
import { useState } from "react";

export default function CasesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => fetchCases("demo-user"),
  });

  const filteredCases = cases.filter((c: Case) => 
    c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mapCase = (c: Case) => ({
    id: c.id,
    patientName: c.patientName,
    age: c.age,
    gender: c.gender === "M" ? "M" : c.gender === "F" ? "F" : "O" as const,
    chiefComplaint: c.chiefComplaint,
    date: new Date(c.recordedAt).toLocaleDateString(),
    status: c.status as "draft" | "processing" | "completed",
  });

  const completedCases = filteredCases.filter((c: Case) => c.status === "completed");
  const draftCases = filteredCases.filter((c: Case) => c.status === "draft");
  const processingCases = filteredCases.filter((c: Case) => c.status === "processing");

  return (
    <MobileLayout>
      <header className="px-6 pt-12 pb-2 bg-background sticky top-0 z-10">
        <h1 className="text-2xl font-heading font-bold mb-4">Case History</h1>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search patients..." 
              className="pl-9 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-cases"
            />
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50" data-testid="button-filter">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">No Cases Yet</h3>
            <p className="text-sm text-slate-400">Start a new recording session to create your first case</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg text-xs" data-testid="tab-all">All ({filteredCases.length})</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg text-xs" data-testid="tab-completed">Done ({completedCases.length})</TabsTrigger>
              <TabsTrigger value="draft" className="rounded-lg text-xs" data-testid="tab-draft">Drafts ({draftCases.length})</TabsTrigger>
              <TabsTrigger value="processing" className="rounded-lg text-xs" data-testid="tab-processing">Proc. ({processingCases.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-3 mt-0">
              {filteredCases.map((c: Case) => <CaseCard key={c.id} data={mapCase(c)} />)}
            </TabsContent>
            <TabsContent value="completed" className="space-y-3 mt-0">
              {completedCases.map((c: Case) => <CaseCard key={c.id} data={mapCase(c)} />)}
            </TabsContent>
            <TabsContent value="draft" className="space-y-3 mt-0">
              {draftCases.map((c: Case) => <CaseCard key={c.id} data={mapCase(c)} />)}
            </TabsContent>
            <TabsContent value="processing" className="space-y-3 mt-0">
              {processingCases.map((c: Case) => <CaseCard key={c.id} data={mapCase(c)} />)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MobileLayout>
  );
}
