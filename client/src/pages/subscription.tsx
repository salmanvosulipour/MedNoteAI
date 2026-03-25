import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Check, Star, X, Loader2, CheckCircle, Zap, Shield, Globe, Headphones, CreditCard, Apple } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

const features = [
  { icon: Zap, label: "Unlimited AI Scribing", desc: "No caps on recordings" },
  { icon: Globe, label: "Multilingual Transcription", desc: "30+ languages supported" },
  { icon: Shield, label: "HIPAA Compliant", desc: "Encrypted & secure" },
  { icon: CreditCard, label: "Export to PPTX & Text", desc: "Shareable notes instantly" },
  { icon: Headphones, label: "Priority Support", desc: "Dedicated physician support" },
  { icon: Check, label: "Cloud Sync", desc: "iOS & web included" },
];

export default function SubscriptionPage() {
  const [isYearly, setIsYearly] = useState(true);
  const [, setLocation] = useLocation();

  const { data: billingStatus, isLoading } = useQuery({
    queryKey: ["/api/billing/status"],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch("/api/billing/status", {
        credentials: "include",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (!res.ok) {
        if (res.status === 401) return { isSubscribed: false, freeTokensRemaining: 0, subscription: null };
        throw new Error("Failed to fetch billing status");
      }
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <MobileLayout showNav={false} className="bg-[#080B14] text-white relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      </MobileLayout>
    );
  }

  if (billingStatus?.isSubscribed) {
    return (
      <MobileLayout showNav={false} className="bg-[#080B14] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-6">
          <div className="flex justify-end pt-8">
            <button onClick={() => setLocation("/home")} className="p-2 bg-white/8 border border-white/10 rounded-full hover:bg-white/15 transition-colors" data-testid="button-close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="relative mb-8"
            >
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <CheckCircle className="w-14 h-14 text-white" strokeWidth={1.5} />
              </div>
              <div className="absolute -inset-3 rounded-3xl border border-emerald-500/25 animate-ping duration-[3000ms]" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent" data-testid="text-pro-title">
                You're Pro
              </h1>
              <p className="text-slate-400 text-sm">Full access to all MedNote AI features</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="w-full max-w-sm mb-8"
            >
              <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/10" />
                <div className="relative p-5 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">Pro Subscription</p>
                      <p className="text-xs text-emerald-400 font-medium capitalize">
                        {billingStatus?.subscription?.status === "trialing" ? "Trial Active" : "Active"}
                      </p>
                    </div>
                  </div>
                  {billingStatus?.subscription?.currentPeriodEnd && (
                    <p className="text-xs text-slate-500 border-t border-white/8 pt-3">
                      {billingStatus.subscription.cancelAtPeriodEnd
                        ? `Cancels ${new Date(billingStatus.subscription.currentPeriodEnd * 1000).toLocaleDateString()}`
                        : `Renews ${new Date(billingStatus.subscription.currentPeriodEnd * 1000).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="w-full max-w-sm">
              <p className="text-xs text-center text-slate-500 mb-4">
                To manage or cancel your subscription, go to iPhone Settings → Apple ID → Subscriptions.
              </p>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/home")}
                className="w-full h-14 rounded-2xl border-white/15 text-white bg-white/5 hover:bg-white/10 text-base"
                data-testid="button-go-home"
              >
                Back to Home
              </Button>
            </motion.div>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false} className="bg-[#080B14] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-20 w-[350px] h-[350px] bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-600/8 rounded-full blur-[80px]" />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize: "36px 36px" }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-end p-6 pt-14">
          <button onClick={() => setLocation("/home")} className="p-2 bg-white/8 border border-white/10 rounded-full hover:bg-white/15 transition-colors" data-testid="button-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 mb-4">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">MedNote Pro</span>
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent leading-tight" data-testid="text-upgrade-title">
              Upgrade to Pro
            </h1>
            <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
              Save hours of documentation time every day with AI-powered medical scribing.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
              <button
                onClick={() => setIsYearly(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${!isYearly ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-white"}`}
                data-testid="button-monthly"
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isYearly ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-white"}`}
                data-testid="button-yearly"
              >
                Yearly
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isYearly ? "bg-emerald-500/20 text-emerald-600" : "bg-emerald-500/20 text-emerald-400"}`}>
                  -45%
                </span>
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="mb-8">
            <div className="relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-violet-600/20 to-cyan-600/10" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
              <div className="relative p-6 border border-white/10 rounded-3xl text-center">
                <motion.div key={isYearly ? "yearly" : "monthly"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-baseline justify-center gap-1 mb-1">
                    <span className="text-6xl font-bold bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent" data-testid="text-price">
                      {isYearly ? "$99" : "$15"}
                    </span>
                    <span className="text-slate-400 text-base mb-1">/{isYearly ? "year" : "mo"}</span>
                  </div>
                  {isYearly ? (
                    <p className="text-xs text-emerald-400 font-semibold">Save $81 per year · $8.25/mo</p>
                  ) : (
                    <p className="text-xs text-slate-500">Billed monthly</p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8 space-y-2">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="flex items-center gap-4 p-3 rounded-2xl bg-white/4 border border-white/6 hover:bg-white/6 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{feature.label}</p>
                  <p className="text-xs text-slate-500">{feature.desc}</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="px-6 pb-8 space-y-3">
          <Button
            size="lg"
            className="w-full h-14 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-xl shadow-blue-500/30 border-t border-white/20 transition-all flex items-center justify-center gap-2"
            data-testid="button-subscribe"
            disabled
          >
            <Apple className="w-5 h-5" />
            {isYearly ? "Subscribe via App Store — $99/yr" : "Subscribe via App Store — $15/mo"}
          </Button>
          <p className="text-xs text-center text-slate-500">
            Billed through your Apple ID · Cancel anytime in iPhone Settings
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
