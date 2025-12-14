import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Calendar, FileText, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { fetchCasesByMrn, type Case } from "@/lib/api";
import { format } from "date-fns";

export default function PatientProgressionPage() {
  const [, params] = useRoute("/patients/:mrn");
  const mrn = params?.mrn || "";

  const { data: cases, isLoading, error } = useQuery({
    queryKey: ["patientCases", mrn],
    queryFn: () => fetchCasesByMrn(mrn),
    enabled: !!mrn,
  });

  const sortedCases = cases?.sort((a, b) => 
    new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  ) || [];

  const patientName = sortedCases[0]?.patientName || "Unknown Patient";

  if (isLoading) {
    return (
      <MobileLayout showNav={false}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading patient history...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (error || !cases) {
    return (
      <MobileLayout showNav={false}>
        <div className="flex flex-col items-center justify-center h-full p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Patient Not Found</h2>
          <p className="text-muted-foreground text-center mb-4">
            No records found for this MRN.
          </p>
          <Link href="/cases">
            <Button>Back to Cases</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  if (sortedCases.length === 0) {
    return (
      <MobileLayout showNav={false}>
        <div className="flex flex-col items-center justify-center h-full p-6">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Visits Found</h2>
          <p className="text-muted-foreground text-center mb-4">
            No encounter records found for MRN: {mrn}
          </p>
          <Link href="/cases">
            <Button>Back to Cases</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false}>
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800">
        <Link href="/cases" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" data-testid="button-back">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </Link>
        <span className="font-semibold text-sm">Patient Progression</span>
        <div className="w-9" />
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 pb-24">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-heading font-bold" data-testid="text-patient-name">{patientName}</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">MRN: {mrn}</span>
              <span className="mx-2">•</span>
              <span>{sortedCases.length} visit{sortedCases.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="space-y-4">
            {sortedCases.map((caseItem, idx) => (
              <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                <Card className={`border-none shadow-md bg-white dark:bg-slate-900 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${idx === 0 ? 'ring-2 ring-primary' : ''}`} data-testid={`card-case-${caseItem.id}`}>
                  {idx === 0 && <div className="h-1 bg-gradient-to-r from-primary to-accent" />}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(new Date(caseItem.recordedAt), "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(caseItem.recordedAt), "HH:mm")}
                        </span>
                      </div>
                      {idx === 0 && (
                        <Badge className="bg-primary/10 text-primary border-none text-xs">Latest</Badge>
                      )}
                    </div>

                    <div className="mb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Chief Complaint</h3>
                      <p className="text-sm font-medium text-foreground" data-testid={`text-cc-${caseItem.id}`}>
                        {caseItem.chiefComplaint}
                      </p>
                    </div>

                    {caseItem.differentialDiagnosis && caseItem.differentialDiagnosis.length > 0 && (
                      <div className="mb-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Diagnosis</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{caseItem.differentialDiagnosis[0].diagnosis}</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {caseItem.differentialDiagnosis[0].icdCode}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {caseItem.plan && (
                      <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Plan Summary</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {caseItem.plan}
                        </p>
                      </div>
                    )}

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Case #{caseItem.id.slice(0, 8)}</span>
                      <Badge variant={caseItem.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {caseItem.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
