import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Check, Star, Shield, Zap, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import premiumBg from "@assets/generated_images/premium_medical_subscription_background.png"; // We will use the generated image

export default function SubscriptionPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [, setLocation] = useLocation();

  const features = [
    "Unlimited AI Scribing",
    "Instant Dictation & Transcription",
    "Export to PDF & PowerPoint",
    "Cloud Sync across iOS & Android",
    "Priority Support",
    "HIPAA Compliant Storage"
  ];

  return (
    <MobileLayout showNav={false} className="bg-slate-950 text-white relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 to-slate-950 z-10" />
        <img 
          src={premiumBg} 
          alt="Premium Background" 
          className="w-full h-full object-cover opacity-50"
        />
      </div>

      <div className="relative z-20 flex flex-col h-full p-6">
        <div className="flex justify-end">
          <Link href="/home">
            <a className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <X className="w-6 h-6" />
            </a>
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center pt-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-gradient-to-br from-amber-300 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-6"
          >
            <Star className="w-10 h-10 text-white fill-current" />
          </motion.div>

          <h1 className="text-3xl font-heading font-bold text-center mb-2">Upgrade to Pro</h1>
          <p className="text-slate-400 text-center text-sm max-w-xs mb-8">
            Unlock the full power of MedNote AI. Save hours of documentation time every day.
          </p>

          {/* Pricing Toggle */}
          <div className="flex items-center gap-4 mb-8 bg-white/5 p-1 rounded-full border border-white/10">
            <button 
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isYearly ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isYearly ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Yearly <span className="text-[10px] ml-1 text-amber-300 font-bold">-45%</span>
            </button>
          </div>

          {/* Price Display */}
          <div className="text-center mb-8">
            <div className="flex items-end justify-center gap-1">
              <span className="text-5xl font-bold font-heading">{isYearly ? "$99" : "$15"}</span>
              <span className="text-slate-400 mb-1">/{isYearly ? "year" : "mo"}</span>
            </div>
            {isYearly && (
              <p className="text-xs text-emerald-400 mt-2 font-medium">
                Save $81 per year
              </p>
            )}
          </div>

          {/* Features */}
          <div className="w-full max-w-sm space-y-4 mb-8">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-slate-200">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full h-14 text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl shadow-blue-500/20 border-t border-white/20"
          >
            {isYearly ? "Start 7-Day Free Trial" : "Subscribe Now"}
          </Button>
          <p className="text-xs text-center text-slate-500">
            Recurring billing. Cancel anytime.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
