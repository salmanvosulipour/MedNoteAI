import { useState } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { ChevronLeft, Settings2, Sparkles, Loader2, Send, Mic } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { createCase, processText } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecordPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("M");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [dictation, setDictation] = useState("");

  const handleSubmit = async () => {
    if (!patientName.trim() || !patientAge || !chiefComplaint.trim() || !dictation.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields including your dictation.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const newCase = await createCase({
        userId: "demo-user",
        patientName: patientName.trim(),
        age: parseInt(patientAge),
        gender: patientGender,
        chiefComplaint: chiefComplaint.trim(),
      });

      toast({
        title: "Generating Medical Note",
        description: "AI is processing your dictation...",
      });

      const result = await processText(newCase.id, dictation.trim());

      toast({
        title: "Medical Note Generated",
        description: "Your case has been processed successfully.",
      });

      setLocation(`/cases/${result.id}`);
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to generate medical note.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <MobileLayout showNav={false} className="bg-slate-950 text-white relative overflow-hidden font-sans">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center z-10">
          <Loader2 className="w-16 h-16 animate-spin text-primary mb-6" />
          <h2 className="text-2xl font-bold mb-2">Generating Medical Note</h2>
          <p className="text-slate-400 text-center px-8">
            AI is analyzing your dictation and generating a structured medical note...
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Powered by GPT-4</span>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false} className="bg-slate-950 text-white relative overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-60">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>
      
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <Link href="/home" className="p-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl hover:bg-white/10 transition-colors group" data-testid="button-back">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
           <Sparkles className="w-3 h-3 text-amber-300" />
           <span className="text-[10px] font-bold tracking-widest uppercase text-white/80">AI Enhanced</span>
        </div>
        <button className="p-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl hover:bg-white/10 transition-colors" data-testid="button-settings">
          <Settings2 className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col z-10 w-full px-6 pt-24 pb-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">New Medical Note</h1>
            <p className="text-slate-400 text-sm">Enter patient details and dictate your notes</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-4">
            <div>
              <Label className="text-white/80">Patient Name</Label>
              <Input 
                placeholder="e.g., John Doe"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                data-testid="input-patient-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/80">Age</Label>
                <Input 
                  type="number"
                  placeholder="Years"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-patient-age"
                />
              </div>
              <div>
                <Label className="text-white/80">Gender</Label>
                <Select value={patientGender} onValueChange={setPatientGender}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-patient-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white/80">Chief Complaint</Label>
              <Input 
                placeholder="e.g., Headache for 3 days"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                data-testid="input-chief-complaint"
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-white/80">Your Dictation</Label>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Mic className="w-3 h-3" />
                <span>Tap mic on keyboard to dictate</span>
              </div>
            </div>
            <Textarea 
              placeholder="Dictate or type your clinical notes here... 

Example: Patient is a 45-year-old male presenting with chest pain for the past 2 hours. Pain is substernal, pressure-like, radiating to left arm. Denies shortness of breath, nausea, or diaphoresis..."
              value={dictation}
              onChange={(e) => setDictation(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[200px] resize-none"
              data-testid="input-dictation"
            />
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!patientName || !patientAge || !chiefComplaint || !dictation}
            className="w-full h-14 text-lg font-semibold rounded-2xl bg-primary hover:bg-primary/90"
            data-testid="button-generate"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Medical Note
          </Button>

          <p className="text-center text-xs text-slate-500">
            AI will generate HPI, ROS, Assessment, Plan, and more
          </p>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
