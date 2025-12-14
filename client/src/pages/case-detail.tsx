import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Share2, AlertTriangle, Pill, Mail, Plus, GraduationCap, Stethoscope, Activity, FlaskConical, FileImage, Loader2, CheckCircle, Download, Printer } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchCase, updateCase, sendEmailSummary, invalidateCase, type Case } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type DiagnosticStudy = {
  type: string;
  imageUrl?: string;
  interpretation: string;
  aiAssisted: boolean;
};

type Medication = {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export default function CaseDetailPage() {
  const [, params] = useRoute("/cases/:id");
  const id = params?.id || "new";
  const { toast } = useToast();

  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ["case", id],
    queryFn: () => fetchCase(id),
    enabled: id !== "new",
  });

  const [diagnosticStudies, setDiagnosticStudies] = useState<DiagnosticStudy[]>([]);
  const [patientEducation, setPatientEducation] = useState("");
  const [redFlags, setRedFlags] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patientEmail, setPatientEmail] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [medDialogOpen, setMedDialogOpen] = useState(false);
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);
  const [newMed, setNewMed] = useState<Medication>({ name: "", dose: "", frequency: "", duration: "", instructions: "" });
  const [newStudy, setNewStudy] = useState<DiagnosticStudy>({ type: "", interpretation: "", aiAssisted: false });

  useEffect(() => {
    if (caseData) {
      setDiagnosticStudies(caseData.diagnosticStudies || []);
      setPatientEducation(caseData.patientEducation || "");
      setRedFlags(caseData.treatmentRedFlags || "");
      setMedications(caseData.dischargeMedications || []);
      setPatientEmail(caseData.patientEmail || "");
    }
  }, [caseData]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Case>) => updateCase(id, data),
    onSuccess: () => {
      invalidateCase(id);
    },
  });

  const emailMutation = useMutation({
    mutationFn: ({ email }: { email: string }) => sendEmailSummary(id, email, "Dr. Provider"),
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: `Case summary sent to ${patientEmail}`,
      });
      setEmailDialogOpen(false);
      invalidateCase(id);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddMedication = () => {
    if (newMed.name && newMed.dose) {
      const updated = [...medications, newMed];
      setMedications(updated);
      updateMutation.mutate({ dischargeMedications: updated });
      setNewMed({ name: "", dose: "", frequency: "", duration: "", instructions: "" });
      setMedDialogOpen(false);
    }
  };

  const handleAddStudy = () => {
    if (newStudy.type && newStudy.interpretation) {
      const updated = [...diagnosticStudies, newStudy];
      setDiagnosticStudies(updated);
      updateMutation.mutate({ diagnosticStudies: updated });
      setNewStudy({ type: "", interpretation: "", aiAssisted: false });
      setStudyDialogOpen(false);
    }
  };

  const handleSendEmail = () => {
    if (patientEmail) {
      emailMutation.mutate({ email: patientEmail });
    }
  };

  const generateCaseSummaryText = () => {
    if (!caseData) return "";
    
    let summary = `MEDICAL CASE SUMMARY\n`;
    summary += `${"=".repeat(50)}\n\n`;
    summary += `Patient: ${caseData.patientName}\n`;
    summary += `Age: ${caseData.age} years | Gender: ${caseData.gender}\n`;
    summary += `Date: ${caseData.recordedAt ? format(new Date(caseData.recordedAt), "MMMM d, yyyy - HH:mm") : "N/A"}\n`;
    summary += `Status: ${caseData.status}\n\n`;
    
    summary += `CHIEF COMPLAINT\n${"-".repeat(30)}\n${caseData.chiefComplaint || "Not recorded"}\n\n`;
    summary += `HISTORY OF PRESENT ILLNESS (HPI)\n${"-".repeat(30)}\n${caseData.hpi || "Not recorded"}\n\n`;
    
    if (caseData.ros && Object.keys(caseData.ros).length > 0) {
      summary += `REVIEW OF SYSTEMS (ROS)\n${"-".repeat(30)}\n`;
      Object.entries(caseData.ros).forEach(([system, findings]) => {
        summary += `${system}: ${findings}\n`;
      });
      summary += "\n";
    }
    
    summary += `PHYSICAL EXAM\n${"-".repeat(30)}\n${caseData.physicalExam || "Not recorded"}\n\n`;
    
    if (caseData.differentialDiagnosis && caseData.differentialDiagnosis.length > 0) {
      summary += `DIFFERENTIAL DIAGNOSIS\n${"-".repeat(30)}\n`;
      caseData.differentialDiagnosis.forEach((dx, i) => {
        summary += `${i + 1}. ${dx.diagnosis} (${dx.icdCode})\n`;
      });
      summary += "\n";
    }
    
    summary += `PLAN\n${"-".repeat(30)}\n${caseData.plan || "Not recorded"}\n\n`;
    
    if (medications.length > 0) {
      summary += `MEDICATIONS\n${"-".repeat(30)}\n`;
      medications.forEach((med) => {
        summary += `• ${med.name} ${med.dose} - ${med.frequency} for ${med.duration}\n`;
        if (med.instructions) summary += `  Instructions: ${med.instructions}\n`;
      });
      summary += "\n";
    }
    
    if (patientEducation) {
      summary += `PATIENT EDUCATION\n${"-".repeat(30)}\n${patientEducation}\n\n`;
    }
    
    if (redFlags) {
      summary += `WARNING SIGNS (RED FLAGS)\n${"-".repeat(30)}\n${redFlags}\n\n`;
    }
    
    return summary;
  };

  const handleDownload = () => {
    const summary = generateCaseSummaryText();
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `case-${caseData?.patientName?.replace(/\s+/g, "-") || id}-summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Downloaded",
      description: "Case summary downloaded as text file.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getStudyIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "x-ray": return <FileImage className="w-4 h-4" />;
      case "ecg": return <Activity className="w-4 h-4" />;
      case "lab": return <FlaskConical className="w-4 h-4" />;
      default: return <Stethoscope className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Completed</Badge>;
      case "draft":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">Draft</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <MobileLayout showNav={false}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading case...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (id === "new") {
    return (
      <MobileLayout showNav={false}>
        <div className="flex flex-col items-center justify-center h-full p-6">
          <Stethoscope className="w-12 h-12 text-primary mb-4" />
          <h2 className="text-lg font-semibold mb-2">Start New Case</h2>
          <p className="text-muted-foreground text-center mb-4">
            Use the Record button to start a new patient case with voice recording.
          </p>
          <Link href="/record">
            <Button>Go to Record</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  if (error || !caseData) {
    return (
      <MobileLayout showNav={false}>
        <div className="flex flex-col items-center justify-center h-full p-6">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold mb-2">Case Not Found</h2>
          <p className="text-muted-foreground text-center mb-4">
            The case you're looking for doesn't exist or couldn't be loaded.
          </p>
          <Link href="/cases">
            <Button>Back to Cases</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  const recordedDate = caseData.recordedAt ? new Date(caseData.recordedAt) : new Date();
  const ros = caseData.ros || {};
  const ddx = caseData.differentialDiagnosis || [];

  return (
    <MobileLayout showNav={false}>
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800">
        <Link href="/cases" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" data-testid="button-back">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </Link>
        <span className="font-semibold text-sm">Case #{id.slice(0, 8)}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleDownload} data-testid="button-download">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handlePrint} data-testid="button-print">
            <Printer className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-share">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 pb-24">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-heading font-bold" data-testid="text-patient-name">{caseData.patientName}</h1>
              {getStatusBadge(caseData.status)}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-3">
              <span>{caseData.age} yrs</span>
              <span>•</span>
              <span>{caseData.gender}</span>
              <span>•</span>
              <span>{format(recordedDate, "MMM d, yyyy - HH:mm")}</span>
            </div>
          </div>

          <Card className="border-none shadow-md bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary to-accent" />
            <CardContent className="p-5 space-y-6">
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chief Complaint (CC)</h3>
                <p className="text-sm leading-relaxed text-foreground" data-testid="text-chief-complaint">
                  {caseData.chiefComplaint || "No chief complaint recorded"}
                </p>
              </section>

              <Separator />

              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">History of Present Illness (HPI)</h3>
                <p className="text-sm leading-relaxed text-foreground" data-testid="text-hpi">
                  {caseData.hpi || "No HPI recorded"}
                </p>
              </section>

              <Separator />

              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Review of Systems (ROS)</h3>
                {Object.keys(ros).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 text-sm text-foreground">
                    {Object.entries(ros).map(([system, findings]) => (
                      <div key={system}>
                        <span className="font-semibold text-xs text-muted-foreground block mb-1">{system}</span>
                        <p>{findings}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No ROS recorded</p>
                )}
              </section>

              <Separator />

              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Physical Exam</h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg p-3 text-sm text-foreground">
                  <p className="whitespace-pre-wrap" data-testid="text-physical-exam">
                    {caseData.physicalExam || "No physical exam recorded"}
                  </p>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assessment / Differential Diagnosis</h3>
                {ddx.length > 0 ? (
                  <ul className="space-y-2">
                    {ddx.map((dx, idx) => (
                      <li key={idx} className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <span className="text-sm text-foreground">{dx.diagnosis}</span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${idx === 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {dx.icdCode}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {caseData.assessment || "No assessment recorded"}
                  </p>
                )}
              </section>

              <Separator />

              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Plan</h3>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-md text-sm font-mono text-foreground">
                  <p className="whitespace-pre-wrap" data-testid="text-plan">
                    {caseData.plan || "No plan recorded"}
                  </p>
                </div>
              </section>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-500" />
                  Diagnostic Studies
                </h3>
                <Dialog open={studyDialogOpen} onOpenChange={setStudyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2" data-testid="button-add-study">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Diagnostic Study</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Study Type</Label>
                        <Select value={newStudy.type} onValueChange={(v) => setNewStudy({...newStudy, type: v})}>
                          <SelectTrigger data-testid="select-study-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="X-Ray">X-Ray</SelectItem>
                            <SelectItem value="ECG">ECG</SelectItem>
                            <SelectItem value="Lab">Lab Results</SelectItem>
                            <SelectItem value="CT">CT Scan</SelectItem>
                            <SelectItem value="MRI">MRI</SelectItem>
                            <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Interpretation</Label>
                        <Textarea 
                          placeholder="Enter findings and interpretation..."
                          value={newStudy.interpretation}
                          onChange={(e) => setNewStudy({...newStudy, interpretation: e.target.value})}
                          data-testid="input-study-interpretation"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddStudy} data-testid="button-save-study">Add Study</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-3">
                {diagnosticStudies.length > 0 ? (
                  diagnosticStudies.map((study, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3" data-testid={`study-item-${idx}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStudyIcon(study.type)}
                          <span className="font-medium text-sm">{study.type}</span>
                        </div>
                        {study.aiAssisted && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            AI Interpreted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{study.interpretation}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No diagnostic studies added</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <GraduationCap className="w-4 h-4 text-green-500" />
                Patient Education
              </h3>
              <Textarea 
                value={patientEducation}
                onChange={(e) => setPatientEducation(e.target.value)}
                onBlur={() => updateMutation.mutate({ patientEducation })}
                className="min-h-[100px] bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                placeholder="Add patient education notes..."
                data-testid="input-patient-education"
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Warning Signs (Red Flags)
              </h3>
              <Textarea 
                value={redFlags}
                onChange={(e) => setRedFlags(e.target.value)}
                onBlur={() => updateMutation.mutate({ treatmentRedFlags: redFlags })}
                className="min-h-[140px] bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-sm"
                placeholder="List warning signs that require immediate medical attention..."
                data-testid="input-red-flags"
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Pill className="w-4 h-4 text-violet-500" />
                  Discharge Medications
                </h3>
                <Dialog open={medDialogOpen} onOpenChange={setMedDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2" data-testid="button-add-medication">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Medication</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Medication Name</Label>
                          <Input 
                            placeholder="e.g., Amoxicillin"
                            value={newMed.name}
                            onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                            data-testid="input-med-name"
                          />
                        </div>
                        <div>
                          <Label>Dose</Label>
                          <Input 
                            placeholder="e.g., 500mg"
                            value={newMed.dose}
                            onChange={(e) => setNewMed({...newMed, dose: e.target.value})}
                            data-testid="input-med-dose"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Frequency</Label>
                          <Input 
                            placeholder="e.g., Twice daily"
                            value={newMed.frequency}
                            onChange={(e) => setNewMed({...newMed, frequency: e.target.value})}
                            data-testid="input-med-frequency"
                          />
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <Input 
                            placeholder="e.g., 7 days"
                            value={newMed.duration}
                            onChange={(e) => setNewMed({...newMed, duration: e.target.value})}
                            data-testid="input-med-duration"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Special Instructions</Label>
                        <Textarea 
                          placeholder="e.g., Take with food"
                          value={newMed.instructions}
                          onChange={(e) => setNewMed({...newMed, instructions: e.target.value})}
                          data-testid="input-med-instructions"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddMedication} data-testid="button-save-medication">Add Medication</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {medications.length > 0 ? (
                  medications.map((med, idx) => (
                    <div key={idx} className="bg-violet-50 dark:bg-violet-900/10 rounded-lg p-3 border border-violet-100 dark:border-violet-800/30" data-testid={`medication-item-${idx}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{med.name}</span>
                            <Badge variant="outline" className="text-xs font-mono">{med.dose}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{med.frequency} • {med.duration}</p>
                        </div>
                      </div>
                      {med.instructions && (
                        <p className="text-xs text-violet-700 dark:text-violet-400 mt-2 italic">{med.instructions}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No medications added</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-sky-500" />
                Send to Patient
              </h3>
              
              {caseData.emailStatus?.sentAt && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    Sent to {caseData.emailStatus.recipient} on {format(new Date(caseData.emailStatus.sentAt), "MMM d, yyyy")}
                  </span>
                </div>
              )}
              
              <div className="flex gap-2">
                <Input 
                  type="email"
                  placeholder="patient@email.com"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className="flex-1"
                  data-testid="input-patient-email"
                />
                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-sky-500 hover:bg-sky-600" disabled={!patientEmail} data-testid="button-send-email">
                      <Mail className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Case Summary to Patient</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        This will send a summary including:
                      </p>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-5 h-5 p-0 flex items-center justify-center">✓</Badge>
                          Diagnosis and treatment plan
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-5 h-5 p-0 flex items-center justify-center">✓</Badge>
                          Discharge medications list
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-5 h-5 p-0 flex items-center justify-center">✓</Badge>
                          Patient education materials
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-5 h-5 p-0 flex items-center justify-center">✓</Badge>
                          Warning signs to watch for
                        </li>
                      </ul>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleSendEmail} 
                        disabled={emailMutation.isPending}
                        data-testid="button-confirm-send-email"
                      >
                        {emailMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Summary
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {caseData.transcription && (
            <Card className="border-none shadow-md bg-white dark:bg-slate-900 mb-6 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Stethoscope className="w-4 h-4 text-slate-500" />
                  Original Transcription
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-sm text-muted-foreground max-h-40 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{caseData.transcription}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
