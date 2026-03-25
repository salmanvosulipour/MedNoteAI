import { useState, useEffect, useRef } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { ChevronLeft, Square, Mic, Sparkles, Loader2, Play, Pause } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { createCase, processText } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type RecordingState = "idle" | "recording" | "paused";

export default function RecordPage() {
  const { user } = useAuth();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [finalTranscriptRef, setFinalTranscriptRef] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientMrn, setPatientMrn] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("M");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [patientDetailsConfirmed, setPatientDetailsConfirmed] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);

  const isRecording = recordingState === "recording";
  const isPaused = recordingState === "paused";

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const buildRecognition = (existingFinal: string) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let localFinal = existingFinal;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          localFinal += r[0].transcript + " ";
          setFinalTranscriptRef(localFinal);
        } else {
          interim += r[0].transcript;
        }
      }
      setTranscription(localFinal + interim);
    };

    recognition.onerror = (event: Event) => {
      const err = (event as any).error || "unknown";
      if (err === "network") {
        toast({ title: "Network Error", description: "Speech recognition requires internet.", variant: "destructive" });
      } else if (err === "audio-capture" || err === "not-allowed") {
        toast({ title: "Microphone Error", description: "Could not access microphone.", variant: "destructive" });
      }
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        try { recognition.start(); } catch (_) {}
      }
    };

    return recognition;
  };

  const startRecording = async (existingFinal = "") => {
    try {
      if (!streamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({ title: "Not Supported", description: "Use Chrome, Edge, or Safari for speech recognition.", variant: "destructive" });
        return;
      }

      const recognition = buildRecognition(existingFinal);
      if (!recognition) return;

      recognitionRef.current = recognition;
      isRecordingRef.current = true;
      recognition.start();
      setRecordingState("recording");
      if (!existingFinal) {
        setDuration(0);
        setTranscription("");
        setFinalTranscriptRef("");
      }
    } catch {
      toast({ title: "Microphone Access Required", description: "Please allow microphone access.", variant: "destructive" });
    }
  };

  const handlePause = () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecordingState("paused");
  };

  const handleResume = () => {
    startRecording(finalTranscriptRef);
  };

  const handleStop = () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setRecordingState("idle");

    const finalText = transcription.trim();
    if (finalText) {
      processRecording(finalText);
    } else {
      toast({ title: "No Speech Detected", description: "Please speak clearly into the microphone.", variant: "destructive" });
      setPatientDetailsConfirmed(false);
    }
  };

  const handleMainButtonClick = () => {
    if (!patientDetailsConfirmed) {
      setShowPatientDialog(true);
    } else if (isRecording) {
      handlePause();
    } else if (isPaused) {
      handleResume();
    } else {
      startRecording();
    }
  };

  const handlePatientDetailsSubmit = () => {
    if (!patientName.trim() || !patientAge || !chiefComplaint.trim()) {
      toast({ title: "Missing Information", description: "Please fill in all patient details.", variant: "destructive" });
      return;
    }
    setPatientDetailsConfirmed(true);
    setShowPatientDialog(false);
    startRecording();
  };

  const processRecording = async (dictation: string) => {
    setIsProcessing(true);
    try {
      const newCase = await createCase({
        userId: user?.id ? String(user.id) : "",
        patientName: patientName.trim(),
        mrn: patientMrn.trim() || undefined,
        age: parseInt(patientAge),
        gender: patientGender,
        chiefComplaint: chiefComplaint.trim(),
      });
      toast({ title: "Generating Medical Note", description: "AI is processing your dictation..." });
      const result = await processText(newCase.id, dictation);
      toast({ title: "Medical Note Generated", description: "Your case has been processed successfully." });
      setLocation(`/cases/${result.id}`);
    } catch (error: any) {
      if (error?.code === "SUBSCRIPTION_REQUIRED") {
        toast({ title: "Free Trial Used", description: "You've used your free case. Subscribe to keep scribing." });
        setLocation("/subscription");
        return;
      }
      toast({ title: "Processing Failed", description: error.message || "Failed to generate medical note.", variant: "destructive" });
      setIsProcessing(false);
      setPatientDetailsConfirmed(false);
    }
  };

  if (isProcessing) {
    return (
      <MobileLayout showNav={false} className="bg-[#050810] text-white relative overflow-hidden font-sans">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-600/15 rounded-full blur-[80px]" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center z-10 px-8">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-blue-500/30 animate-ping" />
          </div>
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Generating Medical Note
          </h2>
          <p className="text-slate-400 text-center text-sm leading-relaxed mb-8">
            AI is analyzing your dictation and creating a structured SOAP note...
          </p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span className="text-xs text-slate-400 font-medium">Processing with GPT-4</span>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const getButtonIcon = () => {
    if (isRecording) return <Pause className="w-10 h-10 text-white" fill="currentColor" />;
    if (isPaused) return <Play className="w-10 h-10 text-white" fill="currentColor" />;
    return <Mic className="w-10 h-10 text-slate-900" />;
  };

  const getStatusLabel = () => {
    if (isRecording) return "Recording";
    if (isPaused) return "Paused — Tap to Resume";
    return "Tap to Start";
  };

  const getStatusColor = () => {
    if (isRecording) return "text-red-400";
    if (isPaused) return "text-amber-400";
    return "text-slate-300";
  };

  const getDotStyle = () => {
    if (isRecording) return "bg-red-500 animate-ping";
    if (isPaused) return "bg-amber-400 animate-pulse";
    return "bg-emerald-400";
  };

  const getStatusBg = () => {
    if (isRecording) return "bg-red-500/10 border-red-500/30";
    if (isPaused) return "bg-amber-500/10 border-amber-500/30";
    return "bg-white/5 border-white/10";
  };

  return (
    <MobileLayout showNav={false} className="bg-[#050810] text-white relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] transition-all duration-1000 ${
          isRecording ? "bg-red-600/15 scale-110" : isPaused ? "bg-amber-600/10" : "bg-blue-600/10"
        }`} />
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-cyan-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }}
      />

      <header className="absolute top-0 left-0 right-0 px-6 pt-14 pb-4 flex justify-between items-center z-20">
        <Link href="/home" className="w-11 h-11 bg-white/8 border border-white/10 rounded-2xl backdrop-blur-xl flex items-center justify-center hover:bg-white/15 transition-colors group pointer-events-auto" data-testid="button-back">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/70">AI Scribe</span>
        </div>
        <div className="w-11 h-11" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full px-6 relative">
        {patientDetailsConfirmed && (patientName || chiefComplaint) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-center"
          >
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Patient</p>
            <p className="text-sm font-semibold text-white">{patientName}{patientAge ? `, ${patientAge}${patientGender ? patientGender : ""}` : ""}</p>
            {chiefComplaint && <p className="text-xs text-slate-500 mt-0.5">{chiefComplaint}</p>}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={recordingState}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-center mb-10"
          >
            <h2 className="text-8xl font-light tracking-tighter mb-6 tabular-nums bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatTime(duration)}
            </h2>
            <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full backdrop-blur-md border transition-all duration-500 ${getStatusBg()}`}>
              <div className={`w-2 h-2 rounded-full ${getDotStyle()}`} />
              <span className={`text-xs font-semibold tracking-[0.15em] uppercase ${getStatusColor()}`}>
                {getStatusLabel()}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {(isRecording || isPaused) && transcription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm mb-10"
          >
            <div className="relative px-5 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <p className="text-sm text-slate-300 leading-relaxed max-h-20 overflow-y-auto">
                {transcription}
              </p>
            </div>
          </motion.div>
        )}

        <div className="h-20 w-full mb-10 flex items-center justify-center relative">
          <AudioVisualizer isRecording={isRecording} />
          {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-8 relative">
          <AnimatePresence>
            {(isRecording || isPaused) && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={handleStop}
                className="absolute -left-24 w-16 h-16 rounded-2xl bg-white/8 border border-white/15 backdrop-blur-xl flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/40 transition-all group"
                data-testid="button-stop"
              >
                <Square className="w-6 h-6 text-red-400 fill-current group-hover:scale-90 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleMainButtonClick}
            whileTap={{ scale: 0.95 }}
            className={`relative w-28 h-28 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isRecording
                ? "bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/50"
                : isPaused
                ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/40"
                : "bg-white shadow-white/25"
            }`}
            data-testid="button-record"
          >
            {!isRecording && !isPaused && (
              <div className="absolute inset-0 rounded-[2rem] border-2 border-white/40 animate-ping duration-[2500ms]" />
            )}
            {isRecording && (
              <div className="absolute inset-0 rounded-[2rem] bg-red-400/20 animate-pulse" />
            )}
            {getButtonIcon()}
          </motion.button>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-14 text-[10px] text-slate-600 font-medium tracking-[0.25em] uppercase"
        >
          Powered by OpenAI & Gemini
        </motion.p>
      </div>

      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="max-w-sm mx-4 bg-slate-900 border-slate-700 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Patient Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Patient Name</Label>
              <Input
                placeholder="e.g., John Doe"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl"
                data-testid="input-patient-name"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">MRN (Optional)</Label>
              <Input
                placeholder="e.g., MRN-12345"
                value={patientMrn}
                onChange={e => setPatientMrn(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl"
                data-testid="input-patient-mrn"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Age</Label>
                <Input
                  type="number"
                  placeholder="Years"
                  value={patientAge}
                  onChange={e => setPatientAge(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl"
                  data-testid="input-patient-age"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Gender</Label>
                <Select value={patientGender} onValueChange={setPatientGender}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white rounded-xl" data-testid="select-patient-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="M" className="text-white">Male</SelectItem>
                    <SelectItem value="F" className="text-white">Female</SelectItem>
                    <SelectItem value="Other" className="text-white">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-400 text-xs uppercase tracking-wide mb-1.5 block">Chief Complaint</Label>
              <Input
                placeholder="e.g., Headache for 3 days"
                value={chiefComplaint}
                onChange={e => setChiefComplaint(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl"
                data-testid="input-chief-complaint"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowPatientDialog(false)} className="text-slate-400 hover:text-white rounded-xl">
              Cancel
            </Button>
            <Button onClick={handlePatientDetailsSubmit} className="bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl flex-1" data-testid="button-start-recording">
              Start Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
