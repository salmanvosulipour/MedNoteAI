import { motion } from "framer-motion";

export function AudioVisualizer({ isRecording }: { isRecording: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-12 w-full max-w-[200px] mx-auto">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 bg-primary/80 rounded-full"
          animate={{
            height: isRecording ? [10, 30, 15, 40, 10] : 8,
            opacity: isRecording ? 1 : 0.3
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
