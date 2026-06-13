import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export const AI_CONSENT_KEY = "mednote_ai_consent_v1";

interface AiConsentPageProps {
  onAccept: () => void;
}

export default function AiConsentPage({ onAccept }: AiConsentPageProps) {
  const { logout } = useAuth();

  const handleAccept = () => {
    localStorage.setItem(AI_CONSENT_KEY, "true");
    onAccept();
  };

  const handleCancel = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-white flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">AI Processing Notice</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 text-sm text-slate-300 leading-relaxed"
        >
          <p>
            MedNote AI uses OpenAI to generate clinical notes, summaries, and related outputs.
          </p>
          <p>
            The clinical text you enter or dictate may be sent to OpenAI for processing. This may include symptoms, examination findings, treatment plans, patient context, and other clinical details entered by the user.
          </p>
          <p className="text-white font-medium">
            By continuing, you agree that this information may be sent to OpenAI for AI processing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Button
            onClick={handleAccept}
            className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-xl shadow-blue-500/25"
            data-testid="button-ai-consent-agree"
          >
            I Agree
          </Button>
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="w-full h-12 rounded-2xl text-base text-slate-400 hover:text-white hover:bg-white/5"
            data-testid="button-ai-consent-cancel"
          >
            Cancel
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[11px] text-center text-slate-600 mt-5 leading-relaxed"
        >
          Your data is never sold or used for advertising. See our Privacy Policy for full details.
        </motion.p>
      </div>
    </div>
  );
}
