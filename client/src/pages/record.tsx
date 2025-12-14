import { useState, useEffect, useRef } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { ChevronLeft, Pause, Square, Mic, Settings2, Sparkles, Loader2 } from "lucide-react";
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

// Web Speech API types
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


export default function RecordPage() {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [showPatientDialog, setShowPatientDialog] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientMrn, setPatientMrn] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("M");
  const [chiefComplaint, setChiefComplaint] = useState("");
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [patientDetailsConfirmed, setPatientDetailsConfirmed] = useState(false);

  const handleRecordButtonClick = () => {
    if (!patientDetailsConfirmed) {
      setShowPatientDialog(true);
    } else if (isRecording) {
      // Pause/Resume not supported with speech recognition, just continue
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone access for audio visualizer
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Check for Speech Recognition API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({
          title: "Speech Recognition Not Supported",
          description: "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.",
          variant: "destructive",
        });
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalTranscript = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        setTranscription(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: Event) => {
        const errorEvent = event as any;
        const errorType = errorEvent.error || 'unknown';
        console.error("Speech recognition error:", errorType);
        
        if (errorType === 'network') {
          toast({
            title: "Network Error",
            description: "Speech recognition requires an internet connection. Please check your connection.",
            variant: "destructive",
          });
        } else if (errorType === 'audio-capture' || errorType === 'not-allowed') {
          toast({
            title: "Microphone Error",
            description: "Could not access your microphone. Please check permissions.",
            variant: "destructive",
          });
        } else if (errorType !== 'no-speech' && errorType !== 'aborted') {
          toast({
            title: "Recognition Issue",
            description: "There was an issue with speech recognition. Please try again.",
            variant: "destructive",
          });
        }
      };

      recognition.onend = () => {
        // Restart if still recording (speech recognition auto-stops after silence)
        if (isRecording && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Already started, ignore
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      setDuration(0);
      setTranscription("");
    } catch (error: any) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to record audio.",
        variant: "destructive",
      });
    }
  };

  const handleStop = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    
    // Process the transcription
    if (transcription.trim()) {
      processRecording(transcription.trim());
    } else {
      toast({
        title: "No Speech Detected",
        description: "Please speak clearly into the microphone.",
        variant: "destructive",
      });
      setPatientDetailsConfirmed(false);
    }
  };

  const handlePatientDetailsSubmit = () => {
    if (!patientName.trim() || !patientAge || !chiefComplaint.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all patient details.",
        variant: "destructive",
      });
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

      toast({
        title: "Generating Medical Note",
        description: "AI is processing your dictation...",
      });

      const result = await processText(newCase.id, dictation);

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
      setPatientDetailsConfirmed(false);
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
            AI is analyzing your dictation and creating a structured medical note...
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
            className="text-center mb-8"
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

        {isRecording && transcription && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm mb-8 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl"
          >
            <p className="text-sm text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
              {transcription}
            </p>
          </motion.div>
        )}

        <div className="h-24 w-full mb-12 flex items-center justify-center relative">
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
            onClick={handleRecordButtonClick}
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
          className="mt-12 text-center"
        >
          <p className="text-xs text-slate-400 font-medium tracking-wide">
             POWERED BY AI
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
            <div>
              <Label>MRN (Optional)</Label>
              <Input 
                placeholder="e.g., MRN-12345"
                value={patientMrn}
                onChange={(e) => setPatientMrn(e.target.value)}
                data-testid="input-patient-mrn"
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
            <Button onClick={handlePatientDetailsSubmit} data-testid="button-start-recording">Start Recording</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
