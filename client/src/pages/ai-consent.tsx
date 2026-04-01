import { useState } from "react";
import { Shield, Mic, FileText, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const AI_CONSENT_KEY = "mednote_ai_consent_v1";

const dataItems = [
  {
    icon: Mic,
    title: "Voice Recordings",
    description: "Your audio recordings are sent to Google Gemini AI to convert speech to text. Audio is processed in real time and not stored by Google.",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/25",
  },
  {
    icon: FileText,
    title: "Medical Transcriptions",
    description: "The text transcription is sent to OpenAI to generate a structured medical note. Only the transcribed text is shared — not the original audio.",
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    border: "border-violet-500/25",
  },
];

interface AiConsentPageProps {
  onAccept: () => void;
}

export default function AiConsentPage({ onAccept }: AiConsentPageProps) {
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    localStorage.setItem(AI_CONSENT_KEY, "true");
    onAccept();
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
          <h1 className="text-2xl font-bold mb-2 text-white">AI Data Usage</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            MedNote AI uses third-party AI services to transcribe audio and generate medical notes. Please review how your data is used before continuing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 mb-6"
        >
          {dataItems.map((item, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl ${item.bg} border ${item.border}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm mb-1 ${item.color}`}>{item.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/10"
        >
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Data sent to third-party services is governed by their respective privacy policies:
          </p>
          <ul className="space-y-1">
            <li className="text-xs text-slate-300">• <span className="font-medium">Google Gemini AI</span> — ai.google.dev/privacy</li>
            <li className="text-xs text-slate-300">• <span className="font-medium">OpenAI</span> — openai.com/policies/privacy-policy</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <button
            onClick={() => setChecked(!checked)}
            className="flex items-start gap-3 w-full text-left"
            data-testid="checkbox-consent"
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-colors ${checked ? "bg-blue-500 border-blue-500" : "border-slate-600 bg-white/5"}`}>
              {checked && <Check className="w-3 h-3 text-white" />}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              I understand that my voice recordings and transcriptions will be sent to <span className="text-white font-medium">Google Gemini AI</span> and <span className="text-white font-medium">OpenAI</span> for processing, and I consent to this data usage.
            </p>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleAccept}
            disabled={!checked}
            className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-xl shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            data-testid="button-consent-accept"
          >
            Continue to MedNote AI
            <ChevronRight className="w-5 h-5" />
          </Button>
          <p className="text-[11px] text-center text-slate-600 mt-3 leading-relaxed">
            You must consent to data usage to use AI features. Your data is never sold or used for advertising.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export { AI_CONSENT_KEY };
