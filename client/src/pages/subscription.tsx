import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Check, Star, X, Loader2, CreditCard, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import premiumBg from "@assets/generated_images/premium_medical_subscription_background.png";

const PRICE_IDS = {
  monthly: "price_1SeG93BSUOePdLSHdZCAfoTm",
  yearly: "price_1SeG93BSUOePdLSHXrpYYN2x",
};

export default function SubscriptionPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    if (success) {
      toast({
        title: "Welcome to Pro!",
        description: "Your subscription is now active. Enjoy unlimited AI scribing!",
      });
      window.history.replaceState({}, "", "/subscription");
    }
    if (canceled) {
      toast({
        title: "Checkout canceled",
        description: "No charges were made. You can try again anytime.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/subscription");
    }
  }, [success, canceled, toast]);

  const { data: billingStatus, isLoading } = useQuery({
    queryKey: ["/api/billing/status"],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch("/api/billing/status", {
        credentials: "include",
        headers: authToken ? { "Authorization": `Bearer ${authToken}` } : {},
      });
      if (!res.ok) {
        if (res.status === 401) {
          return { isEmailVerified: false, freeTokensRemaining: 0, isSubscribed: false, subscription: null };
        }
        throw new Error("Failed to fetch billing status");
      }
      return res.json();
    },
    retry: false,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ priceId }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          throw new Error("Please log in again to continue.");
        }
        throw new Error(data.error || "Failed to start checkout");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        console.log("Redirecting to Stripe:", data.url);
        window.location.replace(data.url);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        credentials: "include",
        headers: authToken ? { "Authorization": `Bearer ${authToken}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to open billing portal");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = () => {
    const priceId = isYearly ? PRICE_IDS.yearly : PRICE_IDS.monthly;
    checkoutMutation.mutate(priceId);
  };

  const features = [
    "Unlimited AI Scribing",
    "Instant Dictation & Transcription",
    "Export to PDF & PowerPoint",
    "Cloud Sync across iOS & Android",
    "Priority Support",
    "HIPAA Compliant Storage"
  ];

  const isSubscribed = billingStatus?.isSubscribed;
  const subscription = billingStatus?.subscription;

  if (isSubscribed) {
    return (
      <MobileLayout showNav={false} className="bg-slate-950 text-white relative overflow-hidden">
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
            <Link href="/home" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" data-testid="button-close">
              <X className="w-6 h-6" />
            </Link>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-6"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-3xl font-heading font-bold text-center mb-2" data-testid="text-pro-title">You're a Pro!</h1>
            <p className="text-slate-400 text-center text-sm max-w-xs mb-6">
              Enjoy unlimited AI scribing and all premium features.
            </p>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 w-full max-w-sm mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">Pro Subscription</p>
                  <p className="text-sm text-slate-400 capitalize">
                    {subscription?.status === 'trialing' ? 'Trial Active' : 'Active'}
                  </p>
                </div>
              </div>
              
              {subscription?.currentPeriodEnd && (
                <p className="text-xs text-slate-500">
                  {subscription.cancelAtPeriodEnd 
                    ? `Cancels on ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>

            <Button 
              size="lg"
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              className="w-full max-w-sm h-14 text-lg border-white/20 text-white hover:bg-white/10"
              data-testid="button-manage-subscription"
            >
              {portalMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <CreditCard className="w-5 h-5 mr-2" />
              )}
              Manage Subscription
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showNav={false} className="bg-slate-950 text-white relative overflow-hidden">
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
          <Link href="/home" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors" data-testid="button-close">
            <X className="w-6 h-6" />
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

          <h1 className="text-3xl font-heading font-bold text-center mb-2" data-testid="text-upgrade-title">Upgrade to Pro</h1>
          <p className="text-slate-400 text-center text-sm max-w-xs mb-8">
            Unlock the full power of MedNote AI. Save hours of documentation time every day.
          </p>

          <div className="flex items-center gap-4 mb-8 bg-white/5 p-1 rounded-full border border-white/10">
            <button 
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isYearly ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              data-testid="button-monthly"
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isYearly ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              data-testid="button-yearly"
            >
              Yearly <span className="text-[10px] ml-1 text-amber-300 font-bold">-45%</span>
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="flex items-end justify-center gap-1">
              <span className="text-5xl font-bold font-heading" data-testid="text-price">{isYearly ? "$99" : "$15"}</span>
              <span className="text-slate-400 mb-1">/{isYearly ? "year" : "mo"}</span>
            </div>
            {isYearly && (
              <p className="text-xs text-emerald-400 mt-2 font-medium">
                Save $81 per year
              </p>
            )}
          </div>

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
            onClick={handleSubscribe}
            disabled={checkoutMutation.isPending || isLoading}
            className="w-full h-14 text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-xl shadow-blue-500/20 border-t border-white/20"
            data-testid="button-subscribe"
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Redirecting...
              </>
            ) : (
              isYearly ? "Start 7-Day Free Trial" : "Subscribe Now"
            )}
          </Button>
          <p className="text-xs text-center text-slate-500">
            Recurring billing. Cancel anytime.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}
