import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Share2, Download, Printer, Edit3, Camera, Mic, FileImage, AlertTriangle, Pill, Mail, Plus, GraduationCap, Stethoscope, Activity, FlaskConical } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

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

  const [diagnosticStudies, setDiagnosticStudies] = useState<DiagnosticStudy[]>([
    { type: "X-Ray", interpretation: "No acute abnormalities. Lungs clear. Heart size normal.", aiAssisted: true },
    { type: "ECG", interpretation: "Normal sinus rhythm. No ST changes.", aiAssisted: false },
  ]);
  
  const [patientEducation, setPatientEducation] = useState(
    "Migraines can be triggered by stress, certain foods, hormonal changes, and sleep disruptions. Keep a headache diary to identify your triggers. Stay hydrated, maintain regular sleep patterns, and avoid known triggers."
  );
  
  const [redFlags, setRedFlags] = useState(
    "Seek immediate medical attention if you experience:\n• Sudden severe headache (thunderclap)\n• Fever with headache and stiff neck\n• Vision changes or loss\n• Weakness or numbness on one side\n• Confusion or difficulty speaking\n• Headache after head injury"
  );
  
  const [medications, setMedications] = useState<Medication[]>([
    { name: "Sumatriptan", dose: "50mg", frequency: "As needed", duration: "PRN", instructions: "Take at onset of migraine. Max 2 doses/24h." },
    { name: "Ibuprofen", dose: "400mg", frequency: "Every 6 hours", duration: "5 days", instructions: "Take with food." },
  ]);
  
  const [patientEmail, setPatientEmail] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [medDialogOpen, setMedDialogOpen] = useState(false);
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);
  
  const [newMed, setNewMed] = useState<Medication>({ name: "", dose: "", frequency: "", duration: "", instructions: "" });
  const [newStudy, setNewStudy] = useState<DiagnosticStudy>({ type: "", interpretation: "", aiAssisted: false });

  const handleAddMedication = () => {
    if (newMed.name && newMed.dose) {
      setMedications([...medications, newMed]);
      setNewMed({ name: "", dose: "", frequency: "", duration: "", instructions: "" });
      setMedDialogOpen(false);
    }
  };

  const handleAddStudy = () => {
    if (newStudy.type && newStudy.interpretation) {
      setDiagnosticStudies([...diagnosticStudies, newStudy]);
      setNewStudy({ type: "", interpretation: "", aiAssisted: false });
      setStudyDialogOpen(false);
    }
  };

  const handleSendEmail = () => {
    if (patientEmail) {
      setEmailDialogOpen(false);
    }
  };

  const getStudyIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "x-ray": return <FileImage className="w-4 h-4" />;
      case "ecg": return <Activity className="w-4 h-4" />;
      case "lab": return <FlaskConical className="w-4 h-4" />;
      default: return <Stethoscope className="w-4 h-4" />;
    }
  };

  return (
    <MobileLayout showNav={false}>
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800">
        <Link href="/cases" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" data-testid="button-back">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </Link>
        <span className="font-semibold text-sm">Case #{id}</span>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Share2 className="w-4 h-4" />
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 pb-24">
          {/* Patient Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-heading font-bold">Sarah Connor</h1>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Completed</Badge>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-3">
              <span>34 yrs</span>
              <span>•</span>
              <span>Female</span>
              <span>•</span>
              <span>Oct 25, 2023 - 14:30</span>
            </div>
          </div>

          {/* AI Summary Card */}
          <Card className="border-none shadow-md bg-white dark:bg-slate-900 mb-6 overflow-hidden">
             <div className="h-1 bg-gradient-to-r from-primary to-accent" />
             <CardContent className="p-5 space-y-6">
                
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chief Complaint (CC)</h3>
                  <p className="text-sm leading-relaxed text-foreground">
                    Patient presents with persistent migraine headaches accompanied by visual aura and photosensitivity.
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">History of Present Illness (HPI)</h3>
                  <p className="text-sm leading-relaxed text-foreground">
                    The patient reports a 3-week history of throbbing left-sided headaches. She describes the pain as 7/10 in severity. The headaches are preceded by visual disturbances (flashing lights) lasting 15-20 minutes. Nausea is present during episodes. OTC analgesics have provided minimal relief. No history of head trauma.
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Review of Systems (ROS)</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-foreground">
                    <div>
                      <span className="font-semibold text-xs text-muted-foreground block mb-1">General</span>
                      <p>Negative for fever, chills, weight loss.</p>
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-muted-foreground block mb-1">HEENT</span>
                      <p>Positive for photophobia. Negative for neck stiffness.</p>
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-muted-foreground block mb-1">Neurologic</span>
                      <p>Positive for visual aura (flashing lights).</p>
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-muted-foreground block mb-1">GI</span>
                      <p>Positive for nausea. Negative for vomiting.</p>
                    </div>
                  </div>
                </section>

                <Separator />

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Physical Exam</h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg p-3 text-sm text-foreground space-y-2">
                    <p><span className="font-semibold">Vitals:</span> BP 120/80, HR 72, RR 16, Temp 98.6°F</p>
                    <p><span className="font-semibold">General:</span> Alert and oriented x3, in mild distress due to pain.</p>
                    <p><span className="font-semibold">HEENT:</span> PERRL, EOMI. Fundoscopic exam normal. No papilledema.</p>
                    <p><span className="font-semibold">Neuro:</span> Cranial nerves II-XII intact. Strength 5/5 in all extremities. Sensation intact. Gait normal. Negative Kernig/Brudzinski.</p>
                  </div>
                </section>

                <Separator />

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assessment / Differential Diagnosis</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <span className="text-sm text-foreground">Migraine with aura (primary suspect)</span>
                      <span className="text-xs font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">G43.109</span>
                    </li>
                    <li className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <span className="text-sm text-foreground">Tension-type headache</span>
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded">G44.209</span>
                    </li>
                    <li className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <span className="text-sm text-foreground">Cluster headache</span>
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded">G44.009</span>
                    </li>
                  </ul>
                </section>

                <Separator />

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Plan</h3>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-md text-sm font-mono text-foreground space-y-2">
                    <p>1. Start Sumatriptan 50mg at onset of headache.</p>
                    <p>2. Keep headache diary for 2 weeks.</p>
                    <p>3. MRI Brain to rule out secondary causes due to new onset.</p>
                    <p>4. Follow up in 3 weeks.</p>
                  </div>
                </section>
             </CardContent>
          </Card>

          {/* Diagnostic Studies */}
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
                {diagnosticStudies.map((study, idx) => (
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
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Patient Education */}
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
                className="min-h-[100px] bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                placeholder="Add patient education notes..."
                data-testid="input-patient-education"
              />
            </CardContent>
          </Card>

          {/* Treatment Red Flags */}
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
                className="min-h-[140px] bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-sm"
                placeholder="List warning signs that require immediate medical attention..."
                data-testid="input-red-flags"
              />
            </CardContent>
          </Card>

          {/* Discharge Medications */}
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
                {medications.map((med, idx) => (
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
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Email to Patient */}
          <Card className="border-none shadow-md bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-sky-500 to-blue-500" />
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-sky-500" />
                Send to Patient
              </h3>
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
                          Warning signs (red flags)
                        </li>
                      </ul>
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-muted-foreground">Sending to:</p>
                        <p className="text-sm font-medium">{patientEmail}</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSendEmail} className="bg-sky-500 hover:bg-sky-600" data-testid="button-confirm-send-email">
                        Send Email
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Attachments
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                <span className="text-xs text-slate-400">Scan 1</span>
              </div>
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                 <span className="text-xs text-slate-400">Lab Result</span>
              </div>
              <button className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1 shadow-lg shadow-primary/20" size="lg">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Note
            </Button>
            <Button variant="outline" size="lg" className="px-4">
              <Download className="w-4 h-4" />
            </Button>
             <Button variant="outline" size="lg" className="px-4">
              <Printer className="w-4 h-4" />
            </Button>
          </div>

        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
