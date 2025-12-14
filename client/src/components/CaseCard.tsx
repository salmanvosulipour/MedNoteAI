import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";

export interface Case {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  date: string;
  status: 'draft' | 'completed' | 'processing';
}

export function CaseCard({ data }: { data: Case }) {
  const statusColors = {
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  };

  return (
    <Link href={`/cases/${data.id}`} className="block group" data-testid={`card-case-${data.id}`}>
      <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {data.patientName}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <span>{data.age} yrs</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{data.gender}</span>
              </p>
            </div>
            <Badge variant="secondary" className={statusColors[data.status]}>
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </Badge>
          </div>
          
          <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
              CC: {data.chiefComplaint}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {data.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                14:30
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
