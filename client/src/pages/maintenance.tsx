import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import logoIcon from "@assets/generated_images/minimalist_medical_ai_logo_icon.png";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-white to-slate-100 shadow-2xl flex items-center justify-center overflow-hidden border border-white/20"
        >
          <img src={logoIcon} alt="MedNote AI" className="w-full h-full object-cover" />
        </motion.div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-amber-400" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            We'll Be Back Soon
          </h1>
          
          <p className="text-slate-400 mb-6">
            MedNote AI is currently undergoing scheduled maintenance. We're making improvements to give you a better experience.
          </p>

          <div className="text-sm text-slate-500">
            Thank you for your patience.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
