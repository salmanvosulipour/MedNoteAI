import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { ChevronLeft, Pause, Square, Mic, Settings2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleStop = () => {
    setIsRecording(false);
    // Simulate processing
    setTimeout(() => {
      setLocation("/cases/new-draft");
    }, 500);
  };

  return (
    <MobileLayout showNav={false} className="bg-slate-950 text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <Link href="/home">
          <a className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </a>
        </Link>
        <span className="text-sm font-medium tracking-wide opacity-80">NEW SESSION</span>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Settings2 className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full px-6">
        
        {/* Dynamic Status Text */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={isRecording ? "recording" : "ready"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-mono font-light tracking-wider mb-2">
              {formatTime(duration)}
            </h2>
            <p className={`text-sm font-medium tracking-widest uppercase ${isRecording ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
              {isRecording ? "Recording Live..." : "Ready to Record"}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Visualizer */}
        <div className="h-24 w-full mb-16 flex items-center justify-center">
          <AudioVisualizer isRecording={isRecording} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8">
          {isRecording && (
             <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleStop}
              className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-red-500 hover:bg-slate-700 transition-colors"
            >
              <Square className="w-6 h-6 fill-current" />
            </motion.button>
          )}

          <button 
            onClick={toggleRecording}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
                : 'bg-primary hover:bg-primary/90 shadow-primary/30'
            }`}
          >
            {isRecording ? (
              <Pause className="w-10 h-10 text-white" fill="currentColor" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>
        </div>

        <p className="mt-12 text-center text-xs text-slate-500 max-w-xs">
          MedNote AI will automatically detect language and transcribe the conversation securely.
        </p>

      </div>
    </MobileLayout>
  );
}
