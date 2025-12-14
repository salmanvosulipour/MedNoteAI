import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { ChevronLeft, Pause, Square, Mic, Settings2, Info } from "lucide-react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import tokenIcon from "@assets/generated_images/gold_medical_token_icon.png";

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
      
      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.15),transparent)] z-0" />

      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <Link href="/home">
          <a className="p-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </a>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
           <img src={tokenIcon} alt="Token" className="w-4 h-4" />
           <span className="text-xs font-medium tracking-wide">1 TOKEN LEFT</span>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <Settings2 className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full px-6 relative">
        
        {/* Dynamic Status Text */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={isRecording ? "recording" : "ready"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-16"
          >
            <h2 className="text-6xl font-mono font-light tracking-tighter mb-4 tabular-nums">
              {formatTime(duration)}
            </h2>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${isRecording ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'}`}>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-xs font-bold tracking-widest uppercase">
                {isRecording ? "Recording" : "Ready"}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Visualizer */}
        <div className="h-32 w-full mb-12 flex items-center justify-center">
          <AudioVisualizer isRecording={isRecording} />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 relative">
          <AnimatePresence>
            {isRecording && (
              <motion.button
                initial={{ scale: 0, opacity: 0, x: 20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0, opacity: 0, x: 20 }}
                onClick={handleStop}
                className="absolute -left-24 w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-md flex items-center justify-center text-red-500 hover:bg-slate-700 transition-colors"
              >
                <Square className="w-6 h-6 fill-current" />
              </motion.button>
            )}
          </AnimatePresence>

          <button 
            onClick={toggleRecording}
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ring-4 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30 ring-red-500/20' 
                : 'bg-gradient-to-br from-primary to-blue-600 hover:scale-105 shadow-primary/40 ring-primary/20'
            }`}
          >
            {isRecording ? (
              <Pause className="w-10 h-10 text-white" fill="currentColor" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5 }}
          className="mt-16 flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl max-w-xs"
        >
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Using <span className="text-white font-medium">Whisper AI</span> for transcription. Please speak clearly. Your recording is encrypted locally.
          </p>
        </motion.div>

      </div>
    </MobileLayout>
  );
}
