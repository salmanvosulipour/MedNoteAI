import { useState, useEffect, useRef } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { ChevronLeft, Pause, Square, Mic, Settings2, Sparkles, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { createCase, processAudio } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("M");
  const [chiefComplaint, setChiefComplaint] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setDuration(0);
    } catch (error: any) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to record audio.",
        variant: "destructive",
      });
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.pause();
      } else if (mediaRecorderRef.current?.state === "paused") {
        mediaRecorderRef.current.resume();
      }
    } else {
      startRecording();
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setShowPatientDialog(true);
  };

  const handleSubmit = async () => {
    if (!patientName.trim() || !patientAge || !chiefComplaint.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all patient details.",
        variant: "destructive",
      });
      return;
    }

    setShowPatientDialog(false);
    setIsProcessing(true);

    try {
      const newCase = await createCase({
        userId: "demo-user",
        patientName: patientName.trim(),
        age: parseInt(patientAge),
        gender: patientGender,
        chiefComplaint: chiefComplaint.trim(),
      });

      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
      });

      toast({
        title: "Processing Recording",
        description: "AI is transcribing and generating medical notes...",
      });

      const result = await processAudio(newCase.id, audioBlob);

      toast({
        title: "Medical Note Generated",
        description: "Your case has been processed successfully.",
      });

      setLocation(`/cases/${result.id}`);
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process the recording.",
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
          <h2 className="text-2xl font-bold mb-2">Processing Your Recording</h2>
          <p className="text-slate-400 text-center px-8">
            AI is transcribing your dictation and generating a structured medical note...
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Powered by Gemini & GPT</span>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false} className="bg-slate-950 text-white relative overflow-hidden font-sans">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isRecording ? 'opacity-100' : 'opacity-60'}`}>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
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

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full px-6 relative">
        <AnimatePresence mode="wait">
          <motion.div 
            key={isRecording ? "recording" : "ready"}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-center mb-16"
          >
            <h2 className="text-7xl font-light tracking-tighter mb-6 tabular-nums font-heading bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              {formatTime(duration)}
            </h2>
            <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full backdrop-blur-md transition-colors duration-500 ${isRecording ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5 border border-white/10'}`}>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
              <span className={`text-xs font-bold tracking-[0.2em] uppercase ${isRecording ? 'text-red-400' : 'text-slate-300'}`}>
                {isRecording ? "Live Recording" : "Tap to Start"}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="h-24 w-full mb-16 flex items-center justify-center relative">
          <AudioVisualizer isRecording={isRecording} />
          {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
               <div className="w-full h-0.5 bg-white/20" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-8 relative">
          <AnimatePresence>
            {isRecording && (
              <motion.button
                initial={{ scale: 0, opacity: 0, x: 40 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0, opacity: 0, x: 40 }}
                onClick={handleStop}
                className="absolute -left-28 w-20 h-20 rounded-[2rem] bg-slate-800/50 border border-white/10 backdrop-blur-xl flex items-center justify-center text-red-500 hover:bg-slate-700/50 transition-colors group"
                data-testid="button-stop"
              >
                <Square className="w-6 h-6 fill-current group-hover:scale-90 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>

          <button 
            onClick={isRecording ? toggleRecording : startRecording}
            className={`relative w-28 h-28 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/40 rotate-180 rounded-full' 
                : 'bg-white hover:scale-105 shadow-white/20'
            }`}
            data-testid="button-record"
          >
            {isRecording ? (
              <Pause className="w-10 h-10 text-white rotate-180" fill="currentColor" />
            ) : (
              <Mic className="w-10 h-10 text-primary" />
            )}
            
            {!isRecording && (
               <div className="absolute inset-0 rounded-[2.5rem] border border-white/30 animate-ping duration-[2000ms]" />
            )}
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-xs text-slate-400 font-medium tracking-wide">
             POWERED BY GEMINI AI
          </p>
        </motion.div>
      </div>

      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Patient Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Patient Name</Label>
              <Input 
                placeholder="e.g., John Doe"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                data-testid="input-patient-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Age</Label>
                <Input 
                  type="number"
                  placeholder="Years"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  data-testid="input-patient-age"
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={patientGender} onValueChange={setPatientGender}>
                  <SelectTrigger data-testid="select-patient-gender">
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
              <Label>Chief Complaint</Label>
              <Input 
                placeholder="e.g., Headache for 3 days"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                data-testid="input-chief-complaint"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatientDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} data-testid="button-submit-case">Process Recording</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
