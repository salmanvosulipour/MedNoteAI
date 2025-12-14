import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { ChevronLeft, Pause, Square, Mic, Settings2, Info, Sparkles } from "lucide-react";
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
    <MobileLayout showNav={false} className="bg-slate-950 text-white relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isRecording ? 'opacity-100' : 'opacity-60'}`}>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>
      
      {/* Mesh Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <Link href="/home">
          <a className="p-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl hover:bg-white/10 transition-colors group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </a>
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl">
           <Sparkles className="w-3 h-3 text-amber-300" />
           <span className="text-[10px] font-bold tracking-widest uppercase text-white/80">AI Enhanced</span>
        </div>
        <button className="p-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl hover:bg-white/10 transition-colors">
          <Settings2 className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full px-6 relative">
        
        {/* Dynamic Status Text */}
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
                {isRecording ? "Live Recording" : "Standby"}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Visualizer - Only show when recording or subtle breathe when idle */}
        <div className="h-24 w-full mb-16 flex items-center justify-center relative">
          <AudioVisualizer isRecording={isRecording} />
          {!isRecording && (
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
               <div className="w-full h-0.5 bg-white/20" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 relative">
          <AnimatePresence>
            {isRecording && (
              <motion.button
                initial={{ scale: 0, opacity: 0, x: 40 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0, opacity: 0, x: 40 }}
                onClick={handleStop}
                className="absolute -left-28 w-20 h-20 rounded-[2rem] bg-slate-800/50 border border-white/10 backdrop-blur-xl flex items-center justify-center text-red-500 hover:bg-slate-700/50 transition-colors group"
              >
                <Square className="w-6 h-6 fill-current group-hover:scale-90 transition-transform" />
              </motion.button>
            )}
          </AnimatePresence>

          <button 
            onClick={toggleRecording}
            className={`relative w-28 h-28 rounded-[2.5rem] flex items-center justify-center transition-all duration-500 shadow-2xl ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/40 rotate-180 rounded-full' 
                : 'bg-white hover:scale-105 shadow-white/20'
            }`}
          >
            {isRecording ? (
              <Pause className="w-10 h-10 text-white rotate-180" fill="currentColor" />
            ) : (
              <Mic className="w-10 h-10 text-primary" />
            )}
            
            {/* Ripple Effect Ring */}
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
             POWERED BY WHISPER AI
          </p>
        </motion.div>

      </div>
    </MobileLayout>
  );
}
