import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Calendar, Clock, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { deleteCase } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface Case {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  date: string;
  status: 'draft' | 'completed' | 'processing';
  isDemo?: boolean;
}

export function CaseCard({ data }: { data: Case }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const statusColors = {
    draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteCase(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setShowConfirm(false);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="relative group" data-testid={`card-case-${data.id}`}>
        <Link href={`/cases/${data.id}`} className="block">
          <Card className="border-none shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                      {data.patientName}
                    </h3>
                    {data.isDemo && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 uppercase tracking-wide">
                        Demo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <span>{data.age} yrs</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{data.gender}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <Badge variant="secondary" className={statusColors[data.status]}>
                    {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                  </Badge>
                  <button
                    onClick={handleDeleteClick}
                    data-testid={`button-delete-case-${data.id}`}
                    className="p-1.5 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete case"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Case?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{data.patientName}</strong>'s case will be permanently deleted. This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting} data-testid="button-confirm-delete">
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
