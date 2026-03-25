import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Share2, AlertTriangle, Pill, Plus, GraduationCap, Stethoscope, Activity, FlaskConical, FileImage, Loader2, CheckCircle, Check, Download, Printer, Presentation, TrendingUp, Mic, MicOff, ClipboardCheck, Pencil, RefreshCw, Brain, Heart, Zap, ShieldAlert, ScrollText } from "lucide-react";
import { EditableSection, PhysicalExamDisplay, parseAIContent } from "@/components/EditableSection";
import pptxgen from "pptxgenjs";
import { Link, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchCase, updateCase, invalidateCase, paraphraseNote, type Case } from "@/lib/api";
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

type ExtendedCase = Case & {
  disposition?: string;
  dischargeSummary?: string;
  finalNotes?: string;
};

export default function CaseDetailPage() {
  const [, params] = useRoute("/cases/:id");
  const id = params?.id || "new";
  const { toast } = useToast();

  const { data: caseData, isLoading, error } = useQuery<ExtendedCase>({
    queryKey: ["case", id],
    queryFn: () => fetchCase(id) as Promise<ExtendedCase>,
    enabled: id !== "new",
  });

  const [diagnosticStudies, setDiagnosticStudies] = useState<DiagnosticStudy[]>([]);
  const [patientEducation, setPatientEducation] = useState("");
  const [dispositionDialogOpen, setDispositionDialogOpen] = useState(false);
  const [isRecordingDisposition, setIsRecordingDisposition] = useState(false);
  const [dispositionText, setDispositionText] = useState("");
  const [selectedDisposition, setSelectedDisposition] = useState("");
  const dispositionRecognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medDialogOpen, setMedDialogOpen] = useState(false);
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);
  const [rxPreviewOpen, setRxPreviewOpen] = useState(false);
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [newMed, setNewMed] = useState<Medication>({ name: "", dose: "", frequency: "", duration: "", instructions: "" });
  const [newStudy, setNewStudy] = useState<DiagnosticStudy>({ type: "", interpretation: "", aiAssisted: false });

  // HPI Recapture
  const [hpiDialogOpen, setHpiDialogOpen] = useState(false);
  const [hpiText, setHpiText] = useState("");
  const [isRecordingHpi, setIsRecordingHpi] = useState(false);
  const hpiRecognitionRef = useRef<any>(null);
  const hpiStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (caseData) {
      setDiagnosticStudies(caseData.diagnosticStudies || []);
      setPatientEducation(caseData.patientEducation || "");
      setMedications(caseData.dischargeMedications || []);
      setSelectedDisposition(caseData.disposition || "");
    }
  }, [caseData]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ExtendedCase>) => updateCase(id, data as Partial<Case>),
    onSuccess: () => {
      invalidateCase(id);
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

  const startHpiRecording = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({ title: "Speech recognition not supported", description: "Please use Chrome, Edge, or Safari.", variant: "destructive" });
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      hpiStreamRef.current = stream;
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      let finalText = hpiText;
      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " ";
          else interim += event.results[i][0].transcript;
        }
        setHpiText(finalText + interim);
      };
      recognition.onerror = (e: any) => {
        if (e.error !== "aborted" && e.error !== "no-speech") setIsRecordingHpi(false);
      };
      recognition.onend = () => {
        if (hpiRecognitionRef.current && isRecordingHpi) {
          try { hpiRecognitionRef.current.start(); } catch {}
        }
      };
      hpiRecognitionRef.current = recognition;
      recognition.start();
      setIsRecordingHpi(true);
    }).catch(() => toast({ title: "Microphone access denied", variant: "destructive" }));
  };

  const stopHpiRecording = () => {
    hpiRecognitionRef.current?.stop();
    hpiStreamRef.current?.getTracks().forEach(t => t.stop());
    setIsRecordingHpi(false);
  };

  const saveHpi = () => {
    stopHpiRecording();
    if (hpiText.trim()) {
      updateMutation.mutate({ hpi: hpiText.trim() });
      toast({ title: "HPI Updated", description: "History of Present Illness has been updated." });
    }
    setHpiDialogOpen(false);
  };

  const getDispositionLabel = (value: string) => {
    const labels: Record<string, string> = {
      'discharged': 'Discharged Home',
      'admitted': 'Admitted',
      'transferred': 'Transferred',
      'ama': 'Left AMA',
      'observation': 'Observation'
    };
    return labels[value] || value;
  };

  const generateDischargeSummary = (disposition?: string, notes?: string) => {
    if (!caseData) return "";
    
    let summary = "";
    
    // Disposition
    const disp = disposition || selectedDisposition;
    if (disp) {
      summary += `DISPOSITION: ${getDispositionLabel(disp)}\n\n`;
    }
    
    // Notes from voice/text input (use finalNotes field, NOT assessment)
    const dictatedNotes = notes || dispositionText;
    if (dictatedNotes && dictatedNotes.trim()) {
      summary += "FINAL NOTES:\n" + dictatedNotes.trim() + "\n\n";
    }
    
    // Diagnosis
    if (caseData.differentialDiagnosis && caseData.differentialDiagnosis.length > 0) {
      summary += "DIAGNOSIS:\n";
      caseData.differentialDiagnosis.forEach((dx, i) => {
        summary += `${i + 1}. ${dx.diagnosis} (${dx.icdCode})\n`;
      });
      summary += "\n";
    }
    
    // Treatment Plan
    if (caseData.plan) {
      summary += "TREATMENT:\n" + caseData.plan + "\n\n";
    }
    
    // Medications
    if (medications.length > 0) {
      summary += "MEDICATIONS:\n";
      medications.forEach((med) => {
        summary += `- ${med.name} ${med.dose}, ${med.frequency} for ${med.duration}\n`;
        if (med.instructions) summary += `  (${med.instructions})\n`;
      });
      summary += "\n";
    }
    
    // Patient Education
    if (patientEducation) {
      summary += "PATIENT EDUCATION:\n" + patientEducation + "\n\n";
    }
    
    // Red Flags
    if (caseData.treatmentRedFlags) {
      summary += "WARNING SIGNS - RETURN IF:\n" + caseData.treatmentRedFlags + "\n\n";
    }
    
    // Follow-up
    summary += "FOLLOW-UP:\nFollow up with your primary care physician within 3-5 days or sooner if symptoms worsen.\n";
    
    return summary;
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
    
    if (caseData.treatmentRedFlags) {
      summary += `WARNING SIGNS (RED FLAGS)\n${"-".repeat(30)}\n${caseData.treatmentRedFlags}\n\n`;
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

  const handlePrintPrescription = () => {
    if (!caseData) return;
    setRxPreviewOpen(true);
  };

  const handleSharePrescription = async () => {
    if (!caseData) return;
    const date = format(new Date(), "MMMM d, yyyy");
    const planLines = parseAIContent(caseData.plan || "");

    let text = `PRESCRIPTION — MedNote AI\n`;
    text += `Date: ${date}\n`;
    if (caseData.mrn) text += `MRN: ${caseData.mrn}\n`;
    text += `\nPATIENT: ${caseData.patientName}, ${caseData.age} yrs, ${caseData.gender}\n`;
    if (caseData.chiefComplaint) text += `Chief Complaint: ${caseData.chiefComplaint}\n`;
    if (caseData.assessment) text += `\nDIAGNOSIS:\n${caseData.assessment}\n`;
    if (medications.length > 0) {
      text += `\nMEDICATIONS:\n`;
      medications.forEach((m, i) => {
        text += `${i + 1}. ${m.name} ${m.dose} — ${m.frequency}${m.duration ? " for " + m.duration : ""}\n`;
        if (m.instructions) text += `   Note: ${m.instructions}\n`;
      });
    }
    if (planLines.length > 0) {
      text += `\nTREATMENT PLAN:\n`;
      planLines.forEach((l, i) => { text += `${i + 1}. ${l.replace(/^\d+[\.\)]\s*/, "")}\n`; });
    }
    text += `\n— Generated by MedNote AI`;

    try {
      await navigator.share({ title: `Prescription — ${caseData.patientName}`, text });
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        toast({ title: "Share not supported", description: "Copy the text manually from this view." });
      }
    }
  };

  const handleExportPPT = async () => {
    if (!caseData) return;
    
    const pptx = new pptxgen();
    const firstName = caseData.patientName.split(' ')[0];
    const caseIdentifier = caseData.mrn ? `${firstName} - ${caseData.mrn}` : firstName;
    pptx.title = `Medical Case Report - ${caseIdentifier}`;
    pptx.author = "MedNote AI";
    pptx.subject = "Medical Case Presentation";
    
    const primaryColor = "0D9488";
    const secondaryColor = "6366F1";
    const accentColor = "F59E0B";
    const darkColor = "1E293B";
    const lightBg = "F8FAFC";
    
    const slide1 = pptx.addSlide();
    slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color: darkColor } });
    slide1.addShape(pptx.ShapeType.rect, { x: 0, y: 4.5, w: "100%", h: 1, fill: { color: primaryColor } });
    slide1.addText("MEDICAL CASE REPORT", { x: 0.5, y: 1.5, w: 9, h: 1, fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Arial" });
    slide1.addText(`Case: ${caseIdentifier}`, { x: 0.5, y: 2.5, w: 9, h: 0.8, fontSize: 28, color: primaryColor, fontFace: "Arial" });
    slide1.addText(`${caseData.age} years old  |  ${caseData.gender}`, { x: 0.5, y: 3.3, w: 9, h: 0.5, fontSize: 18, color: "94A3B8", fontFace: "Arial" });
    slide1.addText(caseData.recordedAt ? format(new Date(caseData.recordedAt), "MMMM d, yyyy") : "", { x: 0.5, y: 3.8, w: 9, h: 0.5, fontSize: 14, color: "64748B", fontFace: "Arial" });
    slide1.addText("Generated by MedNote AI", { x: 0.5, y: 4.6, w: 9, h: 0.4, fontSize: 12, color: "FFFFFF", fontFace: "Arial" });
    
    const slide2 = pptx.addSlide();
    slide2.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.2, fill: { color: primaryColor } });
    slide2.addText("CHIEF COMPLAINT & HPI", { x: 0.5, y: 0.35, w: 9, h: 0.5, fontSize: 24, bold: true, color: "FFFFFF", fontFace: "Arial" });
    slide2.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 9, h: 1.2, fill: { color: lightBg }, line: { color: primaryColor, pt: 2 } });
    slide2.addText("Chief Complaint", { x: 0.7, y: 1.55, w: 8.6, h: 0.4, fontSize: 14, bold: true, color: primaryColor, fontFace: "Arial" });
    slide2.addText(caseData.chiefComplaint || "Not recorded", { x: 0.7, y: 1.95, w: 8.6, h: 0.7, fontSize: 12, color: darkColor, fontFace: "Arial", valign: "top" });
    slide2.addText("History of Present Illness", { x: 0.5, y: 2.9, w: 9, h: 0.4, fontSize: 16, bold: true, color: secondaryColor, fontFace: "Arial" });
    slide2.addText(caseData.hpi || "Not recorded", { x: 0.5, y: 3.4, w: 9, h: 2, fontSize: 12, color: darkColor, fontFace: "Arial", valign: "top" });
    
    if (caseData.ros && Object.keys(caseData.ros).length > 0) {
      const slide3 = pptx.addSlide();
      slide3.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.2, fill: { color: secondaryColor } });
      slide3.addText("REVIEW OF SYSTEMS", { x: 0.5, y: 0.35, w: 9, h: 0.5, fontSize: 24, bold: true, color: "FFFFFF", fontFace: "Arial" });
      
      const rosEntries = Object.entries(caseData.ros);
      const cols = 2;
      const itemWidth = 4.3;
      rosEntries.forEach(([system, findings], idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = 0.5 + col * 4.5;
        const y = 1.5 + row * 1.2;
        slide3.addShape(pptx.ShapeType.rect, { x, y, w: itemWidth, h: 1, fill: { color: lightBg }, line: { color: secondaryColor, pt: 1 } });
        slide3.addText(system, { x: x + 0.15, y: y + 0.05, w: itemWidth - 0.3, h: 0.35, fontSize: 12, bold: true, color: secondaryColor, fontFace: "Arial" });
        slide3.addText(String(findings), { x: x + 0.15, y: y + 0.4, w: itemWidth - 0.3, h: 0.55, fontSize: 10, color: darkColor, fontFace: "Arial", valign: "top" });
      });
    }
    
    const slide4 = pptx.addSlide();
    slide4.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.2, fill: { color: accentColor } });
    slide4.addText("PHYSICAL EXAMINATION", { x: 0.5, y: 0.35, w: 9, h: 0.5, fontSize: 24, bold: true, color: "FFFFFF", fontFace: "Arial" });
    slide4.addText(caseData.physicalExam || "Not recorded", { x: 0.5, y: 1.5, w: 9, h: 4, fontSize: 12, color: darkColor, fontFace: "Arial", valign: "top" });
    
    if (caseData.differentialDiagnosis && caseData.differentialDiagnosis.length > 0) {
      const slide5 = pptx.addSlide();
      slide5.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.2, fill: { color: "DC2626" } });
      slide5.addText("DIFFERENTIAL DIAGNOSIS", { x: 0.5, y: 0.35, w: 9, h: 0.5, fontSize: 24, bold: true, color: "FFFFFF", fontFace: "Arial" });
      
      caseData.differentialDiagnosis.forEach((dx, idx) => {
        const y = 1.5 + idx * 0.8;
        const isPrimary = idx === 0;
        slide5.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 9, h: 0.7, fill: { color: isPrimary ? "FEE2E2" : lightBg }, line: { color: isPrimary ? "DC2626" : "CBD5E1", pt: isPrimary ? 2 : 1 } });
        slide5.addText(`${idx + 1}. ${dx.diagnosis}`, { x: 0.7, y: y + 0.15, w: 6.5, h: 0.4, fontSize: 14, bold: isPrimary, color: darkColor, fontFace: "Arial" });
        slide5.addText(dx.icdCode, { x: 7.5, y: y + 0.15, w: 1.8, h: 0.4, fontSize: 12, color: isPrimary ? "DC2626" : "64748B", fontFace: "Arial", align: "right" });
      });
    }
    
    const slide6 = pptx.addSlide();
    slide6.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.2, fill: { color: "059669" } });
    slide6.addText("TREATMENT PLAN", { x: 0.5, y: 0.35, w: 9, h: 0.5, fontSize: 24, bold: true, color: "FFFFFF", fontFace: "Arial" });
    slide6.addText(caseData.plan || "Not recorded", { x: 0.5, y: 1.5, w: 9, h: 2.5, fontSize: 12, color: darkColor, fontFace: "Arial", valign: "top" });
    
    if (medications.length > 0) {
      slide6.addText("Medications", { x: 0.5, y: 4.2, w: 9, h: 0.4, fontSize: 14, bold: true, color: "059669", fontFace: "Arial" });
      medications.forEach((med, idx) => {
        slide6.addText(`• ${med.name} ${med.dose} - ${med.frequency}`, { x: 0.7, y: 4.6 + idx * 0.35, w: 8.8, h: 0.35, fontSize: 11, color: darkColor, fontFace: "Arial" });
      });
    }
    
    if (patientEducation || caseData.treatmentRedFlags) {
      const slide7 = pptx.addSlide();
      slide7.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.2, fill: { color: "7C3AED" } });
      slide7.addText("PATIENT EDUCATION & SAFETY", { x: 0.5, y: 0.35, w: 9, h: 0.5, fontSize: 24, bold: true, color: "FFFFFF", fontFace: "Arial" });
      
      if (patientEducation) {
        slide7.addText("Patient Education", { x: 0.5, y: 1.5, w: 9, h: 0.4, fontSize: 14, bold: true, color: "7C3AED", fontFace: "Arial" });
        slide7.addText(patientEducation, { x: 0.5, y: 1.9, w: 9, h: 1.5, fontSize: 11, color: darkColor, fontFace: "Arial", valign: "top" });
      }
      
      if (caseData.treatmentRedFlags) {
        slide7.addShape(pptx.ShapeType.rect, { x: 0.5, y: 3.6, w: 9, h: 1.8, fill: { color: "FEF2F2" }, line: { color: "DC2626", pt: 2 } });
        slide7.addText("Warning Signs (Red Flags)", { x: 0.7, y: 3.7, w: 8.6, h: 0.4, fontSize: 14, bold: true, color: "DC2626", fontFace: "Arial" });
        slide7.addText(caseData.treatmentRedFlags, { x: 0.7, y: 4.1, w: 8.6, h: 1.2, fontSize: 10, color: darkColor, fontFace: "Arial", valign: "top" });
      }
    }
    
    const slideEnd = pptx.addSlide();
    slideEnd.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color: darkColor } });
    slideEnd.addShape(pptx.ShapeType.rect, { x: 0, y: 2.3, w: "100%", h: 1, fill: { color: primaryColor } });
    slideEnd.addText("Thank You", { x: 0, y: 2.4, w: 10, h: 0.8, fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Arial", align: "center" });
    slideEnd.addText("Case Report Generated by MedNote AI", { x: 0, y: 4, w: 10, h: 0.5, fontSize: 14, color: "94A3B8", fontFace: "Arial", align: "center" });
    
    const fileName = `Case-Report-${caseIdentifier.replace(/\s+/g, "-")}.pptx`;

    // On iOS/WKWebView, file downloads don't work — use Web Share API instead
    if (navigator.canShare) {
      try {
        const blob = await (pptx as any).write({ outputType: "blob" }) as Blob;
        const file = new File([blob], fileName, { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
          toast({ title: "Presentation Shared", description: "PowerPoint shared successfully." });
          return;
        }
      } catch (shareErr: any) {
        if (shareErr?.name !== "AbortError") console.error("Share failed:", shareErr);
      }
    }
    // Desktop fallback
    await pptx.writeFile({ fileName });
    toast({ title: "Presentation Exported", description: "PowerPoint presentation downloaded successfully." });
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
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handlePrintPrescription} data-testid="button-print-rx" title="Print Prescription">
            <ScrollText className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExportPPT} data-testid="button-export-ppt" title="Export as PowerPoint">
            <Presentation className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleDownload} data-testid="button-download" title="Download as text">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handlePrint} data-testid="button-print" title="Print">
            <Printer className="w-4 h-4" />
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
            {caseData.mrn && (
              <Link href={`/patients/${encodeURIComponent(caseData.mrn)}`}>
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium hover:bg-primary/20 transition-colors cursor-pointer" data-testid="link-patient-progression">
                  <TrendingUp className="w-3 h-3" />
                  <span>MRN: {caseData.mrn}</span>
                  <span className="text-primary/60">View History</span>
                </div>
              </Link>
            )}
          </div>

          <Card className="border-none shadow-lg bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Clinical Notes</h2>
                  <p className="text-xs text-slate-400">AI-generated from your recording</p>
                </div>
              </div>
            </div>
            <CardContent className="p-5 space-y-6">
              <EditableSection
                title="Chief Complaint (CC)"
                content={caseData.chiefComplaint || ""}
                onSave={(content) => updateMutation.mutate({ chiefComplaint: content })}
                placeholder="No chief complaint recorded"
                variant="default"
                testId="chief-complaint"
              />

              <Separator />

              <EditableSection
                title="History of Present Illness (HPI)"
                content={caseData.hpi || ""}
                onSave={(content) => updateMutation.mutate({ hpi: content })}
                placeholder="No HPI recorded"
                variant="highlighted"
                testId="hpi"
                extraActions={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-50 gap-1"
                    onClick={() => { setHpiText(caseData.hpi || ""); setHpiDialogOpen(true); }}
                    data-testid="button-recapture-hpi"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Recapture
                  </Button>
                }
              />

              <Separator />

              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Review of Systems (ROS)
                </h3>
                {Object.keys(ros).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(ros).map(([system, findings]) => (
                      <div key={system} className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                        <span className="font-semibold text-xs text-primary block mb-1">{system}</span>
                        <p className="text-sm text-foreground">{findings}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground italic">No ROS recorded</p>
                  </div>
                )}
              </section>

              <Separator />

              <EditableSection
                title="Physical Examination"
                content={caseData.physicalExam || ""}
                onSave={(content) => updateMutation.mutate({ physicalExam: content })}
                placeholder="No physical exam recorded"
                variant="default"
                testId="physical-exam"
                renderContent={(content) => <PhysicalExamDisplay content={content} />}
              />

              <Separator />

              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Assessment / Differential Diagnosis
                </h3>
                {ddx.length > 0 ? (
                  <div className="space-y-2">
                    {ddx.map((dx, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${idx === 0 ? "bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20" : "bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border-slate-200 dark:border-slate-700"}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-primary text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-foreground">{dx.diagnosis}</span>
                        </div>
                        <span className={`text-xs font-mono px-3 py-1 rounded-full ${idx === 0 ? "bg-primary/20 text-primary font-semibold" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {dx.icdCode}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground italic">
                      {caseData.assessment || "No assessment recorded"}
                    </p>
                  </div>
                )}
              </section>

              <Separator />

              <EditableSection
                title="Treatment Plan"
                content={caseData.plan || ""}
                onSave={(content) => updateMutation.mutate({ plan: content })}
                placeholder="No plan recorded"
                variant="accent"
                testId="plan"
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-blue-900 to-cyan-900 dark:from-blue-950 dark:to-cyan-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Diagnostic Studies</h2>
                    <p className="text-xs text-blue-200/70">Labs, imaging & results</p>
                  </div>
                </div>
                <Dialog open={studyDialogOpen} onOpenChange={setStudyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/15 rounded-xl" data-testid="button-add-study">
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
            </div>
            <CardContent className="p-5">
              <div className="space-y-3">
                {diagnosticStudies.length > 0 ? (
                  diagnosticStudies.map((study, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700" data-testid={`study-item-${idx}`}>
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
                  <p className="text-sm text-muted-foreground text-center py-6">No diagnostic studies added yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-emerald-900 to-green-900 dark:from-emerald-950 dark:to-green-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Patient Education</h2>
                  <p className="text-xs text-emerald-200/70">Instructions & warning signs</p>
                </div>
              </div>
            </div>
            <CardContent className="p-5 space-y-5">
              <EditableSection
                title="Patient Education"
                content={patientEducation}
                onSave={(content) => {
                  setPatientEducation(content);
                  updateMutation.mutate({ patientEducation: content });
                }}
                placeholder="Add patient education notes..."
                variant="accent"
                testId="patient-education"
              />
              {caseData.treatmentRedFlags && (
                <>
                  <Separator />
                  <EditableSection
                    title="Warning Signs (Red Flags)"
                    content={caseData.treatmentRedFlags}
                    onSave={(content) => updateMutation.mutate({ treatmentRedFlags: content })}
                    placeholder="No warning signs recorded"
                    variant="warning"
                    testId="treatment-red-flags"
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-white dark:bg-slate-900 mb-6 overflow-hidden">
            <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-violet-900 to-purple-900 dark:from-violet-950 dark:to-purple-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Pill className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Discharge Medications</h2>
                    <p className="text-xs text-violet-200/70">Prescribed at discharge</p>
                  </div>
                </div>
                <Dialog open={medDialogOpen} onOpenChange={setMedDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/15 rounded-xl" data-testid="button-add-medication">
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
            </div>
            <CardContent className="p-5">
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
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-600" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-indigo-500" />
                  Final Diagnosis & Disposition
                </h3>
                {caseData.disposition && (
                  <Link href={`/cases/${id}/disposition`}>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer">
                      View Summary
                    </Badge>
                  </Link>
                )}
              </div>
              
              {caseData.disposition ? (
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          Case Finalized - {getDispositionLabel(caseData.disposition)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-green-700 hover:text-green-800 hover:bg-green-100"
                        onClick={() => {
                          setDispositionText((caseData as ExtendedCase).finalNotes || "");
                          setSelectedDisposition(caseData.disposition || "");
                          setDispositionDialogOpen(true);
                        }}
                        data-testid="button-edit-disposition"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                    {(caseData as ExtendedCase).finalNotes && (
                      <p className="text-sm text-muted-foreground mt-2">{(caseData as ExtendedCase).finalNotes}</p>
                    )}
                  </div>
                  <Link href={`/cases/${id}/disposition`}>
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                      data-testid="button-view-disposition"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View & Download Disposition Summary
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg"
                  onClick={() => {
                    setDispositionText("");
                    setSelectedDisposition("");
                    setDispositionDialogOpen(true);
                  }}
                  data-testid="button-disposition"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Record Final Diagnosis & Disposition
                </Button>
              )}
              
              <Dialog open={dispositionDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  if (dispositionRecognitionRef.current) {
                    dispositionRecognitionRef.current.abort();
                  }
                  if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                  }
                  setIsRecordingDisposition(false);
                }
                setDispositionDialogOpen(open);
              }}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{caseData.disposition ? "Edit" : "Record"} Final Diagnosis & Disposition</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      {caseData.disposition ? "Edit the final diagnosis and disposition." : "Record the final diagnosis and patient disposition. If discharged, a summary will be generated including patient education, warning signs, and follow-up instructions."}
                    </p>
                    
                    <div className="relative">
                      <Textarea
                        value={dispositionText}
                        onChange={(e) => setDispositionText(e.target.value)}
                        placeholder="Dictate or type final diagnosis and disposition..."
                        className={`min-h-[150px] resize-none pr-12 ${isRecordingDisposition ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                        data-testid="textarea-disposition"
                      />
                      <Button
                        type="button"
                        variant={isRecordingDisposition ? "destructive" : "secondary"}
                        size="icon"
                        onClick={() => {
                          if (isRecordingDisposition) {
                            if (dispositionRecognitionRef.current) {
                              dispositionRecognitionRef.current.stop();
                            }
                            if (streamRef.current) {
                              streamRef.current.getTracks().forEach(track => track.stop());
                            }
                            setIsRecordingDisposition(false);
                          } else {
                            const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                            if (!SpeechRecognitionAPI) {
                              toast({ title: "Speech recognition not supported", description: "Please use Chrome, Edge, or Safari.", variant: "destructive" });
                              return;
                            }
                            
                            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                              streamRef.current = stream;
                              
                              const recognition = new SpeechRecognitionAPI();
                              recognition.continuous = true;
                              recognition.interimResults = true;
                              recognition.lang = "en-US";
                              
                              let finalTranscript = dispositionText;
                              
                              recognition.onresult = (event: any) => {
                                let interimTranscript = "";
                                for (let i = event.resultIndex; i < event.results.length; i++) {
                                  if (event.results[i].isFinal) {
                                    finalTranscript += event.results[i][0].transcript + " ";
                                  } else {
                                    interimTranscript += event.results[i][0].transcript;
                                  }
                                }
                                setDispositionText(finalTranscript + interimTranscript);
                              };
                              
                              recognition.onerror = (event: any) => {
                                if (event.error !== 'aborted' && event.error !== 'no-speech') {
                                  toast({ title: "Speech recognition error", variant: "destructive" });
                                }
                              };
                              
                              recognition.onend = () => {
                                if (isRecordingDisposition && dispositionRecognitionRef.current) {
                                  try {
                                    dispositionRecognitionRef.current.start();
                                  } catch (e) {}
                                }
                              };
                              
                              dispositionRecognitionRef.current = recognition;
                              recognition.start();
                              setIsRecordingDisposition(true);
                              toast({ title: "Recording started", description: "Speak clearly - text will appear as you talk." });
                            }).catch(() => {
                              toast({ title: "Microphone access denied", variant: "destructive" });
                            });
                          }
                        }}
                        className={`absolute right-2 top-2 h-8 w-8 ${isRecordingDisposition ? 'animate-pulse' : ''}`}
                        data-testid="button-voice-disposition"
                      >
                        {isRecordingDisposition ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    </div>

                    {isRecordingDisposition && (
                      <div className="flex items-center gap-2 text-xs text-red-500">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Listening... speak now
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Disposition</Label>
                      <Select value={selectedDisposition} onValueChange={(value) => {
                        setSelectedDisposition(value);
                      }}>
                        <SelectTrigger data-testid="select-disposition">
                          <SelectValue placeholder="Select disposition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discharged">Discharged Home</SelectItem>
                          <SelectItem value="admitted">Admitted</SelectItem>
                          <SelectItem value="transferred">Transferred</SelectItem>
                          <SelectItem value="ama">Left AMA</SelectItem>
                          <SelectItem value="observation">Observation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={async () => {
                        if (!selectedDisposition) return;
                        let cleanedNotes = dispositionText;

                        if (dispositionText.trim()) {
                          setIsParaphrasing(true);
                          try {
                            cleanedNotes = await paraphraseNote(dispositionText);
                            setDispositionText(cleanedNotes);
                          } catch {
                            // fall back to raw text if paraphrase fails
                          } finally {
                            setIsParaphrasing(false);
                          }
                        }

                        const dischargeSummary = selectedDisposition === 'discharged' 
                          ? generateDischargeSummary(selectedDisposition, cleanedNotes)
                          : undefined;
                        
                        updateMutation.mutate({ 
                          finalNotes: cleanedNotes,
                          disposition: selectedDisposition,
                          dischargeSummary: dischargeSummary,
                          status: 'completed'
                        });
                        setDispositionDialogOpen(false);
                        toast({
                          title: caseData.disposition ? "Disposition Updated" : "Case Finalized",
                          description: selectedDisposition === 'discharged' 
                            ? "Discharge summary updated."
                            : "Final diagnosis and disposition saved.",
                        });
                      }}
                      disabled={!selectedDisposition || isParaphrasing}
                      data-testid="button-save-disposition"
                    >
                      {isParaphrasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Cleaning up notes...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {caseData.disposition ? "Update" : "Finalize Case"}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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

      {/* HPI Recapture Dialog */}
      <Dialog open={hpiDialogOpen} onOpenChange={(open) => {
        if (!open) stopHpiRecording();
        setHpiDialogOpen(open);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500" />
              Recapture History of Present Illness
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Record a new HPI to replace the current one. Use the microphone button or type directly.
            </p>

            <div className="relative">
              <Textarea
                value={hpiText}
                onChange={(e) => setHpiText(e.target.value)}
                placeholder="Dictate or type the updated HPI here..."
                className={`min-h-[160px] resize-none pr-12 text-sm leading-relaxed ${isRecordingHpi ? "border-red-400 ring-2 ring-red-100" : ""}`}
                data-testid="textarea-recapture-hpi"
              />
              <Button
                type="button"
                variant={isRecordingHpi ? "destructive" : "secondary"}
                size="icon"
                onClick={isRecordingHpi ? stopHpiRecording : startHpiRecording}
                className={`absolute right-2 top-2 h-9 w-9 rounded-xl ${isRecordingHpi ? "animate-pulse" : ""}`}
                data-testid="button-voice-recapture-hpi"
              >
                {isRecordingHpi ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>

            {isRecordingHpi && (
              <div className="flex items-center gap-2 text-xs text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Listening… speak clearly
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { stopHpiRecording(); setHpiDialogOpen(false); }}>Cancel</Button>
            <Button
              onClick={saveHpi}
              disabled={!hpiText.trim()}
              className="bg-gradient-to-r from-blue-600 to-violet-600 text-white"
              data-testid="button-save-recapture-hpi"
            >
              <Check className="w-4 h-4 mr-1" />
              Save Updated HPI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prescription Preview Modal */}
      {rxPreviewOpen && caseData && (() => {
        const date = format(new Date(), "MMMM d, yyyy");
        const planLines = parseAIContent(caseData.plan || "");
        return (
          <div className="fixed inset-0 z-50 bg-white flex flex-col" data-testid="rx-preview-modal">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
              <button onClick={() => setRxPreviewOpen(false)} className="text-slate-500 font-medium text-sm flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <span className="font-semibold text-sm text-slate-800">Prescription</span>
              <button onClick={handleSharePrescription} className="text-teal-600 font-semibold text-sm flex items-center gap-1">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5 font-serif text-slate-800">
              <div className="flex justify-between items-start border-b-2 border-teal-500 pb-4">
                <div>
                  <div className="text-xl font-bold text-teal-600">MedNote AI</div>
                  <div className="text-xs text-slate-500 mt-0.5">AI-Assisted Medical Documentation</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{date}</div>
                  {caseData.mrn && <div className="text-xs text-slate-500">MRN: {caseData.mrn}</div>}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Patient</div>
                  <div className="font-bold text-sm mt-0.5">{caseData.patientName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Age / Gender</div>
                  <div className="font-bold text-sm mt-0.5">{caseData.age} yrs / {caseData.gender}</div>
                </div>
                {caseData.chiefComplaint && (
                  <div className="col-span-2">
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Chief Complaint</div>
                    <div className="text-sm mt-0.5">{caseData.chiefComplaint}</div>
                  </div>
                )}
              </div>

              {caseData.assessment && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-teal-600 border-b border-teal-100 pb-1 mb-3">Diagnosis / Assessment</div>
                  <div className="text-sm leading-relaxed bg-green-50 border-l-4 border-teal-500 pl-3 py-2 rounded-r-lg">{caseData.assessment}</div>
                </div>
              )}

              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-teal-600 border-b border-teal-100 pb-1 mb-3">Medications Prescribed</div>
                {medications.length > 0 ? medications.map((m, i) => (
                  <div key={i} className="flex gap-3 mb-4 pb-4 border-b border-dashed border-slate-200 last:border-0 last:mb-0 last:pb-0">
                    <div className="text-2xl font-bold text-teal-500 leading-none mt-0.5">℞</div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">{i + 1}. {m.name} <span className="font-normal text-slate-500">{m.dose}</span></div>
                      <div className="text-xs text-slate-500 mt-1">Sig: Take {m.frequency}{m.duration ? ` for ${m.duration}` : ""}</div>
                      {m.instructions && <div className="text-xs text-slate-400 italic mt-0.5">{m.instructions}</div>}
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-400 italic">No medications prescribed</p>}
              </div>

              {planLines.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-teal-600 border-b border-teal-100 pb-1 mb-3">Treatment Plan</div>
                  <ol className="list-decimal list-outside pl-5 space-y-1.5">
                    {planLines.map((l, i) => (
                      <li key={i} className="text-sm text-slate-700">{l.replace(/^\d+[\.\)]\s*/, "")}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end">
                <div className="text-center">
                  <div className="w-48 border-b-2 border-slate-800 mb-1 h-10" />
                  <div className="text-xs text-slate-400">Physician Signature &amp; Stamp</div>
                </div>
                <div className="text-xs text-slate-300">MedNote AI</div>
              </div>
            </div>
          </div>
        );
      })()}
    </MobileLayout>
  );
}
